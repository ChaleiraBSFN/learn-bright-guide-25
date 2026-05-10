import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../MainVideo";

export const Scene1Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 120, mass: 0.8 } });
  const logoRot = interpolate(logoScale, [0, 1], [-25, 0]);
  const flash = interpolate(frame, [8, 16, 28], [0, 0.9, 0], { extrapolateRight: "clamp" });
  const titleY = spring({ frame: frame - 18, fps, config: { damping: 18 } });
  const titleOpacity = interpolate(frame, [18, 30], [0, 1], { extrapolateRight: "clamp" });
  const subY = spring({ frame: frame - 30, fps, config: { damping: 20 } });
  const subOpacity = interpolate(frame, [30, 42], [0, 1], { extrapolateRight: "clamp" });
  const exit = interpolate(frame, [60, 75], [0, -100], { extrapolateLeft: "clamp" });
  const exitOp = interpolate(frame, [60, 75], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: exitOp, transform: `translateY(${exit}px)` }}>
      <div style={{ position: "absolute", inset: 0, background: COLORS.white, opacity: flash }} />
      <div style={{
        transform: `scale(${logoScale}) rotate(${logoRot}deg)`,
        boxShadow: `0 30px 80px ${COLORS.teal}66, 0 0 0 6px ${COLORS.white}, 0 0 0 10px ${COLORS.amber}`,
        borderRadius: 32, overflow: "hidden",
      }}>
        <Img src={staticFile("images/logo.jpeg")} style={{ width: 280, height: 280, display: "block" }} />
      </div>
      <div style={{
        marginTop: 50,
        fontSize: 110, fontWeight: 900, color: COLORS.white,
        letterSpacing: -3,
        opacity: titleOpacity,
        transform: `translateY(${interpolate(titleY, [0, 1], [40, 0])}px)`,
        textShadow: `0 6px 30px ${COLORS.blue}88`,
      }}>
        Learn <span style={{ color: COLORS.amber }}>Buddy</span>
      </div>
      <div style={{
        marginTop: 12,
        fontSize: 30, fontWeight: 700, color: COLORS.teal,
        letterSpacing: 8, textTransform: "uppercase",
        opacity: subOpacity,
        transform: `translateY(${interpolate(subY, [0, 1], [20, 0])}px)`,
      }}>
        Sua IA de estudos
      </div>
    </AbsoluteFill>
  );
};
