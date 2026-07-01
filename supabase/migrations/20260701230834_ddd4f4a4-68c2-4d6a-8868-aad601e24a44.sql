
-- 1. cbt_attempts: revoke answers column from clients
REVOKE SELECT (answers) ON public.cbt_attempts FROM authenticated, anon, PUBLIC;

-- 2. counseling_sessions: exclude tutors from counselor manage policy
DROP POLICY IF EXISTS counseling_counselor_manage ON public.counseling_sessions;
CREATE POLICY counseling_counselor_manage ON public.counseling_sessions
  FOR ALL TO authenticated
  USING (
    (counselor_id = auth.uid() AND NOT has_role(auth.uid(), 'tutor'::app_role))
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
  WITH CHECK (
    (counselor_id = auth.uid() AND NOT has_role(auth.uid(), 'tutor'::app_role))
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- 3. event_registrations: bind authenticated inserts to user_id, add delete policy
DROP POLICY IF EXISTS "Anyone can register" ON public.event_registrations;
CREATE POLICY "Anyone can register" ON public.event_registrations
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    auth.uid() IS NULL OR user_id = auth.uid()
  );

CREATE POLICY "Users delete own registrations" ON public.event_registrations
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'content_admin'::app_role)
  );

-- 4. profiles: revoke phone and invite_code column access from clients
REVOKE SELECT (phone, invite_code) ON public.profiles FROM authenticated, anon, PUBLIC;
