
-- 1) cbt_questions: hide correct_option/explanation from clients
REVOKE SELECT (correct_option, explanation) ON public.cbt_questions FROM PUBLIC, anon, authenticated;

-- Grading RPC (SECURITY DEFINER) - callable only by authenticated users; returns answer keys
CREATE OR REPLACE FUNCTION public.get_cbt_answer_keys(_ids uuid[])
RETURNS TABLE(id uuid, question text, correct_option char(1), explanation text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.id, q.question, q.correct_option, q.explanation
  FROM public.cbt_questions q
  WHERE q.id = ANY(_ids) AND auth.uid() IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.get_cbt_answer_keys(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_cbt_answer_keys(uuid[]) TO authenticated;

-- 2) site_settings: restrict raw SELECT to super_admins; expose safe branding fields publicly via RPC
DROP POLICY IF EXISTS "site_settings readable" ON public.site_settings;
CREATE POLICY "site_settings admin read" ON public.site_settings
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.get_public_site_settings()
RETURNS TABLE(site_name text, tagline text, logo_url text, favicon_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT site_name, tagline, logo_url, favicon_url FROM public.site_settings WHERE id = true LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_public_site_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_site_settings() TO anon, authenticated;

-- Admin-only detail RPC (includes sensitive contact info)
CREATE OR REPLACE FUNCTION public.get_admin_site_settings()
RETURNS SETOF public.site_settings
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.site_settings
  WHERE id = true AND (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'admin'))
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_admin_site_settings() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_site_settings() TO authenticated;
