CREATE POLICY "Admins can view all credits"
ON public.user_credits FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));