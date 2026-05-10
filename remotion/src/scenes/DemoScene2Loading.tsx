import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig } from "remotion";
import { SITE } from "../site-theme";

export const DemoScene2Loading: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = interpolate(frame, [0, 90], [0, 100], { extrapolateRight: "clamp" });
  const rot = (frame * 8) % 360;
  const fade = interpolate(frame, [85, 100], [1, 0], { extrapolateLeft: "clamp" });

  const steps = [
    { label: "Analisando tema", at: 10 },
    { label: "Gerando conceito profundo", at: 30 },
    { label: "Criando exemplo prático", at: 55 },
    { label: "Montando mapa mental", at: 75 },
  ];

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: fade }}>
      <div style={{ position: "relative", width: 180, height: 180 }}>
        <svg width="180" height="180" style={{ transform: `rotate(${rot}deg)` }}>
          <circle cx="90" cy="90" r="74" fill="none" stroke={SITE.border} strokeWidth="10" />
          <circle cx="90" cy="90" r="74" fill="none" stroke={SITE.primary} strokeWidth="10"
            strokeDasharray={`${(progress / 100) * 465} 465`} strokeLinecap="round"
            transform="rotate(-90 90 90)" />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "Nunito", fontSize: 42, fontWeight: 900, color: SITE.text,
        }}>{Math.floor(progress)}%</div>
      </div>
      <div style={{ marginTop: 36, fontFamily: "Nunito", fontSize: 32, fontWeight: 900, color: SITE.text }}>
        Gerando seu estudo...
      </div>
      <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
        {steps.map((s, i) => {
          const done = frame >= s.at;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 18, fontWeight: 700, color: done ? SITE.secondary : "#cbd5e1" }}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", background: done ? SITE.secondary : "#e2e8f0", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900 }}>{done ? "✓" : "○"}</span>
              <span>{s.label}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
