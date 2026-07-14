import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { supabase } from '@/integrations/supabase/client';
import {
  Users, Sparkles, Megaphone, Trophy, BookOpen, Brain, Dumbbell,
  Map, Coins, Heart, Star, Zap, ArrowRight, Download, Loader2,
} from 'lucide-react';

const iconMap: Record<string, any> = {
  users: Users, sparkles: Sparkles, megaphone: Megaphone, trophy: Trophy,
  book: BookOpen, brain: Brain, dumbbell: Dumbbell, map: Map,
  coins: Coins, heart: Heart, star: Star, zap: Zap, download: Download,
};

const variantStyles: Record<string, { border: string; bg: string; ring: string; text: string; cta: string; glow1: string; glow2: string; }> = {
  violet: {
    border: 'border-violet-700 hover:border-violet-900 dark:border-violet-500/40 dark:hover:border-violet-500/70',

    bg: 'from-violet-500/15 via-fuchsia-500/10 to-purple-600/15',
    ring: 'bg-violet-500/20 ring-violet-500/30',
    text: 'text-violet-600 dark:text-violet-300',
    cta: 'bg-violet-600 hover:bg-violet-700',
    glow1: 'bg-violet-500/20', glow2: 'bg-fuchsia-500/20',
  },
  blue: {
    border: 'border-blue-700 hover:border-blue-900 dark:border-blue-500/40 dark:hover:border-blue-500/70',
    bg: 'from-blue-500/15 via-cyan-500/10 to-sky-600/15',
    ring: 'bg-blue-500/20 ring-blue-500/30',
    text: 'text-blue-600 dark:text-blue-300',
    cta: 'bg-blue-600 hover:bg-blue-700',
    glow1: 'bg-blue-500/20', glow2: 'bg-cyan-500/20',
  },
  amber: {
    border: 'border-amber-700 hover:border-amber-900 dark:border-amber-500/40 dark:hover:border-amber-500/70',
    bg: 'from-amber-500/15 via-orange-500/10 to-yellow-600/15',
    ring: 'bg-amber-500/20 ring-amber-500/30',
    text: 'text-amber-600 dark:text-amber-300',
    cta: 'bg-amber-600 hover:bg-amber-700',
    glow1: 'bg-amber-500/20', glow2: 'bg-orange-500/20',
  },
  emerald: {
    border: 'border-emerald-700 hover:border-emerald-900 dark:border-emerald-500/40 dark:hover:border-emerald-500/70',
    bg: 'from-emerald-500/15 via-teal-500/10 to-green-600/15',
    ring: 'bg-emerald-500/20 ring-emerald-500/30',
    text: 'text-emerald-600 dark:text-emerald-300',
    cta: 'bg-emerald-600 hover:bg-emerald-700',
    glow1: 'bg-emerald-500/20', glow2: 'bg-teal-500/20',
  },
  rose: {
    border: 'border-rose-700 hover:border-rose-900 dark:border-rose-500/40 dark:hover:border-rose-500/70',
    bg: 'from-rose-500/15 via-pink-500/10 to-red-600/15',
    ring: 'bg-rose-500/20 ring-rose-500/30',
    text: 'text-rose-600 dark:text-rose-300',
    cta: 'bg-rose-600 hover:bg-rose-700',
    glow1: 'bg-rose-500/20', glow2: 'bg-pink-500/20',
  },
};

function isWithinSchedule(b: any, now: Date): boolean {
  if (b.start_at && new Date(b.start_at) > now) return false;
  if (b.end_at && new Date(b.end_at) < now) return false;
  if (Array.isArray(b.days_of_week) && b.days_of_week.length > 0) {
    if (!b.days_of_week.includes(now.getDay())) return false;
  }
  const mins = now.getHours() * 60 + now.getMinutes();
  const s = b.daily_start_minutes;
  const e = b.daily_end_minutes;
  if (s != null && e != null) {
    if (s <= e) {
      if (mins < s || mins >= e) return false;
    } else {
      // overnight window e.g. 22:00 -> 06:00
      if (mins < s && mins >= e) return false;
    }
  } else if (s != null && mins < s) {
    return false;
  } else if (e != null && mins >= e) {
    return false;
  }
  return true;
}

// ISO week number
function isoWeekKey(d: Date): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((+t - +yearStart) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${week}`;
}

const IMP_KEY = 'lb_banner_impressions_v1';
type ImpRecord = Record<string, { day: string; dayCount: number; week: string; weekCount: number }>;

function readImpressions(): ImpRecord {
  try { return JSON.parse(localStorage.getItem(IMP_KEY) || '{}'); } catch { return {}; }
}

function withinCaps(b: any, now: Date, imps: ImpRecord): boolean {
  const rec = imps[b.id];
  if (!rec) return true;
  const today = now.toISOString().slice(0, 10);
  const week = isoWeekKey(now);
  if (b.max_per_day != null && rec.day === today && rec.dayCount >= b.max_per_day) return false;
  if (b.max_per_week != null && rec.week === week && rec.weekCount >= b.max_per_week) return false;
  return true;
}

function recordImpression(id: string, now: Date) {
  const imps = readImpressions();
  const today = now.toISOString().slice(0, 10);
  const week = isoWeekKey(now);
  const r = imps[id] || { day: today, dayCount: 0, week, weekCount: 0 };
  if (r.day !== today) { r.day = today; r.dayCount = 0; }
  if (r.week !== week) { r.week = week; r.weekCount = 0; }
  r.dayCount += 1;
  r.weekCount += 1;
  imps[id] = r;
  try { localStorage.setItem(IMP_KEY, JSON.stringify(imps)); } catch {}
}

const TRANSLATION_CACHE_KEY = 'lb_banner_translations_v1';
type TranslationCache = Record<string, Record<string, { title: string; description: string; cta_label: string }>>;

function readTranslationCache(): TranslationCache {
  try { return JSON.parse(localStorage.getItem(TRANSLATION_CACHE_KEY) || '{}'); } catch { return {}; }
}
function writeTranslationCache(cache: TranslationCache) {
  try { localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(cache)); } catch {}
}

const loadingLabels: Record<string, string> = {
  'pt-BR': 'Traduzindo banners...',
  'en': 'Translating banners...',
  'es': 'Traduciendo banners...',
  'fr': 'Traduction des bannières...',
  'de': 'Banner werden übersetzt...',
  'it': 'Traduzione dei banner...',
  'ja': 'バナーを翻訳中...',
  'zh': '正在翻译横幅...',
  'ru': 'Перевод баннеров...',
};

export const PromoBanners = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'pt-BR';

  const { data: banners } = useQuery({
    queryKey: ['promo-banners-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_banners')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 60_000,
  });

  const visible = useMemo(() => {
    const now = new Date();
    const imps = readImpressions();
    return (banners || []).filter(b => isWithinSchedule(b, now) && withinCaps(b, now, imps));
  }, [banners]);

  const { data: translations, isLoading: isTranslating } = useQuery({
    queryKey: ['promo-banners-translations', lang, visible.map(b => `${b.id}:${b.title}:${b.description}:${b.cta_label}`).join('|')],
    enabled: visible.length > 0 && lang !== 'pt-BR',
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const cache = readTranslationCache();
      const result: Record<string, { title: string; description: string; cta_label: string }> = {};
      const toTranslate: Array<{ id: string; title: string; description: string; cta_label: string }> = [];

      for (const b of visible) {
        const key = `${b.id}:${b.title}:${b.description}:${b.cta_label}`;
        const cached = cache[lang]?.[key];
        if (cached) {
          result[b.id] = cached;
        } else {
          toTranslate.push({ id: b.id, title: b.title, description: b.description, cta_label: b.cta_label });
        }
      }

      if (toTranslate.length > 0) {
        const content: Record<string, { title: string; description: string; cta_label: string }> = {};
        toTranslate.forEach(b => { content[b.id] = { title: b.title, description: b.description, cta_label: b.cta_label }; });

        const { data, error } = await supabase.functions.invoke('translate-content', {
          body: { content, targetLanguage: lang },
        });

        if (!error && data) {
          if (!cache[lang]) cache[lang] = {};
          for (const b of toTranslate) {
            const tr = (data as any)[b.id];
            if (tr && tr.title && tr.description && tr.cta_label) {
              result[b.id] = tr;
              const key = `${b.id}:${b.title}:${b.description}:${b.cta_label}`;
              cache[lang][key] = tr;
            }
          }
          writeTranslationCache(cache);
        }
      }
      return result;
    },
  });

  useEffect(() => {
    if (visible.length === 0) return;
    const now = new Date();
    visible.forEach(b => recordImpression(b.id, now));
  }, [visible]);

  if (visible.length === 0) return null;

  const getText = (b: any) => {
    if (lang === 'pt-BR') return { title: b.title, description: b.description, cta_label: b.cta_label };
    return translations?.[b.id] || { title: b.title, description: b.description, cta_label: b.cta_label };
  };

  return (
    <div className="space-y-2">
      {isTranslating && (
        <div className="flex items-center justify-center gap-1.5 pb-1 text-xs text-foreground/60">
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
          <span>{loadingLabels[lang] || loadingLabels['en']}</span>
        </div>
      )}
      {visible.map((b) => {
        const Icon = iconMap[b.icon] || Users;
        const s = variantStyles[b.variant] || variantStyles.violet;
        const text = getText(b);
        return (
          <motion.button
            key={b.id}
            type="button"
            onClick={() => navigate(b.route)}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`group relative w-full overflow-hidden rounded-2xl border-2 ${s.border} bg-gradient-to-br ${s.bg} p-4 text-left shadow-[0_8px_30px_-12px_rgba(0,0,0,0.4)] backdrop-blur-sm transition-all`}
          >
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full ${s.glow1} blur-2xl`} aria-hidden />
            <div className={`absolute -left-4 -bottom-8 h-20 w-20 rounded-full ${s.glow2} blur-2xl`} aria-hidden />
            <div className="relative flex items-center gap-3">
              <div className={`shrink-0 rounded-xl ${s.ring} p-2.5 ring-2`}>
                <Icon className={`h-5 w-5 ${s.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-display text-sm md:text-base font-bold ${s.text}`}>{text.title}</p>
                <p className="text-xs md:text-sm text-foreground/80 mt-0.5">{text.description}</p>
              </div>
              <div className="hidden sm:flex shrink-0 items-center gap-2">
                <div className={`flex items-center gap-1 rounded-full ${s.cta} px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-colors max-w-[160px] text-center leading-tight whitespace-normal break-words`}>
                  <span className="line-clamp-2">{text.cta_label}</span>
                  <ArrowRight className="h-3 w-3 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>

            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
