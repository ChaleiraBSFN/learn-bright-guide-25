
-- Allow creators to see their own groups (needed for the INSERT...RETURNING flow)
CREATE POLICY "Creators can view their own groups" ON public.study_groups
FOR SELECT TO authenticated
USING (auth.uid() = created_by);
