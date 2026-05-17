import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
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
  // Auto-reload when a new service worker takes control (new deploy)
  let reloading = false;
  navigator.serviceWorker?.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  const updateSW = registerSW({
    onNeedRefresh() {
      // New version available: clear caches and reload immediately
      const reload = () => window.location.reload();
      if ('caches' in window) {
        caches.keys().then(names => Promise.all(names.map(n => caches.delete(n)))).finally(reload);
      } else {
        reload();
      }
    },
    onOfflineReady() {
      console.log("App ready for offline use");
    },
    immediate: true,
  });

  const forceUpdate = () => updateSW(true);

  // Poll every 5 seconds for updates
  setInterval(forceUpdate, 5 * 1000);

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

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
