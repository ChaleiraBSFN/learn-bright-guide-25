import { useEffect, useState } from 'react';
import { usePrime, formatDuration } from '@/hooks/usePrime';
import { Crown } from 'lucide-react';

export const PrimeOverlay = () => {
  const { isActive, activeRemainingMs, activeProgress } = usePrime();

  useEffect(() => {
    if (isActive) {
      document.documentElement.classList.add('prime-active');
      return () => document.documentElement.classList.remove('prime-active');
    }
  }, [isActive]);

  if (!isActive) return null;

  const progressPct = Math.min(100, Math.max(0, (1 - activeProgress) * 100));

  return (
    <>
      {/* Prime animations — NO body filter (breaks position:fixed) */}
      <style>{`
        @keyframes prime-corner-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 0.95; transform: scale(1.18); }
        }
        @keyframes prime-confetti-fall {
          0%   { transform: translate3d(0,-10vh,0) rotate(0deg);    opacity: 0; }
          8%   { opacity: 1; }
          100% { transform: translate3d(var(--drift,40px),110vh,0) rotate(720deg); opacity: 0.9; }
        }
        @keyframes prime-explode {
          0%   { transform: translate(-50%,-50%) scale(0);   opacity: 1; }
          70%  { opacity: 1; }
          100% { transform: translate(-50%,-50%) scale(8);   opacity: 0; }
        }
        @keyframes prime-explode-ring {
          0%   { transform: translate(-50%,-50%) scale(0.2); opacity: 0.9; border-width: 6px; }
          100% { transform: translate(-50%,-50%) scale(6);   opacity: 0;   border-width: 1px; }
        }
        @keyframes prime-particle-burst {
          0%   { transform: translate(-50%,-50%) translate(0,0)         scale(1); opacity: 1; }
          100% { transform: translate(-50%,-50%) translate(var(--bx,80px),var(--by,-80px)) scale(0.2); opacity: 0; }
        }
        @keyframes prime-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        html.prime-active button:not([data-no-prime]):hover,
        html.prime-active [role="button"]:not([data-no-prime]):hover {
          filter: brightness(1.12) saturate(1.25) drop-shadow(0 0 12px hsl(45 100% 60% / 0.55));
          transition: filter .2s ease;
        }
      `}</style>

      {/* Top banner */}

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

        {/* Confetti rain */}
        {Array.from({ length: 50 }).map((_, i) => {
          const left = (i * 97) % 100;
          const delay = (i * 0.37) % 6;
          const dur = 4 + ((i * 13) % 5);
          const w = 6 + (i % 3) * 3;
          const h = 10 + (i % 4) * 3;
          const drift = ((i % 7) - 3) * 30;
          const colors = ['#fbbf24', '#ec4899', '#22d3ee', '#a78bfa', '#34d399', '#f97316', '#f43f5e'];
          const color = colors[i % colors.length];
          const round = i % 5 === 0;
          return (
            <span
              key={`c${i}`}
              className="absolute"
              style={{
                left: `${left}%`,
                top: 0,
                width: w,
                height: round ? w : h,
                borderRadius: round ? '50%' : '2px',
                background: color,
                boxShadow: `0 0 6px ${color}`,
                ['--drift' as any]: `${drift}px`,
                animation: `prime-confetti-fall ${dur}s linear ${delay}s infinite`,
              }}
            />
          );
        })}

        {/* Periodic explosion bursts */}
        <ExplosionLayer />
      </div>
    </>
  );
};

const ExplosionLayer = () => {
  const [bursts, setBursts] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);

  useEffect(() => {
    let id = 0;
    const palette = ['#fbbf24', '#ec4899', '#22d3ee', '#a78bfa', '#34d399', '#f97316'];
    const spawn = () => {
      const b = {
        id: ++id,
        x: 10 + Math.random() * 80,
        y: 15 + Math.random() * 70,
        color: palette[Math.floor(Math.random() * palette.length)],
      };
      setBursts(prev => [...prev, b]);
      setTimeout(() => setBursts(prev => prev.filter(p => p.id !== b.id)), 1500);
    };
    spawn();
    const iv = setInterval(spawn, 1400);
    return () => clearInterval(iv);
  }, []);

  return (
    <>
      {bursts.map(b => (
        <div key={b.id} className="absolute" style={{ left: `${b.x}%`, top: `${b.y}%` }}>
          {/* Flash */}
          <span
            className="absolute rounded-full"
            style={{
              left: 0, top: 0, width: 40, height: 40,
              background: `radial-gradient(circle, ${b.color} 0%, ${b.color}88 40%, transparent 70%)`,
              animation: 'prime-explode 700ms ease-out forwards',
            }}
          />
          {/* Ring */}
          <span
            className="absolute rounded-full border-solid"
            style={{
              left: 0, top: 0, width: 30, height: 30,
              borderColor: b.color,
              borderWidth: 4,
              animation: 'prime-explode-ring 900ms ease-out forwards',
            }}
          />
          {/* 12 particles in burst */}
          {Array.from({ length: 12 }).map((_, j) => {
            const angle = (j / 12) * Math.PI * 2;
            const dist = 80 + Math.random() * 60;
            const bx = Math.cos(angle) * dist;
            const by = Math.sin(angle) * dist;
            return (
              <span
                key={j}
                className="absolute rounded-full"
                style={{
                  left: 0, top: 0, width: 8, height: 8,
                  background: b.color,
                  boxShadow: `0 0 8px ${b.color}`,
                  ['--bx' as any]: `${bx}px`,
                  ['--by' as any]: `${by}px`,
                  animation: `prime-particle-burst 1.2s cubic-bezier(.1,.7,.2,1) forwards`,
                }}
              />
            );
          })}
        </div>
      ))}
    </>
  );
};

