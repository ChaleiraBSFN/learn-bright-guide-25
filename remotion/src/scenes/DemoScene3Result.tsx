import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";
import { SITE } from "../site-theme";

// Faithful reproduction of StudyResult: vertical stack of section-cards
// with colored left strip (1.5 width) — see src/components/sections/*.tsx

const SectionCard: React.FC<{
  delay: number;
  accent: string;
  number: string;
  icon: string;
  title: string;
  children: React.ReactNode;
}> = ({ delay, accent, number, icon, title, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 110 } });
  return (
    <div style={{
      position: "relative", overflow: "hidden",
      background: SITE.card, border: `1px solid ${SITE.border}`,
      borderRadius: 16, padding: 22,
      opacity: s, transform: `translateY(${interpolate(s, [0, 1], [24, 0])}px)`,
      boxShadow: `0 1px 2px ${SITE.shadow}`,
    }}>
      {/* Left colored strip (w-1.5 rounded-l-2xl bg-section-X) */}
      <div style={{
        position: "absolute", left: 0, top: 0, height: "100%", width: 6,
        borderTopLeftRadius: 16, borderBottomLeftRadius: 16,
        background: accent,
      }} />
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, paddingLeft: 6 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${accent}1a`, color: accent,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
          flexShrink: 0,
        }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SITE.fontDisplay, fontSize: 20, fontWeight: 800, color: SITE.text, marginBottom: 8 }}>
            {number}. {title}
          </div>
          <div style={{ fontFamily: SITE.fontBody, color: SITE.text, opacity: 0.92, fontSize: 15, lineHeight: 1.55 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export const DemoScene3Result: React.FC = () => {
  const frame = useCurrentFrame();
  const headerS = spring({ frame, fps: 30, config: { damping: 18 } });

  // Simulate vertical scroll after frame 95
  const scrollY = interpolate(frame, [95, 155], [0, -340], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: SITE.bg, overflow: "hidden" }}>
      <div style={{ padding: "32px 80px", transform: `translateY(${scrollY}px)` }}>
        {/* Header — matches StudyResult title block */}
        <div style={{ textAlign: "center", marginBottom: 28, opacity: headerS, transform: `translateY(${interpolate(headerS, [0, 1], [-12, 0])}px)` }}>
          <div style={{ fontFamily: SITE.fontDisplay, fontSize: 36, fontWeight: 800, color: SITE.text }}>
            Material de Estudo
          </div>
          <div style={{ fontSize: 18, color: SITE.muted, marginTop: 6, fontFamily: SITE.fontBody }}>
            Tema: <span style={{ color: SITE.primary, fontWeight: 700 }}>Fotossíntese</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 1100, margin: "0 auto" }}>
          <SectionCard delay={6} accent={SITE.sectionObjective} number="1" icon="🎯" title="Objetivo">
            Compreender o processo da fotossíntese, identificando suas fases (clara e escura), seus reagentes, produtos e a importância biológica para a vida na Terra.
          </SectionCard>

          <SectionCard delay={20} accent={SITE.sectionSummary} number="2" icon="📚" title="Resumo">
            <div style={{ display: "flex", gap: 18 }}>
              <div style={{ flex: 1 }}>
                A fotossíntese é o processo bioquímico em que plantas, algas e algumas bactérias <b>convertem energia luminosa em energia química</b>, sintetizando glicose a partir de CO₂ e H₂O e liberando O₂. Ocorre nos cloroplastos e divide-se em fase clara (fotofase) e fase escura (Ciclo de Calvin).
              </div>
              <div style={{
                width: 180, height: 110, borderRadius: 12,
                background: `linear-gradient(135deg, ${SITE.sectionSummary}33, ${SITE.sectionSummary}11)`,
                border: `1px solid ${SITE.sectionSummary}55`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 56, flexShrink: 0,
              }}>🌿</div>
            </div>
          </SectionCard>

          <SectionCard delay={36} accent={SITE.sectionSteps} number="3" icon="📋" title="Demonstrações">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { n: 1, t: "Absorção da luz pela clorofila", d: "Os fótons excitam elétrons da clorofila nos tilacoides." },
                { n: 2, t: "Fotólise da água (H₂O → 2H⁺ + ½O₂ + 2e⁻)", d: "Libera O₂ e fornece elétrons para o ETC." },
                { n: 3, t: "Ciclo de Calvin: fixação do CO₂", d: "Usa ATP e NADPH para formar glicose (C₆H₁₂O₆)." },
              ].map((p) => (
                <div key={p.n} style={{
                  display: "flex", gap: 12, padding: "10px 12px",
                  background: `${SITE.sectionSteps}08`, borderRadius: 10,
                  border: `1px solid ${SITE.sectionSteps}22`,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: SITE.sectionSteps, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: 13, flexShrink: 0,
                  }}>{p.n}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: SITE.text, fontSize: 15 }}>{p.t}</div>
                    <div style={{ fontSize: 13, color: SITE.muted, marginTop: 2 }}>{p.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard delay={52} accent={SITE.sectionMindmap} number="4" icon="🧠" title="Mapa Visual">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["Clorofila", "Cloroplastos", "Fase clara", "Ciclo de Calvin", "ATP", "NADPH", "Glicose", "O₂", "CO₂"].map((tag, i) => (
                <div key={i} style={{
                  padding: "6px 14px", borderRadius: 999,
                  background: `${SITE.sectionMindmap}15`,
                  border: `1px solid ${SITE.sectionMindmap}55`,
                  color: SITE.sectionMindmap, fontSize: 13, fontWeight: 700, fontFamily: SITE.fontBody,
                }}>{tag}</div>
              ))}
            </div>
          </SectionCard>

          <SectionCard delay={70} accent={SITE.sectionPlan} number="5" icon="📅" title="Plano de Estudo (7 dias)">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { d: "Dia 1", t: "Estrutura do cloroplasto" },
                { d: "Dia 2", t: "Fase clara: fotólise da água" },
                { d: "Dia 3", t: "Cadeia transportadora de elétrons" },
                { d: "Dia 4", t: "Ciclo de Calvin (fase escura)" },
                { d: "Dia 5", t: "Fatores limitantes da fotossíntese" },
              ].map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: SITE.bg, borderRadius: 8 }}>
                  <div style={{ width: 50, fontSize: 12, fontWeight: 800, color: SITE.sectionPlan }}>{p.d}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: SITE.text }}>{p.t}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </AbsoluteFill>
  );
};
