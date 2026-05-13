import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Brain, Dumbbell, ChevronRight, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Feature {
  icon: typeof BookOpen;
  color: string;
  bgGradient: string;
  borderColor: string;
  title: string;
  description: string;
}

export function FeatureCarousel() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const features: Feature[] = [
    {
      icon: BookOpen,
      color: "text-primary",
      bgGradient: "from-primary/10 via-primary/5 to-transparent",
      borderColor: "border-primary/30",
      title: t("features.summaries"),
      description: t("features.summariesLong"),
    },
    {
      icon: Brain,
      color: "text-secondary",
      bgGradient: "from-secondary/10 via-secondary/5 to-transparent",
      borderColor: "border-secondary/30",
      title: t("features.mindMaps"),
      description: t("features.mindMapsLong"),
    },
    {
      icon: Dumbbell,
      color: "text-accent",
      bgGradient: "from-accent/10 via-accent/5 to-transparent",
      borderColor: "border-accent/30",
      title: t("features.exercises"),
      description: t("features.exercisesLong"),
    },
  ];

  // Duplicate for infinite scroll illusion
  const items = [...features, ...features, ...features];

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-background to-transparent" />

      <motion.div
        className="flex gap-4 py-2"
        animate={{
          x: ["0%", "-33.33%"],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 18,
            ease: "linear",
          },
        }}
        style={{ width: "fit-content" }}
        {...(isHovered && { animate: undefined })}
      >
        {items.map((feat, i) => (
          <FeatureCard key={`${feat.title}-${i}`} feature={feat} index={i} />
        ))}
      </motion.div>
    </div>
  );
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      className={`relative flex-shrink-0 w-[280px] sm:w-[320px] md:w-[380px] rounded-2xl border-2 ${feature.borderColor} bg-card overflow-hidden cursor-pointer group`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % 3) * 0.15, duration: 0.4 }}
      whileHover={{ scale: 1.03, y: -4 }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-60 group-hover:opacity-100 transition-opacity duration-300`}
      />

      {/* Glow effect on hover */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${feature.bgGradient} blur-xl`}
      />

      <div className="relative p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div
            className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl ${feature.color} bg-current/10`}
          >
            <feature.icon className={`h-6 w-6 sm:h-7 sm:w-7 ${feature.color}`} />
          </div>
          <Sparkles
            className={`h-5 w-5 ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
          />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
            {feature.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
            {feature.description}
          </p>
        </div>

        {/* Interactive hint */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground/70 group-hover:text-foreground transition-colors duration-300 pt-1">
          <span className="uppercase tracking-wider">Saiba mais</span>
          <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-300" />
        </div>
      </div>

      {/* Bottom accent bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-1 ${feature.color.replace("text-", "bg-")} opacity-40 group-hover:opacity-100 transition-opacity duration-300`}
      />
    </motion.div>
  );
}
