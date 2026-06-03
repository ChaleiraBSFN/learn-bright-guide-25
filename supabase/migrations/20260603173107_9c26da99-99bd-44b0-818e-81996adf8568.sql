
CREATE TABLE public.promo_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  cta_label text NOT NULL DEFAULT 'Explorar',
  route text NOT NULL DEFAULT '/',
  icon text NOT NULL DEFAULT 'users',
  variant text NOT NULL DEFAULT 'violet',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT ON public.promo_banners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.promo_banners TO authenticated;
GRANT ALL ON public.promo_banners TO service_role;

ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promo banners"
  ON public.promo_banners FOR SELECT
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert promo banners"
  ON public.promo_banners FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update promo banners"
  ON public.promo_banners FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete promo banners"
  ON public.promo_banners FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.promo_banners (title, description, cta_label, route, icon, variant, sort_order)
VALUES (
  '✨ Conheça a Comunidade!',
  'Compartilhe exercícios, soluções e dúvidas com estudantes de todo o mundo. Doe buddies para ajudar quem você curte!',
  'Explorar',
  '/community',
  'users',
  'violet',
  0
);
