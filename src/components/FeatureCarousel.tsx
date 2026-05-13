import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue } from "framer-motion";
import { BookOpen, Brain, Dumbbell, ChevronRight, Sparkles, CheckCircle2, Cpu, Map, Trophy, Users, Coins } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Feature {
  id: string;
  icon: typeof BookOpen;
  color: string;
  bgGradient: string;
  borderColor: string;
  title: string;
  description: string;
  detail: string;
  examples: string[];
}

export function FeatureCarousel() {
  const { t } = useTranslation();
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState<Feature | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const x = useMotionValue(0);

  const features: Feature[] = [
    {
      id: "summaries",
      icon: BookOpen,
      color: "text-primary",
      bgGradient: "from-primary/10 via-primary/5 to-transparent",
      borderColor: "border-primary/30",
      title: t("features.summaries"),
      description: t("features.summariesLong"),
      detail:
        "Resumos claros e estruturados, com tópicos organizados, definições essenciais, exemplos práticos e analogias para fixar o conteúdo de forma rápida. Ideal para revisar antes de provas, ENEM, vestibulares e concursos.",
      examples: [
        "Fotossíntese: etapas, equação, fase clara e escura, com exemplo do dia a dia.",
        "Revolução Francesa: causas, fases, principais figuras e consequências em tópicos.",
        "Funções de 2º grau: fórmula de Bhaskara, vértice, gráfico e exemplo resolvido.",
      ],
    },
    {
      id: "mindMaps",
      icon: Brain,
      color: "text-secondary",
      bgGradient: "from-secondary/10 via-secondary/5 to-transparent",
      borderColor: "border-secondary/30",
      title: t("features.mindMaps"),
      description: t("features.mindMapsLong"),
      detail:
        "Mapas mentais visuais que conectam conceitos, mostram hierarquias e relações. Perfeitos para enxergar o tema de cima e memorizar associando ideias — não decorando frases soltas.",
      examples: [
        "Sistema digestivo com órgãos, função de cada um e ramificações por etapa.",
        "Segunda Guerra Mundial conectando países, alianças, batalhas e desfechos.",
        "Programação: variáveis, tipos, estruturas de controle e fluxo lógico.",
      ],
    },
    {
      id: "exercises",
      icon: Dumbbell,
      color: "text-accent",
      bgGradient: "from-accent/10 via-accent/5 to-transparent",
      borderColor: "border-accent/30",
      title: t("features.exercises"),
      description: t("features.exercisesLong"),
      detail:
        "Exercícios objetivos e dissertativos gerados sob medida, com correção automática, feedback explicativo e classificação (Correto, Parcial ou Incorreto). Treine de verdade e descubra exatamente o que precisa revisar.",
      examples: [
        "Múltipla escolha de Biologia com explicação de por que cada alternativa está certa ou errada.",
        "Questões dissertativas de redação com correção, nota e sugestões de melhoria.",
        "Problemas de Matemática com passo a passo da resolução comentado.",
      ],
    },
    {
      id: "llm",
      icon: Cpu,
      color: "text-primary",
      bgGradient: "from-primary/10 via-primary/5 to-transparent",
      borderColor: "border-primary/30",
      title: "Modelos de IA de ponta",
      description: "Use os melhores LLMs do mercado: Gemini, GPT e mais — escolhidos automaticamente para cada tarefa.",
      detail:
        "O Learn Buddy roteia cada tipo de pedido (resumo, mapa mental, exercício, correção) para o LLM mais adequado, garantindo qualidade alta e velocidade. Você não precisa configurar nada — sempre roda no melhor modelo disponível.",
      examples: [
        "Gemini 2.5 Pro para conteúdo extenso com raciocínio profundo.",
        "Gemini 2.5 Flash para geração rápida de resumos e exercícios.",
        "GPT-5 para correção dissertativa precisa e feedback detalhado.",
      ],
    },
    {
      id: "trail",
      icon: Map,
      color: "text-secondary",
      bgGradient: "from-secondary/10 via-secondary/5 to-transparent",
      borderColor: "border-secondary/30",
      title: "Trilha de progresso",
      description: "49 desafios em uma trilha gamificada estilo curva-S para medir sua evolução nos estudos.",
      detail:
        "Avance pela trilha completando desafios de estudo, exercícios e missões diárias. Cada conquista desbloqueia créditos extras, badges e libera novos níveis — tornando o aprendizado viciante e visível.",
      examples: [
        "Complete 5 resumos seguidos para desbloquear o nível Aprendiz.",
        "Acerte 10 exercícios em sequência para ganhar créditos bônus.",
        "Estude todos os dias da semana e suba de nível na trilha.",
      ],
    },
    {
      id: "ranking",
      icon: Trophy,
      color: "text-accent",
      bgGradient: "from-accent/10 via-accent/5 to-transparent",
      borderColor: "border-accent/30",
      title: "Ranking competitivo",
      description: "8 níveis de ranking — de Bronze a Lenda — para medir você contra outros estudantes.",
      detail:
        "Compita de verdade: a cada estudo, exercício e missão concluída você ganha pontos e sobe de divisão. Veja sua posição global, desafie amigos e prove que está estudando mais que ninguém.",
      examples: [
        "Suba de Bronze para Prata acumulando 500 pontos de estudo.",
        "Entre no top 10 da semana e ganhe destaque com badge dourado.",
        "Compare seu progresso com colegas dentro de grupos de estudo.",
      ],
    },
    {
      id: "groups",
      icon: Users,
      color: "text-primary",
      bgGradient: "from-primary/10 via-primary/5 to-transparent",
      borderColor: "border-primary/30",
      title: "Grupos de estudo",
      description: "Crie ou entre em grupos para estudar junto, conversar em tempo real e compartilhar materiais.",
      detail:
        "Forme um grupo com seus amigos da escola, faculdade ou cursinho. Tenha um chat em tempo real, compartilhe resumos gerados, troque dúvidas e estude em conjunto — totalmente grátis.",
      examples: [
        "Grupo da turma do 3º ano para revisar para o ENEM juntos.",
        "Chat em tempo real para tirar dúvidas com colegas durante o estudo.",
        "Compartilhe resumos e mapas mentais gerados pela IA com o grupo.",
      ],
    },
    {
      id: "credits",
      icon: Coins,
      color: "text-secondary",
      bgGradient: "from-secondary/10 via-secondary/5 to-transparent",
      borderColor: "border-secondary/30",
      title: "Sistema de créditos",
      description: "Comece com créditos diários grátis e ganhe mais completando desafios da trilha.",
      detail:
        "Cada usuário recebe créditos para gerar materiais (10 sem conta, 15 logado). Termine desafios da trilha de progresso para ganhar créditos extras — sem precisar pagar nada, nunca.",
      examples: [
        "15 créditos por dia só por estar logado na sua conta.",
        "Créditos bônus ao completar marcos da trilha de progresso.",
        "Ganhe créditos extras subindo de nível no ranking.",
      ],
    },
  ];

  // Triple for seamless loop
  const items = [...features, ...features, ...features];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const normalSpeed = 60; // px per second
    const slowSpeed = normalSpeed * 0.35;

    let raf: number;
    const step = (timestamp: number) => {
      if (lastTimeRef.current == null) {
        lastTimeRef.current = timestamp;
      }
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const speed = paused ? slowSpeed : normalSpeed;
      progressRef.current -= delta * speed;

      const totalWidth = track.scrollWidth / 3; // we tripled the items
      if (totalWidth > 0) {
        // Wrap modulo totalWidth
        progressRef.current = ((progressRef.current % totalWidth) + totalWidth) % totalWidth;
        x.set(-progressRef.current);
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      lastTimeRef.current = null;
    };
  }, [paused, x]);

  return (
    <>
      <div
        className="relative w-screen left-1/2 -translate-x-1/2 overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Tiny edge fades */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-3 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-3 bg-gradient-to-l from-background to-transparent" />

        <motion.div
          ref={trackRef}
          className="flex gap-3 py-2"
          style={{ x, width: "fit-content" }}
        >
          {items.map((feat, i) => (
            <FeatureCard
              key={`${feat.id}-${i}`}
              feature={feat}
              index={i}
              onOpen={() => setActive(feat)}
            />
          ))}
        </motion.div>
      </div>

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-lg sm:max-w-xl max-h-[85vh] overflow-y-auto">
          {active && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${active.color} bg-current/10`}
                  >
                    <active.icon className={`h-6 w-6 ${active.color}`} />
                  </div>
                  <DialogTitle className="font-display text-xl sm:text-2xl">
                    {active.title}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-sm sm:text-base text-foreground/80 leading-relaxed">
                  {active.detail}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-3">
                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Sparkles className={`h-4 w-4 ${active.color}`} />
                  Exemplos
                </h4>
                <ul className="space-y-2.5">
                  {active.examples.map((ex, idx) => (
                    <li
                      key={idx}
                      className="flex gap-2.5 text-sm sm:text-base text-foreground leading-relaxed"
                    >
                      <CheckCircle2
                        className={`h-5 w-5 mt-0.5 flex-shrink-0 ${active.color}`}
                      />
                      <span>{ex}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function FeatureCard({
  feature,
  index,
  onOpen,
}: {
  feature: Feature;
  index: number;
  onOpen: () => void;
}) {
  return (
    <motion.div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}
      className={`relative flex-shrink-0 w-[180px] sm:w-[200px] md:w-[220px] rounded-2xl border ${feature.borderColor} bg-card overflow-hidden group cursor-pointer shadow-md hover:shadow-2xl transition-shadow duration-300`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % 3) * 0.1, duration: 0.35 }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      style={{
        boxShadow:
          "0 10px 25px -10px rgba(0,0,0,0.25), 0 4px 10px -4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      {/* Background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-70 group-hover:opacity-100 transition-opacity duration-300`}
      />

      {/* Glossy highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent" />

      <div className="relative p-4 sm:p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div
            className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl ${feature.color} bg-current/10 shadow-inner`}
            style={{
              boxShadow:
                "inset 0 2px 4px rgba(0,0,0,0.1), 0 2px 6px -2px rgba(0,0,0,0.2)",
            }}
          >
            <feature.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${feature.color}`} />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <h3 className="font-display text-base sm:text-lg font-bold text-foreground leading-tight">
            {feature.title}
          </h3>
          <p className="text-sm sm:text-[0.95rem] text-muted-foreground leading-snug line-clamp-3">
            {feature.description}
          </p>
        </div>

        {/* Saiba mais hint */}
        <div
          className={`relative inline-flex items-center gap-1 text-xs font-semibold ${feature.color} group-hover:gap-2 transition-all duration-200 uppercase tracking-wider`}
        >
          <span>Saiba mais</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Bottom accent bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-1 ${feature.color.replace("text-", "bg-")} opacity-60 group-hover:opacity-100 transition-opacity duration-300`}
      />
    </motion.div>
  );
}
