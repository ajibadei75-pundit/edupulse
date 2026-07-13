
-- 1) Set/reset password for the super admin account
UPDATE auth.users
SET encrypted_password = crypt('ajibson111', gen_salt('bf')),
    updated_at = now()
WHERE lower(email) = 'ajibadei75@gmail.com';

-- 2) Extend site_feedback so students can rate tutors and programs
ALTER TABLE public.site_feedback
  ADD COLUMN IF NOT EXISTS target_type text CHECK (target_type IN ('tutor','program','platform','course')),
  ADD COLUMN IF NOT EXISTS target_id uuid,
  ADD COLUMN IF NOT EXISTS target_label text;

CREATE INDEX IF NOT EXISTS site_feedback_target_idx ON public.site_feedback (target_type, target_id);

-- 3) Admin analytics RPC — restricted to admin/super_admin
CREATE OR REPLACE FUNCTION public.get_admin_analytics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _out jsonb;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  SELECT jsonb_build_object(
    'users_total',        (SELECT COUNT(*) FROM public.profiles),
    'users_pending',      (SELECT COUNT(*) FROM public.profiles WHERE approval_status='pending'),
    'users_approved',     (SELECT COUNT(*) FROM public.profiles WHERE approval_status='approved'),
    'users_new_7d',       (SELECT COUNT(*) FROM public.profiles WHERE created_at > now() - interval '7 days'),
    'courses_total',      (SELECT COUNT(*) FROM public.courses),
    'enrollments_total',  (SELECT COUNT(*) FROM public.enrollments),
    'cbt_attempts_total', (SELECT COUNT(*) FROM public.cbt_attempts),
    'cbt_avg_score',      (SELECT COALESCE(ROUND(AVG((score::numeric/NULLIF(total,0))*100)),0) FROM public.cbt_attempts WHERE total>0),
    'live_classes_total', (SELECT COUNT(*) FROM public.live_classes),
    'live_classes_upcoming', (SELECT COUNT(*) FROM public.live_classes WHERE starts_at > now()),
    'events_total',       (SELECT COUNT(*) FROM public.events),
    'event_regs_total',   (SELECT COUNT(*) FROM public.event_registrations),
    'community_posts',    (SELECT COUNT(*) FROM public.community_posts),
    'certificates',       (SELECT COUNT(*) FROM public.certificates),
    'feedback_total',     (SELECT COUNT(*) FROM public.site_feedback),
    'feedback_avg_rating',(SELECT COALESCE(ROUND(AVG(rating)::numeric,2),0) FROM public.site_feedback WHERE rating IS NOT NULL),
    'signups_by_day',     (SELECT COALESCE(jsonb_agg(row_to_json(d)),'[]'::jsonb) FROM (
                             SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS n
                             FROM public.profiles WHERE created_at > now() - interval '30 days'
                             GROUP BY 1 ORDER BY 1) d),
    'feedback_by_category',(SELECT COALESCE(jsonb_object_agg(category, n),'{}'::jsonb) FROM (
                             SELECT category, COUNT(*)::int AS n FROM public.site_feedback GROUP BY category) c),
    'top_tutor_feedback', (SELECT COALESCE(jsonb_agg(row_to_json(t)),'[]'::jsonb) FROM (
                             SELECT target_label, COUNT(*)::int AS n, ROUND(AVG(rating)::numeric,2) AS avg_rating
                             FROM public.site_feedback WHERE target_type='tutor'
                             GROUP BY target_label ORDER BY n DESC LIMIT 10) t),
    'top_program_feedback',(SELECT COALESCE(jsonb_agg(row_to_json(p)),'[]'::jsonb) FROM (
                             SELECT target_label, COUNT(*)::int AS n, ROUND(AVG(rating)::numeric,2) AS avg_rating
                             FROM public.site_feedback WHERE target_type='program'
                             GROUP BY target_label ORDER BY n DESC LIMIT 10) p)
  ) INTO _out;
  RETURN _out;
END $$;
