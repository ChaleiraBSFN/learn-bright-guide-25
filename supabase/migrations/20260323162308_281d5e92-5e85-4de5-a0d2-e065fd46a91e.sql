CREATE TABLE public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  credits_remaining integer NOT NULL DEFAULT 15,
  total_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits" ON public.user_credits
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits" ON public.user_credits
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.use_credit(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  remaining integer;
BEGIN
  INSERT INTO public.user_credits (user_id, credits_remaining)
  VALUES (_user_id, 15)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.user_credits
  SET credits_remaining = GREATEST(credits_remaining - 1, 0),
      updated_at = now()
  WHERE user_id = _user_id AND credits_remaining > 0
  RETURNING credits_remaining INTO remaining;

  IF remaining IS NULL THEN
    SELECT credits_remaining INTO remaining FROM public.user_credits WHERE user_id = _user_id;
    RETURN -1;
  END IF;

  RETURN remaining;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_credits(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  remaining integer;
BEGIN
  INSERT INTO public.user_credits (user_id, credits_remaining)
  VALUES (_user_id, 15)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT credits_remaining INTO remaining FROM public.user_credits WHERE user_id = _user_id;
  RETURN remaining;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_credits(_user_id uuid, _amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  remaining integer;
BEGIN
  INSERT INTO public.user_credits (user_id, credits_remaining)
  VALUES (_user_id, 15)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.user_credits
  SET credits_remaining = credits_remaining + _amount,
      total_earned = total_earned + _amount,
      updated_at = now()
  WHERE user_id = _user_id
  RETURNING credits_remaining INTO remaining;

  RETURN remaining;
END;
$$;