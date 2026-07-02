
CREATE TABLE IF NOT EXISTS public.islamic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program TEXT NOT NULL,
  milestone TEXT NOT NULL,
  score INT,
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.islamic_progress TO authenticated;
GRANT ALL ON public.islamic_progress TO service_role;
ALTER TABLE public.islamic_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student reads own islamic progress" ON public.islamic_progress
  FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "organizers manage islamic progress" ON public.islamic_progress
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'islamic_organizer') OR public.has_role(auth.uid(),'islamic_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'islamic_organizer') OR public.has_role(auth.uid(),'islamic_admin') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "parents view linked student islamic" ON public.islamic_progress
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.parent_links pl WHERE pl.parent_id = auth.uid() AND pl.student_id = islamic_progress.student_id));

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated can log own" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());
CREATE POLICY "admins read activity" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE OR REPLACE FUNCTION public.assign_user_role(_target uuid, _role app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'super_admin') THEN
    RAISE EXCEPTION 'Only super admins can assign roles';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_target, _role)
    ON CONFLICT DO NOTHING;
  INSERT INTO public.activity_logs (actor_id, action, target, meta)
    VALUES (auth.uid(), 'role.assigned', _target::text, jsonb_build_object('role', _role));
  INSERT INTO public.notifications (user_id, kind, title, body, url)
    VALUES (_target, 'role', 'New role granted', 'You have been assigned the role: ' || _role, '/dashboard');
END $$;
REVOKE EXECUTE ON FUNCTION public.assign_user_role(uuid, app_role) FROM anon;

CREATE OR REPLACE FUNCTION public.revoke_user_role(_target uuid, _role app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'super_admin') THEN
    RAISE EXCEPTION 'Only super admins can revoke roles';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _target AND role = _role;
  INSERT INTO public.activity_logs (actor_id, action, target, meta)
    VALUES (auth.uid(), 'role.revoked', _target::text, jsonb_build_object('role', _role));
END $$;
REVOKE EXECUTE ON FUNCTION public.revoke_user_role(uuid, app_role) FROM anon;

CREATE OR REPLACE FUNCTION public.admin_search_users(_q text)
RETURNS TABLE(id uuid, full_name text, avatar_url text, school text, roles text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.avatar_url, p.school,
         COALESCE(ARRAY(SELECT ur.role::text FROM public.user_roles ur WHERE ur.user_id = p.id), ARRAY[]::text[])
  FROM public.profiles p
  WHERE (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
    AND (_q = '' OR p.full_name ILIKE '%'||_q||'%')
  ORDER BY p.created_at DESC LIMIT 50;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_search_users(text) FROM anon;
