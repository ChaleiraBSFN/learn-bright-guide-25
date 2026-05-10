import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS } from "../MainVideo";
import { Cursor } from "../components/Cursor";

const TYPED = "Fotossíntese";

export const DemoScene1Type: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Typing starts at frame 30, finishes at 90 (60 frames for 12 chars = 5f/char)
  const typedCount = Math.floor(interpolate(frame, [30, 90], [0, TYPED.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const text = TYPED.slice(0, typedCount);

  // Button press at 130
  const buttonPress = spring({ frame: frame - 130, fps, config: { damping: 8, stiffness: 300 }, durationInFrames: 14 });
  const buttonScale = 1 - buttonPress * 0.06;

  // Cursor path: center → input (855, 360) → button (855, 530)
  const cursorPath = [
    { x: 1400, y: 700, frame: 0 },
    { x: 855, y: 360, frame: 25 },
    { x: 855, y: 360, frame: 90 },
    { x: 855, y: 530, frame: 125 },
    { x: 855, y: 530, frame: 170 },
  ];

  return (
    <AbsoluteFill>
      {/* Hero title */}
      <div style={{ position: "absolute", top: 80, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 56, fontWeight: 900, color: COLORS.white }}>
          O que você quer <span style={{ color: COLORS.amber }}>aprender hoje?</span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, color: `${COLORS.white}99`, marginTop: 12 }}>
          Digite qualquer tema. A IA cria estudo, exercícios e plano em segundos.
        </div>
      </div>

      {/* Input field */}
      <div style={{
        position: "absolute", top: 320, left: 350, right: 350,
        height: 90,
        background: `${COLORS.white}0d`,
        border: `2px solid ${typedCount > 0 ? COLORS.teal : COLORS.white}33`,
        borderRadius: 18,
        display: "flex", alignItems: "center", padding: "0 28px",
        fontSize: 36, fontWeight: 700, color: COLORS.white,
        boxShadow: typedCount > 0 ? `0 0 0 4px ${COLORS.teal}22` : "none",
      }}>
        <span>{text}</span>
        {frame >= 30 && frame < 90 && (
          <span style={{ width: 3, height: 40, background: COLORS.amber, marginLeft: 4, opacity: Math.floor(frame / 8) % 2 }} />
        )}
        {typedCount === 0 && frame < 30 && (
          <span style={{ color: `${COLORS.white}44`, fontWeight: 600 }}>Ex: Fotossíntese, Equações de 2º grau...</span>
        )}
      </div>

      {/* Generate button */}
      <div style={{
        position: "absolute", top: 470, left: 0, right: 0,
        display: "flex", justifyContent: "center",
      }}>
        <div style={{
          padding: "22px 56px",
          background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.blue})`,
          borderRadius: 16,
          fontSize: 32, fontWeight: 900, color: COLORS.white,
          boxShadow: `0 12px 40px ${COLORS.teal}66`,
          transform: `scale(${buttonScale})`,
          letterSpacing: 1,
        }}>
          ✨ GERAR ESTUDO
        </div>
      </div>

      {/* Subject pills */}
      <div style={{
        position: "absolute", bottom: 90, left: 0, right: 0,
        display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap",
      }}>
        {["📚 Biologia", "🧮 Matemática", "🌍 História", "⚗️ Química", "📖 Literatura"].map((s, i) => (
          <div key={i} style={{
            padding: "12px 24px",
            background: `${COLORS.white}0d`,
            border: `1px solid ${COLORS.white}22`,
            borderRadius: 999,
            color: `${COLORS.white}cc`, fontWeight: 700, fontSize: 18,
          }}>{s}</div>
        ))}
      </div>

      <Cursor path={cursorPath} clickFrames={[130]} />
    </AbsoluteFill>
  );
};
