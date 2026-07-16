import { useEffect, useRef } from 'react';

/**
 * Google AdSense display slot.
 * Publisher ID and slot are set via env-like constants below.
 * When ADSENSE_CLIENT is empty, renders a friendly placeholder (dev/testing).
 */
export const ADSENSE_CLIENT = ''; // ex: 'ca-pub-1234567890'
export const ADSENSE_SLOT = '';   // ex: '1234567890'

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export const AdSenseSlot = ({ className = '' }: { className?: string }) => {
  const insRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    if (!ADSENSE_CLIENT || !ADSENSE_SLOT) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn('AdSense push failed', e);
    }
  }, []);

  if (!ADSENSE_CLIENT || !ADSENSE_SLOT) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 text-center p-8 min-h-[250px] ${className}`}
      >
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Advertisement
          </div>
          <div className="text-sm font-medium text-foreground/70">
            Ad placeholder
          </div>
        </div>
      </div>
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
