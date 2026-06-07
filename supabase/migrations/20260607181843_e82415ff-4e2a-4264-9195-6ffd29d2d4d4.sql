ALTER TABLE public.user_history DROP CONSTRAINT IF EXISTS user_history_type_check;
ALTER TABLE public.user_history ADD CONSTRAINT user_history_type_check
  CHECK (type = ANY (ARRAY['study'::text, 'exercise'::text, 'chat'::text]));

DROP POLICY IF EXISTS "Users can update their own history" ON public.user_history;
CREATE POLICY "Users can update their own history"
ON public.user_history
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);