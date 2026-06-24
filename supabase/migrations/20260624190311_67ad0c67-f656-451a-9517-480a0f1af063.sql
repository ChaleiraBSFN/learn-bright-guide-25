
-- 1) feature_purchases: scope SELECT to authenticated only
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.feature_purchases;
CREATE POLICY "Users can view their own purchases"
ON public.feature_purchases
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2) user_achievements: remove broad SELECT, keep owner SELECT, add admin SELECT
DROP POLICY IF EXISTS "Anyone can view all achievements for ranking" ON public.user_achievements;

CREATE POLICY "Admins can view all achievements"
ON public.user_achievements
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
