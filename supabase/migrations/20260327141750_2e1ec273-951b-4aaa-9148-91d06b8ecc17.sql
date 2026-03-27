
CREATE TABLE public.update_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'announcement',
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.update_notices ENABLE ROW LEVEL SECURITY;

-- Everyone can read active notices
CREATE POLICY "Anyone can view active notices"
  ON public.update_notices FOR SELECT
  TO public
  USING (active = true);

-- Admins can do everything
CREATE POLICY "Admins can view all notices"
  ON public.update_notices FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert notices"
  ON public.update_notices FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update notices"
  ON public.update_notices FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete notices"
  ON public.update_notices FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
