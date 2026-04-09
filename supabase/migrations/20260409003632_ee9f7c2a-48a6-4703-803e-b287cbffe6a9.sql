-- Remove client-side INSERT policy for achievements
DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;

-- Create a secure server-side function to grant achievements
CREATE OR REPLACE FUNCTION public.grant_achievement(_user_id uuid, _achievement_id integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow if called for the authenticated user
  IF auth.uid() IS NULL OR auth.uid() != _user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Insert achievement (ignore duplicates)
  INSERT INTO public.user_achievements (user_id, achievement_id)
  VALUES (_user_id, _achievement_id)
  ON CONFLICT DO NOTHING;
END;
$$;