-- Function to get pending feature purchases (admin only)
CREATE OR REPLACE FUNCTION public.get_pending_feature_purchases()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  user_email text,
  feature_type text,
  study_topic text,
  status text,
  created_at timestamp with time zone,
  payment_proof text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    fp.id,
    fp.user_id,
    p.email as user_email,
    fp.feature_type,
    fp.study_topic,
    fp.status,
    fp.created_at,
    fp.stripe_payment_id as payment_proof
  FROM public.feature_purchases fp
  LEFT JOIN public.profiles p ON p.user_id = fp.user_id
  WHERE fp.status = 'pending'
    AND fp.stripe_payment_id IS NOT NULL
    AND fp.stripe_payment_id LIKE 'pix:%'
  ORDER BY fp.created_at ASC;
END;
$$;

-- Function to approve a feature purchase (admin only)
CREATE OR REPLACE FUNCTION public.approve_feature_purchase(_purchase_id uuid)
RETURNS feature_purchases
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.feature_purchases;
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;
  
  -- Update feature purchase to active
  UPDATE public.feature_purchases
  SET 
    status = 'active',
    purchased_at = now(),
    updated_at = now()
  WHERE id = _purchase_id AND status = 'pending'
  RETURNING * INTO result;
  
  IF result IS NULL THEN
    RAISE EXCEPTION 'Feature purchase not found or already processed';
  END IF;
  
  RETURN result;
END;
$$;