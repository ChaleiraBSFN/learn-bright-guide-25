import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS } from "../MainVideo";

export const Scene3Gamification: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headerS = spring({ frame, fps, config: { damping: 18 } });
  const exitOp = interpolate(frame, [78, 90], [1, 0], { extrapolateLeft: "clamp" });

  // 49 trail nodes on S-curve
  const nodes = Array.from({ length: 24 }, (_, i) => i);
  const counter = Math.floor(interpolate(frame, [20, 60], [0, 49], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      <div style={{
        position: "absolute", top: 80, left: 0, right: 0, textAlign: "center",
        fontSize: 64, fontWeight: 900, color: COLORS.white,
        opacity: headerS,
        transform: `translateY(${interpolate(headerS, [0, 1], [-30, 0])}px)`,
      }}>
        Aprenda <span style={{ color: COLORS.amber }}>jogando</span>
      </div>

      {/* Trail S-curve */}
      <div style={{ position: "absolute", top: 280, left: 0, right: 0, height: 400 }}>
        <svg width="1920" height="400" viewBox="0 0 1920 400">
          <path
            d="M 100 300 Q 480 50, 860 200 T 1820 100"
            stroke={`${COLORS.teal}66`}
            strokeWidth="8"
            fill="none"
            strokeDasharray="4000"
            strokeDashoffset={interpolate(frame, [10, 70], [4000, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
          />
        </svg>
        {nodes.map((i) => {
          const t = i / (nodes.length - 1);
          const x = 100 + t * 1720;
          // approximation of S-curve y
          const y = 300 - Math.sin(t * Math.PI) * 200 + (t > 0.5 ? -50 : 0);
          const appear = spring({ frame: frame - 12 - i * 1.5, fps, config: { damping: 15 } });
          const isStar = i === nodes.length - 1;
          return (
            <div key={i} style={{
              position: "absolute",
              left: x - 20, top: y - 20,
              width: 40, height: 40,
              borderRadius: "50%",
              background: isStar ? COLORS.amber : COLORS.teal,
              border: `4px solid ${COLORS.white}`,
              boxShadow: `0 0 20px ${isStar ? COLORS.amber : COLORS.teal}`,
              transform: `scale(${appear})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20,
            }}>{isStar ? "⭐" : ""}</div>
          );
        })}
      </div>

      {/* Counter + Trophy */}
      <div style={{
        position: "absolute", bottom: 120, left: 0, right: 0,
        display: "flex", justifyContent: "center", gap: 80, alignItems: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 140, fontWeight: 900, color: COLORS.amber, lineHeight: 1, textShadow: `0 0 40px ${COLORS.amber}88` }}>
            {counter}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.white, marginTop: 8, letterSpacing: 2 }}>DESAFIOS</div>
        </div>
        <div style={{ width: 4, height: 120, background: `${COLORS.white}33` }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 100 }}>🏆</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.white, marginTop: 8, letterSpacing: 2 }}>RANKING</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
