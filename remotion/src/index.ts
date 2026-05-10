import { registerRoot, staticFile } from "remotion";
import { RemotionRoot } from "./Root";

// Load Noto Color Emoji as a fallback restricted to emoji codepoints,
// so it doesn't affect spacing on Latin text/spaces.
const style = document.createElement("style");
style.innerHTML = `
@font-face {
  font-family: 'NotoColorEmoji';
  src: url('${staticFile("fonts/NotoColorEmoji.ttf")}') format('truetype');
  font-display: block;
  unicode-range: U+1F000-1FFFF, U+2600-27BF, U+2300-23FF, U+2B00-2BFF, U+25A0-25FF, U+2190-21FF, U+2700-27BF, U+1F1E6-1F1FF;
}
`;
document.head.appendChild(style);

registerRoot(RemotionRoot);
