
DROP POLICY IF EXISTS "Users can add themselves or admins can add" ON public.study_group_members;

CREATE POLICY "Owner self-join or admins can add members"
  ON public.study_group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Group creator joining themselves as owner (initial membership)
    (
      auth.uid() = user_id
      AND EXISTS (
        SELECT 1 FROM public.study_groups g
        WHERE g.id = study_group_members.group_id
          AND g.created_by = auth.uid()
      )
    )
    -- Or an existing admin of the group adding someone
    OR public.is_group_admin(auth.uid(), group_id)
  );
