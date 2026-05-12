CREATE OR REPLACE FUNCTION public.get_online_now(_window_seconds integer DEFAULT 120)
RETURNS TABLE(online_count integer, registered_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(DISTINCT COALESCE(user_id::text, session_id))::int AS online_count,
    COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)::int AS registered_count
  FROM public.site_visits
  WHERE COALESCE(ended_at, started_at) >= now() - make_interval(secs => _window_seconds);
END;
$$;