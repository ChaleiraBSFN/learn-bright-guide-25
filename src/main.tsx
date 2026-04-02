import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches;
const isLovablePreview = () => {
  const host = window.location.hostname;
  return host.includes("lovableproject.com") || host.includes("id-preview--");
};

const clearPreviewServiceWorkers = async () => {
  if (!("serviceWorker" in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  } catch (error) {
    console.error("Failed to clear preview service workers", error);
  }

  if (!("caches" in window)) return;

  try {
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map((key) => caches.delete(key)));
  } catch (error) {
    console.error("Failed to clear preview caches", error);
  }
};

const shouldRegisterSW = !import.meta.env.DEV && (!isLovablePreview() || isStandalone());

const updateSW = shouldRegisterSW
  ? registerSW({
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
    })
  : undefined;

const forceUpdateCheck = async () => {
  if (!shouldRegisterSW) return;

  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    await registration?.update();
    if (registration?.waiting && updateSW) {
      updateSW(true);
    }
  } catch (error) {
    console.error("Manual update check failed", error);
  }
};

if (shouldRegisterSW) {
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
} else if (isLovablePreview()) {
  clearPreviewServiceWorkers();
}

createRoot(document.getElementById("root")!).render(<App />);
