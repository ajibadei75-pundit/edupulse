-- Live Classes
CREATE TABLE public.live_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text,
  description text,
  meeting_url text NOT NULL,
  starts_at timestamptz NOT NULL,
  duration_minutes int NOT NULL DEFAULT 60,
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_classes TO authenticated;
GRANT ALL ON public.live_classes TO service_role;
ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone signed in can read live classes" ON public.live_classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "hosts and staff can insert" ON public.live_classes FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = host_id AND (
    public.has_role(auth.uid(),'tutor') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'content_admin')
  )
);
CREATE POLICY "host or admin can update" ON public.live_classes FOR UPDATE TO authenticated USING (
  auth.uid() = host_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
);
CREATE POLICY "host or admin can delete" ON public.live_classes FOR DELETE TO authenticated USING (
  auth.uid() = host_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
);
CREATE TRIGGER live_classes_touch BEFORE UPDATE ON public.live_classes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Library Resources
CREATE TABLE public.library_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  subject text,
  topic text,
  level text,
  resource_type text NOT NULL DEFAULT 'pdf', -- pdf, slides, notes, video, link
  file_path text, -- storage object path (in 'library' bucket)
  external_url text,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  download_allowed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_resources TO authenticated;
GRANT ALL ON public.library_resources TO service_role;
ALTER TABLE public.library_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signed in can read library" ON public.library_resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff can insert library" ON public.library_resources FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = uploaded_by AND (
    public.has_role(auth.uid(),'tutor') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'content_admin')
  )
);
CREATE POLICY "owner or admin update library" ON public.library_resources FOR UPDATE TO authenticated USING (
  auth.uid() = uploaded_by OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
);
CREATE POLICY "owner or admin delete library" ON public.library_resources FOR DELETE TO authenticated USING (
  auth.uid() = uploaded_by OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
);
CREATE TRIGGER library_touch BEFORE UPDATE ON public.library_resources FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.library_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES public.library_resources(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, resource_id)
);
GRANT SELECT, INSERT, DELETE ON public.library_bookmarks TO authenticated;
GRANT ALL ON public.library_bookmarks TO service_role;
ALTER TABLE public.library_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bookmarks" ON public.library_bookmarks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL, -- live_class, exam, result, announcement
  title text NOT NULL,
  body text,
  url text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications read" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "service inserts notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'tutor') OR public.has_role(auth.uid(),'content_admin')
);

CREATE INDEX notifications_user_unread_idx ON public.notifications(user_id, read_at);
CREATE INDEX live_classes_starts_at_idx ON public.live_classes(starts_at);
CREATE INDEX library_subject_idx ON public.library_resources(subject);

-- Fanout helper: notify all students when a live class is created
CREATE OR REPLACE FUNCTION public.notify_live_class()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, kind, title, body, url)
  SELECT ur.user_id, 'live_class', 'New live class scheduled: ' || NEW.title,
         COALESCE(NEW.subject,'') || ' • starts ' || to_char(NEW.starts_at, 'Mon DD HH24:MI'),
         '/dashboard/live-classes'
  FROM public.user_roles ur
  WHERE ur.role = 'student';
  RETURN NEW;
END $$;
CREATE TRIGGER live_classes_notify AFTER INSERT ON public.live_classes
FOR EACH ROW EXECUTE FUNCTION public.notify_live_class();

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_classes;