import { SITE } from "../site-theme";
import { Img, staticFile } from "remotion";

export const BrowserFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{
      width: 1700, height: 940,
      background: SITE.card,
      borderRadius: 18,
      overflow: "hidden",
      boxShadow: `0 40px 100px ${SITE.shadowLg}, 0 0 0 1px ${SITE.border}`,
      display: "flex", flexDirection: "column",
    }}>
      {/* Browser chrome */}
      <div style={{
        height: 48,
        background: "#e8eaed",
        borderBottom: `1px solid #d2d4d8`,
        display: "flex", alignItems: "center", padding: "0 18px", gap: 16,
      }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ width: 13, height: 13, borderRadius: 7, background: "#ff5f57" }} />
          <div style={{ width: 13, height: 13, borderRadius: 7, background: "#febc2e" }} />
          <div style={{ width: 13, height: 13, borderRadius: 7, background: "#28c840" }} />
        </div>
        <div style={{
          flex: 1, maxWidth: 600, margin: "0 auto",
          background: "#ffffff", borderRadius: 8,
          padding: "7px 14px", color: "#5f6368", fontSize: 14, fontWeight: 500,
          textAlign: "center", border: "1px solid #dadce0",
        }}>
          🔒 studdybuddy.com.br
        </div>
        <div style={{ width: 80 }} />
      </div>

      {/* Site header */}
      <div style={{
        background: SITE.bg,
        padding: "16px 36px",
        borderBottom: `1px solid ${SITE.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Img src={staticFile("images/logo.jpeg")} style={{ width: 44, height: 44, borderRadius: 10 }} />
          <div>
            <div style={{ fontFamily: "Nunito", fontWeight: 900, fontSize: 22, color: SITE.text, lineHeight: 1.1 }}>Learn Buddy</div>
            <div style={{ fontSize: 13, color: SITE.muted, fontWeight: 600 }}>Seu assistente de aprendizado</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ padding: "8px 16px", background: "#fff", border: `1px solid ${SITE.border}`, borderRadius: 8, fontSize: 14, fontWeight: 700, color: SITE.text, display: "flex", gap: 6, alignItems: "center" }}>
            <svg viewBox="0 0 30 20" style={{ width: 22, height: 14, borderRadius: 2 }} aria-hidden="true">
              <rect width="30" height="20" fill="#009c3b" />
              <path d="M15 2 L28 10 L15 18 L2 10 Z" fill="#ffdf00" />
              <circle cx="15" cy="10" r="5.5" fill="#002776" />
            </svg>
            BR
          </div>
          <div style={{ padding: "8px 16px", background: "#fff", border: `1px solid ${SITE.border}`, borderRadius: 8, fontSize: 14, fontWeight: 700, color: SITE.text }}>
            ❓ Ajuda
          </div>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: SITE.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>MA</div>
        </div>
      </div>

      <div style={{ flex: 1, position: "relative", overflow: "hidden", background: SITE.bg }}>
        {children}
      </div>
    </div>
  );
};
