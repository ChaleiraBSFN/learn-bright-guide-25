ALTER TABLE public.promo_banners
  ADD COLUMN IF NOT EXISTS start_at timestamptz,
  ADD COLUMN IF NOT EXISTS end_at timestamptz,
  ADD COLUMN IF NOT EXISTS daily_start_minutes integer,
  ADD COLUMN IF NOT EXISTS daily_end_minutes integer,
  ADD COLUMN IF NOT EXISTS days_of_week integer[],
  ADD COLUMN IF NOT EXISTS max_per_day integer,
  ADD COLUMN IF NOT EXISTS max_per_week integer;

ALTER TABLE public.promo_banners
  DROP CONSTRAINT IF EXISTS promo_banners_daily_window_check;
ALTER TABLE public.promo_banners
  ADD CONSTRAINT promo_banners_daily_window_check
  CHECK (
    (daily_start_minutes IS NULL OR (daily_start_minutes >= 0 AND daily_start_minutes <= 1440))
    AND (daily_end_minutes IS NULL OR (daily_end_minutes >= 0 AND daily_end_minutes <= 1440))
  );