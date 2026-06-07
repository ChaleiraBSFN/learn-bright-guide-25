
DROP POLICY IF EXISTS "Anyone can view likes" ON public.community_likes;
CREATE POLICY "Authenticated can view likes" ON public.community_likes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view comments" ON public.community_comments;
CREATE POLICY "Authenticated can view comments" ON public.community_comments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view buddy donations" ON public.community_buddies;
CREATE POLICY "Authenticated can view buddy donations" ON public.community_buddies
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read community images" ON storage.objects;
CREATE POLICY "Authenticated list community images" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'community-images');

CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'avatars');
