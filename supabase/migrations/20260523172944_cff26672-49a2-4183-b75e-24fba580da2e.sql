
-- 1) Remove sensitive tables from realtime publication to prevent data leaks via Realtime broadcasts
ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;
ALTER PUBLICATION supabase_realtime DROP TABLE public.subscriptions;
ALTER PUBLICATION supabase_realtime DROP TABLE public.site_visits;
ALTER PUBLICATION supabase_realtime DROP TABLE public.user_history;
ALTER PUBLICATION supabase_realtime DROP TABLE public.user_credits;
ALTER PUBLICATION supabase_realtime DROP TABLE public.user_achievements;

-- 2) Drop broad public SELECT on avatars (public buckets serve via CDN, RLS not required for reads)
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;

-- 3) Harden SECURITY DEFINER functions: revoke from anon/authenticated where appropriate
-- Admin-only functions: revoke from anon and authenticated (server-side admin RPC use)
REVOKE EXECUTE ON FUNCTION public.get_pending_feature_purchases() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_pending_subscriptions() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_site_analytics() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_online_now(integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.approve_subscription(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.approve_feature_purchase(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limits() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_ai_cache() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, integer) FROM anon, authenticated;

-- Authenticated-only functions: revoke from anon
REVOKE EXECUTE ON FUNCTION public.use_credit(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.grant_achievement(uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_pending_subscription() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_group_member_history(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_feature_access(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_credits(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_rate_limit_remaining(uuid, text, integer, integer) FROM anon;

-- Internal-only helpers: revoke from public/anon/authenticated entirely
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
