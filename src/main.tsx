import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches;

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true);
    window.location.reload();
  },
  onOfflineReady() {
    console.log("App ready for offline use");
  },
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;

    const runUpdate = async () => {
      try {
        await registration.update();
        if (registration.waiting) {
          updateSW(true);
        }
      } catch (error) {
        console.error("SW update check failed", error);
      }
    };

    runUpdate();
    setInterval(runUpdate, isStandalone() ? 5000 : 15000);
  },
});

const forceUpdateCheck = async () => {
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    await registration?.update();
    updateSW(true);
  } catch (error) {
    console.error("Manual update check failed", error);
  }
};

navigator.serviceWorker?.addEventListener("controllerchange", () => {
  window.location.reload();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    forceUpdateCheck();
  }
});

window.addEventListener("focus", forceUpdateCheck);
window.addEventListener("online", forceUpdateCheck);
window.addEventListener("pageshow", () => {
  forceUpdateCheck();
});

createRoot(document.getElementById("root")!).render(<App />);
