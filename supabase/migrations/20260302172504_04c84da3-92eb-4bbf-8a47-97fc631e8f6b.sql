
-- Fix the overly permissive INSERT policy on study_group_members
DROP POLICY IF EXISTS "Anyone can add themselves or admins can add" ON public.study_group_members;

CREATE POLICY "Users can add themselves or admins can add" ON public.study_group_members
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id OR public.is_group_admin(auth.uid(), group_id)
);
