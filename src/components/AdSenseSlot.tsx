import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';


/**
 * Ad slot showing rotating Learn Buddy promo videos.
 * When ADSENSE_CLIENT/SLOT are filled, real AdSense display ads render instead.
 */
export const ADSENSE_CLIENT = 'ca-pub-3378474598402206';
export const ADSENSE_SLOT = '7188987191';
const ADSENSE_SCRIPT_ID = 'learn-buddy-adsense-script';
const ADSENSE_FALLBACK_DELAY_MS = 6000;
const ADSENSE_RETRY_DELAY_MS = 20000;
const ADSENSE_MAX_RETRIES = 3;
const ADSENSE_ALLOWED_HOSTS = [
  'studdybuddy.com.br',
  'www.studdybuddy.com.br',
  'learn-bright-guide-25.lovable.app',
  'id-preview--9687ee74-66ca-4d7e-ac8e-7257bce45838.lovable.app',
];

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

export const AdSenseSlot = ({
  className = '',
  hideCta = false,
  variant = 'card',
}: { className?: string; hideCta?: boolean; variant?: 'card' | 'compact' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const insRef = useRef<HTMLModElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pushedRef = useRef(false);
  const [index, setIndex] = useState(() => Math.floor(Math.random() * LEARN_BUDDY_ADS.length));
  const [adState, setAdState] = useState<'loading' | 'filled' | 'fallback'>('loading');
  const [cycle, setCycle] = useState(0);

  const canRequestAdsense =
    typeof window !== 'undefined' && ADSENSE_ALLOWED_HOSTS.includes(window.location.hostname);
  const hasAdsense = Boolean(ADSENSE_CLIENT && ADSENSE_SLOT && canRequestAdsense);

  useEffect(() => {
    if (!hasAdsense) return;
    let isCancelled = false;
    let attempts = 0;
    let fallbackTimer: number | undefined;
    let retryTimer: number | undefined;
    let cycleTimer: number | undefined;
    let isNearViewport = false;
    pushedRef.current = false;

    const scheduleRetryCycle = () => {
      if (cycleTimer || cycle >= ADSENSE_MAX_RETRIES) return;
      cycleTimer = window.setTimeout(() => {
        if (!isCancelled) setCycle((c) => c + 1);
      }, ADSENSE_RETRY_DELAY_MS);
    };

    const updateFromAdStatus = () => {
      const status = insRef.current?.getAttribute('data-ad-status');

      if (status === 'filled') {
        setAdState('filled');
      } else if (status === 'unfilled') {
        setAdState('fallback');
        scheduleRetryCycle();
      }
    };

    const observer = new MutationObserver(updateFromAdStatus);
    if (insRef.current) {
      observer.observe(insRef.current, {
        attributes: true,
        attributeFilter: ['data-ad-status', 'data-adsbygoogle-status'],
      });
    }

    const tryPush = async () => {
      if (isCancelled || pushedRef.current) return;

      const containerWidth = containerRef.current?.getBoundingClientRect().width ?? 0;
      const isVisible = containerRef.current?.getClientRects().length;
      if (!isNearViewport || !isVisible || containerWidth < 120) return;

      try {
        await ensureAdsenseScript();
        if (isCancelled || pushedRef.current) return;
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
        window.setTimeout(updateFromAdStatus, 800);
        fallbackTimer = window.setTimeout(() => {
          if (!isCancelled && insRef.current?.getAttribute('data-ad-status') !== 'filled') {
            setAdState('fallback');
            scheduleRetryCycle();
          }
        }, ADSENSE_FALLBACK_DELAY_MS);
      } catch (e) {
        const message = e instanceof Error ? e.message : '';

        if (message.includes('already have ads')) {
          pushedRef.current = true;
          updateFromAdStatus();
          return;
        }

        if (attempts++ < 10) {
          retryTimer = window.setTimeout(tryPush, 500);
        } else {
          setAdState('fallback');
        }
      }
    };

    const resizeObserver = new ResizeObserver(() => void tryPush());
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        isNearViewport = entries.some((entry) => entry.isIntersecting);
        if (isNearViewport) void tryPush();
      },
      { rootMargin: '400px 0px' },
    );
    if (containerRef.current) intersectionObserver.observe(containerRef.current);

    return () => {
      isCancelled = true;
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      if (retryTimer) window.clearTimeout(retryTimer);
      if (cycleTimer) window.clearTimeout(cycleTimer);
      observer.disconnect();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [hasAdsense, cycle]);


  const ad = useMemo(() => LEARN_BUDDY_ADS[index], [index]);

  const handleEnded = () => {
    setIndex((i) => (i + 1) % LEARN_BUDDY_ADS.length);
  };

  const openRewardShop = () => {
    navigate('/reward-shop');
  };


  const compactFallback = (
    <div
      className={`flex w-full items-center gap-3 overflow-hidden rounded-xl border-2 border-primary/25 bg-card p-2 ${className}`}
    >
      <video
        key={ad.src}
        src={ad.src}
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
        className="h-16 w-28 shrink-0 rounded-lg object-cover"
        preload="metadata"
      />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t('rewardShop.adLabel', 'Anúncio')} · {ad.tag}
        </div>
        <div className="truncate text-sm font-bold text-foreground">{ad.title}</div>
      </div>
      {!hideCta && (
        <Button
          type="button"
          size="sm"
          onClick={openRewardShop}
          className="h-auto shrink-0 px-3 py-1.5 text-xs"
        >
          {t('rewardShop.openShop', 'Abrir mercadinho')}
        </Button>
      )}
    </div>
  );

  const promoFallback = variant === 'compact' ? compactFallback : (
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
        {t('rewardShop.adLabel', 'Anúncio')}
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
            <Button
              type="button"
              size="sm"
              onClick={openRewardShop}
              className="h-auto shrink-0 px-3 py-1.5 text-xs"
            >
              {t('rewardShop.openShop', 'Abrir mercadinho')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (!hasAdsense) {
    return promoFallback;
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full min-w-0 overflow-hidden rounded-xl bg-muted/20 ${
        variant === 'compact' ? 'min-h-[90px]' : 'min-h-[250px]'
      } ${className}`}
    >
      {adState === 'fallback' && <div className="relative z-10">{promoFallback}</div>}
      <ins
        key={cycle}
        ref={insRef}
        className={`adsbygoogle w-full transition-opacity duration-300 ${
          adState === 'fallback' ? 'hidden' : 'block opacity-100'
        }`}
        style={{ display: 'block', minHeight: variant === 'compact' ? 90 : 250 }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};
