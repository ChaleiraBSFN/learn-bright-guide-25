import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Sequence } from "remotion";
import { COLORS } from "./MainVideo";
import { Cursor } from "./components/Cursor";
import { BrowserFrame } from "./components/BrowserFrame";
import { DemoScene1Type } from "./scenes/DemoScene1Type";
import { DemoScene2Loading } from "./scenes/DemoScene2Loading";
import { DemoScene3Result } from "./scenes/DemoScene3Result";
import { DemoScene4Exercise } from "./scenes/DemoScene4Exercise";
import { DemoScene5Outro } from "./scenes/DemoScene5Outro";

export const DemoVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 20, stiffness: 100 } });
  const outroFade = interpolate(frame, [600, 660], [1, 1]);

  return (
    <AbsoluteFill style={{ fontFamily: "Nunito, sans-serif", background: COLORS.bgDeep }}>
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse at top left, ${COLORS.blue}55, transparent 60%), radial-gradient(ellipse at bottom right, ${COLORS.teal}33, transparent 60%), ${COLORS.bgDeep}`,
      }} />
      <Sequence from={0} durationInFrames={600}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 60, transform: `scale(${interpolate(intro, [0, 1], [0.92, 1])})` }}>
          <BrowserFrame>
            <Sequence from={0} durationInFrames={170}><DemoScene1Type /></Sequence>
            <Sequence from={170} durationInFrames={100}><DemoScene2Loading /></Sequence>
            <Sequence from={270} durationInFrames={170}><DemoScene3Result /></Sequence>
            <Sequence from={440} durationInFrames={160}><DemoScene4Exercise /></Sequence>
          </BrowserFrame>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={600} durationInFrames={60}><DemoScene5Outro /></Sequence>
    </AbsoluteFill>
  );
};
