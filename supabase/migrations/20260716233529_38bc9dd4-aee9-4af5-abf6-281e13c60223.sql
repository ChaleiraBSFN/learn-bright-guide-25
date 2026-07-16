
-- 1. ad_rewards
CREATE TABLE public.ad_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  credits_granted integer NOT NULL DEFAULT 25,
  watched_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ad_rewards_user_watched_idx ON public.ad_rewards(user_id, watched_at DESC);

GRANT SELECT ON public.ad_rewards TO authenticated;
GRANT ALL ON public.ad_rewards TO service_role;

ALTER TABLE public.ad_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ad rewards"
ON public.ad_rewards FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. section_flags
CREATE TABLE public.section_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  title text NOT NULL DEFAULT 'Em desenvolvimento',
  message text NOT NULL DEFAULT 'Estamos trabalhando nesta funcionalidade. Volte em breve!',
  cta_label text,
  cta_url text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.section_flags TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.section_flags TO authenticated;
GRANT ALL ON public.section_flags TO service_role;

ALTER TABLE public.section_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read section flags"
ON public.section_flags FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Only admins can insert section flags"
ON public.section_flags FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update section flags"
ON public.section_flags FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete section flags"
ON public.section_flags FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER section_flags_set_updated_at
BEFORE UPDATE ON public.section_flags
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed com todas as seções principais
INSERT INTO public.section_flags (section_key, enabled) VALUES
  ('ranking', true),
  ('trail', true),
  ('study_groups', true),
  ('community', true),
  ('history', true),
  ('shop', true),
  ('carousel', true),
  ('promo_banners', true),
  ('engine_status', true),
  ('subscription', true),
  ('pix', true),
  ('password_recovery', true),
  ('demo_examples', true),
  ('exercises', true),
  ('study_plan', true),
  ('image_ocr', true),
  ('chat_buddy', true),
  ('external_sources', true),
  ('images_section', true),
  ('videos_section', true)
ON CONFLICT (section_key) DO NOTHING;
