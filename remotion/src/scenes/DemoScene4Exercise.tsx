import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";
import { SITE } from "../site-theme";
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

  const cursorPath = [
    { x: 320, y: 60, frame: 0 },     // exercises tab
    { x: 320, y: 60, frame: 18 },
    { x: 1100, y: 320, frame: 80 },  // option B
    { x: 1100, y: 320, frame: 160 },
  ];

  const selected = frame >= 80;
  const showFeedback = frame >= 105;
  const feedbackS = spring({ frame: frame - 105, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ padding: 30 }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {[
          { name: "📖 Estudo", active: false, color: SITE.primary },
          { name: "🧠 Mapa Mental", active: false, color: SITE.secondary },
          { name: "✏️ Exercícios", active: true, color: SITE.accent },
          { name: "📅 Plano", active: false, color: SITE.primary },
        ].map((t, i) => (
          <div key={i} style={{
            padding: "10px 18px",
            background: t.active ? t.color : SITE.card,
            border: `1px solid ${t.active ? t.color : SITE.border}`,
            borderRadius: 10,
            color: t.active ? "#fff" : SITE.text, fontWeight: 800, fontSize: 14,
            boxShadow: t.active ? `0 4px 12px ${t.color}44` : "none",
          }}>{t.name}</div>
        ))}
      </div>

      {/* Question card */}
      <div style={{
        background: SITE.card,
        border: `1px solid ${SITE.border}`,
        borderTop: `4px solid ${SITE.accent}`,
        borderRadius: 14,
        padding: 28,
        opacity: titleS,
        boxShadow: `0 8px 24px ${SITE.shadow}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ padding: "6px 14px", background: `${SITE.accent}22`, color: SITE.accent, borderRadius: 999, fontSize: 13, fontWeight: 900 }}>
            QUESTÃO 1 DE 5
          </div>
          <div style={{ padding: "6px 12px", background: `${SITE.primary}15`, color: SITE.primary, borderRadius: 999, fontSize: 12, fontWeight: 800 }}>
            🎯 Múltipla escolha
          </div>
        </div>

        <div style={{ fontSize: 24, fontWeight: 800, color: SITE.text, marginBottom: 22, lineHeight: 1.4, fontFamily: "Nunito" }}>
          Qual é o principal processo realizado durante a fotossíntese?
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ALTERNATIVES.map((alt) => {
            const isCorrect = alt.id === "B";
            const isSelected = selected && isCorrect;
            const showCorrect = showFeedback && isCorrect;
            return (
              <div key={alt.id} style={{
                padding: "14px 18px",
                background: showCorrect
                  ? `${SITE.secondary}15`
                  : isSelected ? `${SITE.accent}15` : SITE.card,
                border: `2px solid ${showCorrect ? SITE.secondary : isSelected ? SITE.accent : SITE.border}`,
                borderRadius: 12,
                display: "flex", alignItems: "center", gap: 16,
                transform: showCorrect ? `scale(${interpolate(feedbackS, [0, 1], [1, 1.01])})` : "none",
                boxShadow: showCorrect ? `0 0 20px ${SITE.secondary}33` : "none",
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: showCorrect ? SITE.secondary : "#f1f5f9",
                  color: showCorrect ? "#fff" : SITE.text,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 900, fontSize: 16,
                }}>{showCorrect ? "✓" : alt.id}</div>
                <div style={{ color: SITE.text, fontSize: 17, fontWeight: 600, flex: 1 }}>{alt.text}</div>
              </div>
            );
          })}
        </div>

        {showFeedback && (
          <div style={{
            marginTop: 18,
            padding: "16px 20px",
            background: `${SITE.secondary}10`,
            border: `2px solid ${SITE.secondary}`,
            borderRadius: 12,
            opacity: feedbackS,
            transform: `translateY(${interpolate(feedbackS, [0, 1], [15, 0])}px)`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: SITE.secondary, fontFamily: "Nunito" }}>
                ✓ Resposta correta!
              </div>
              <div style={{ padding: "3px 10px", background: SITE.accent, color: "#fff", borderRadius: 999, fontSize: 12, fontWeight: 900 }}>
                +10 XP
              </div>
              <div style={{ padding: "3px 10px", background: SITE.primary, color: "#fff", borderRadius: 999, fontSize: 12, fontWeight: 900 }}>
                ⭐ Trilha avançou
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: SITE.text }}>
              A fotossíntese converte energia luminosa em química, formando glicose a partir de CO₂ e H₂O. Os produtos são glicose (C₆H₁₂O₆) e oxigênio (O₂).
            </div>
          </div>
        )}
      </div>

      <Cursor path={cursorPath} clickFrames={[6, 82]} />
    </AbsoluteFill>
  );
};
