
CREATE TABLE public.carousel_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_key text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  detail text NOT NULL DEFAULT '',
  examples text[] NOT NULL DEFAULT '{}',
  icon text NOT NULL DEFAULT 'sparkles',
  color_theme text NOT NULL DEFAULT 'primary',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.carousel_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carousel_items TO authenticated;
GRANT ALL ON public.carousel_items TO service_role;

ALTER TABLE public.carousel_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active carousel items"
  ON public.carousel_items FOR SELECT
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert carousel items"
  ON public.carousel_items FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update carousel items"
  ON public.carousel_items FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete carousel items"
  ON public.carousel_items FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER carousel_items_updated_at
  BEFORE UPDATE ON public.carousel_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with the current 10 carousel items (community now uses 'users' icon)
INSERT INTO public.carousel_items (item_key, title, description, detail, examples, icon, color_theme, sort_order) VALUES
('summaries', 'Resumos inteligentes', 'Resumos completos e organizados em segundos para qualquer tema.',
  'Resumos claros e estruturados, com tópicos organizados, definições essenciais, exemplos práticos e analogias para fixar o conteúdo de forma rápida. Ideal para revisar antes de provas, ENEM, vestibulares e concursos.',
  ARRAY['Fotossíntese: etapas, equação, fase clara e escura, com exemplo do dia a dia.','Revolução Francesa: causas, fases, principais figuras e consequências em tópicos.','Funções de 2º grau: fórmula de Bhaskara, vértice, gráfico e exemplo resolvido.'],
  'book-open', 'primary', 10),
('mindMaps', 'Mapas mentais', 'Visualize conexões e hierarquias entre conceitos.',
  'Mapas mentais visuais que conectam conceitos, mostram hierarquias e relações. Perfeitos para enxergar o tema de cima e memorizar associando ideias — não decorando frases soltas.',
  ARRAY['Sistema digestivo com órgãos, função de cada um e ramificações por etapa.','Segunda Guerra Mundial conectando países, alianças, batalhas e desfechos.','Programação: variáveis, tipos, estruturas de controle e fluxo lógico.'],
  'brain', 'secondary', 20),
('exercises', 'Exercícios com correção', 'Treine com questões objetivas e dissertativas corrigidas pela IA.',
  'Exercícios objetivos e dissertativos gerados sob medida, com correção automática, feedback explicativo e classificação (Correto, Parcial ou Incorreto). Treine de verdade e descubra exatamente o que precisa revisar.',
  ARRAY['Múltipla escolha de Biologia com explicação de por que cada alternativa está certa ou errada.','Questões dissertativas de redação com correção, nota e sugestões de melhoria.','Problemas de Matemática com passo a passo da resolução comentado.'],
  'dumbbell', 'accent', 30),
('llm', 'Modelos de IA de ponta', 'Use os melhores LLMs do mercado: Gemini, GPT e mais — escolhidos automaticamente para cada tarefa.',
  'O Learn Buddy roteia cada tipo de pedido (resumo, mapa mental, exercício, correção) para o LLM mais adequado, garantindo qualidade alta e velocidade. Você não precisa configurar nada — sempre roda no melhor modelo disponível.',
  ARRAY['Gemini 2.5 Pro para conteúdo extenso com raciocínio profundo.','Gemini 2.5 Flash para geração rápida de resumos e exercícios.','GPT-5 para correção dissertativa precisa e feedback detalhado.'],
  'cpu', 'primary', 40),
('trail', 'Trilha de progresso', '49 desafios em uma trilha gamificada estilo curva-S para medir sua evolução nos estudos.',
  'Avance pela trilha completando desafios de estudo, exercícios e missões diárias. Cada conquista desbloqueia créditos extras, badges e libera novos níveis — tornando o aprendizado viciante e visível.',
  ARRAY['Complete 5 resumos seguidos para desbloquear o nível Aprendiz.','Acerte 10 exercícios em sequência para ganhar créditos bônus.','Estude todos os dias da semana e suba de nível na trilha.'],
  'map', 'secondary', 50),
('ranking', 'Ranking competitivo', '8 níveis de ranking — de Bronze a Lenda — para medir você contra outros estudantes.',
  'Compita de verdade: a cada estudo, exercício e missão concluída você ganha pontos e sobe de divisão. Veja sua posição global, desafie amigos e prove que está estudando mais que ninguém.',
  ARRAY['Suba de Bronze para Prata acumulando 500 pontos de estudo.','Entre no top 10 da semana e ganhe destaque com badge dourado.','Compare seu progresso com colegas dentro de grupos de estudo.'],
  'trophy', 'accent', 60),
('groups', 'Grupos de estudo', 'Crie ou entre em grupos para estudar junto, conversar em tempo real e compartilhar materiais.',
  'Forme um grupo com seus amigos da escola, faculdade ou cursinho. Tenha um chat em tempo real, compartilhe resumos gerados, troque dúvidas e estude em conjunto — totalmente grátis.',
  ARRAY['Grupo da turma do 3º ano para revisar para o ENEM juntos.','Chat em tempo real para tirar dúvidas com colegas durante o estudo.','Compartilhe resumos e mapas mentais gerados pela IA com o grupo.'],
  'users', 'primary', 70),
('community', 'Comunidade', 'Compartilhe dúvidas, conquistas e ajude outros estudantes na comunidade.',
  'Poste perguntas, compartilhe materiais e celebre conquistas com outros estudantes. Doe Buddies para reconhecer respostas úteis e construa uma rede de apoio nos estudos.',
  ARRAY['Tire dúvidas com a comunidade quando travar em um exercício.','Ajude colegas e ganhe Buddies como reconhecimento.','Compartilhe seus melhores resumos e mapas mentais.'],
  'users', 'violet', 80),
('chatBuddy', 'Chat com Learn Buddy', 'Converse com a IA tutora para tirar dúvidas a qualquer hora.',
  'Um tutor de IA pessoal disponível 24/7. Explique conceitos do seu jeito, peça exemplos, simule provas orais — a conversa fica salva no seu histórico.',
  ARRAY['Peça explicações em linguagem simples quando o assunto for difícil.','Simule provas orais e treine para entrevistas.','Reveja conversas antigas no seu histórico pessoal.'],
  'message-square', 'rose', 90),
('credits', 'Sistema de créditos', 'Comece com créditos diários grátis e ganhe mais completando desafios da trilha.',
  'Cada usuário recebe créditos para gerar materiais (10 sem conta, 15 logado). Termine desafios da trilha de progresso para ganhar créditos extras — sem precisar pagar nada, nunca.',
  ARRAY['15 créditos por dia só por estar logado na sua conta.','Créditos bônus ao completar marcos da trilha de progresso.','Ganhe créditos extras subindo de nível no ranking.'],
  'coins', 'secondary', 100);
