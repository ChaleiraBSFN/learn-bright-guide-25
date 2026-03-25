-- Create rate limits table for tracking API usage
CREATE TABLE public.rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create unique index for efficient lookups and upserts
CREATE UNIQUE INDEX idx_rate_limits_user_endpoint ON public.rate_limits(user_id, endpoint);

-- Create index for cleanup queries
CREATE INDEX idx_rate_limits_window_start ON public.rate_limits(window_start);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No direct user access - only via SECURITY DEFINER functions
-- This prevents users from manipulating their own rate limits

-- Create function to check and increment rate limit
-- Returns TRUE if request is allowed, FALSE if rate limited
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id uuid,
  _endpoint text,
  _max_requests integer DEFAULT 10,
  _window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_window timestamp with time zone;
  current_count integer;
BEGIN
  current_window := date_trunc('hour', now()) + 
    (floor(extract(minute from now()) / _window_minutes) * _window_minutes) * interval '1 minute';
  
  -- Try to insert or update the rate limit record
  INSERT INTO public.rate_limits (user_id, endpoint, request_count, window_start)
  VALUES (_user_id, _endpoint, 1, current_window)
  ON CONFLICT (user_id, endpoint) DO UPDATE
  SET 
    request_count = CASE 
      WHEN rate_limits.window_start = current_window THEN rate_limits.request_count + 1
      ELSE 1
    END,
    window_start = current_window
  RETURNING request_count INTO current_count;
  
  -- Check if within limit
  RETURN current_count <= _max_requests;
END;
$$;

-- Create function to get remaining requests
CREATE OR REPLACE FUNCTION public.get_rate_limit_remaining(
  _user_id uuid,
  _endpoint text,
  _max_requests integer DEFAULT 10,
  _window_minutes integer DEFAULT 60
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_window timestamp with time zone;
  current_count integer;
BEGIN
  current_window := date_trunc('hour', now()) + 
    (floor(extract(minute from now()) / _window_minutes) * interval '1 minute');
  
  SELECT request_count INTO current_count
  FROM public.rate_limits
  WHERE user_id = _user_id 
    AND endpoint = _endpoint 
    AND window_start = current_window;
  
  IF current_count IS NULL THEN
    RETURN _max_requests;
  END IF;
  
  RETURN GREATEST(0, _max_requests - current_count);
END;
$$;

-- Create cleanup function for old rate limit records (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '2 hours';
END;
$$;