import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Rocket, BookOpen, Trophy, Zap, Star } from 'lucide-react';

/**
 * Google AdSense display slot.
 * When ADSENSE_CLIENT/SLOT are empty, shows rotating house ads (self-promo)
 * so the user always sees engaging content while AdSense is pending approval.
 */
export const ADSENSE_CLIENT = ''; // ex: 'ca-pub-1234567890'
export const ADSENSE_SLOT = '';   // ex: '1234567890'

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type HouseAd = {
  icon: typeof Sparkles;
  title: string;
  desc: string;
  cta: string;
  href: string;
  gradient: string;
};

const HOUSE_ADS: HouseAd[] = [
  {
    icon: Rocket,
    title: 'Turbine seus estudos',
    desc: 'Gere resumos, exercícios e planos com IA em segundos.',
    cta: 'Começar agora',
    href: '/',
    gradient: 'from-blue-500/20 via-cyan-500/15 to-teal-500/20',
  },
  {
    icon: Trophy,
    title: 'Suba no ranking',
    desc: 'Conquiste posições, ganhe emblemas e desafie amigos.',
    cta: 'Ver ranking',
    href: '/ranking',
    gradient: 'from-amber-500/20 via-orange-500/15 to-yellow-500/20',
  },
  {
    icon: BookOpen,
    title: 'Trilha de progresso',
    desc: '49 desafios interativos para dominar qualquer tema.',
    cta: 'Explorar trilha',
    href: '/trail',
    gradient: 'from-emerald-500/20 via-green-500/15 to-lime-500/20',
  },
  {
    icon: Sparkles,
    title: 'Grupos de estudo',
    desc: 'Estude junto, compartilhe conteúdo e evolua em equipe.',
    cta: 'Criar grupo',
    href: '/groups',
    gradient: 'from-purple-500/20 via-fuchsia-500/15 to-pink-500/20',
  },
  {
    icon: Zap,
    title: 'Comunidade ativa',
    desc: 'Dicas, dúvidas e conquistas de milhares de estudantes.',
    cta: 'Participar',
    href: '/community',
    gradient: 'from-rose-500/20 via-red-500/15 to-orange-500/20',
  },
  {
    icon: Star,
    title: 'Ganhe créditos grátis',
    desc: 'Complete desafios diários e libere recompensas.',
    cta: 'Ver recompensas',
    href: '/',
    gradient: 'from-indigo-500/20 via-blue-500/15 to-sky-500/20',
  },
];

export const AdSenseSlot = ({ className = '' }: { className?: string }) => {
  const insRef = useRef<HTMLModElement | null>(null);
  const [index, setIndex] = useState(() => Math.floor(Math.random() * HOUSE_ADS.length));

  const hasAdsense = Boolean(ADSENSE_CLIENT && ADSENSE_SLOT);

  useEffect(() => {
    if (!hasAdsense) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn('AdSense push failed', e);
    }
  }, [hasAdsense]);

  useEffect(() => {
    if (hasAdsense) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % HOUSE_ADS.length);
    }, 5000);
    return () => clearInterval(id);
  }, [hasAdsense]);

  const ad = useMemo(() => HOUSE_ADS[index], [index]);

  if (!hasAdsense) {
    const Icon = ad.icon;
    return (
      <a
        href={ad.href}
        className={`group relative flex flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-primary/20 bg-gradient-to-br ${ad.gradient} p-6 text-center min-h-[250px] transition-all hover:scale-[1.02] hover:border-primary/40 hover:shadow-lg ${className}`}
      >
        <div className="absolute top-2 right-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
          Anúncio
        </div>
        <div className="mb-3 rounded-full bg-background/60 p-4 shadow-inner backdrop-blur-sm">
          <Icon className="h-10 w-10 text-primary animate-pulse" />
        </div>
        <div className="text-lg font-bold text-foreground mb-1">{ad.title}</div>
        <div className="text-sm text-foreground/70 mb-4 max-w-xs">{ad.desc}</div>
        <div className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-md group-hover:shadow-xl transition-shadow">
          {ad.cta}
          <Rocket className="h-3.5 w-3.5" />
        </div>
        <div className="mt-3 flex gap-1">
          {HOUSE_ADS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === index ? 'w-6 bg-primary' : 'w-1.5 bg-primary/30'
              }`}
            />
          ))}
        </div>
      </a>
    );
  }

  return (
    <ins
      ref={insRef}
      className={`adsbygoogle block ${className}`}
      style={{ display: 'block', minHeight: 250 }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={ADSENSE_SLOT}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
};
