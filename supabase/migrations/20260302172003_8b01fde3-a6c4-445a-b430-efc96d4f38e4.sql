
-- Function to get study history for all members of a group (only if caller is a member)
CREATE OR REPLACE FUNCTION public.get_group_member_history(_group_id UUID)
RETURNS TABLE (
  id UUID,
  topic TEXT,
  type TEXT,
  created_at TIMESTAMPTZ,
  level TEXT,
  display_name TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is a member of the group
  IF NOT public.is_group_member(auth.uid(), _group_id) THEN
    RAISE EXCEPTION 'Not a member of this group';
  END IF;

  RETURN QUERY
  SELECT 
    h.id,
    h.topic,
    h.type,
    h.created_at,
    h.level,
    p.display_name
  FROM public.user_history h
  JOIN public.study_group_members m ON m.user_id = h.user_id AND m.group_id = _group_id
  LEFT JOIN public.profiles p ON p.user_id = h.user_id
  ORDER BY h.created_at DESC
  LIMIT 50;
END;
$$;
