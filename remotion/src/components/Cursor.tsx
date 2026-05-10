import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SITE } from "../site-theme";

type Point = { x: number; y: number; frame: number };

export const Cursor: React.FC<{ path: Point[]; clickFrames?: number[] }> = ({ path, clickFrames = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let x = path[0].x, y = path[0].y;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    if (frame >= a.frame && frame <= b.frame) {
      const t = (frame - a.frame) / (b.frame - a.frame);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      x = a.x + (b.x - a.x) * e;
      y = a.y + (b.y - a.y) * e;
      break;
    } else if (frame > b.frame) {
      x = b.x; y = b.y;
    }
  }

  const clickScale = clickFrames.reduce((acc, cf) => {
    const s = spring({ frame: frame - cf, fps, config: { damping: 8, stiffness: 200 }, durationInFrames: 12 });
    if (frame >= cf && frame < cf + 14) return Math.max(acc, s);
    return acc;
  }, 0);

  return (
    <>
      {clickScale > 0 && (
        <div style={{
          position: "absolute", left: x - 30, top: y - 30,
          width: 60, height: 60, borderRadius: "50%",
          border: `3px solid ${SITE.accent}`,
          opacity: 1 - clickScale,
          transform: `scale(${0.5 + clickScale * 1.5})`,
          pointerEvents: "none",
        }} />
      )}
      <svg style={{ position: "absolute", left: x, top: y, pointerEvents: "none", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }} width="32" height="32" viewBox="0 0 24 24">
        <path d="M3 2 L3 18 L7 14 L10 21 L13 20 L10 13 L17 13 Z" fill="#0a0a0a" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </>
  );
};
