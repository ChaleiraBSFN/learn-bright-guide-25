import { AbsoluteFill, Img, staticFile, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";
import { SITE } from "../site-theme";

export const DemoScene5Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14 } });
  const sub = spring({ frame: frame - 18, fps, config: { damping: 16 } });

  return (
    <AbsoluteFill style={{
      alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 36,
      background: `linear-gradient(135deg, ${SITE.primary}, ${SITE.secondary} 50%, ${SITE.accent})`,
    }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at center, rgba(255,255,255,0.2), transparent 70%)",
      }} />
      <div style={{
        display: "flex", alignItems: "center", gap: 28,
        transform: `scale(${s})`, opacity: s,
      }}>
        <div style={{
          borderRadius: 24, overflow: "hidden",
          boxShadow: `0 20px 60px rgba(0,0,0,0.3), 0 0 0 5px #fff`,
        }}>
          <Img src={staticFile("images/logo.jpeg")} style={{ width: 130, height: 130, display: "block" }} />
        </div>
        <div style={{ fontFamily: "Nunito", fontSize: 96, fontWeight: 900, color: "#fff", letterSpacing: -3 }}>
          Learn Buddy
        </div>
      </div>
      <div style={{
        fontFamily: "Nunito", fontSize: 36, fontWeight: 800, color: "#fff", textAlign: "center",
        opacity: sub, transform: `translateY(${interpolate(sub, [0, 1], [20, 0])}px)`,
        textShadow: "0 2px 10px rgba(0,0,0,0.2)",
      }}>
        Experimente agora — <span style={{ color: "#fff", background: "rgba(0,0,0,0.2)", padding: "4px 16px", borderRadius: 999 }}>100% gratuito</span>
      </div>
      <div style={{
        fontFamily: "Nunito", fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: 4,
        opacity: sub, padding: "12px 32px", background: "rgba(255,255,255,0.15)", borderRadius: 999, border: "2px solid rgba(255,255,255,0.4)",
      }}>
        STUDDYBUDDY.COM.BR
      </div>
    </AbsoluteFill>
  );
};
