import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost = window.location.hostname.includes("id-preview--") || window.location.hostname.includes("lovableproject.com");

if (isInIframe || isPreviewHost) {
  navigator.serviceWorker?.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
} else {
  const updateSW = registerSW({
    onNeedRefresh() {
      window.location.reload();
    },
    onOfflineReady() {
      console.log("App ready for offline use");
    },
    immediate: true,
  });

  const forceUpdate = () => updateSW(true);

  setInterval(forceUpdate, 15 * 1000);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") forceUpdate();
  });

  window.addEventListener("focus", forceUpdate);
  window.addEventListener("online", forceUpdate);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted || window.matchMedia('(display-mode: standalone)').matches) {
      forceUpdate();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
