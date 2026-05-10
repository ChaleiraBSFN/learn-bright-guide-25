import { COLORS } from "../MainVideo";
import { Img, staticFile } from "remotion";

export const BrowserFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{
      width: 1700, height: 940,
      background: COLORS.bg,
      borderRadius: 24,
      overflow: "hidden",
      boxShadow: `0 40px 100px ${COLORS.bgDeep}, 0 0 0 2px ${COLORS.white}11`,
      display: "flex", flexDirection: "column",
    }}>
      {/* Title bar */}
      <div style={{
        height: 56,
        background: `linear-gradient(180deg, ${COLORS.blue}66, ${COLORS.bg})`,
        borderBottom: `1px solid ${COLORS.white}15`,
        display: "flex", alignItems: "center", padding: "0 20px", gap: 16,
      }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: "#ff5f57" }} />
          <div style={{ width: 14, height: 14, borderRadius: 7, background: "#febc2e" }} />
          <div style={{ width: 14, height: 14, borderRadius: 7, background: "#28c840" }} />
        </div>
        <div style={{
          flex: 1, maxWidth: 600, margin: "0 auto",
          background: `${COLORS.white}10`, borderRadius: 8,
          padding: "8px 16px", color: `${COLORS.white}99`, fontSize: 16, fontWeight: 600,
          textAlign: "center",
        }}>
          🔒 studdybuddy.com.br
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Img src={staticFile("images/logo.jpeg")} style={{ width: 32, height: 32, borderRadius: 6 }} />
          <span style={{ color: COLORS.white, fontWeight: 800, fontSize: 18 }}>Learn Buddy</span>
        </div>
      </div>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
};
