
DROP POLICY IF EXISTS "Users can create their own purchases" ON public.feature_purchases;
CREATE POLICY "Users can create their own purchases"
ON public.feature_purchases
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
  AND purchased_at IS NULL
  AND expires_at IS NULL
);

DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;
CREATE POLICY "Users can insert their own subscription"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
  AND starts_at IS NULL
  AND expires_at IS NULL
);
