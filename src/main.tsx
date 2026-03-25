import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// Force immediate update when new SW is available
const updateSW = registerSW({
  onNeedRefresh() {
    // Auto-update without asking
    window.location.reload();
  },
  onOfflineReady() {
    console.log("App ready for offline use");
  },
  immediate: true,
});

// Check for updates every 15 seconds (more aggressive)
setInterval(() => {
  updateSW(true);
}, 15 * 1000);

// Check on visibility change (when user switches back to the app)
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    updateSW(true);
  }
});

// Check on focus (covers more mobile scenarios)
window.addEventListener("focus", () => {
  updateSW(true);
});

// Check on online event (when network comes back)
window.addEventListener("online", () => {
  updateSW(true);
});

// For standalone PWA: force check on app resume / page show
window.addEventListener("pageshow", (event) => {
  if (event.persisted || window.matchMedia('(display-mode: standalone)').matches) {
    updateSW(true);
  }
});

createRoot(document.getElementById("root")!).render(<App />);
