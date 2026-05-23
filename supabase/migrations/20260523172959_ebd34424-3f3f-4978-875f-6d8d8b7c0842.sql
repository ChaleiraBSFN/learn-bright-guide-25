
-- Revoke from PUBLIC on all custom security definer functions
REVOKE EXECUTE ON FUNCTION public.get_pending_feature_purchases() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_pending_subscriptions() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_site_analytics() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_online_now(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.approve_subscription(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.approve_feature_purchase(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limits() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_ai_cache() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.use_credit(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.grant_achievement(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_pending_subscription() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_group_member_history(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_rate_limit_remaining(uuid, text, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.track_site_visit(text, text, text) FROM PUBLIC;
