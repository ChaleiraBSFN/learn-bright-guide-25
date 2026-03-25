-- Create table to track site visits
CREATE TABLE public.site_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  duration_seconds integer,
  page_views integer DEFAULT 1,
  search_queries text[] DEFAULT '{}',
  user_agent text,
  ip_country text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- Only admins can view all visits
CREATE POLICY "Admins can view all visits"
  ON public.site_visits
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can insert (for anonymous tracking)
CREATE POLICY "Anyone can insert visits"
  ON public.site_visits
  FOR INSERT
  WITH CHECK (true);

-- Anyone can update their own session
CREATE POLICY "Anyone can update own session"
  ON public.site_visits
  FOR UPDATE
  USING (session_id IS NOT NULL)
  WITH CHECK (session_id IS NOT NULL);

-- Create index for performance
CREATE INDEX idx_site_visits_session ON public.site_visits(session_id);
CREATE INDEX idx_site_visits_started ON public.site_visits(started_at DESC);
CREATE INDEX idx_site_visits_user ON public.site_visits(user_id);