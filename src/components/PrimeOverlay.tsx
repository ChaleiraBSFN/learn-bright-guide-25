import { usePrime, formatDuration } from '@/hooks/usePrime';
import { Sparkles, Crown } from 'lucide-react';

export const PrimeOverlay = () => {
  const { isActive, activeRemainingMs, activeProgress } = usePrime();

  if (!isActive) return null;

  const progressPct = Math.min(100, Math.max(0, (1 - activeProgress) * 100));

  return (
    <>
      {/* Rainbow body class injection */}
      <style>{`
        @keyframes prime-rainbow-bg {
          0%   { filter: hue-rotate(0deg)   saturate(1.25); }
          50%  { filter: hue-rotate(180deg) saturate(1.4);  }
          100% { filter: hue-rotate(360deg) saturate(1.25); }
        }
        @keyframes prime-corner-pulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.15); }
        }
        @keyframes prime-float-spark {
          0%   { transform: translateY(0) rotate(0deg);   opacity: 0; }
          10%  { opacity: 1; }
          100% { transform: translateY(-120vh) rotate(360deg); opacity: 0; }
        }
        @keyframes prime-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        html.prime-active body {
          animation: prime-rainbow-bg 8s ease-in-out infinite;
        }
        html.prime-active button,
        html.prime-active [role="button"] {
          transition: transform .2s ease, box-shadow .2s ease, filter .2s ease;
        }
        html.prime-active button:hover,
        html.prime-active [role="button"]:hover {
          transform: translateY(-2px) scale(1.04);
          filter: brightness(1.1) saturate(1.3) drop-shadow(0 0 14px hsl(var(--primary) / 0.6));
        }
      `}</style>

      <PrimeBodyClass />

      {/* Top banner */}
      <div className="fixed top-0 inset-x-0 z-[60] pointer-events-none">
        <div className="mx-auto max-w-3xl mt-2 mx-3 md:mx-auto rounded-2xl border-2 border-yellow-400/70 bg-gradient-to-r from-yellow-500/95 via-pink-500/95 to-purple-600/95 text-white shadow-[0_8px_32px_-4px_hsl(45_100%_50%/0.6)] backdrop-blur-md pointer-events-auto">
          <div className="px-4 py-2.5 flex items-center gap-3">
            <Crown className="h-5 w-5 shrink-0 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold truncate">
                  ⚡ Modo Prime ATIVO — desafios 60% mais fáceis!
                </p>
                <span className="text-sm font-mono font-bold tabular-nums shrink-0">
                  {formatDuration(activeRemainingMs)}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/25 overflow-hidden">
                <div
                  className="h-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] transition-[width] duration-500"
                  style={{
                    width: `${progressPct}%`,
                    backgroundImage:
                      'linear-gradient(90deg, rgba(255,255,255,0.6) 0%, #fff 50%, rgba(255,255,255,0.6) 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'prime-shimmer 2s linear infinite',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Corner sparkles */}
      <div className="pointer-events-none fixed inset-0 z-[55] overflow-hidden">
        {/* Top-left corner */}
        <div className="absolute -top-6 -left-6 w-48 h-48 rounded-full bg-gradient-to-br from-pink-500/40 via-purple-500/30 to-transparent blur-2xl"
             style={{ animation: 'prime-corner-pulse 3s ease-in-out infinite' }} />
        {/* Top-right */}
        <div className="absolute -top-6 -right-6 w-48 h-48 rounded-full bg-gradient-to-bl from-yellow-400/40 via-orange-500/30 to-transparent blur-2xl"
             style={{ animation: 'prime-corner-pulse 3.5s ease-in-out infinite .5s' }} />
        {/* Bottom-left */}
        <div className="absolute -bottom-6 -left-6 w-48 h-48 rounded-full bg-gradient-to-tr from-cyan-400/40 via-blue-500/30 to-transparent blur-2xl"
             style={{ animation: 'prime-corner-pulse 4s ease-in-out infinite 1s' }} />
        {/* Bottom-right */}
        <div className="absolute -bottom-6 -right-6 w-48 h-48 rounded-full bg-gradient-to-tl from-emerald-400/40 via-teal-500/30 to-transparent blur-2xl"
             style={{ animation: 'prime-corner-pulse 3.2s ease-in-out infinite 1.5s' }} />

        {/* Floating sparkles */}
        {Array.from({ length: 14 }).map((_, i) => {
          const left = (i * 7.3) % 100;
          const delay = (i * 0.7) % 8;
          const dur = 6 + (i % 5);
          const size = 12 + (i % 4) * 4;
          const colors = ['text-yellow-300', 'text-pink-300', 'text-cyan-300', 'text-emerald-300', 'text-purple-300'];
          const color = colors[i % colors.length];
          return (
            <Sparkles
              key={i}
              className={`absolute ${color} drop-shadow-[0_0_8px_currentColor]`}
              style={{
                left: `${left}%`,
                bottom: `-30px`,
                width: size,
                height: size,
                animation: `prime-float-spark ${dur}s linear ${delay}s infinite`,
              }}
            />
          );
        })}
      </div>
    </>
  );
};

const PrimeBodyClass = () => {
  // Add/remove html class so global hue-rotate kicks in
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('prime-active');
    // Cleanup on unmount via effect-like pattern
    queueMicrotask(() => {
      if (!document.documentElement.classList.contains('prime-active')) {
        document.documentElement.classList.add('prime-active');
      }
    });
  }
  return null;
};
