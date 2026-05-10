import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";
import { SITE } from "../site-theme";
import { Cursor } from "../components/Cursor";

const ALTERNATIVES = [
  { id: "A", text: "Quebra de moléculas de glicose para liberar energia (ATP)" },
  { id: "B", text: "Conversão de energia luminosa em energia química, produzindo glicose e O₂" },
  { id: "C", text: "Transporte de água da raiz até as folhas pelo xilema" },
  { id: "D", text: "Reprodução assexuada das plantas via esporos" },
];

export const DemoScene4Exercise: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headerS = spring({ frame, fps, config: { damping: 18 } });
  const cardS = spring({ frame: frame - 8, fps, config: { damping: 16 } });

  // Cursor: option B at frame 70, then "Verificar" at frame 110
  const cursorPath = [
    { x: 1500, y: 800, frame: 0 },
    { x: 920, y: 530, frame: 60 },
    { x: 920, y: 530, frame: 100 },
    { x: 920, y: 720, frame: 115 },
    { x: 920, y: 720, frame: 160 },
  ];

  const selected = frame >= 70;
  const verified = frame >= 118;
  const fbS = spring({ frame: frame - 118, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill style={{ background: SITE.bg, padding: "32px 100px" }}>
      {/* Page title */}
      <div style={{ textAlign: "center", marginBottom: 22, opacity: headerS, transform: `translateY(${interpolate(headerS, [0, 1], [-10, 0])}px)` }}>
        <div style={{ fontFamily: SITE.fontDisplay, fontSize: 32, fontWeight: 800, color: SITE.text }}>
          Exercícios
        </div>
        <div style={{ fontSize: 15, color: SITE.muted, marginTop: 4, fontFamily: SITE.fontBody }}>
          Tema: <span style={{ color: SITE.accent, fontWeight: 700 }}>Fotossíntese</span> · Nível: <span style={{ fontWeight: 700, color: SITE.text }}>Médio</span>
        </div>
      </div>

      {/* Question card with section-style left strip */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: SITE.card, border: `1px solid ${SITE.border}`,
        borderRadius: 16, padding: 28,
        opacity: cardS, transform: `translateY(${interpolate(cardS, [0, 1], [16, 0])}px)`,
        boxShadow: `0 4px 12px ${SITE.shadow}`,
        maxWidth: 1100, margin: "0 auto", width: "100%",
      }}>
        <div style={{
          position: "absolute", left: 0, top: 0, height: "100%", width: 6,
          borderTopLeftRadius: 16, borderBottomLeftRadius: 16,
          background: SITE.sectionExercises,
        }} />

        <div style={{ paddingLeft: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{
              padding: "5px 12px", background: `${SITE.accent}22`, color: SITE.accent,
              borderRadius: 999, fontSize: 12, fontWeight: 800, fontFamily: SITE.fontBody,
            }}>QUESTÃO 1 DE 5</div>
            <div style={{
              padding: "5px 11px", background: `${SITE.primary}15`, color: SITE.primary,
              borderRadius: 999, fontSize: 12, fontWeight: 700, fontFamily: SITE.fontBody,
            }}>🎯 Múltipla escolha</div>
          </div>

          <div style={{ fontFamily: SITE.fontDisplay, fontSize: 22, fontWeight: 800, color: SITE.text, marginBottom: 18, lineHeight: 1.4 }}>
            Qual é o principal processo realizado durante a fotossíntese?
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
            {ALTERNATIVES.map((alt) => {
              const isCorrect = alt.id === "B";
              const isSelected = selected && isCorrect;
              const showCorrect = verified && isCorrect;
              return (
                <div key={alt.id} style={{
                  padding: "14px 16px",
                  background: showCorrect ? `${SITE.secondary}10` : isSelected ? `${SITE.primary}08` : SITE.card,
                  border: `2px solid ${showCorrect ? SITE.secondary : isSelected ? SITE.primary : SITE.border}`,
                  borderRadius: 12, display: "flex", alignItems: "center", gap: 14,
                  boxShadow: showCorrect ? `0 0 0 4px ${SITE.secondary}22` : "none",
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%",
                    background: showCorrect ? SITE.secondary : isSelected ? SITE.primary : "#f1f5f9",
                    color: (showCorrect || isSelected) ? "#fff" : SITE.text,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: 14, flexShrink: 0,
                  }}>{showCorrect ? "✓" : alt.id}</div>
                  <div style={{ color: SITE.text, fontSize: 16, fontWeight: 500, fontFamily: SITE.fontBody, flex: 1 }}>{alt.text}</div>
                </div>
              );
            })}
          </div>

          {/* Verify button OR feedback */}
          {!verified ? (
            <div style={{
              height: 50, width: 220,
              background: selected ? `linear-gradient(135deg, ${SITE.primary}, ${SITE.primaryLight})` : "#e2e8f0",
              borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              color: selected ? "#fff" : SITE.muted, fontSize: 15, fontWeight: 800, fontFamily: SITE.fontDisplay,
              boxShadow: selected ? `0 6px 16px ${SITE.primary}44` : "none",
            }}>
              ✦ Verificar resposta
            </div>
          ) : (
            <div style={{
              padding: "16px 20px",
              background: `${SITE.secondary}0d`,
              border: `2px solid ${SITE.secondary}`,
              borderRadius: 12,
              opacity: fbS, transform: `translateY(${interpolate(fbS, [0, 1], [10, 0])}px)`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                <div style={{ fontFamily: SITE.fontDisplay, fontSize: 18, fontWeight: 800, color: SITE.secondary }}>
                  ✓ Resposta correta!
                </div>
                <div style={{ padding: "3px 10px", background: SITE.accent, color: "#fff", borderRadius: 999, fontSize: 12, fontWeight: 800 }}>
                  +10 XP
                </div>
                <div style={{ padding: "3px 10px", background: SITE.primary, color: "#fff", borderRadius: 999, fontSize: 12, fontWeight: 800 }}>
                  ⭐ Trilha avançou
                </div>
              </div>
              <div style={{ fontSize: 14, color: SITE.text, fontFamily: SITE.fontBody, lineHeight: 1.5 }}>
                A fotossíntese converte energia luminosa em energia química, formando glicose (C₆H₁₂O₆) a partir de CO₂ e H₂O. O O₂ é liberado como subproduto da fotólise da água.
              </div>
            </div>
          )}
        </div>
      </div>

      <Cursor path={cursorPath} clickFrames={[70, 118]} />
    </AbsoluteFill>
  );
};
