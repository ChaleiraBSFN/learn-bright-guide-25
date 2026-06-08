import { useState, useRef, useEffect, useMemo } from "react";
import { motion, useMotionValue } from "framer-motion";
import {
  BookOpen, Brain, Dumbbell, ChevronRight, Sparkles, CheckCircle2,
  Cpu, Map, Trophy, Users, Coins, HeartHandshake, MessageSquare,
  Heart, Star, Zap, Megaphone,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const ICON_MAP: Record<string, typeof BookOpen> = {
  "book-open": BookOpen,
  brain: Brain,
  dumbbell: Dumbbell,
  cpu: Cpu,
  map: Map,
  trophy: Trophy,
  users: Users,
  coins: Coins,
  "heart-handshake": HeartHandshake,
  "message-square": MessageSquare,
  sparkles: Sparkles,
  heart: Heart,
  star: Star,
  zap: Zap,
  megaphone: Megaphone,
};

const THEME_MAP: Record<string, { color: string; bgGradient: string; borderColor: string }> = {
  primary: {
    color: "text-primary",
    bgGradient: "from-primary/10 via-primary/5 to-transparent",
    borderColor: "border-primary dark:border-primary/30",
  },
  secondary: {
    color: "text-secondary",
    bgGradient: "from-secondary/10 via-secondary/5 to-transparent",
    borderColor: "border-secondary dark:border-secondary/30",
  },
  accent: {
    color: "text-accent",
    bgGradient: "from-accent/10 via-accent/5 to-transparent",
    borderColor: "border-accent dark:border-accent/30",
  },
  violet: {
    color: "text-violet-500",
    bgGradient: "from-violet-500/10 via-fuchsia-500/5 to-transparent",
    borderColor: "border-violet-700 dark:border-violet-500/30",
  },
  rose: {
    color: "text-rose-500",
    bgGradient: "from-rose-500/10 via-pink-500/5 to-transparent",
    borderColor: "border-rose-700 dark:border-rose-500/30",
  },
};

interface CarouselItemRow {
  id: string;
  item_key: string;
  title: string;
  description: string;
  detail: string;
  examples: string[];
  icon: string;
  color_theme: string;
  sort_order: number;
  active: boolean;
}

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

  const { data: rows = [] } = useQuery({
    queryKey: ["carousel-items-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("carousel_items")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as CarouselItemRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const features: Feature[] = useMemo(() => {
    return rows.map((r) => {
      const theme = THEME_MAP[r.color_theme] || THEME_MAP.primary;
      const Icon = ICON_MAP[r.icon] || Sparkles;
      return {
        id: r.item_key,
        icon: Icon,
        ...theme,
        title: r.title,
        description: r.description,
        detail: r.detail,
        examples: r.examples || [],
      };
    });
  }, [rows]);

  const items = useMemo(
    () => (features.length ? [...features, ...features, ...features] : []),
    [features],
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track || items.length === 0) return;

    const normalSpeed = 60;
    const slowSpeed = normalSpeed * 0.35;

    let raf: number;
    const step = (timestamp: number) => {
      if (lastTimeRef.current == null) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const speed = paused ? slowSpeed : normalSpeed;
      progressRef.current -= delta * speed;

      const totalWidth = track.scrollWidth / 3;
      if (totalWidth > 0) {
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
  }, [paused, x, items.length]);

  if (features.length === 0) return null;

  return (
    <>
      <div
        className="relative w-screen left-1/2 -translate-x-1/2 overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
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

              {active.examples.length > 0 && (
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
              )}
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
      className={`relative flex-shrink-0 w-[180px] sm:w-[200px] md:w-[220px] rounded-2xl border-2 ${feature.borderColor} bg-card overflow-hidden group cursor-pointer shadow-md hover:shadow-2xl transition-shadow duration-300`}
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
      <div
        className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-70 group-hover:opacity-100 transition-opacity duration-300`}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent" />

      <div className="relative p-4 sm:p-5 space-y-3">
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

        <div className="space-y-1.5">
          <h2 className="font-display text-base sm:text-lg font-bold text-foreground leading-tight">
            {feature.title}
          </h2>
          <p className="text-sm sm:text-[0.95rem] text-muted-foreground leading-snug line-clamp-3">
            {feature.description}
          </p>
        </div>

        <div
          className={`relative inline-flex items-center gap-1 text-xs font-semibold ${feature.color} group-hover:gap-2 transition-all duration-200 uppercase tracking-wider`}
        >
          <span>Saiba mais</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>

      <div
        className={`absolute bottom-0 left-0 right-0 h-1 ${feature.color.replace("text-", "bg-")} opacity-60 group-hover:opacity-100 transition-opacity duration-300`}
      />
    </motion.div>
  );
}
