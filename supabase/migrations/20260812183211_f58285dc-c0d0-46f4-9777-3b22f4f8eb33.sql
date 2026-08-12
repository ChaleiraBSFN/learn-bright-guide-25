DROP POLICY IF EXISTS "Auth users upload community images" ON storage.objects;

DROP POLICY IF EXISTS "Anyone can view posts" ON public.community_posts;
CREATE POLICY "Authenticated users can view posts"
ON public.community_posts
FOR SELECT
TO authenticated
USING (true);

REVOKE SELECT ON public.community_posts FROM anon;