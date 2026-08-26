import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AD_CONSENT_EVENT, applyAdConsent, getAdConsent } from '@/lib/adConsent';
import { useSubscription } from '@/hooks/useSubscription';

/**
 * Google AdSense display slot.
 * Renders nothing when ads can't/shouldn't be requested (no consent, rewarded
 * context, Buddy subscriber, or unfilled inventory).
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
  variant = 'card',
  houseOnly = false,
}: { className?: string; hideCta?: boolean; variant?: 'card' | 'compact'; houseOnly?: boolean }) => {
  const { isBuddy } = useSubscription();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const insRef = useRef<HTMLModElement | null>(null);
  const pushedRef = useRef(false);
  const [adState, setAdState] = useState<'loading' | 'filled' | 'fallback'>('loading');
  const [cycle, setCycle] = useState(0);
  const [consent, setConsent] = useState(() => getAdConsent());

  useEffect(() => {
    const onChange = () => setConsent(getAdConsent());
    window.addEventListener(AD_CONSENT_EVENT, onChange);
    return () => window.removeEventListener(AD_CONSENT_EVENT, onChange);
  }, []);

  const canRequestAdsense =
    typeof window !== 'undefined' && ADSENSE_ALLOWED_HOSTS.includes(window.location.hostname);
  // AdSense policy: never request ads where the user is rewarded for viewing them,
  // never before the user has made a cookie/ads consent choice, and never for Buddy members.
  const hasAdsense = Boolean(
    ADSENSE_CLIENT && ADSENSE_SLOT && canRequestAdsense && !houseOnly && !isBuddy && consent !== null,
  );

  useEffect(() => {
    if (!hasAdsense) return;
    let isCancelled = false;
    let attempts = 0;
    let fallbackTimer: number | undefined;
    let retryTimer: number | undefined;
    let cycleTimer: number | undefined;
    let isNearViewport = false;
    pushedRef.current = false;
    if (cycle > 0) setAdState('loading');

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
        applyAdConsent();
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

  if (!hasAdsense || adState === 'fallback') {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full min-w-0 overflow-hidden rounded-xl ${
        variant === 'compact' ? 'min-h-[90px]' : 'min-h-[250px]'
      } ${className}`}
    >
      <ins
        key={cycle}
        ref={insRef}
        className="adsbygoogle block w-full"
        style={{ display: 'block', minHeight: variant === 'compact' ? 90 : 250 }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};
