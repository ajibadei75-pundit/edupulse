
DROP POLICY IF EXISTS "Profiles readable by authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Profiles readable by owner and staff" ON public.profiles;

CREATE POLICY "Profiles readable by owner and staff"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'hod')
    OR public.has_role(auth.uid(), 'tutor')
    OR public.has_role(auth.uid(), 'islamic_organizer')
    OR public.has_role(auth.uid(), 'islamic_admin')
    OR EXISTS (
      SELECT 1 FROM public.parent_links pl
      WHERE pl.parent_id = auth.uid() AND pl.student_id = profiles.id
    )
  );
