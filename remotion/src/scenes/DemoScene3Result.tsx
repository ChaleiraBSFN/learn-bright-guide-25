import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";
import { COLORS } from "../MainVideo";

const Card: React.FC<{ delay: number; x: number; y: number; w: number; h: number; accent: string; icon: string; title: string; body: React.ReactNode }> = ({ delay, x, y, w, h, accent, icon, title, body }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 130 } });
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h,
      background: `linear-gradient(160deg, ${COLORS.white}10, ${COLORS.white}03)`,
      border: `2px solid ${accent}66`,
      borderRadius: 20, padding: 22,
      transform: `translateY(${interpolate(s, [0, 1], [60, 0])}px) scale(${s})`,
      opacity: s,
      boxShadow: `0 18px 50px ${accent}33`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 32 }}>{icon}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: accent, textTransform: "uppercase", letterSpacing: 1 }}>{title}</div>
      </div>
      <div style={{ color: COLORS.white, fontSize: 18, fontWeight: 600, lineHeight: 1.4 }}>{body}</div>
    </div>
  );
};

export const DemoScene3Result: React.FC = () => {
  const frame = useCurrentFrame();
  const titleS = spring({ frame, fps: 30, config: { damping: 18 } });

  return (
    <AbsoluteFill style={{ padding: 30 }}>
      <div style={{
        fontSize: 38, fontWeight: 900, color: COLORS.white, marginBottom: 18,
        opacity: titleS, transform: `translateY(${interpolate(titleS, [0, 1], [-20, 0])}px)`,
      }}>
        🌱 Fotossíntese <span style={{ color: COLORS.teal, fontSize: 22, marginLeft: 12 }}>· estudo gerado</span>
      </div>

      <Card
        delay={6} x={20} y={100} w={780} h={340} accent={COLORS.teal}
        icon="📖" title="Conceito"
        body={<>Processo bioquímico em que plantas, algas e algumas bactérias <b>convertem energia luminosa em energia química</b>, sintetizando glicose a partir de CO₂ e H₂O, liberando O₂. Ocorre nos cloroplastos, em duas fases: clara (fotofase) e escura (Ciclo de Calvin).</>}
      />

      <Card
        delay={18} x={820} y={100} w={780} h={340} accent={COLORS.amber}
        icon="💡" title="Exemplo Prático"
        body={<>Uma folha de manjericão na janela: a luz solar excita a clorofila → quebra a água (H₂O) → libera O₂ → produz ATP e NADPH → o ciclo de Calvin transforma CO₂ em glicose (C₆H₁₂O₆), que vira o "alimento" da planta.</>}
      />

      <Card
        delay={30} x={20} y={460} w={780} h={310} accent={COLORS.blue}
        icon="🧠" title="Mapa Mental"
        body={
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
            {["Clorofila", "Cloroplastos", "Fase clara", "Ciclo de Calvin", "ATP", "NADPH", "Glicose", "O₂"].map((t, i) => (
              <div key={i} style={{ padding: "10px 18px", background: `${COLORS.blue}33`, border: `1px solid ${COLORS.blue}`, borderRadius: 999, fontSize: 16, fontWeight: 700, color: COLORS.white }}>{t}</div>
            ))}
          </div>
        }
      />

      <Card
        delay={42} x={820} y={460} w={780} h={310} accent={COLORS.teal}
        icon="📋" title="Plano de Estudo"
        body={
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
            {[
              { d: "Dia 1", t: "Estrutura do cloroplasto" },
              { d: "Dia 2", t: "Fase clara: fotólise da água" },
              { d: "Dia 3", t: "Ciclo de Calvin" },
              { d: "Dia 4", t: "Fatores limitantes + exercícios" },
            ].map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 14px", background: `${COLORS.white}08`, borderRadius: 10 }}>
                <div style={{ width: 60, fontSize: 14, fontWeight: 900, color: COLORS.amber }}>{p.d}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.white }}>{p.t}</div>
              </div>
            ))}
          </div>
        }
      />
    </AbsoluteFill>
  );
};
