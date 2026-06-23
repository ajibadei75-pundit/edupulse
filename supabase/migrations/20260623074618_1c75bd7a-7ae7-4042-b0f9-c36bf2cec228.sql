-- Library bucket policies
CREATE POLICY "library read signed in" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'library');
CREATE POLICY "library staff write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'library' AND (
    public.has_role(auth.uid(),'tutor') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'content_admin')
  )
);
CREATE POLICY "library staff update" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'library' AND (
    public.has_role(auth.uid(),'tutor') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'content_admin')
  )
);
CREATE POLICY "library staff delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'library' AND (
    public.has_role(auth.uid(),'tutor') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
  )
);

REVOKE EXECUTE ON FUNCTION public.notify_live_class() FROM PUBLIC, anon, authenticated;