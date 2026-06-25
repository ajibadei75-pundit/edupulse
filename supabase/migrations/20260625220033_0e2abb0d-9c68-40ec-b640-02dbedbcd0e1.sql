
-- 1. New role + profile department
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hod';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department text;

-- 2. Courses ownership
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS department text;
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON public.courses(created_by);
CREATE INDEX IF NOT EXISTS idx_courses_department ON public.courses(department);

-- Replace policies on courses
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON public.courses;
DROP POLICY IF EXISTS "Admins manage courses" ON public.courses;
DROP POLICY IF EXISTS "courses_select_all" ON public.courses;
DROP POLICY IF EXISTS "courses_admin_all" ON public.courses;
DROP POLICY IF EXISTS "courses_public_read" ON public.courses;
DROP POLICY IF EXISTS "courses_tutor_own" ON public.courses;
DROP POLICY IF EXISTS "courses_hod_dept" ON public.courses;
DROP POLICY IF EXISTS "courses_admin_manage" ON public.courses;

CREATE POLICY "courses_public_read" ON public.courses FOR SELECT USING (is_published = true OR created_by = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'content_admin'));
CREATE POLICY "courses_tutor_own" ON public.courses FOR ALL TO authenticated
  USING (created_by = auth.uid() AND (public.has_role(auth.uid(),'tutor') OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'hod')))
  WITH CHECK (created_by = auth.uid() AND (public.has_role(auth.uid(),'tutor') OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'hod')));
CREATE POLICY "courses_hod_dept" ON public.courses FOR ALL TO authenticated
  USING (department IS NOT NULL AND EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.profiles p ON p.id = ur.user_id WHERE ur.user_id = auth.uid() AND ur.role::text = 'hod' AND p.department = courses.department))
  WITH CHECK (department IS NOT NULL AND EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.profiles p ON p.id = ur.user_id WHERE ur.user_id = auth.uid() AND ur.role::text = 'hod' AND p.department = courses.department));
CREATE POLICY "courses_admin_manage" ON public.courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'content_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'content_admin'));

-- 3. Lessons mirror course ownership
DROP POLICY IF EXISTS "Lessons viewable by everyone" ON public.lessons;
DROP POLICY IF EXISTS "Admins manage lessons" ON public.lessons;
DROP POLICY IF EXISTS "lessons_select_all" ON public.lessons;
DROP POLICY IF EXISTS "lessons_admin_all" ON public.lessons;
DROP POLICY IF EXISTS "lessons_public_read" ON public.lessons;
DROP POLICY IF EXISTS "lessons_owner_manage" ON public.lessons;
DROP POLICY IF EXISTS "lessons_admin_manage" ON public.lessons;

CREATE POLICY "lessons_public_read" ON public.lessons FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.courses c WHERE c.id = lessons.course_id AND (c.is_published = true OR c.created_by = auth.uid()))
);
CREATE POLICY "lessons_owner_manage" ON public.lessons FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = lessons.course_id AND c.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = lessons.course_id AND c.created_by = auth.uid()));
CREATE POLICY "lessons_admin_manage" ON public.lessons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'content_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'content_admin'));

-- 4. Enrollments completion fields
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS completed boolean NOT NULL DEFAULT false;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS last_lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL;

-- 5. Counseling: counselor assignment
ALTER TABLE public.counseling_sessions ADD COLUMN IF NOT EXISTS counselor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_counseling_counselor ON public.counseling_sessions(counselor_id);

DROP POLICY IF EXISTS "counseling_own" ON public.counseling_sessions;
DROP POLICY IF EXISTS "counseling_user_manage" ON public.counseling_sessions;
DROP POLICY IF EXISTS "counseling_counselor_manage" ON public.counseling_sessions;
DROP POLICY IF EXISTS "counseling_unclaimed_visible" ON public.counseling_sessions;

CREATE POLICY "counseling_user_manage" ON public.counseling_sessions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "counseling_counselor_manage" ON public.counseling_sessions FOR ALL TO authenticated
  USING (counselor_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (counselor_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "counseling_unclaimed_visible" ON public.counseling_sessions FOR SELECT TO authenticated
  USING (counselor_id IS NULL AND (public.has_role(auth.uid(),'tutor') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')));

-- 6. Auto-issue certificate when enrollment hits 100%
CREATE OR REPLACE FUNCTION public.maybe_issue_certificate()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _course_title text; _code text;
BEGIN
  IF NEW.progress >= 100 AND (OLD.progress IS NULL OR OLD.progress < 100) THEN
    NEW.completed := true;
    NEW.completed_at := now();
    SELECT title INTO _course_title FROM public.courses WHERE id = NEW.course_id;
    _code := upper(substring(md5(random()::text || clock_timestamp()::text || NEW.id::text) for 12));
    IF NOT EXISTS (SELECT 1 FROM public.certificates WHERE user_id = NEW.user_id AND course_id = NEW.course_id) THEN
      INSERT INTO public.certificates (user_id, course_id, title, verification_code)
      VALUES (NEW.user_id, NEW.course_id, COALESCE(_course_title,'Course') || ' — Certificate of Completion', _code);
      INSERT INTO public.notifications (user_id, kind, title, body, url)
      VALUES (NEW.user_id, 'certificate', 'Certificate issued', COALESCE(_course_title,'Your course') || ' completion certificate is ready.', '/dashboard/certificates');
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enrollment_certificate ON public.enrollments;
CREATE TRIGGER trg_enrollment_certificate BEFORE UPDATE OF progress ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.maybe_issue_certificate();

-- 7. Grants (idempotent — re-asserting on touched tables)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT SELECT ON public.courses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT SELECT ON public.lessons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.counseling_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.courses, public.lessons, public.enrollments, public.counseling_sessions, public.certificates TO service_role;
