
CREATE OR REPLACE FUNCTION public.use_credit(_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  remaining integer;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

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
$function$;

CREATE OR REPLACE FUNCTION public.get_credits(_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  remaining integer;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.user_credits (user_id, credits_remaining)
  VALUES (_user_id, 15)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT credits_remaining INTO remaining FROM public.user_credits WHERE user_id = _user_id;
  RETURN remaining;
END;
$function$;
