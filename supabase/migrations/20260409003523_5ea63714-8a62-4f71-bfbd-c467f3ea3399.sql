-- 1. Fix profiles: replace overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Keep admin policy (already exists) and public group-member visibility
-- Add a policy for group members to see each other's display_name/avatar (not email)
-- We'll handle this via the existing RPC functions instead

-- 2. Fix study_group_invites: replace blanket SELECT with token-scoped lookup
DROP POLICY IF EXISTS "Anyone can view invite by token" ON public.study_group_invites;

CREATE POLICY "Users can view invites by their email"
ON public.study_group_invites
FOR SELECT
TO authenticated
USING (
  invite_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- 3. Fix user_credits: remove user INSERT policy (credits managed by server-side RPC only)
DROP POLICY IF EXISTS "Users can insert own credits" ON public.user_credits;