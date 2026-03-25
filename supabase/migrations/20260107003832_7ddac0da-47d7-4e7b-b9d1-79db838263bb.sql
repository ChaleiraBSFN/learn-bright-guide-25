-- Update the create_pending_subscription function with rate limiting and active subscription check
CREATE OR REPLACE FUNCTION public.create_pending_subscription()
RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.subscriptions;
  existing_sub public.subscriptions;
BEGIN
  -- Check for existing subscription
  SELECT * INTO existing_sub
  FROM public.subscriptions
  WHERE user_id = auth.uid();
  
  -- Block if user already has active subscription
  IF existing_sub IS NOT NULL 
     AND existing_sub.status = 'active' 
     AND existing_sub.expires_at > now() THEN
    RAISE EXCEPTION 'You already have an active subscription';
  END IF;
  
  -- Rate limit: prevent repeated calls within 5 minutes for pending subscriptions
  IF existing_sub IS NOT NULL 
     AND existing_sub.status = 'pending'
     AND existing_sub.updated_at > now() - interval '5 minutes' THEN
    -- Return existing subscription instead of error for better UX
    RETURN existing_sub;
  END IF;
  
  INSERT INTO public.subscriptions (user_id, plan_type, status)
  VALUES (auth.uid(), 'premium', 'pending')
  ON CONFLICT (user_id) DO UPDATE
    SET updated_at = now(),
        plan_type = 'premium',
        status = CASE 
          WHEN subscriptions.status = 'pending' THEN 'pending'
          ELSE subscriptions.status -- Keep current status if not pending
        END
  RETURNING * INTO result;
  
  RETURN result;
END;
$$;