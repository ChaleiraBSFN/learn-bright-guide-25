-- Drop the existing UPDATE policy that allows users to modify any field
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;

-- Create a more restrictive UPDATE policy that only allows updating payment proof while status is pending
CREATE POLICY "Users can update pending subscription proof only"
ON public.subscriptions FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (
  auth.uid() = user_id 
  AND status = 'pending'
  AND starts_at IS NULL 
  AND expires_at IS NULL
);

-- Create a secure function for creating/updating pending subscriptions
CREATE OR REPLACE FUNCTION public.create_pending_subscription()
RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.subscriptions;
BEGIN
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_pending_subscription() TO authenticated;