CREATE POLICY "Admins can view all history for analytics"
ON public.user_history
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));