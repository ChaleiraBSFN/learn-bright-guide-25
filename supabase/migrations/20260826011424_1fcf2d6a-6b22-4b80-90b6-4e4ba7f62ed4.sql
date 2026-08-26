CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS TABLE(studies_count bigint, users_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM public.user_history)::bigint AS studies_count,
    (SELECT count(*) FROM public.profiles)::bigint AS users_count;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon, authenticated, service_role;