import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Brain, Dumbbell, ChevronRight, Sparkles, X, CheckCircle2 } from "lucide-react";
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
  ];

  // Triple for seamless loop
  const items = [...features, ...features, ...features];

  return (
    <>
      <div
        className="relative w-full overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Fade edges */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-background to-transparent" />

        <motion.div
          className="flex gap-3 py-2"
          animate={paused ? undefined : { x: ["0%", "-33.333%"] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 22,
              ease: "linear",
            },
          }}
          style={{ width: "fit-content" }}
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
      className={`relative flex-shrink-0 w-[230px] sm:w-[260px] md:w-[290px] rounded-2xl border-2 ${feature.borderColor} bg-card overflow-hidden group`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % 3) * 0.1, duration: 0.35 }}
      whileHover={{ y: -3 }}
    >
      {/* Background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-70 group-hover:opacity-100 transition-opacity duration-300`}
      />

      <div className="relative p-4 sm:p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div
            className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl ${feature.color} bg-current/10`}
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

        {/* Saiba mais button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className={`relative z-10 inline-flex items-center gap-1 text-xs font-semibold ${feature.color} hover:gap-2 transition-all duration-200 uppercase tracking-wider`}
        >
          <span>Saiba mais</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Bottom accent bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-1 ${feature.color.replace("text-", "bg-")} opacity-50 group-hover:opacity-100 transition-opacity duration-300`}
      />
    </motion.div>
  );
}
