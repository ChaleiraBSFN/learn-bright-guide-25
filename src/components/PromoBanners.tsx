import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import {
  Users, Sparkles, Megaphone, Trophy, BookOpen, Brain, Dumbbell,
  Map, Coins, Heart, Star, Zap, ArrowRight,
} from 'lucide-react';

const iconMap: Record<string, any> = {
  users: Users, sparkles: Sparkles, megaphone: Megaphone, trophy: Trophy,
  book: BookOpen, brain: Brain, dumbbell: Dumbbell, map: Map,
  coins: Coins, heart: Heart, star: Star, zap: Zap,
};

const variantStyles: Record<string, { border: string; bg: string; ring: string; text: string; cta: string; glow1: string; glow2: string; }> = {
  violet: {
    border: 'border-violet-500/40 hover:border-violet-500/70',
    bg: 'from-violet-500/15 via-fuchsia-500/10 to-purple-600/15',
    ring: 'bg-violet-500/20 ring-violet-500/30',
    text: 'text-violet-600 dark:text-violet-300',
    cta: 'bg-violet-600 hover:bg-violet-700',
    glow1: 'bg-violet-500/20', glow2: 'bg-fuchsia-500/20',
  },
  blue: {
    border: 'border-blue-500/40 hover:border-blue-500/70',
    bg: 'from-blue-500/15 via-cyan-500/10 to-sky-600/15',
    ring: 'bg-blue-500/20 ring-blue-500/30',
    text: 'text-blue-600 dark:text-blue-300',
    cta: 'bg-blue-600 hover:bg-blue-700',
    glow1: 'bg-blue-500/20', glow2: 'bg-cyan-500/20',
  },
  amber: {
    border: 'border-amber-500/40 hover:border-amber-500/70',
    bg: 'from-amber-500/15 via-orange-500/10 to-yellow-600/15',
    ring: 'bg-amber-500/20 ring-amber-500/30',
    text: 'text-amber-600 dark:text-amber-300',
    cta: 'bg-amber-600 hover:bg-amber-700',
    glow1: 'bg-amber-500/20', glow2: 'bg-orange-500/20',
  },
  emerald: {
    border: 'border-emerald-500/40 hover:border-emerald-500/70',
    bg: 'from-emerald-500/15 via-teal-500/10 to-green-600/15',
    ring: 'bg-emerald-500/20 ring-emerald-500/30',
    text: 'text-emerald-600 dark:text-emerald-300',
    cta: 'bg-emerald-600 hover:bg-emerald-700',
    glow1: 'bg-emerald-500/20', glow2: 'bg-teal-500/20',
  },
  rose: {
    border: 'border-rose-500/40 hover:border-rose-500/70',
    bg: 'from-rose-500/15 via-pink-500/10 to-red-600/15',
    ring: 'bg-rose-500/20 ring-rose-500/30',
    text: 'text-rose-600 dark:text-rose-300',
    cta: 'bg-rose-600 hover:bg-rose-700',
    glow1: 'bg-rose-500/20', glow2: 'bg-pink-500/20',
  },
};

export const PromoBanners = () => {
  const navigate = useNavigate();
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

  if (!banners || banners.length === 0) return null;

  return (
    <div className="space-y-2">
      {banners.map((b) => {
        const Icon = iconMap[b.icon] || Users;
        const s = variantStyles[b.variant] || variantStyles.violet;
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
                <p className={`font-display text-sm md:text-base font-bold ${s.text}`}>{b.title}</p>
                <p className="text-xs md:text-sm text-foreground/80 mt-0.5">{b.description}</p>
              </div>
              <div className={`hidden sm:flex shrink-0 items-center gap-1 rounded-full ${s.cta} px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-colors max-w-[160px] text-center leading-tight whitespace-normal break-words`}>
                <span className="line-clamp-2">{b.cta_label}</span>
                <ArrowRight className="h-3 w-3 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
