import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SITE } from "../site-theme";
import { Cursor } from "../components/Cursor";

const TYPED = "Fotossíntese";

export const DemoScene1Type: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const heroS = spring({ frame, fps, config: { damping: 18 } });
  const typedCount = Math.floor(interpolate(frame, [40, 95], [0, TYPED.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const text = TYPED.slice(0, typedCount);

  // Level select highlight after typing
  const nivelSelected = frame >= 110;
  const prazoFilled = frame >= 130;
  // Button press at frame 150
  const buttonPress = spring({ frame: frame - 150, fps, config: { damping: 8, stiffness: 300 }, durationInFrames: 14 });
  const buttonScale = 1 - buttonPress * 0.05;

  // Cursor path: top-right → input → nivel → prazo → button
  const cursorPath = [
    { x: 1500, y: 700, frame: 0 },
    { x: 800, y: 245, frame: 35 },     // input
    { x: 800, y: 245, frame: 100 },
    { x: 460, y: 360, frame: 115 },    // nivel select
    { x: 1100, y: 360, frame: 135 },   // prazo
    { x: 800, y: 580, frame: 150 },    // button
    { x: 800, y: 580, frame: 170 },
  ];

  return (
    <AbsoluteFill style={{ padding: "30px 60px" }}>
      {/* Hero title */}
      <div style={{ textAlign: "center", marginBottom: 18, opacity: heroS, transform: `translateY(${interpolate(heroS, [0, 1], [-15, 0])}px)` }}>
        <div style={{
          display: "inline-block",
          padding: "6px 14px", background: `${SITE.primary}15`, color: SITE.primary,
          borderRadius: 999, fontSize: 13, fontWeight: 800, marginBottom: 10,
        }}>
          ✦ Aprendizado Inteligente
        </div>
        <div style={{ fontFamily: "Nunito", fontSize: 44, fontWeight: 900, color: SITE.text, lineHeight: 1.05 }}>
          Aprenda qualquer assunto de forma <span style={{ background: `linear-gradient(90deg, ${SITE.primary}, ${SITE.secondary}, ${SITE.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>clara e visual</span>
        </div>
      </div>

      {/* Form card */}
      <div style={{
        background: SITE.card,
        border: `1px solid ${SITE.border}`,
        borderRadius: 16,
        padding: 32,
        boxShadow: `0 4px 20px ${SITE.shadow}`,
        flex: 1,
      }}>
        {/* Tema */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 16, fontWeight: 700, color: SITE.text }}>
            <span style={{ color: SITE.primary }}>📖</span> Tema de Estudo
          </div>
          <div style={{
            height: 56,
            background: SITE.card,
            border: `2px solid ${typedCount > 0 ? SITE.primary : SITE.border}`,
            borderRadius: 10,
            display: "flex", alignItems: "center", padding: "0 18px",
            fontSize: 22, fontWeight: 600, color: SITE.text,
            boxShadow: typedCount > 0 ? `0 0 0 4px ${SITE.primary}22` : "none",
          }}>
            {text || <span style={{ color: "#9ca3af", fontWeight: 500 }}>Ex.: Revolução Francesa, Equações de 2º grau, Fotossíntese...</span>}
            {frame >= 40 && frame < 95 && <span style={{ width: 2, height: 28, background: SITE.primary, marginLeft: 4, opacity: Math.floor(frame / 8) % 2 }} />}
          </div>
        </div>

        {/* Nivel + Prazo */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 18 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 16, fontWeight: 700, color: SITE.text }}>
              <span style={{ color: SITE.secondary }}>🎓</span> Nível de Ensino
            </div>
            <div style={{
              height: 50, background: SITE.card,
              border: `2px solid ${nivelSelected ? SITE.secondary : SITE.border}`,
              borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px",
              fontSize: 16, fontWeight: 600, color: nivelSelected ? SITE.text : "#9ca3af",
            }}>
              <span>{nivelSelected ? "Ensino Médio" : "Selecione o nível"}</span>
              <span style={{ color: "#9ca3af" }}>▾</span>
            </div>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 16, fontWeight: 700, color: SITE.text }}>
              <span style={{ color: SITE.accent }}>📅</span> Dias (Roteiro de Estudos)
            </div>
            <div style={{
              height: 50, background: SITE.card,
              border: `2px solid ${prazoFilled ? SITE.accent : SITE.border}`,
              borderRadius: 10,
              display: "flex", alignItems: "center", padding: "0 16px",
              fontSize: 16, fontWeight: 600, color: prazoFilled ? SITE.text : "#9ca3af",
            }}>
              {prazoFilled ? "7" : "Ex.: 7"}
            </div>
          </div>
        </div>

        {/* Dúvidas */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 16, fontWeight: 700, color: SITE.text }}>
            <span style={{ color: SITE.muted }}>❓</span> Dúvidas Específicas
          </div>
          <div style={{
            height: 70, background: SITE.card,
            border: `2px solid ${SITE.border}`,
            borderRadius: 10,
            padding: "12px 16px",
            fontSize: 15, fontWeight: 500, color: "#9ca3af",
          }}>
            Descreva aqui suas dúvidas ou pontos que gostaria de aprofundar...
          </div>
        </div>

        {/* Generate button */}
        <div style={{
          height: 60,
          background: `linear-gradient(135deg, ${SITE.primary}, ${SITE.primaryLight})`,
          borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
          color: "#fff", fontSize: 22, fontWeight: 800, fontFamily: "Nunito",
          boxShadow: `0 8px 24px ${SITE.primary}55`,
          transform: `scale(${buttonScale})`,
        }}>
          ✦ Gerar Material de Estudo
        </div>
      </div>

      <Cursor path={cursorPath} clickFrames={[115, 135, 150]} />
    </AbsoluteFill>
  );
};
