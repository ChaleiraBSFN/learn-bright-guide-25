import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/Nunito";
import { Scene1Logo } from "./scenes/Scene1Logo";
import { Scene2Features } from "./scenes/Scene2Features";
import { Scene3Gamification } from "./scenes/Scene3Gamification";
import { Scene4Multiplatform } from "./scenes/Scene4Multiplatform";
import { Scene5Tagline } from "./scenes/Scene5Tagline";

loadFont("normal", { weights: ["400", "700", "800", "900"], subsets: ["latin"] });

// Brand colors
export const COLORS = {
  bg: "#0a1628",
  bgDeep: "#050b18",
  blue: "#1e40af",
  teal: "#14b8a6",
  amber: "#f59e0b",
  white: "#ffffff",
  ink: "#0a1628",
};

const PersistentBg: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const drift = interpolate(frame, [0, durationInFrames], [0, 360]);
  return (
    <AbsoluteFill style={{ background: COLORS.bgDeep, overflow: "hidden" }}>
      {/* Animated gradient orbs */}
      <div
        style={{
          position: "absolute",
          width: 1400, height: 1400,
          top: -300, left: -200,
          background: `radial-gradient(circle, ${COLORS.blue}55 0%, transparent 60%)`,
          transform: `translate(${Math.sin(drift * 0.02) * 80}px, ${Math.cos(drift * 0.02) * 60}px)`,
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1200, height: 1200,
          bottom: -300, right: -200,
          background: `radial-gradient(circle, ${COLORS.teal}44 0%, transparent 60%)`,
          transform: `translate(${Math.cos(drift * 0.025) * 100}px, ${Math.sin(drift * 0.025) * 80}px)`,
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 800, height: 800,
          top: "30%", left: "40%",
          background: `radial-gradient(circle, ${COLORS.amber}22 0%, transparent 65%)`,
          transform: `translate(${Math.sin(drift * 0.03) * 120}px, ${Math.cos(drift * 0.018) * 90}px)`,
          filter: "blur(50px)",
        }}
      />
      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(${COLORS.white}06 1px, transparent 1px), linear-gradient(90deg, ${COLORS.white}06 1px, transparent 1px)`,
        backgroundSize: "80px 80px",
      }} />
      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at center, transparent 40%, ${COLORS.bgDeep}cc 100%)`,
      }} />
    </AbsoluteFill>
  );
};

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily: "Nunito, sans-serif" }}>
      <PersistentBg />
      <Sequence from={0} durationInFrames={75}><Scene1Logo /></Sequence>
      <Sequence from={75} durationInFrames={90}><Scene2Features /></Sequence>
      <Sequence from={165} durationInFrames={90}><Scene3Gamification /></Sequence>
      <Sequence from={255} durationInFrames={90}><Scene4Multiplatform /></Sequence>
      <Sequence from={345} durationInFrames={105}><Scene5Tagline /></Sequence>
    </AbsoluteFill>
  );
};
