
-- Create table for user search/study history
CREATE TABLE public.user_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('study', 'exercise')),
  topic TEXT NOT NULL,
  level TEXT,
  content JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own history
CREATE POLICY "Users can view their own history"
  ON public.user_history FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own history
CREATE POLICY "Users can insert their own history"
  ON public.user_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own history
CREATE POLICY "Users can delete their own history"
  ON public.user_history FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_user_history_user_id ON public.user_history(user_id);
CREATE INDEX idx_user_history_created_at ON public.user_history(created_at DESC);
