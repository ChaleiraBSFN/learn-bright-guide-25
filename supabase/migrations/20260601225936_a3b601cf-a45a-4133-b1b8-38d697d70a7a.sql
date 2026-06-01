
-- Community posts
CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('exercise','photo','solution','doubt')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  content text CHECK (content IS NULL OR char_length(content) <= 5000),
  image_url text,
  buddy_count integer NOT NULL DEFAULT 0,
  like_count integer NOT NULL DEFAULT 0,
  comment_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_community_posts_created ON public.community_posts (created_at DESC);
CREATE INDEX idx_community_posts_user ON public.community_posts (user_id);

GRANT SELECT ON public.community_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;
GRANT ALL ON public.community_posts TO service_role;

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view posts" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.community_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.community_posts
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Comments
CREATE TABLE public.community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_community_comments_post ON public.community_comments (post_id, created_at DESC);

GRANT SELECT ON public.community_comments TO anon;
GRANT SELECT, INSERT, DELETE ON public.community_comments TO authenticated;
GRANT ALL ON public.community_comments TO service_role;

ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON public.community_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.community_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.community_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Likes
CREATE TABLE public.community_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
CREATE INDEX idx_community_likes_post ON public.community_likes (post_id);

GRANT SELECT ON public.community_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.community_likes TO authenticated;
GRANT ALL ON public.community_likes TO service_role;

ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes" ON public.community_likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON public.community_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike own" ON public.community_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Buddies (credit donations to a post)
CREATE TABLE public.community_buddies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  donor_id uuid NOT NULL,
  author_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_community_buddies_post ON public.community_buddies (post_id);
CREATE INDEX idx_community_buddies_author ON public.community_buddies (author_id);

GRANT SELECT ON public.community_buddies TO anon;
GRANT SELECT ON public.community_buddies TO authenticated;
GRANT ALL ON public.community_buddies TO service_role;

ALTER TABLE public.community_buddies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view buddy donations" ON public.community_buddies FOR SELECT USING (true);
-- INSERT only via SECURITY DEFINER RPC below (no direct insert policy)

-- ============ Triggers to keep counters in sync ============
CREATE OR REPLACE FUNCTION public.community_bump_like_count() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER trg_community_like_count
AFTER INSERT OR DELETE ON public.community_likes
FOR EACH ROW EXECUTE FUNCTION public.community_bump_like_count();

CREATE OR REPLACE FUNCTION public.community_bump_comment_count() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER trg_community_comment_count
AFTER INSERT OR DELETE ON public.community_comments
FOR EACH ROW EXECUTE FUNCTION public.community_bump_comment_count();

-- ============ Donate buddy RPC: atomic credit transfer ============
CREATE OR REPLACE FUNCTION public.donate_buddy(_post_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _donor uuid := auth.uid();
  _author uuid;
  _remaining integer;
BEGIN
  IF _donor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT user_id INTO _author FROM public.community_posts WHERE id = _post_id;
  IF _author IS NULL THEN RAISE EXCEPTION 'Post not found'; END IF;
  IF _author = _donor THEN RAISE EXCEPTION 'Cannot donate to your own post'; END IF;

  -- Ensure donor row exists
  INSERT INTO public.user_credits (user_id, credits_remaining)
  VALUES (_donor, 15) ON CONFLICT (user_id) DO NOTHING;

  -- Atomic spend
  UPDATE public.user_credits
  SET credits_remaining = credits_remaining - 1, updated_at = now()
  WHERE user_id = _donor AND credits_remaining > 0
  RETURNING credits_remaining INTO _remaining;

  IF _remaining IS NULL THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Credit the author
  INSERT INTO public.user_credits (user_id, credits_remaining, total_earned)
  VALUES (_author, 15 + 1, 1)
  ON CONFLICT (user_id) DO UPDATE
  SET credits_remaining = public.user_credits.credits_remaining + 1,
      total_earned = public.user_credits.total_earned + 1,
      updated_at = now();

  -- Record donation
  INSERT INTO public.community_buddies (post_id, donor_id, author_id)
  VALUES (_post_id, _donor, _author);

  -- Bump denormalized counter
  UPDATE public.community_posts SET buddy_count = buddy_count + 1 WHERE id = _post_id;

  RETURN _remaining;
END $$;

-- ============ Storage bucket for community images ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-images', 'community-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read community images" ON storage.objects
  FOR SELECT USING (bucket_id = 'community-images');
CREATE POLICY "Auth users upload community images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'community-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth users delete own community images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'community-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_likes;
