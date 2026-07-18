
-- Departments taxonomy
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.departments TO anon, authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Departments readable by all" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Only admins manage departments" ON public.departments FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'hod'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'hod'));

-- Extend cbt_subjects with department, duration, guidelines
ALTER TABLE public.cbt_subjects
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 10 CHECK (duration_minutes BETWEEN 1 AND 240),
  ADD COLUMN IF NOT EXISTS guidelines text;

-- Allow tutor/admin to create/edit subjects via policies (currently subjects have SELECT only for all)
DROP POLICY IF EXISTS "Tutors and admins manage subjects" ON public.cbt_subjects;
CREATE POLICY "Tutors and admins manage subjects" ON public.cbt_subjects FOR ALL TO authenticated
  USING (has_role(auth.uid(),'tutor') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'content_admin') OR has_role(auth.uid(),'cbt_admin') OR has_role(auth.uid(),'hod'))
  WITH CHECK (has_role(auth.uid(),'tutor') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'content_admin') OR has_role(auth.uid(),'cbt_admin') OR has_role(auth.uid(),'hod'));

-- Seed a few departments (idempotent)
INSERT INTO public.departments (name, slug, description) VALUES
  ('Science', 'science', 'Physics, Chemistry, Biology, Mathematics'),
  ('Arts', 'arts', 'Literature, Government, History, CRK/IRK'),
  ('Commercial', 'commercial', 'Accounting, Commerce, Economics'),
  ('IT & Digital Skills', 'it', 'Coding, Data, Cybersecurity, Design'),
  ('Islamic Studies', 'islamic', 'Qur''an, Hadith, Fiqh, Arabic'),
  ('General', 'general', 'Cross-department subjects')
ON CONFLICT (slug) DO NOTHING;
