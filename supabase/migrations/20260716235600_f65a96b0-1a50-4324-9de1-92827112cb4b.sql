CREATE OR REPLACE FUNCTION public.claim_ad_reward()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _daily_limit integer := 3;
  _credits_per_ad integer := 25;
  _min_seconds_between integer := 18;
  _since timestamptz := now() - interval '24 hours';
  _last_watched timestamptz;
  _used_today integer;
  _credits_remaining integer;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Avoid double claims from repeated clicks/timers for the same user.
  PERFORM pg_advisory_xact_lock(hashtext(_user_id::text));

  SELECT watched_at INTO _last_watched
  FROM public.ad_rewards
  WHERE user_id = _user_id
  ORDER BY watched_at DESC
  LIMIT 1;

  IF _last_watched IS NOT NULL
     AND EXTRACT(EPOCH FROM (now() - _last_watched)) < _min_seconds_between THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'too_fast'
    );
  END IF;

  SELECT COUNT(*)::integer INTO _used_today
  FROM public.ad_rewards
  WHERE user_id = _user_id
    AND watched_at >= _since;

  IF _used_today >= _daily_limit THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'daily_limit',
      'used_today', _used_today,
      'limit', _daily_limit
    );
  END IF;

  INSERT INTO public.ad_rewards (user_id, credits_granted)
  VALUES (_user_id, _credits_per_ad);

  INSERT INTO public.user_credits (user_id, credits_remaining, total_earned)
  VALUES (_user_id, 15 + _credits_per_ad, _credits_per_ad)
  ON CONFLICT (user_id) DO UPDATE
  SET credits_remaining = public.user_credits.credits_remaining + _credits_per_ad,
      total_earned = public.user_credits.total_earned + _credits_per_ad,
      updated_at = now()
  RETURNING credits_remaining INTO _credits_remaining;

  RETURN jsonb_build_object(
    'success', true,
    'credits_remaining', _credits_remaining,
    'credits_granted', _credits_per_ad,
    'used_today', _used_today + 1,
    'limit', _daily_limit
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_ad_reward() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_ad_reward() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_ad_reward() TO service_role;