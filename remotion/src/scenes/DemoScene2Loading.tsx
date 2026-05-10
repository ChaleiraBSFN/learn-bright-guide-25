import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig } from "remotion";
import { SITE } from "../site-theme";

// Recreates GeneratingOverlay: rotating rings with gradient center icon + tip
export const DemoScene2Loading: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = interpolate(frame, [85, 100], [1, 0], { extrapolateLeft: "clamp" });
  const enter = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });

  const tips = [
    "Analisando o tema solicitado...",
    "Criando resumos e explicações...",
    "Montando mapa mental e plano de estudos...",
  ];
  const tipIdx = Math.min(Math.floor(frame / 30), tips.length - 1);
  const tip = tips[tipIdx];

  // Pulse glow
  const glowScale = 1 + Math.sin((frame / fps) * 2.5) * 0.075;
  const glowOpacity = 0.22 + Math.sin((frame / fps) * 2.5) * 0.07;

  return (
    <AbsoluteFill style={{
      alignItems: "center", justifyContent: "center",
      opacity: fade,
      background: `radial-gradient(ellipse at center, ${SITE.bg}f7 0%, ${SITE.bg}d9 60%, ${SITE.bg}b3 100%)`,
    }}>
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 32,
        transform: `scale(${0.5 + enter * 0.5})`, opacity: enter,
      }}>
        {/* Rings stack */}
        <div style={{ position: "relative", width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Glow */}
          <div style={{
            position: "absolute", width: 144, height: 144, borderRadius: "50%",
            background: `${SITE.primary}33`, filter: "blur(24px)",
            transform: `scale(${glowScale})`, opacity: glowOpacity,
          }} />
          {/* Outer ring */}
          <svg width="160" height="160" style={{ position: "absolute", transform: `rotate(${(frame * 360 / (4 * fps)) % 360}deg)` }}>
            <circle cx="80" cy="80" r="56" fill="none" stroke={SITE.primary} strokeWidth="3" strokeDasharray="100 250" strokeLinecap="round" />
          </svg>
          {/* Middle ring */}
          <svg width="120" height="120" style={{ position: "absolute", transform: `rotate(${(-frame * 360 / (2.5 * fps)) % 360}deg)` }}>
            <circle cx="60" cy="60" r="40" fill="none" stroke={SITE.secondary} strokeWidth="3" strokeDasharray="80 180" strokeLinecap="round" />
          </svg>
          {/* Inner ring */}
          <svg width="72" height="72" style={{ position: "absolute", transform: `rotate(${(frame * 360 / (1.8 * fps)) % 360}deg)` }}>
            <circle cx="36" cy="36" r="22" fill="none" stroke={SITE.accent} strokeWidth="2.5" strokeDasharray="40 100" strokeLinecap="round" />
          </svg>
          {/* Center gradient circle with icon */}
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: `linear-gradient(135deg, ${SITE.primary}, ${SITE.secondary}, ${SITE.accent})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
            transform: `scale(${1 + Math.sin((frame / fps) * 3) * 0.12}) rotate(${Math.sin((frame / fps) * 2) * 10}deg)`,
            fontSize: 26,
          }}>
            📖
          </div>
        </div>

        {/* Title */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontFamily: SITE.fontDisplay, fontSize: 30, fontWeight: 800, color: SITE.text }}>
              Gerando material de estudo
            </span>
            {[0, 0.3, 0.6].map((d, i) => {
              const t = (frame / fps + d) % 1;
              const op = Math.sin(t * Math.PI);
              return <span key={i} style={{ fontSize: 32, fontWeight: 800, color: SITE.primary, opacity: op, transform: `translateY(${-op * 4}px)` }}>.</span>;
            })}
          </div>
          <div style={{ fontSize: 16, color: SITE.muted, fontFamily: SITE.fontBody, fontWeight: 500 }}>
            {tip}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
