DROP POLICY IF EXISTS "Users can update pending subscription proof only" ON public.subscriptions;
CREATE POLICY "Users can update pending subscription proof only"
ON public.subscriptions
FOR UPDATE
USING ((auth.uid() = user_id) AND (status = 'pending'::text))
WITH CHECK (
  (auth.uid() = user_id)
  AND (status = 'pending'::text)
  AND (starts_at IS NULL)
  AND (expires_at IS NULL)
  AND (plan_type = (SELECT s.plan_type FROM public.subscriptions s WHERE s.id = subscriptions.id))
);