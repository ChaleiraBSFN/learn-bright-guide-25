import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { DemoVideo } from "./DemoVideo";

export const RemotionRoot = () => (
  <>
    <Composition id="main" component={MainVideo} durationInFrames={450} fps={30} width={1920} height={1080} />
    <Composition id="demo" component={DemoVideo} durationInFrames={660} fps={30} width={1920} height={1080} />
  </>
);
