import { registerRoot, staticFile } from "remotion";
import { RemotionRoot } from "./Root";

// Load Noto Color Emoji so emoji glyphs render in the headless Chromium
const style = document.createElement("style");
style.innerHTML = `
@font-face {
  font-family: 'NotoColorEmoji';
  src: url('${staticFile("fonts/NotoColorEmoji.ttf")}') format('truetype');
  font-display: block;
}
`;
document.head.appendChild(style);

registerRoot(RemotionRoot);
