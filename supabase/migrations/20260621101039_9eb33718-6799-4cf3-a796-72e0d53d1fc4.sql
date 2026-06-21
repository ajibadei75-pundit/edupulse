
-- ============ EVENTS ============
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  location TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  capacity INTEGER,
  is_published BOOLEAN NOT NULL DEFAULT true,
  feedback_open BOOLEAN NOT NULL DEFAULT true,
  custom_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events public read published" ON public.events FOR SELECT USING (is_published = true);
CREATE POLICY "Events admin all" ON public.events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'content_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'content_admin'));

CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  school TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.event_registrations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_registrations TO authenticated;
GRANT ALL ON public.event_registrations TO service_role;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can register" ON public.event_registrations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users see own registrations" ON public.event_registrations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'content_admin'));
CREATE POLICY "Admins manage registrations" ON public.event_registrations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'content_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'content_admin'));

CREATE TABLE public.event_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comments TEXT,
  full_name TEXT,
  email TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.event_feedback TO anon;
GRANT SELECT, INSERT ON public.event_feedback TO authenticated;
GRANT ALL ON public.event_feedback TO service_role;
ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone leaves feedback" ON public.event_feedback FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read feedback" ON public.event_feedback FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'content_admin'));

-- ============ SITE FEEDBACK ============
CREATE TABLE public.site_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  category TEXT,
  message TEXT NOT NULL,
  page TEXT,
  email TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.site_feedback TO anon;
GRANT SELECT, INSERT ON public.site_feedback TO authenticated;
GRANT ALL ON public.site_feedback TO service_role;
ALTER TABLE public.site_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submits feedback" ON public.site_feedback FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read feedback" ON public.site_feedback FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- ============ SCHOOLS ============
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT,
  state TEXT,
  type TEXT,
  ownership TEXT,
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.schools TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.schools TO authenticated;
GRANT ALL ON public.schools TO service_role;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Schools public read" ON public.schools FOR SELECT USING (true);
CREATE POLICY "Schools admin manage" ON public.schools FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'content_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'content_admin'));

CREATE TABLE public.school_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  faculty TEXT,
  jamb_cutoff SMALLINT NOT NULL DEFAULT 180,
  min_waec_credits SMALLINT NOT NULL DEFAULT 5,
  required_subjects JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.school_courses TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.school_courses TO authenticated;
GRANT ALL ON public.school_courses TO service_role;
ALTER TABLE public.school_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Courses public read" ON public.school_courses FOR SELECT USING (true);
CREATE POLICY "Courses admin manage" ON public.school_courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'content_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'content_admin'));

CREATE INDEX idx_school_courses_school ON public.school_courses(school_id);
CREATE INDEX idx_school_courses_cutoff ON public.school_courses(jamb_cutoff);

-- ============ STUDENT RESULTS ============
CREATE TABLE public.student_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jamb_score SMALLINT CHECK (jamb_score BETWEEN 0 AND 400),
  jamb_subjects JSONB NOT NULL DEFAULT '[]'::jsonb,
  waec_subjects JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferred_course TEXT,
  preferred_state TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_results TO authenticated;
GRANT ALL ON public.student_results TO service_role;
ALTER TABLE public.student_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own results" ON public.student_results FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER trg_events_touch BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_results_touch BEFORE UPDATE ON public.student_results FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ SEED SCHOOLS ============
INSERT INTO public.schools (slug,name,short_name,state,type,ownership) VALUES
  ('university-of-ibadan','University of Ibadan','UI','Oyo','University','Federal'),
  ('university-of-lagos','University of Lagos','UNILAG','Lagos','University','Federal'),
  ('obafemi-awolowo-university','Obafemi Awolowo University','OAU','Osun','University','Federal'),
  ('ahmadu-bello-university','Ahmadu Bello University','ABU','Kaduna','University','Federal'),
  ('university-of-nigeria-nsukka','University of Nigeria, Nsukka','UNN','Enugu','University','Federal'),
  ('university-of-benin','University of Benin','UNIBEN','Edo','University','Federal'),
  ('university-of-ilorin','University of Ilorin','UNILORIN','Kwara','University','Federal'),
  ('lagos-state-university','Lagos State University','LASU','Lagos','University','State'),
  ('covenant-university','Covenant University','CU','Ogun','University','Private'),
  ('babcock-university','Babcock University','BU','Ogun','University','Private'),
  ('university-of-port-harcourt','University of Port Harcourt','UNIPORT','Rivers','University','Federal'),
  ('federal-university-of-technology-akure','Federal University of Technology, Akure','FUTA','Ondo','University','Federal'),
  ('university-of-jos','University of Jos','UNIJOS','Plateau','University','Federal'),
  ('bayero-university-kano','Bayero University, Kano','BUK','Kano','University','Federal'),
  ('nnamdi-azikiwe-university','Nnamdi Azikiwe University','UNIZIK','Anambra','University','Federal');

-- Seed sample courses across schools
INSERT INTO public.school_courses (school_id, course_name, faculty, jamb_cutoff, required_subjects, notes)
SELECT s.id, c.course_name, c.faculty, c.cutoff, c.subjects::jsonb, c.notes
FROM public.schools s
CROSS JOIN (VALUES
  ('Medicine and Surgery','Clinical Sciences',260,'["English","Mathematics","Biology","Chemistry","Physics"]','Highly competitive'),
  ('Law','Law',230,'["English","Mathematics","Literature","Government","CRS/IRS"]',NULL),
  ('Computer Science','Science',220,'["English","Mathematics","Physics","Chemistry","Biology"]',NULL),
  ('Accounting','Management Sciences',200,'["English","Mathematics","Economics","Commerce","Government"]',NULL),
  ('Mass Communication','Social Sciences',210,'["English","Mathematics","Literature","Government","Economics"]',NULL),
  ('Mechanical Engineering','Engineering',220,'["English","Mathematics","Physics","Chemistry"]',NULL),
  ('Business Administration','Management Sciences',190,'["English","Mathematics","Economics","Commerce"]',NULL),
  ('Economics','Social Sciences',200,'["English","Mathematics","Economics","Government"]',NULL),
  ('Nursing','Clinical Sciences',240,'["English","Mathematics","Biology","Chemistry","Physics"]',NULL),
  ('Architecture','Environmental Sciences',210,'["English","Mathematics","Physics","Fine Art/Geography"]',NULL)
) AS c(course_name, faculty, cutoff, subjects, notes);
