import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';


/**
 * Ad slot showing rotating Learn Buddy promo videos.
 * When ADSENSE_CLIENT/SLOT are filled, real AdSense display ads render instead.
 */
export const ADSENSE_CLIENT = 'ca-pub-3378474598402206';
export const ADSENSE_SLOT = '7188987191';
const ADSENSE_SCRIPT_ID = 'learn-buddy-adsense-script';
const ADSENSE_FALLBACK_DELAY_MS = 3500;
const ADSENSE_ALLOWED_HOSTS = ['studdybuddy.com.br', 'www.studdybuddy.com.br', 'learn-bright-guide-25.lovable.app'];

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const LEARN_BUDDY_ADS = [
  {
    src: '/learn-buddy-trailer.mp4',
    tag: 'Learn Buddy',
    title: 'Sua IA de estudos, em segundos',
  },
  {
    src: '/learn-buddy-demo.mp4',
    tag: 'Demonstração',
    title: 'Veja como funciona na prática',
  },
];

const ensureAdsenseScript = () =>
  new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`,
    );

    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = ADSENSE_SCRIPT_ID;
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('AdSense script failed to load'));
    document.head.appendChild(script);
  });

export const AdSenseSlot = ({ className = '', hideCta = false }: { className?: string; hideCta?: boolean }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();


  const insRef = useRef<HTMLModElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pushedRef = useRef(false);
  const [index, setIndex] = useState(() => Math.floor(Math.random() * LEARN_BUDDY_ADS.length));
  const [adState, setAdState] = useState<'loading' | 'filled' | 'fallback'>('loading');

  const canRequestAdsense =
    typeof window !== 'undefined' && ADSENSE_ALLOWED_HOSTS.includes(window.location.hostname);
  const hasAdsense = Boolean(ADSENSE_CLIENT && ADSENSE_SLOT && canRequestAdsense);

  useEffect(() => {
    if (!hasAdsense) return;
    let isCancelled = false;
    let attempts = 0;

    const updateFromAdStatus = () => {
      const status = insRef.current?.getAttribute('data-ad-status');

      if (status === 'filled') {
        setAdState('filled');
      } else if (status === 'unfilled') {
        setAdState('fallback');
      }
    };

    const fallbackTimer = window.setTimeout(() => {
      if (!isCancelled && adState !== 'filled') {
        updateFromAdStatus();
        if (insRef.current?.getAttribute('data-ad-status') !== 'filled') {
          setAdState('fallback');
        }
      }
    }, ADSENSE_FALLBACK_DELAY_MS);

    const observer = new MutationObserver(updateFromAdStatus);
    if (insRef.current) {
      observer.observe(insRef.current, {
        attributes: true,
        attributeFilter: ['data-ad-status', 'data-adsbygoogle-status'],
      });
    }

    const tryPush = async () => {
      if (isCancelled) return;

      try {
        await ensureAdsenseScript();
        if (isCancelled || pushedRef.current) return;
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
        window.setTimeout(updateFromAdStatus, 800);
      } catch (e) {
        const message = e instanceof Error ? e.message : '';

        if (message.includes('already have ads')) {
          pushedRef.current = true;
          updateFromAdStatus();
          return;
        }

        if (attempts++ < 10) {
          window.setTimeout(tryPush, 500);
        } else {
          setAdState('fallback');
        }
      }
    };

    tryPush();

    return () => {
      isCancelled = true;
      window.clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, [hasAdsense, adState]);

  const ad = useMemo(() => LEARN_BUDDY_ADS[index], [index]);

  const handleEnded = () => {
    setIndex((i) => (i + 1) % LEARN_BUDDY_ADS.length);
  };

  const openRewardShop = () => {
    navigate('/reward-shop');
  };


  const promoFallback = (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-xl border-2 border-primary/30 bg-foreground ${className}`}
    >
      <video
        ref={videoRef}
        key={ad.src}
        src={ad.src}
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
        className="h-full w-full object-cover"
        preload="auto"
      />
      <div className="absolute right-2 top-2 rounded-full bg-background/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground backdrop-blur-sm">
        Anúncio
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/90 to-transparent p-3">
        <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70">
              {ad.tag}
            </div>
            <div className="text-sm font-bold text-primary-foreground">{ad.title}</div>
          </div>
          {!hideCta && (
            <button
              type="button"
              onClick={openRewardShop}
              className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {t('rewardShop.openShop', 'Abrir mercadinho')}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (!hasAdsense) {
    return promoFallback;
  }

  return (
    <div className={`relative w-full overflow-hidden rounded-xl ${className}`}>
      {adState !== 'filled' && <div className="relative z-10">{promoFallback}</div>}
      <ins
        ref={insRef}
        className={`adsbygoogle block w-full transition-opacity duration-300 ${
          adState === 'filled' ? 'opacity-100' : 'pointer-events-none opacity-0 absolute inset-0'
        }`}
        style={{ display: 'block', minHeight: 250 }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};
