import { registerRoot, staticFile } from "remotion";
import { RemotionRoot } from "./Root";

// Register Noto Color Emoji as a global fallback so emoji glyphs render
// in the headless Chromium (no system emoji font in the sandbox).
const style = document.createElement("style");
style.innerHTML = `
@font-face {
  font-family: 'NotoColorEmoji';
  src: url('${staticFile("fonts/NotoColorEmoji.ttf")}') format('truetype');
  font-display: block;
  unicode-range: U+1F300-1FAFF, U+2600-27BF, U+1F000-1F2FF, U+2700-27BF, U+2B00-2BFF, U+2300-23FF, U+2190-21FF;
}
html, body, * {
  font-family: inherit, 'NotoColorEmoji';
}
`;
document.head.appendChild(style);

registerRoot(RemotionRoot);
