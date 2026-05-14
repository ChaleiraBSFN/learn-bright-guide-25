CREATE OR REPLACE FUNCTION public.get_public_ranking(_limit integer DEFAULT 100)
RETURNS TABLE(user_id uuid, display_name text, achievement_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ua.user_id,
    COALESCE(NULLIF(p.display_name, ''), 'Estudante') AS display_name,
    COUNT(*)::integer AS achievement_count
  FROM public.user_achievements ua
  LEFT JOIN public.profiles p ON p.user_id = ua.user_id
  GROUP BY ua.user_id, p.display_name
  ORDER BY COUNT(*) DESC, COALESCE(NULLIF(p.display_name, ''), 'Estudante') ASC
  LIMIT GREATEST(1, LEAST(COALESCE(_limit, 100), 100));
$$;

GRANT EXECUTE ON FUNCTION public.get_public_ranking(integer) TO anon, authenticated;