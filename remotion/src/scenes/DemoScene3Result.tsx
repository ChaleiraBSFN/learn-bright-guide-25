import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";
import { SITE } from "../site-theme";

const SectionCard: React.FC<{ delay: number; x: number; y: number; w: number; h: number; accent: string; icon: string; title: string; subtitle?: string; body: React.ReactNode }> = ({ delay, x, y, w, h, accent, icon, title, subtitle, body }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 130 } });
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h,
      background: SITE.card,
      border: `1px solid ${SITE.border}`,
      borderTop: `4px solid ${accent}`,
      borderRadius: 14, padding: 22,
      transform: `translateY(${interpolate(s, [0, 1], [50, 0])}px) scale(${s})`,
      opacity: s,
      boxShadow: `0 8px 24px ${SITE.shadow}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${accent}20`, color: accent,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
        }}>{icon}</div>
        <div>
          <div style={{ fontFamily: "Nunito", fontSize: 19, fontWeight: 900, color: SITE.text }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: SITE.muted, fontWeight: 600 }}>{subtitle}</div>}
        </div>
      </div>
      <div style={{ color: SITE.text, fontSize: 15, fontWeight: 500, lineHeight: 1.5 }}>{body}</div>
    </div>
  );
};

export const DemoScene3Result: React.FC = () => {
  const frame = useCurrentFrame();
  const titleS = spring({ frame, fps: 30, config: { damping: 18 } });

  return (
    <AbsoluteFill style={{ padding: 30 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 14, marginBottom: 18,
        opacity: titleS, transform: `translateY(${interpolate(titleS, [0, 1], [-15, 0])}px)`,
      }}>
        <div style={{ fontFamily: "Nunito", fontSize: 32, fontWeight: 900, color: SITE.text }}>
          🌱 Fotossíntese
        </div>
        <div style={{ padding: "5px 12px", background: `${SITE.secondary}22`, color: SITE.secondary, borderRadius: 999, fontSize: 13, fontWeight: 800 }}>
          ✓ Estudo gerado em 4.2s
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[
          { name: "📖 Estudo", active: true, color: SITE.primary },
          { name: "🧠 Mapa Mental", active: false, color: SITE.secondary },
          { name: "✏️ Exercícios", active: false, color: SITE.accent },
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

      <SectionCard
        delay={6} x={20} y={170} w={780} h={310} accent={SITE.primary}
        icon="📖" title="Conceito" subtitle="Definição completa"
        body={<>Processo bioquímico em que plantas, algas e algumas bactérias <b>convertem energia luminosa em energia química</b>, sintetizando glicose a partir de CO₂ e H₂O e liberando O₂. Ocorre nos cloroplastos em duas fases: clara (fotofase) e escura (Ciclo de Calvin).</>}
      />

      <SectionCard
        delay={18} x={820} y={170} w={780} h={310} accent={SITE.accent}
        icon="💡" title="Exemplo Prático" subtitle="Aplicação no dia a dia"
        body={<>Uma folha de manjericão na janela: a luz solar excita a clorofila → quebra a água (H₂O) → libera O₂ → produz ATP e NADPH → o ciclo de Calvin transforma CO₂ em glicose (C₆H₁₂O₆), que vira o "alimento" da planta.</>}
      />

      <SectionCard
        delay={30} x={20} y={500} w={780} h={290} accent={SITE.secondary}
        icon="🧠" title="Mapa Mental" subtitle="Conceitos relacionados"
        body={
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {["Clorofila", "Cloroplastos", "Fase clara", "Ciclo de Calvin", "ATP", "NADPH", "Glicose", "O₂", "CO₂"].map((t, i) => (
              <div key={i} style={{ padding: "8px 14px", background: `${SITE.secondary}15`, border: `1px solid ${SITE.secondary}55`, borderRadius: 999, fontSize: 13, fontWeight: 700, color: SITE.secondary }}>{t}</div>
            ))}
          </div>
        }
      />

      <SectionCard
        delay={42} x={820} y={500} w={780} h={290} accent={SITE.primary}
        icon="📅" title="Plano de Estudo" subtitle="7 dias"
        body={
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 2 }}>
            {[
              { d: "Dia 1", t: "Estrutura do cloroplasto" },
              { d: "Dia 2", t: "Fase clara: fotólise da água" },
              { d: "Dia 3", t: "Ciclo de Calvin (fase escura)" },
              { d: "Dia 4", t: "Fatores limitantes + exercícios" },
            ].map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: SITE.bg, borderRadius: 8 }}>
                <div style={{ width: 56, fontSize: 12, fontWeight: 900, color: SITE.accent }}>{p.d}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: SITE.text }}>{p.t}</div>
              </div>
            ))}
          </div>
        }
      />
    </AbsoluteFill>
  );
};
