
CREATE TABLE public.engine_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_key text NOT NULL UNIQUE,
  engine_name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  notice_message text,
  show_banner boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.engine_notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view engine notices"
  ON public.engine_notices FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can insert engine notices"
  ON public.engine_notices FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update engine notices"
  ON public.engine_notices FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete engine notices"
  ON public.engine_notices FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_engine_notices_updated_at
  BEFORE UPDATE ON public.engine_notices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.engine_notices (engine_key, engine_name, status) VALUES
  ('content_engine', 'Motor de Conteúdo', 'active'),
  ('exercise_engine', 'Motor de Exercícios', 'active'),
  ('correction_engine', 'Motor de Correção', 'active'),
  ('image_engine', 'Motor de Imagens', 'active'),
  ('translation_engine', 'Motor de Tradução', 'active'),
  ('auth', 'Autenticação', 'active'),
  ('database', 'Banco de Dados', 'active'),
  ('realtime', 'Tempo Real', 'active'),
  ('storage', 'Armazenamento', 'active'),
  ('cdn', 'CDN Global', 'active'),
  ('rate_limit', 'Rate Limiting', 'active');
