import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";
import { COLORS } from "../MainVideo";
import { Cursor } from "../components/Cursor";

const ALTERNATIVES = [
  { id: "A", text: "Quebra de moléculas de glicose para liberar energia" },
  { id: "B", text: "Conversão de energia luminosa em energia química, produzindo glicose e O₂" },
  { id: "C", text: "Transporte de água da raiz até as folhas" },
  { id: "D", text: "Reprodução assexuada das plantas" },
];

export const DemoScene4Exercise: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleS = spring({ frame, fps, config: { damping: 18 } });

  // Tab switch — Exercises tab highlighted from start
  const tabHighlight = spring({ frame: frame - 4, fps, config: { damping: 15 } });

  // Cursor: tab → option B → submit button (none, auto submit)
  const cursorPath = [
    { x: 250, y: 70, frame: 0 },     // exercises tab
    { x: 250, y: 70, frame: 20 },
    { x: 1000, y: 460, frame: 90 },  // option B
    { x: 1000, y: 460, frame: 160 },
  ];

  // Selection at frame 90, feedback at 110
  const selected = frame >= 90;
  const showFeedback = frame >= 115;
  const feedbackS = spring({ frame: frame - 115, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ padding: 30 }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[
          { name: "📖 Estudo", active: false },
          { name: "✏️ Exercícios", active: true },
          { name: "🗓️ Plano", active: false },
        ].map((t, i) => (
          <div key={i} style={{
            padding: "12px 24px",
            background: t.active ? `${COLORS.teal}33` : `${COLORS.white}08`,
            border: `2px solid ${t.active ? COLORS.teal : COLORS.white + "11"}`,
            borderRadius: 12,
            color: COLORS.white, fontWeight: 800, fontSize: 18,
            transform: t.active ? `scale(${interpolate(tabHighlight, [0, 1], [0.95, 1])})` : "none",
            boxShadow: t.active ? `0 0 20px ${COLORS.teal}44` : "none",
          }}>{t.name}</div>
        ))}
      </div>

      <div style={{
        fontSize: 28, fontWeight: 900, color: COLORS.white, marginBottom: 8,
        opacity: titleS,
      }}>
        Pergunta 1 <span style={{ color: COLORS.amber }}>de 5</span>
      </div>
      <div style={{
        fontSize: 26, fontWeight: 700, color: COLORS.white, marginBottom: 30, lineHeight: 1.4,
        opacity: titleS,
      }}>
        Qual é o principal processo realizado durante a fotossíntese?
      </div>

      {/* Alternatives */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {ALTERNATIVES.map((alt, i) => {
          const isCorrect = alt.id === "B";
          const isSelected = selected && isCorrect;
          const showCorrect = showFeedback && isCorrect;
          return (
            <div key={alt.id} style={{
              padding: "18px 24px",
              background: showCorrect
                ? `${COLORS.teal}33`
                : isSelected ? `${COLORS.amber}22` : `${COLORS.white}08`,
              border: `2px solid ${showCorrect ? COLORS.teal : isSelected ? COLORS.amber : COLORS.white + "15"}`,
              borderRadius: 14,
              display: "flex", alignItems: "center", gap: 20,
              transform: showCorrect ? `scale(${interpolate(feedbackS, [0, 1], [1, 1.02])})` : "none",
              boxShadow: showCorrect ? `0 0 30px ${COLORS.teal}55` : "none",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: showCorrect ? COLORS.teal : `${COLORS.white}15`,
                color: COLORS.white, display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, fontSize: 20,
              }}>{showCorrect ? "✓" : alt.id}</div>
              <div style={{ color: COLORS.white, fontSize: 20, fontWeight: 600, flex: 1 }}>{alt.text}</div>
            </div>
          );
        })}
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div style={{
          marginTop: 24,
          padding: "18px 24px",
          background: `${COLORS.teal}22`,
          border: `2px solid ${COLORS.teal}`,
          borderRadius: 14,
          opacity: feedbackS,
          transform: `translateY(${interpolate(feedbackS, [0, 1], [20, 0])}px)`,
        }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: COLORS.teal, marginBottom: 6 }}>
            ✅ Correto! +10 XP · Trilha avançou
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, color: `${COLORS.white}dd` }}>
            A fotossíntese converte energia luminosa em química, formando glicose a partir de CO₂ e H₂O.
          </div>
        </div>
      )}

      <Cursor path={cursorPath} clickFrames={[8, 92]} />
    </AbsoluteFill>
  );
};
