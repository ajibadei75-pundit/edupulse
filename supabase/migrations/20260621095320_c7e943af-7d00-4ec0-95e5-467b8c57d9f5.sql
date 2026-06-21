
-- 1) CBT attempts: drop the broad public SELECT policy
DROP POLICY IF EXISTS "Public leaderboard view" ON public.cbt_attempts;

-- Safe leaderboard aggregator (no row-level exposure of answers/scores)
CREATE OR REPLACE FUNCTION public.get_cbt_leaderboard(_limit int DEFAULT 20)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text,
  school text,
  attempts bigint,
  avg_score numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.user_id,
         p.full_name,
         p.avatar_url,
         p.school,
         COUNT(*)::bigint AS attempts,
         ROUND(AVG((a.score::numeric / NULLIF(a.total,0)) * 100))::numeric AS avg_score
  FROM public.cbt_attempts a
  LEFT JOIN public.profiles p ON p.id = a.user_id
  WHERE a.total > 0
  GROUP BY a.user_id, p.full_name, p.avatar_url, p.school
  ORDER BY avg_score DESC NULLS LAST
  LIMIT GREATEST(1, LEAST(_limit, 100));
$$;

REVOKE ALL ON FUNCTION public.get_cbt_leaderboard(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cbt_leaderboard(int) TO authenticated;

-- 2) Certificates: drop public bulk-read, replace with single-code verifier
DROP POLICY IF EXISTS "Certificates public verify" ON public.certificates;

CREATE POLICY "Users read own certificates"
  ON public.certificates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.verify_certificate(_code text)
RETURNS TABLE (
  title text,
  issued_at timestamptz,
  holder_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.title, c.issued_at, p.full_name AS holder_name
  FROM public.certificates c
  LEFT JOIN public.profiles p ON p.id = c.user_id
  WHERE c.verification_code = _code
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.verify_certificate(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated;

-- 3) user_roles: explicit restrictive write policies — only super_admin can manage
CREATE POLICY "Super admins insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role));
