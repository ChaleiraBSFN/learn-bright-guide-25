-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy: users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Function to approve subscription (admin only)
CREATE OR REPLACE FUNCTION public.approve_subscription(_subscription_id UUID)
RETURNS subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.subscriptions;
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;
  
  -- Update subscription to active with 2-month expiry
  UPDATE public.subscriptions
  SET 
    status = 'active',
    starts_at = now(),
    expires_at = now() + interval '2 months',
    updated_at = now()
  WHERE id = _subscription_id AND status = 'pending'
  RETURNING * INTO result;
  
  IF result IS NULL THEN
    RAISE EXCEPTION 'Subscription not found or already processed';
  END IF;
  
  RETURN result;
END;
$$;

-- Function to get all pending subscriptions (admin only)
CREATE OR REPLACE FUNCTION public.get_pending_subscriptions()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_email TEXT,
  plan_type TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  pix_payment_proof TEXT
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
    s.id,
    s.user_id,
    p.email as user_email,
    s.plan_type,
    s.status,
    s.created_at,
    s.pix_payment_proof
  FROM public.subscriptions s
  LEFT JOIN public.profiles p ON p.user_id = s.user_id
  WHERE s.status = 'pending'
  ORDER BY s.created_at ASC;
END;
$$;