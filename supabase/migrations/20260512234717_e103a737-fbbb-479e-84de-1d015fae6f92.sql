CREATE TABLE IF NOT EXISTS public.ai_response_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL UNIQUE,
  endpoint text NOT NULL,
  response jsonb NOT NULL,
  hits integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_ai_response_cache_key ON public.ai_response_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_response_cache_expires ON public.ai_response_cache(expires_at);

ALTER TABLE public.ai_response_cache ENABLE ROW LEVEL SECURITY;

-- No public access; only service role (used by edge functions) can read/write.
CREATE POLICY "no_public_select_cache" ON public.ai_response_cache FOR SELECT USING (false);

CREATE OR REPLACE FUNCTION public.cleanup_expired_ai_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.ai_response_cache WHERE expires_at < now();
END;
$$;