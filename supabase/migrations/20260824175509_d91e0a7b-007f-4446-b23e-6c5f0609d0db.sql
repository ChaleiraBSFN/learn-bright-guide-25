CREATE OR REPLACE FUNCTION public.admin_set_test_buddy(_enable boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF _enable THEN
    PERFORM public.sync_buddy_subscription(
      auth.uid(),
      'active',
      now() + interval '30 days',
      NULL,
      NULL,
      'admin_test'
    );
    RETURN true;
  END IF;

  PERFORM set_config('app.sync_subscription', 'on', true);
  UPDATE public.subscriptions
  SET status = 'canceled', expires_at = NULL, price_id = NULL, updated_at = now()
  WHERE user_id = auth.uid() AND plan_type = 'buddy' AND price_id = 'admin_test';
  PERFORM set_config('app.sync_subscription', 'off', true);

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_test_buddy(_user_id uuid)
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
      AND price_id = 'admin_test'
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;