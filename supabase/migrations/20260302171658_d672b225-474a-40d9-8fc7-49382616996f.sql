
-- Study Groups table
CREATE TABLE public.study_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  max_members INTEGER NOT NULL DEFAULT 10,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Study Group Members table
CREATE TABLE public.study_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Study Group Messages table (chat)
CREATE TABLE public.study_group_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Study Group Invites table
CREATE TABLE public.study_group_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_email TEXT,
  invite_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, invite_email)
);

-- Enable RLS on all tables
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_invites ENABLE ROW LEVEL SECURITY;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_group_messages;

-- Helper function: check if user is member of group
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.study_group_members
    WHERE user_id = _user_id AND group_id = _group_id
  )
$$;

-- Helper function: check if user is owner/admin of group
CREATE OR REPLACE FUNCTION public.is_group_admin(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.study_group_members
    WHERE user_id = _user_id AND group_id = _group_id AND role IN ('owner', 'admin')
  )
$$;

-- RLS: study_groups
CREATE POLICY "Members can view their groups" ON public.study_groups
FOR SELECT USING (public.is_group_member(auth.uid(), id));

CREATE POLICY "Authenticated users can create groups" ON public.study_groups
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update their groups" ON public.study_groups
FOR UPDATE USING (public.is_group_admin(auth.uid(), id));

CREATE POLICY "Owner can delete group" ON public.study_groups
FOR DELETE USING (created_by = auth.uid());

-- RLS: study_group_members
CREATE POLICY "Members can view group members" ON public.study_group_members
FOR SELECT USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Admins can add members" ON public.study_group_members
FOR INSERT WITH CHECK (
  public.is_group_admin(auth.uid(), group_id) OR auth.uid() = user_id
);

CREATE POLICY "Admins can update member roles" ON public.study_group_members
FOR UPDATE USING (public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Admins can remove members" ON public.study_group_members
FOR DELETE USING (
  public.is_group_admin(auth.uid(), group_id) OR auth.uid() = user_id
);

-- RLS: study_group_messages
CREATE POLICY "Members can view group messages" ON public.study_group_messages
FOR SELECT USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Members can send messages" ON public.study_group_messages
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND public.is_group_member(auth.uid(), group_id)
);

CREATE POLICY "Users can delete own messages" ON public.study_group_messages
FOR DELETE USING (auth.uid() = user_id);

-- RLS: study_group_invites
CREATE POLICY "Admins can view invites" ON public.study_group_invites
FOR SELECT USING (public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Admins can create invites" ON public.study_group_invites
FOR INSERT WITH CHECK (public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Admins can update invites" ON public.study_group_invites
FOR UPDATE USING (public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Admins can delete invites" ON public.study_group_invites
FOR DELETE USING (public.is_group_admin(auth.uid(), group_id));

-- Anyone can view invites by token (for accepting)
CREATE POLICY "Anyone can view invite by token" ON public.study_group_invites
FOR SELECT USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_study_groups_updated_at
BEFORE UPDATE ON public.study_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
