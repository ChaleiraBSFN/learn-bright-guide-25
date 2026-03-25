-- Prevent all profile deletions (only admins can delete via service role)
CREATE POLICY "Only admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));