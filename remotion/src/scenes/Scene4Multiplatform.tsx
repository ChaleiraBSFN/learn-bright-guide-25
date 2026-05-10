import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../MainVideo";

const Device: React.FC<{ delay: number; w: number; h: number; label: string; sub: string; rot: number }> = ({ delay, w, h, label, sub, rot }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 130 } });
  return (
    <div style={{
      transform: `translateY(${interpolate(s, [0, 1], [200, 0])}px) scale(${s}) rotate(${rot}deg)`,
      opacity: s,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 24,
    }}>
      <div style={{
        width: w, height: h,
        background: `linear-gradient(160deg, ${COLORS.blue}, ${COLORS.bgDeep})`,
        border: `6px solid ${COLORS.white}`,
        borderRadius: w > 400 ? 18 : 36,
        boxShadow: `0 30px 80px ${COLORS.teal}55, inset 0 0 0 2px ${COLORS.amber}66`,
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 20,
          background: `linear-gradient(135deg, ${COLORS.teal}33, ${COLORS.amber}22)`,
          borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 60,
        }}>📚</div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: COLORS.white }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.teal, marginTop: -16 }}>{sub}</div>
    </div>
  );
};

export const Scene4Multiplatform: React.FC = () => {
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
        Em <span style={{ color: COLORS.amber }}>todos os seus dispositivos</span>
      </div>
      <div style={{ display: "flex", gap: 100, alignItems: "flex-end", marginTop: 100 }}>
        <Device delay={6} w={220} h={400} label="Mobile" sub="iOS · Android" rot={-4} />
        <Device delay={14} w={580} h={360} label="Web" sub="Qualquer navegador" rot={0} />
        <Device delay={22} w={260} h={400} label="PWA" sub="Instalável" rot={4} />
      </div>
    </AbsoluteFill>
  );
};
