
-- 1) Student approval on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- existing users keep working
UPDATE public.profiles SET approval_status = 'approved', approved_at = COALESCE(approved_at, now())
  WHERE approval_status = 'pending';

CREATE OR REPLACE FUNCTION public.is_approved(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    -- non-students bypass approval
    (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role = 'student')
       OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role <> 'student'))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid AND approval_status = 'approved');
$$;
GRANT EXECUTE ON FUNCTION public.is_approved(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_student_approval(_student uuid, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF _status NOT IN ('approved','rejected','pending') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  UPDATE public.profiles
    SET approval_status = _status,
        approved_at = CASE WHEN _status = 'approved' THEN now() ELSE approved_at END,
        approved_by = auth.uid()
    WHERE id = _student;
  INSERT INTO public.notifications (user_id, kind, title, body, url)
  VALUES (_student, 'approval',
    CASE WHEN _status = 'approved' THEN 'Account approved 🎉'
         WHEN _status = 'rejected' THEN 'Account rejected'
         ELSE 'Account status updated' END,
    CASE WHEN _status = 'approved' THEN 'Welcome aboard! You now have full access.'
         WHEN _status = 'rejected' THEN 'Please contact support if this was a mistake.'
         ELSE 'Your access is being reviewed.' END,
    '/dashboard');
END $$;
GRANT EXECUTE ON FUNCTION public.set_student_approval(uuid, text) TO authenticated;

-- 2) Site settings singleton
CREATE TABLE IF NOT EXISTS public.site_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  site_name text NOT NULL DEFAULT 'EduPulse',
  tagline text NOT NULL DEFAULT 'The Heartbeat of Student Success',
  support_email text,
  support_phone text,
  address text,
  logo_url text,
  favicon_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings readable" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "site_settings super admin write"
  ON public.site_settings FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'super_admin'));
CREATE POLICY "site_settings super admin update"
  ON public.site_settings FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'super_admin'))
  WITH CHECK (has_role(auth.uid(),'super_admin'));

CREATE TRIGGER site_settings_touch BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.site_settings (id) VALUES (true) ON CONFLICT DO NOTHING;

-- 3) Live class targeting
ALTER TABLE public.live_classes
  ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS department text;

CREATE INDEX IF NOT EXISTS live_classes_course_id_idx ON public.live_classes(course_id);
CREATE INDEX IF NOT EXISTS live_classes_department_idx ON public.live_classes(department);
