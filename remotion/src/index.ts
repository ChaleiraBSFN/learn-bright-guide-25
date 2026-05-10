import { registerRoot, staticFile } from "remotion";
import { RemotionRoot } from "./Root";

// Register Noto Color Emoji so emoji glyphs render in the headless Chromium
const style = document.createElement("style");
style.innerHTML = `
@font-face {
  font-family: 'NotoColorEmoji';
  src: url('${staticFile("fonts/NotoColorEmoji.ttf")}') format('truetype');
  font-display: block;
}
* {
  font-family: Nunito, Inter, sans-serif, 'NotoColorEmoji' !important;
}
`;
// Override !important: append a more specific rule for body
const style2 = document.createElement("style");
style2.innerHTML = `
html, body { font-family: Inter, sans-serif, 'NotoColorEmoji'; }
`;
document.head.appendChild(style);

registerRoot(RemotionRoot);
