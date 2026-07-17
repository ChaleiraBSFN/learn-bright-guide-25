
-- Prevent users from changing plan_type on their own subscription updates.
-- Only admins (or service_role) can change plan_type; other users' updates keep OLD.plan_type.

CREATE OR REPLACE FUNCTION public.prevent_subscription_plan_type_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.plan_type IS DISTINCT FROM OLD.plan_type THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      NEW.plan_type := OLD.plan_type;
    END IF;
  END IF;

  -- Also lock starts_at/expires_at from user tampering (defense in depth)
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.starts_at := OLD.starts_at;
    NEW.expires_at := OLD.expires_at;
    NEW.status := OLD.status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_subscription_plan_type_change ON public.subscriptions;
CREATE TRIGGER trg_prevent_subscription_plan_type_change
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_subscription_plan_type_change();

-- Tighten the WITH CHECK policy: the broken self-referential subquery is removed.
-- Immutability of plan_type / starts_at / expires_at / status is enforced by the trigger above.
DROP POLICY IF EXISTS "Users can update pending subscription proof only" ON public.subscriptions;
CREATE POLICY "Users can update pending subscription proof only"
ON public.subscriptions
FOR UPDATE
USING ((auth.uid() = user_id) AND (status = 'pending'::text))
WITH CHECK ((auth.uid() = user_id) AND (status = 'pending'::text));
