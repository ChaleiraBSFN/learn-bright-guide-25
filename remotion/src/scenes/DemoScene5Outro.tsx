import { AbsoluteFill, Img, staticFile, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";
import { COLORS } from "../MainVideo";

export const DemoScene5Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14 } });
  const sub = spring({ frame: frame - 18, fps, config: { damping: 16 } });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 40, background: COLORS.bgDeep }}>
      <div style={{
        background: `radial-gradient(circle, ${COLORS.teal}33, transparent 60%)`,
        position: "absolute", inset: 0,
      }} />
      <div style={{
        display: "flex", alignItems: "center", gap: 28,
        transform: `scale(${s})`, opacity: s,
      }}>
        <div style={{
          borderRadius: 24, overflow: "hidden",
          boxShadow: `0 20px 60px ${COLORS.teal}88, 0 0 0 5px ${COLORS.white}`,
        }}>
          <Img src={staticFile("images/logo.jpeg")} style={{ width: 140, height: 140, display: "block" }} />
        </div>
        <div style={{ fontSize: 96, fontWeight: 900, color: COLORS.white, letterSpacing: -3 }}>
          Learn <span style={{ color: COLORS.amber }}>Buddy</span>
        </div>
      </div>
      <div style={{
        fontSize: 36, fontWeight: 800, color: COLORS.white, textAlign: "center",
        opacity: sub, transform: `translateY(${interpolate(sub, [0, 1], [20, 0])}px)`,
      }}>
        Experimente agora — <span style={{ color: COLORS.amber }}>100% gratuito</span>
      </div>
      <div style={{
        fontSize: 22, fontWeight: 700, color: COLORS.teal, letterSpacing: 4,
        opacity: sub,
      }}>
        STUDDYBUDDY.COM.BR
      </div>
    </AbsoluteFill>
  );
};
