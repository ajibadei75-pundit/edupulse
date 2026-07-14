
DROP POLICY IF EXISTS "Anyone leaves feedback" ON public.event_feedback;
CREATE POLICY "Anyone leaves feedback" ON public.event_feedback
  FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone submits feedback" ON public.site_feedback;
CREATE POLICY "Anyone submits feedback" ON public.site_feedback
  FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());
