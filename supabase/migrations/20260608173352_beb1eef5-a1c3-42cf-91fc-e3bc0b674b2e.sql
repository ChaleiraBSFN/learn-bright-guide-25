
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
  VALUES (_user_id, 100)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT credits_remaining INTO remaining FROM public.user_credits WHERE user_id = _user_id;
  RETURN remaining;
END;
$function$;

UPDATE public.user_credits SET credits_remaining = 100 WHERE credits_remaining < 100;
