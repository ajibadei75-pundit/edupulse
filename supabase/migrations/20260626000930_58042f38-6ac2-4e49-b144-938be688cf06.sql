
-- 1) profiles: restrict SELECT to authenticated; hide phone & invite_code from clients
DROP POLICY IF EXISTS "Profiles are public" ON public.profiles;
CREATE POLICY "Profiles readable by authenticated"
  ON public.profiles FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT (phone, invite_code) ON public.profiles FROM PUBLIC;
REVOKE SELECT (phone, invite_code) ON public.profiles FROM anon;
REVOKE SELECT (phone, invite_code) ON public.profiles FROM authenticated;
GRANT SELECT (id, full_name, avatar_url, school, level, bio, streak_days, created_at, updated_at, country, institution, interests, goals, department) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_private_profile()
RETURNS TABLE(phone text, invite_code text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT phone, invite_code FROM public.profiles WHERE id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.get_my_private_profile() TO authenticated;

-- 2) counseling_sessions: remove tutors from unclaimed visibility
DROP POLICY IF EXISTS counseling_unclaimed_visible ON public.counseling_sessions;
CREATE POLICY counseling_unclaimed_visible ON public.counseling_sessions
  FOR SELECT TO authenticated
  USING (
    counselor_id IS NULL AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'super_admin'::app_role)
      OR has_role(auth.uid(), 'hod'::app_role)
    )
  );

-- 3) Fix search_path on gen_invite_code (immutable function had no search_path set)
CREATE OR REPLACE FUNCTION public.gen_invite_code()
RETURNS text
LANGUAGE sql
SET search_path = public
AS $$
  SELECT upper(substring(md5(random()::text || clock_timestamp()::text) for 8));
$$;
