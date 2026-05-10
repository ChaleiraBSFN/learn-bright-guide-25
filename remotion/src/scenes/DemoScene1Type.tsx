import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SITE } from "../site-theme";
import { Cursor } from "../components/Cursor";

const TYPED = "Fotossíntese";

export const DemoScene1Type: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const heroS = spring({ frame, fps, config: { damping: 18 } });
  const featS = spring({ frame: frame - 10, fps, config: { damping: 18 } });
  const tabsS = spring({ frame: frame - 18, fps, config: { damping: 18 } });
  const formS = spring({ frame: frame - 26, fps, config: { damping: 16 } });

  const typedCount = Math.floor(interpolate(frame, [55, 105], [0, TYPED.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const text = TYPED.slice(0, typedCount);

  const nivelSelected = frame >= 122;
  const prazoFilled = frame >= 140;
  const buttonPress = spring({ frame: frame - 158, fps, config: { damping: 8, stiffness: 300 }, durationInFrames: 14 });
  const buttonScale = 1 - buttonPress * 0.06;

  // Cursor path — coords measured against actual layout (scene area 1700×~816, padding 26px 110px)
  // Hero ~122, Features end ~206, Tabs end ~272, Form card padding starts y=300
  // Tema input center ≈ y 349 | Nivel select ≈ y 436 | Prazo input ≈ y 434 | Generate button ≈ y 607
  const cursorPath = [
    { x: 1450, y: 720, frame: 0 },
    { x: 750, y: 349, frame: 50 },     // Tema input
    { x: 750, y: 349, frame: 110 },
    { x: 380, y: 436, frame: 122 },    // Nivel select
    { x: 1080, y: 434, frame: 142 },   // Prazo input
    { x: 740, y: 607, frame: 158 },    // Generate button
    { x: 740, y: 607, frame: 175 },
  ];

  return (
    <AbsoluteFill style={{ padding: "26px 110px", overflow: "hidden" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 16, opacity: heroS, transform: `translateY(${interpolate(heroS, [0, 1], [-12, 0])}px)` }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 14px", background: `${SITE.primary}1a`, color: SITE.primary,
          borderRadius: 999, fontSize: 13, fontWeight: 700, marginBottom: 8,
          fontFamily: SITE.fontBody,
        }}>
          ✦ Aprendizado Inteligente
        </div>
        <div style={{ fontFamily: SITE.fontDisplay, fontSize: 40, fontWeight: 800, color: SITE.text, lineHeight: 1.1 }}>
          Aprenda qualquer assunto de forma{" "}
          <span style={{
            backgroundImage: `linear-gradient(135deg, ${SITE.primary} 0%, ${SITE.secondary} 50%, ${SITE.accent} 100%)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>clara e visual</span>
        </div>
      </div>

      {/* Features grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14,
        opacity: featS, transform: `translateY(${interpolate(featS, [0, 1], [12, 0])}px)`,
      }}>
        {[
          { icon: "📖", title: "Resumos Claros", desc: "Detalhados", color: SITE.primary },
          { icon: "🧠", title: "Mapas Visuais", desc: "Completos", color: SITE.secondary },
          { icon: "💪", title: "Exercícios", desc: "10+ com desafios", color: SITE.accent },
        ].map((f, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 14px", background: SITE.card, borderRadius: 12,
            border: `1px solid ${SITE.border}`,
          }}>
            <div style={{ fontSize: 26, color: f.color }}>{f.icon}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: SITE.fontBody, fontWeight: 700, fontSize: 14, color: SITE.text }}>{f.title}</div>
              <div style={{ fontSize: 12, color: SITE.muted }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs (border-2 border-foreground style) */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16,
        opacity: tabsS, transform: `translateY(${interpolate(tabsS, [0, 1], [10, 0])}px)`,
      }}>
        {[
          { name: "Estudo", icon: "📖", active: true },
          { name: "Exercícios", icon: "✏️", active: false },
          { name: "Histórico", icon: "🕘", active: false },
        ].map((t, i) => (
          <div key={i} style={{
            padding: "12px 16px", borderRadius: 12,
            border: `2px solid ${SITE.text}`,
            background: t.active ? SITE.primary : SITE.card,
            color: t.active ? "#fff" : SITE.muted,
            fontWeight: 700, fontSize: 15, fontFamily: SITE.fontBody,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: t.active ? `0 4px 12px ${SITE.primary}55` : "none",
          }}>
            <span>{t.icon}</span> {t.name}
          </div>
        ))}
      </div>

      {/* Form card (card-elevated) */}
      <div style={{
        background: SITE.card, border: `1px solid ${SITE.border}`,
        borderRadius: 14, padding: 28,
        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.06)",
        opacity: formS, transform: `translateY(${interpolate(formS, [0, 1], [16, 0])}px)`,
        flex: 1,
      }}>
        {/* Tema */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 15, fontWeight: 600, color: SITE.text, fontFamily: SITE.fontBody }}>
            <span style={{ color: SITE.primary }}>📖</span> Tema de Estudo
          </div>
          <div style={{
            height: 44, background: SITE.card,
            border: `1px solid ${typedCount > 0 ? SITE.primary : SITE.border}`,
            borderRadius: 10, display: "flex", alignItems: "center", padding: "0 14px",
            fontSize: 16, fontWeight: 500, color: SITE.text, fontFamily: SITE.fontBody,
            boxShadow: typedCount > 0 ? `0 0 0 3px ${SITE.primary}26` : "none",
          }}>
            {text || <span style={{ color: "#9ca3af" }}>Ex.: Revolução Francesa, Equações de 2º grau, Fotossíntese...</span>}
            {frame >= 55 && frame < 105 && <span style={{ width: 2, height: 22, background: SITE.primary, marginLeft: 3, opacity: Math.floor(frame / 8) % 2 }} />}
          </div>
        </div>

        {/* Nivel + Prazo */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 15, fontWeight: 600, color: SITE.text, fontFamily: SITE.fontBody }}>
              <span style={{ color: SITE.secondary }}>🎓</span> Nível de Ensino
            </div>
            <div style={{
              height: 48, background: SITE.card,
              border: `1px solid ${nivelSelected ? SITE.secondary : SITE.border}`,
              borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px",
              fontSize: 15, fontWeight: 500, color: nivelSelected ? SITE.text : "#9ca3af", fontFamily: SITE.fontBody,
            }}>
              <span>{nivelSelected ? "Ensino Médio" : "Selecione o nível"}</span>
              <span style={{ color: "#9ca3af" }}>▾</span>
            </div>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 15, fontWeight: 600, color: SITE.text, fontFamily: SITE.fontBody }}>
              <span style={{ color: SITE.accent }}>📅</span> Dias (Roteiro de Estudos)
            </div>
            <div style={{
              height: 44, background: SITE.card,
              border: `1px solid ${prazoFilled ? SITE.accent : SITE.border}`,
              borderRadius: 10, display: "flex", alignItems: "center", padding: "0 14px",
              fontSize: 15, fontWeight: 500, color: prazoFilled ? SITE.text : "#9ca3af", fontFamily: SITE.fontBody,
            }}>
              {prazoFilled ? "7" : "Ex.: 7"}
            </div>
          </div>
        </div>

        {/* Dúvidas */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 15, fontWeight: 600, color: SITE.text, fontFamily: SITE.fontBody }}>
            <span style={{ color: SITE.muted }}>❓</span> Dúvidas Específicas
          </div>
          <div style={{
            height: 60, background: SITE.card, border: `1px solid ${SITE.border}`,
            borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "#9ca3af", fontFamily: SITE.fontBody,
          }}>
            Descreva aqui suas dúvidas ou pontos que gostaria de aprofundar...
          </div>
        </div>

        {/* Generate button (hero variant) */}
        <div style={{
          height: 56,
          background: `linear-gradient(135deg, ${SITE.primary}, ${SITE.primaryLight})`,
          borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          color: "#fff", fontSize: 19, fontWeight: 800, fontFamily: SITE.fontDisplay,
          boxShadow: `0 8px 24px ${SITE.primary}55`,
          transform: `scale(${buttonScale})`,
        }}>
          ✦ Gerar Material de Estudo
        </div>
      </div>

      <Cursor path={cursorPath} clickFrames={[125, 145, 158]} />
    </AbsoluteFill>
  );
};
