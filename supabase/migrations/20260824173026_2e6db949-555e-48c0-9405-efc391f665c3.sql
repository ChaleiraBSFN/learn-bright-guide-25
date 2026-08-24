REVOKE ALL ON FUNCTION public.sync_buddy_subscription(uuid, text, timestamptz, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.grant_buddy_monthly_credits(uuid, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_buddy(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_buddy_subscription(uuid, text, timestamptz, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.grant_buddy_monthly_credits(uuid, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_buddy(uuid) TO authenticated, service_role;