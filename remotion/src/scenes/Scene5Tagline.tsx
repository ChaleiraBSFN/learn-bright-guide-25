import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../MainVideo";

export const Scene5Tagline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tag1 = spring({ frame, fps, config: { damping: 16 } });
  const tag2 = spring({ frame: frame - 14, fps, config: { damping: 16 } });
  const tag3 = spring({ frame: frame - 28, fps, config: { damping: 14, stiffness: 120 } });
  const logoS = spring({ frame: frame - 45, fps, config: { damping: 12, stiffness: 130 } });
  const free = spring({ frame: frame - 65, fps, config: { damping: 10 } });

  const word = (s: number) => ({
    opacity: s,
    transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px) scale(${interpolate(s, [0, 1], [0.85, 1])})`,
    display: "inline-block",
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 40 }}>
      <div style={{ fontSize: 120, fontWeight: 900, color: COLORS.white, letterSpacing: -4, textAlign: "center", lineHeight: 1.1 }}>
        <span style={word(tag1)}>Estude.&nbsp;</span>
        <span style={{ ...word(tag2), color: COLORS.teal }}>Evolua.&nbsp;</span>
        <span style={{ ...word(tag3), color: COLORS.amber }}>Conquiste.</span>
      </div>

      <div style={{
        marginTop: 30,
        transform: `scale(${logoS})`,
        opacity: logoS,
        display: "flex", alignItems: "center", gap: 28,
      }}>
        <div style={{
          borderRadius: 24, overflow: "hidden",
          boxShadow: `0 20px 50px ${COLORS.teal}88, 0 0 0 4px ${COLORS.white}`,
        }}>
          <Img src={staticFile("images/logo.jpeg")} style={{ width: 120, height: 120, display: "block" }} />
        </div>
        <div style={{ fontSize: 80, fontWeight: 900, color: COLORS.white, letterSpacing: -2 }}>
          Learn <span style={{ color: COLORS.amber }}>Buddy</span>
        </div>
      </div>

      <div style={{
        marginTop: 20,
        padding: "18px 48px",
        background: COLORS.amber,
        color: COLORS.bgDeep,
        fontSize: 36, fontWeight: 900,
        borderRadius: 999,
        letterSpacing: 3, textTransform: "uppercase",
        transform: `scale(${free})`,
        opacity: free,
        boxShadow: `0 15px 40px ${COLORS.amber}88`,
      }}>
        100% Gratuito
      </div>
    </AbsoluteFill>
  );
};
