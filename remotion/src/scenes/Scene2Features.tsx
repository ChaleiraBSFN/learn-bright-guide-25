import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../MainVideo";

const Card: React.FC<{ delay: number; icon: string; title: string; desc: string; accent: string }> = ({ delay, icon, title, desc, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 140 } });
  const y = interpolate(s, [0, 1], [120, 0]);
  return (
    <div style={{
      width: 380, height: 420,
      background: `linear-gradient(160deg, ${COLORS.white}10, ${COLORS.white}03)`,
      border: `2px solid ${accent}55`,
      borderRadius: 28,
      padding: 40,
      transform: `translateY(${y}px) scale(${s})`,
      opacity: s,
      backdropFilter: "blur(0px)",
      boxShadow: `0 20px 60px ${accent}33, inset 0 1px 0 ${COLORS.white}22`,
      display: "flex", flexDirection: "column", justifyContent: "space-between",
    }}>
      <div style={{ fontSize: 110 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 42, fontWeight: 900, color: COLORS.white, marginBottom: 12 }}>{title}</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: `${COLORS.white}cc`, lineHeight: 1.4 }}>{desc}</div>
      </div>
      <div style={{ height: 6, background: accent, borderRadius: 3, width: `${Math.min(100, s * 100)}%` }} />
    </div>
  );
};

export const Scene2Features: React.FC = () => {
  const frame = useCurrentFrame();
  const headerS = spring({ frame, fps: 30, config: { damping: 18 } });
  const exitOp = interpolate(frame, [78, 90], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: exitOp }}>
      <div style={{
        position: "absolute", top: 100,
        fontSize: 64, fontWeight: 900, color: COLORS.white,
        opacity: headerS,
        transform: `translateY(${interpolate(headerS, [0, 1], [-30, 0])}px)`,
      }}>
        Tudo o que você precisa <span style={{ color: COLORS.amber }}>para estudar</span>
      </div>
      <div style={{ display: "flex", gap: 40, marginTop: 80 }}>
        <Card delay={8} icon="📚" title="Estudo Profundo" desc="Conceitos explicados com clareza, exemplos práticos e mapas mentais." accent={COLORS.teal} />
        <Card delay={18} icon="✏️" title="Exercícios" desc="Questões personalizadas com correção inteligente e feedback detalhado." accent={COLORS.amber} />
        <Card delay={28} icon="🗓️" title="Plano de Estudos" desc="Cronogramas sob medida para você aprender no seu ritmo." accent={COLORS.blue} />
      </div>
    </AbsoluteFill>
  );
};
