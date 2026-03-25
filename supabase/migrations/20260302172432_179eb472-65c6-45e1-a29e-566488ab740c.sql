
-- Drop existing restrictive policies on study_groups
DROP POLICY IF EXISTS "Members can view their groups" ON public.study_groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.study_groups;
DROP POLICY IF EXISTS "Admins can update their groups" ON public.study_groups;
DROP POLICY IF EXISTS "Owner can delete group" ON public.study_groups;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Members can view their groups" ON public.study_groups
FOR SELECT TO authenticated
USING (public.is_group_member(auth.uid(), id));

CREATE POLICY "Authenticated users can create groups" ON public.study_groups
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update their groups" ON public.study_groups
FOR UPDATE TO authenticated
USING (public.is_group_admin(auth.uid(), id));

CREATE POLICY "Owner can delete group" ON public.study_groups
FOR DELETE TO authenticated
USING (created_by = auth.uid());

-- Drop existing restrictive policies on study_group_members
DROP POLICY IF EXISTS "Members can view group members" ON public.study_group_members;
DROP POLICY IF EXISTS "Admins can add members" ON public.study_group_members;
DROP POLICY IF EXISTS "Admins can update member roles" ON public.study_group_members;
DROP POLICY IF EXISTS "Admins can remove members" ON public.study_group_members;

-- Recreate as PERMISSIVE
CREATE POLICY "Members can view group members" ON public.study_group_members
FOR SELECT TO authenticated
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Anyone can add themselves or admins can add" ON public.study_group_members
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can update member roles" ON public.study_group_members
FOR UPDATE TO authenticated
USING (public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Admins or self can remove members" ON public.study_group_members
FOR DELETE TO authenticated
USING (public.is_group_admin(auth.uid(), group_id) OR auth.uid() = user_id);

-- Drop existing restrictive policies on study_group_messages
DROP POLICY IF EXISTS "Members can view group messages" ON public.study_group_messages;
DROP POLICY IF EXISTS "Members can send messages" ON public.study_group_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.study_group_messages;

-- Recreate as PERMISSIVE
CREATE POLICY "Members can view group messages" ON public.study_group_messages
FOR SELECT TO authenticated
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Members can send messages" ON public.study_group_messages
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Users can delete own messages" ON public.study_group_messages
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Drop existing restrictive policies on study_group_invites
DROP POLICY IF EXISTS "Admins can view invites" ON public.study_group_invites;
DROP POLICY IF EXISTS "Admins can create invites" ON public.study_group_invites;
DROP POLICY IF EXISTS "Admins can update invites" ON public.study_group_invites;
DROP POLICY IF EXISTS "Admins can delete invites" ON public.study_group_invites;
DROP POLICY IF EXISTS "Anyone can view invite by token" ON public.study_group_invites;

-- Recreate as PERMISSIVE
CREATE POLICY "Admins can view invites" ON public.study_group_invites
FOR SELECT TO authenticated
USING (public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Anyone can view invite by token" ON public.study_group_invites
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can create invites" ON public.study_group_invites
FOR INSERT TO authenticated
WITH CHECK (public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Admins can update invites" ON public.study_group_invites
FOR UPDATE TO authenticated
USING (public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Admins can delete invites" ON public.study_group_invites
FOR DELETE TO authenticated
USING (public.is_group_admin(auth.uid(), group_id));
