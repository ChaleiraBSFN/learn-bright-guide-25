-- Table for individual feature purchases
CREATE TABLE public.feature_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('videos', 'images', 'study_plan')),
  study_topic TEXT NOT NULL,
  study_content_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired')),
  stripe_payment_id TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_purchases ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own purchases"
ON public.feature_purchases
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchases"
ON public.feature_purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_feature_purchases_user_topic ON public.feature_purchases(user_id, study_topic, feature_type);

-- Trigger for updated_at
CREATE TRIGGER update_feature_purchases_updated_at
BEFORE UPDATE ON public.feature_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if user has purchased a specific feature for a topic
CREATE OR REPLACE FUNCTION public.has_feature_access(
  _user_id UUID,
  _feature_type TEXT,
  _study_topic TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.feature_purchases
    WHERE user_id = _user_id
      AND feature_type = _feature_type
      AND study_topic = _study_topic
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$;