-- Drop the permissive policies
DROP POLICY IF EXISTS "Anyone can insert visits" ON public.site_visits;
DROP POLICY IF EXISTS "Anyone can update own session" ON public.site_visits;

-- Create a function to track visits securely
CREATE OR REPLACE FUNCTION public.track_site_visit(
  _session_id text,
  _user_agent text DEFAULT NULL,
  _search_query text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _visit_id uuid;
  _current_user_id uuid;
  _current_email text;
BEGIN
  _current_user_id := auth.uid();
  
  -- Get email if user is authenticated
  IF _current_user_id IS NOT NULL THEN
    SELECT email INTO _current_email FROM public.profiles WHERE user_id = _current_user_id;
  END IF;

  -- Check if session already exists
  SELECT id INTO _visit_id FROM public.site_visits WHERE session_id = _session_id;
  
  IF _visit_id IS NOT NULL THEN
    -- Update existing visit
    UPDATE public.site_visits
    SET 
      ended_at = now(),
      duration_seconds = EXTRACT(EPOCH FROM (now() - started_at))::integer,
      page_views = page_views + 1,
      search_queries = CASE 
        WHEN _search_query IS NOT NULL AND NOT (_search_query = ANY(search_queries))
        THEN array_append(search_queries, _search_query)
        ELSE search_queries
      END,
      user_id = COALESCE(user_id, _current_user_id),
      user_email = COALESCE(user_email, _current_email)
    WHERE id = _visit_id;
  ELSE
    -- Create new visit
    INSERT INTO public.site_visits (
      session_id, 
      user_id, 
      user_email,
      user_agent, 
      search_queries
    )
    VALUES (
      _session_id, 
      _current_user_id, 
      _current_email,
      _user_agent,
      CASE WHEN _search_query IS NOT NULL THEN ARRAY[_search_query] ELSE '{}' END
    )
    RETURNING id INTO _visit_id;
  END IF;
  
  RETURN _visit_id;
END;
$$;

-- Function to get visit analytics for admins
CREATE OR REPLACE FUNCTION public.get_site_analytics()
RETURNS TABLE(
  id uuid,
  session_id text,
  user_id uuid,
  user_email text,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  duration_seconds integer,
  page_views integer,
  search_queries text[],
  user_agent text,
  is_registered boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    sv.id,
    sv.session_id,
    sv.user_id,
    sv.user_email,
    sv.started_at,
    sv.ended_at,
    sv.duration_seconds,
    sv.page_views,
    sv.search_queries,
    sv.user_agent,
    sv.user_id IS NOT NULL as is_registered
  FROM public.site_visits sv
  ORDER BY sv.started_at DESC
  LIMIT 500;
END;
$$;