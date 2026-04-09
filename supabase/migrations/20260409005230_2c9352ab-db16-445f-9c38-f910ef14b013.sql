
CREATE TABLE public.ai_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section text NOT NULL,
  config_data jsonb NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(section, sort_order)
);

ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ai_config"
ON public.ai_config FOR SELECT TO public
USING (true);

CREATE POLICY "Admins can insert ai_config"
ON public.ai_config FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update ai_config"
ON public.ai_config FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete ai_config"
ON public.ai_config FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default metrics
INSERT INTO public.ai_config (section, sort_order, config_data) VALUES
('metric', 0, '{"label": "Latência Média", "value": "~1.2s", "progress": 88}'),
('metric', 1, '{"label": "Confiabilidade", "value": "99.7%", "progress": 99}'),
('metric', 2, '{"label": "Uptime", "value": "99.9%", "progress": 99}'),
('metric', 3, '{"label": "Throughput", "value": "~45 req/s", "progress": 75}');

-- Insert default models
INSERT INTO public.ai_config (section, sort_order, config_data) VALUES
('model', 0, '{"name": "Gemini 2.5 Flash", "version": "v2.5.0", "provider": "Google DeepMind", "icon": "zap", "color": "amber", "usage": "Geração de texto e conteúdo", "context": "1M tokens", "maxOutput": "16K tokens", "speed": "Rápido", "details": "Motor principal para geração de estudos e exercícios."}'),
('model', 1, '{"name": "Gemini 2.5 Flash Lite", "version": "v2.5.0-lite", "provider": "Google DeepMind", "icon": "sparkles", "color": "emerald", "usage": "Geração gratuita", "context": "1M tokens", "maxOutput": "8K tokens", "speed": "Muito rápido", "details": "Modelo leve para tarefas simples e respostas rápidas."}'),
('model', 2, '{"name": "Gemini 3.1 Flash Image", "version": "v3.1-preview", "provider": "Google DeepMind", "icon": "image", "color": "purple", "usage": "Geração de imagens", "context": "1M tokens", "maxOutput": "Imagens + texto", "speed": "Moderado", "details": "Modelo para geração de imagens educacionais."}'),
('model', 3, '{"name": "Gemini 2.5 Flash (Translate)", "version": "v2.5.0", "provider": "Google DeepMind", "icon": "languages", "color": "blue", "usage": "Tradução em tempo real", "context": "1M tokens", "maxOutput": "16K tokens", "speed": "Rápido", "details": "Tradução multilíngue de conteúdo gerado."}');

-- Insert default capabilities
INSERT INTO public.ai_config (section, sort_order, config_data) VALUES
('capability', 0, '{"label": "Conteúdo de Estudo", "icon": "book-open", "color": "primary"}'),
('capability', 1, '{"label": "Exercícios", "icon": "pen-tool", "color": "secondary"}'),
('capability', 2, '{"label": "Correção IA", "icon": "brain", "color": "accent"}'),
('capability', 3, '{"label": "Imagens", "icon": "image", "color": "purple"}'),
('capability', 4, '{"label": "Tradução", "icon": "languages", "color": "blue"}'),
('capability', 5, '{"label": "Fallback", "icon": "refresh-cw", "color": "muted"}'),
('capability', 6, '{"label": "Rate Limit", "icon": "shield", "color": "muted"}');
