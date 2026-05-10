import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Sequence } from "remotion";
import { SITE } from "./site-theme";
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

  return (
    <AbsoluteFill style={{ fontFamily: "Nunito, 'NotoColorEmoji', sans-serif", background: SITE.bg }}>
      {/* subtle pattern bg */}
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse at top, ${SITE.primary}10, transparent 60%), radial-gradient(ellipse at bottom right, ${SITE.secondary}0a, transparent 60%)`,
      }} />
      <Sequence from={0} durationInFrames={600}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 60, transform: `scale(${interpolate(intro, [0, 1], [0.94, 1])})` }}>
          <BrowserFrame>
            <Sequence from={0} durationInFrames={180}><DemoScene1Type /></Sequence>
            <Sequence from={180} durationInFrames={100}><DemoScene2Loading /></Sequence>
            <Sequence from={280} durationInFrames={160}><DemoScene3Result /></Sequence>
            <Sequence from={440} durationInFrames={160}><DemoScene4Exercise /></Sequence>
          </BrowserFrame>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={600} durationInFrames={60}><DemoScene5Outro /></Sequence>
    </AbsoluteFill>
  );
};
