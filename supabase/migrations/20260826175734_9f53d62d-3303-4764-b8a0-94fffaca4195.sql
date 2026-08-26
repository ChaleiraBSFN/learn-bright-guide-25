ALTER TABLE public.community_buddies ADD COLUMN IF NOT EXISTS amount integer NOT NULL DEFAULT 1;

DROP FUNCTION IF EXISTS public.donate_buddy(uuid);

CREATE OR REPLACE FUNCTION public.donate_buddy(_post_id uuid, _amount integer DEFAULT 1)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _donor uuid := auth.uid();
  _author uuid;
  _remaining integer;
  _qty integer := COALESCE(_amount, 1);
BEGIN
  IF _donor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _qty < 1 OR _qty > 100 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  SELECT user_id INTO _author FROM public.community_posts WHERE id = _post_id;
  IF _author IS NULL THEN RAISE EXCEPTION 'Post not found'; END IF;
  IF _author = _donor THEN RAISE EXCEPTION 'Cannot donate to your own post'; END IF;

  INSERT INTO public.user_credits (user_id, credits_remaining)
  VALUES (_donor, 15) ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.user_credits
  SET credits_remaining = credits_remaining - _qty, updated_at = now()
  WHERE user_id = _donor AND credits_remaining >= _qty
  RETURNING credits_remaining INTO _remaining;

  IF _remaining IS NULL THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  INSERT INTO public.user_credits (user_id, credits_remaining, total_earned)
  VALUES (_author, 15 + _qty, _qty)
  ON CONFLICT (user_id) DO UPDATE
  SET credits_remaining = public.user_credits.credits_remaining + _qty,
      total_earned = public.user_credits.total_earned + _qty,
      updated_at = now();

  INSERT INTO public.community_buddies (post_id, donor_id, author_id, amount)
  VALUES (_post_id, _donor, _author, _qty);

  UPDATE public.community_posts SET buddy_count = buddy_count + _qty WHERE id = _post_id;

  RETURN _remaining;
END $function$;

ALTER TABLE public.community_buddies REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.community_buddies;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;