CREATE OR REPLACE FUNCTION public.sync_buddy_subscription(_user_id uuid, _status text, _expires_at timestamp with time zone, _stripe_customer_id text DEFAULT NULL::text, _stripe_subscription_id text DEFAULT NULL::text, _price_id text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM set_config('app.sync_subscription', 'on', true);

  INSERT INTO public.subscriptions (user_id, plan_type, status, starts_at, expires_at, stripe_customer_id, stripe_subscription_id, price_id)
  VALUES (_user_id, 'buddy', _status, CASE WHEN _status = 'active' THEN now() ELSE NULL END, _expires_at, _stripe_customer_id, _stripe_subscription_id, _price_id)
  ON CONFLICT (user_id) DO UPDATE
    SET plan_type = 'buddy',
        status = EXCLUDED.status,
        expires_at = EXCLUDED.expires_at,
        starts_at = COALESCE(public.subscriptions.starts_at, EXCLUDED.starts_at),
        stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, public.subscriptions.stripe_customer_id),
        stripe_subscription_id = COALESCE(EXCLUDED.stripe_subscription_id, public.subscriptions.stripe_subscription_id),
        price_id = COALESCE(EXCLUDED.price_id, public.subscriptions.price_id),
        updated_at = now();

  PERFORM set_config('app.sync_subscription', 'off', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.grant_buddy_monthly_credits(_user_id uuid, _period text, _amount integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  already text;
  remaining integer;
BEGIN
  IF NOT public.is_buddy(_user_id) THEN
    RETURN -1;
  END IF;

  SELECT credits_period INTO already
  FROM public.subscriptions
  WHERE user_id = _user_id AND plan_type = 'buddy';

  IF already IS NOT NULL AND already = _period THEN
    RETURN -2;
  END IF;

  remaining := public.add_credits(_user_id, _amount);

  PERFORM set_config('app.sync_subscription', 'on', true);
  UPDATE public.subscriptions
  SET credits_period = _period, updated_at = now()
  WHERE user_id = _user_id AND plan_type = 'buddy';
  PERFORM set_config('app.sync_subscription', 'off', true);

  RETURN remaining;
END;
$function$;