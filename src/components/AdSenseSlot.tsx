import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Ad slot showing rotating Learn Buddy promo videos.
 * When ADSENSE_CLIENT/SLOT are filled, real AdSense display ads render instead.
 */
export const ADSENSE_CLIENT = 'ca-pub-3378474598402206';
export const ADSENSE_SLOT = ''; // preencha após criar o bloco no AdSense

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

export const AdSenseSlot = ({ className = '' }: { className?: string }) => {
  const insRef = useRef<HTMLModElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [index, setIndex] = useState(() => Math.floor(Math.random() * LEARN_BUDDY_ADS.length));

  const hasAdsense = Boolean(ADSENSE_CLIENT && ADSENSE_SLOT);

  useEffect(() => {
    if (!hasAdsense) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn('AdSense push failed', e);
    }
  }, [hasAdsense]);

  const ad = useMemo(() => LEARN_BUDDY_ADS[index], [index]);

  const handleEnded = () => {
    setIndex((i) => (i + 1) % LEARN_BUDDY_ADS.length);
  };

  if (!hasAdsense) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl border-2 border-primary/30 bg-black min-h-[220px] ${className}`}
      >
        <video
          ref={videoRef}
          key={ad.src}
          src={ad.src}
          autoPlay
          muted
          playsInline
          onEnded={handleEnded}
          className="w-full h-full object-cover"
          preload="auto"
        />
        <div className="absolute top-2 right-2 text-[10px] uppercase tracking-wider bg-black/60 text-white px-2 py-0.5 rounded-full font-semibold backdrop-blur-sm">
          Anúncio
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <div className="text-[10px] uppercase tracking-wider text-primary-foreground/70 font-semibold mb-0.5">
            {ad.tag}
          </div>
          <div className="text-sm font-bold text-white">{ad.title}</div>
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
