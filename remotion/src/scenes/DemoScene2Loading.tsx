import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig } from "remotion";
import { COLORS } from "../MainVideo";

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
      <div style={{ position: "relative", width: 200, height: 200 }}>
        <svg width="200" height="200" style={{ transform: `rotate(${rot}deg)` }}>
          <circle cx="100" cy="100" r="80" fill="none" stroke={`${COLORS.white}15`} strokeWidth="10" />
          <circle cx="100" cy="100" r="80" fill="none" stroke={COLORS.amber} strokeWidth="10"
            strokeDasharray={`${(progress / 100) * 502} 502`} strokeLinecap="round"
            transform="rotate(-90 100 100)" />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 48, fontWeight: 900, color: COLORS.white,
        }}>{Math.floor(progress)}%</div>
      </div>
      <div style={{ marginTop: 50, fontSize: 36, fontWeight: 900, color: COLORS.white }}>
        Gerando seu estudo...
      </div>
      <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
        {steps.map((s, i) => {
          const done = frame >= s.at;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 22, fontWeight: 700, color: done ? COLORS.teal : `${COLORS.white}44` }}>
              <span style={{ fontSize: 24 }}>{done ? "✓" : "○"}</span>
              <span>{s.label}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
