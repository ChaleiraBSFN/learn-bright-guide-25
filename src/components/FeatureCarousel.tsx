import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, useMotionValue, animate, useTransform } from "framer-motion";
import {
  BookOpen, Brain, Dumbbell, ChevronRight, ChevronLeft, Sparkles, CheckCircle2,
  Cpu, Map, Trophy, Users, Coins, HeartHandshake, MessageSquare,
  Heart, Star, Zap, Megaphone, Loader2,
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

const TRANSLATION_CACHE_KEY = 'lb_carousel_translations_v1';
type CarouselTranslation = { title: string; description: string; detail: string; examples: string[] };
type TranslationCache = Record<string, Record<string, CarouselTranslation>>;

function readTranslationCache(): TranslationCache {
  try { return JSON.parse(localStorage.getItem(TRANSLATION_CACHE_KEY) || '{}'); } catch { return {}; }
}
function writeTranslationCache(cache: TranslationCache) {
  try { localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(cache)); } catch {}
}

const loadingLabels: Record<string, string> = {
  'pt-BR': 'Traduzindo...',
  'en': 'Translating...',
  'es': 'Traduciendo...',
  'fr': 'Traduction...',
  'de': 'Übersetzen...',
  'it': 'Traduzione...',
  'ja': '翻訳中...',
  'zh': '翻译中...',
  'ru': 'Перевод...',
};

const saibaMaisLabels: Record<string, string> = {
  'pt-BR': 'Saiba mais',
  'en': 'Learn more',
  'es': 'Saber más',
  'fr': 'En savoir plus',
  'de': 'Mehr erfahren',
  'it': 'Scopri di più',
  'ja': '詳細を見る',
  'zh': '了解更多',
  'ru': 'Подробнее',
};

const exemplosLabels: Record<string, string> = {
  'pt-BR': 'Exemplos',
  'en': 'Examples',
  'es': 'Ejemplos',
  'fr': 'Exemples',
  'de': 'Beispiele',
  'it': 'Esempi',
  'ja': '例',
  'zh': '示例',
  'ru': 'Примеры',
};

export function FeatureCarousel() {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'pt-BR';
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState<Feature | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const manualAnimatingRef = useRef(false);
  const x = useMotionValue(0);
  const thumbX = useMotionValue(0);
  const scrollbarTrackRef = useRef<HTMLDivElement>(null);
  const scrollbarThumbRef = useRef<HTMLDivElement>(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const [totalWidth, setTotalWidth] = useState(0);
  const isDraggingThumbRef = useRef(false);

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

  const { data: translations, isLoading: isTranslating } = useQuery({
    queryKey: ['carousel-translations', lang, rows.map(r => `${r.id}:${r.title}`).join('|')],
    enabled: rows.length > 0 && lang !== 'pt-BR',
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const cache = readTranslationCache();
      const result: Record<string, CarouselTranslation> = {};
      const toTranslate: CarouselItemRow[] = [];

      for (const r of rows) {
        const key = `${r.id}:${r.title}:${r.description}:${r.detail}:${(r.examples || []).join('§')}`;
        const cached = cache[lang]?.[key];
        if (cached) result[r.id] = cached;
        else toTranslate.push(r);
      }

      if (toTranslate.length > 0) {
        const content: Record<string, CarouselTranslation> = {};
        toTranslate.forEach(r => {
          content[r.id] = {
            title: r.title,
            description: r.description,
            detail: r.detail,
            examples: r.examples || [],
          };
        });

        const { data, error } = await supabase.functions.invoke('translate-content', {
          body: { content, targetLanguage: lang },
        });

        if (!error && data) {
          if (!cache[lang]) cache[lang] = {};
          for (const r of toTranslate) {
            const tr = (data as any)[r.id];
            if (tr && tr.title && tr.description) {
              const merged: CarouselTranslation = {
                title: tr.title,
                description: tr.description,
                detail: tr.detail || r.detail,
                examples: Array.isArray(tr.examples) && tr.examples.length ? tr.examples : (r.examples || []),
              };
              result[r.id] = merged;
              const key = `${r.id}:${r.title}:${r.description}:${r.detail}:${(r.examples || []).join('§')}`;
              cache[lang][key] = merged;
            }
          }
          writeTranslationCache(cache);
        }
      }
      return result;
    },
  });

  const features: Feature[] = useMemo(() => {
    return rows.map((r) => {
      const theme = THEME_MAP[r.color_theme] || THEME_MAP.primary;
      const Icon = ICON_MAP[r.icon] || Sparkles;
      const tr = lang !== 'pt-BR' ? translations?.[r.id] : undefined;
      return {
        id: r.item_key,
        icon: Icon,
        ...theme,
        title: tr?.title ?? r.title,
        description: tr?.description ?? r.description,
        detail: tr?.detail ?? r.detail,
        examples: tr?.examples ?? (r.examples || []),
      };
    });
  }, [rows, translations, lang]);

  const items = useMemo(
    () => (features.length ? [...features, ...features, ...features] : []),
    [features],
  );

  const updateDimensions = useCallback(() => {
    const track = trackRef.current;
    const scrollbar = scrollbarTrackRef.current;
    if (track && scrollbar) {
      const tw = track.scrollWidth / 3;
      setTotalWidth(tw);
      setScrollbarWidth(scrollbar.getBoundingClientRect().width);
    }
  }, []);

  useEffect(() => {
    updateDimensions();
    const handleResize = () => updateDimensions();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateDimensions]);

  useEffect(() => {
    updateDimensions();
  }, [items, updateDimensions]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || items.length === 0) return;

    const normalSpeed = 60;
    const slowSpeed = normalSpeed * 0.35;
    const minThumb = 48;

    let raf: number;
    const step = (timestamp: number) => {
      if (lastTimeRef.current == null) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      // Don't advance auto-scroll while a manual nudge/drag is running
      if (!manualAnimatingRef.current && !isDraggingThumbRef.current) {
        const speed = paused ? slowSpeed : normalSpeed;
        progressRef.current -= delta * speed;

        const tw = track.scrollWidth / 3;
        if (tw > 0) {
          progressRef.current = ((progressRef.current % tw) + tw) % tw;
          x.set(-progressRef.current);
        }
      }

      // Sync scrollbar thumb only when not being dragged
      if (!isDraggingThumbRef.current && scrollbarWidth > 0 && totalWidth > 0) {
        const thumbWidth = Math.max(minThumb, scrollbarWidth * (scrollbarWidth / totalWidth));
        const thumbTravel = Math.max(0, scrollbarWidth - thumbWidth);
        const ratio = totalWidth > 0 ? progressRef.current / totalWidth : 0;
        thumbX.set(ratio * thumbTravel);
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      lastTimeRef.current = null;
    };
  }, [paused, x, thumbX, items.length, scrollbarWidth, totalWidth]);

  const nudge = async (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track || manualAnimatingRef.current) return;

    const card = track.firstElementChild as HTMLElement | null;
    if (!card) return;

    const gap = 12; // gap-3 = 0.75rem
    const cardWidth = card.getBoundingClientRect().width;
    // Move a bit more than one card so the user feels real progress
    const step = (cardWidth + gap) * 1.35;

    const totalWidth = track.scrollWidth / 3;
    if (totalWidth <= 0) return;

    manualAnimatingRef.current = true;
    const target = ((progressRef.current + dir * step) % totalWidth + totalWidth) % totalWidth;

    await animate(x, -target, {
      type: "spring",
      stiffness: 110,
      damping: 16,
      mass: 0.9,
    });

    progressRef.current = target;
    manualAnimatingRef.current = false;
  };

  const minThumb = 48;
  const thumbWidth = totalWidth > 0 && scrollbarWidth > 0
    ? Math.max(minThumb, scrollbarWidth * (scrollbarWidth / totalWidth))
    : minThumb;
  const thumbTravel = Math.max(0, scrollbarWidth - thumbWidth);

  const applyScrollFromRatio = useCallback((ratio: number) => {
    if (totalWidth <= 0) return;
    const clamped = Math.max(0, Math.min(1, ratio));
    const target = clamped * totalWidth;
    progressRef.current = target;
    x.set(-target);
  }, [totalWidth, x]);

  const handleScrollbarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollbarTrackRef.current || thumbTravel <= 0) return;
    const rect = scrollbarTrackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = clickX / scrollbarWidth;
    applyScrollFromRatio(ratio);
  };

  const handleThumbDrag = (_: unknown, info: { point: { x: number } }) => {
    if (!scrollbarTrackRef.current || scrollbarWidth <= 0) return;
    const trackRect = scrollbarTrackRef.current.getBoundingClientRect();
    const relativeX = info.point.x - trackRect.left;
    const ratio = relativeX / scrollbarWidth;
    applyScrollFromRatio(ratio);
  };

  if (features.length === 0) return null;

  return (
    <>
      {isTranslating && lang !== 'pt-BR' && (
        <div className="flex items-center justify-center gap-1.5 pb-1 text-xs text-foreground/60">
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
          <span>{loadingLabels[lang] || loadingLabels['en']}</span>
        </div>
      )}
      <div
        className="relative w-screen left-1/2 -translate-x-1/2 overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-3 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-3 bg-gradient-to-l from-background to-transparent" />

        <button
          type="button"
          aria-label="Anterior"
          onClick={() => nudge(-1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur shadow-md hover:bg-background hover:scale-105 active:scale-95 transition"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <button
          type="button"
          aria-label="Próximo"
          onClick={() => nudge(1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur shadow-md hover:bg-background hover:scale-105 active:scale-95 transition"
        >
          <ChevronRight className="h-5 w-5 text-foreground" />
        </button>

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
              ctaLabel={saibaMaisLabels[lang] || saibaMaisLabels['en']}
              onOpen={() => setActive(feat)}
            />
          ))}
        </motion.div>

        {/* Subtle scrollbar */}
        <div
          ref={scrollbarTrackRef}
          onClick={handleScrollbarClick}
          className="relative mx-auto mt-2 h-1.5 w-[min(92vw,720px)] cursor-pointer rounded-full bg-foreground/10 hover:bg-foreground/15 transition-colors"
          aria-label="Barra de rolagem do carrossel"
          role="scrollbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={totalWidth > 0 ? Math.round((progressRef.current / totalWidth) * 100) : 0}
        >
          <motion.div
            ref={scrollbarThumbRef}
            drag="x"
            dragConstraints={{ left: 0, right: thumbTravel }}
            dragElastic={0}
            dragMomentum={false}
            onDrag={handleThumbDrag}
            onDragStart={() => { isDraggingThumbRef.current = true; setPaused(true); }}
            onDragEnd={() => { isDraggingThumbRef.current = false; setPaused(false); }}
            style={{ x: thumbX, width: thumbWidth }}
            className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full bg-primary/70 hover:bg-primary shadow-sm cursor-grab active:cursor-grabbing"
          />
        </div>
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
                    {exemplosLabels[lang] || exemplosLabels['en']}
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
  ctaLabel,
  onOpen,
}: {
  feature: Feature;
  index: number;
  ctaLabel: string;
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
          <span>{ctaLabel}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>

      <div
        className={`absolute bottom-0 left-0 right-0 h-1 ${feature.color.replace("text-", "bg-")} opacity-60 group-hover:opacity-100 transition-opacity duration-300`}
      />
    </motion.div>
  );
}
