ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS price_id text,
  ADD COLUMN IF NOT EXISTS credits_period text;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_plan_uidx ON public.subscriptions (user_id, plan_type);

GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

-- Allow trusted server-side sync (definer function sets the flag) to change plan/status
CREATE OR REPLACE FUNCTION public.prevent_subscription_plan_type_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(current_setting('app.sync_subscription', true), '') = 'on' THEN
    RETURN NEW;
  END IF;

  IF NEW.plan_type IS DISTINCT FROM OLD.plan_type THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      NEW.plan_type := OLD.plan_type;
    END IF;
  END IF;

  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.starts_at := OLD.starts_at;
    NEW.expires_at := OLD.expires_at;
    NEW.status := OLD.status;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_buddy(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND plan_type = 'buddy'
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

CREATE OR REPLACE FUNCTION public.sync_buddy_subscription(
  _user_id uuid,
  _status text,
  _expires_at timestamptz,
  _stripe_customer_id text DEFAULT NULL,
  _stripe_subscription_id text DEFAULT NULL,
  _price_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.sync_subscription', 'on', true);

  INSERT INTO public.subscriptions (user_id, plan_type, status, starts_at, expires_at, stripe_customer_id, stripe_subscription_id, price_id)
  VALUES (_user_id, 'buddy', _status, CASE WHEN _status = 'active' THEN now() ELSE NULL END, _expires_at, _stripe_customer_id, _stripe_subscription_id, _price_id)
  ON CONFLICT (user_id, plan_type) DO UPDATE
    SET status = EXCLUDED.status,
        expires_at = EXCLUDED.expires_at,
        starts_at = COALESCE(public.subscriptions.starts_at, EXCLUDED.starts_at),
        stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, public.subscriptions.stripe_customer_id),
        stripe_subscription_id = COALESCE(EXCLUDED.stripe_subscription_id, public.subscriptions.stripe_subscription_id),
        price_id = COALESCE(EXCLUDED.price_id, public.subscriptions.price_id),
        updated_at = now();

  PERFORM set_config('app.sync_subscription', 'off', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_buddy_monthly_credits(_user_id uuid, _period text, _amount integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.sync_buddy_subscription(uuid, text, timestamptz, text, text, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_buddy_subscription(uuid, text, timestamptz, text, text, text) TO service_role;
REVOKE ALL ON FUNCTION public.grant_buddy_monthly_credits(uuid, text, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_buddy_monthly_credits(uuid, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_buddy(uuid) TO authenticated, service_role;