ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'community';
COMMENT ON COLUMN public.community_posts.visibility IS 'community publishes a post to signed-in community members; any other value restricts reading to its owner and administrators.';

ALTER POLICY "Authenticated users can view posts" ON public.community_posts
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role) OR (auth.uid() IS NOT NULL AND visibility = 'community'));

ALTER POLICY "Authenticated can view comments" ON public.community_comments
USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.community_posts AS post WHERE post.id = community_comments.post_id));

ALTER POLICY "Authenticated can view likes" ON public.community_likes
USING (auth.uid() = user_id);

ALTER POLICY "Authenticated can view buddy donations" ON public.community_buddies
USING (auth.uid() = donor_id OR auth.uid() = author_id);

ALTER POLICY "Anyone can view ai_config" ON public.ai_config
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR CASE section
    WHEN 'capability' THEN config_data - ARRAY['color','icon','label']::text[] = '{}'::jsonb
    WHEN 'footer' THEN config_data - ARRAY['text']::text[] = '{}'::jsonb
    WHEN 'metric' THEN config_data - ARRAY['label','progress','value','icon']::text[] = '{}'::jsonb
    WHEN 'model' THEN config_data - ARRAY['color','context','details','icon','maxOutput','name','provider','speed','usage','version']::text[] = '{}'::jsonb
    WHEN 'trail_nodes' THEN config_data - ARRAY['nodes','version']::text[] = '{}'::jsonb
    ELSE false
  END
);

ALTER POLICY "Anyone can read section flags" ON public.section_flags
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR section_key = ANY (ARRAY['carousel','chat_buddy','community','demo_examples','engine_status','exercises','external_sources','history','image_ocr','images_section','password_recovery','pix','promo_banners','ranking','shop','study_groups','study_plan','subscription','trail','videos_section']::text[])
);
