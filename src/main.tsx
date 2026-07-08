import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { startVersionCheck } from "./lib/versionCheck";

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com") ||
  window.location.hostname.includes("lovable.app");

const isAppCache = (name: string) =>
  /(^|-)precache-v\d+-|(^|-)runtime-|(^|-)googleAnalytics-/.test(name) ||
  name.includes("workbox") ||
  name.includes("supabase-api");

const clearAppCaches = async () => {
  if (!("caches" in window)) return;
  try {
    const cacheNames = await caches.keys();
    await Promise.allSettled(
      cacheNames.filter(isAppCache).map((name) => caches.delete(name))
    );
  } catch {}
};

const unregisterServiceWorkers = async () => {
  if (!navigator.serviceWorker) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(registrations.map((r) => r.unregister()));
  } catch {}
};

const forceFreshOnce = (key: string) => {
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    const url = new URL(window.location.href);
    if (!url.searchParams.has("_fresh")) {
      url.searchParams.set("_fresh", Date.now().toString());
      window.location.replace(url.toString());
    }
  } catch {}
};

// Always keep the preview/editor iframe on the latest build by aggressively
// unregistering service workers, clearing caches and polling for new deploys.
if (isInIframe || isPreviewHost) {
  clearAppCaches();
  unregisterServiceWorkers();
  forceFreshOnce("lb-preview-fresh");
  startVersionCheck();
} else {
  const removeStaleServiceWorkers = async () => {
    try {
      const registrations = await navigator.serviceWorker?.getRegistrations();
      if (!registrations?.length) return;

      await Promise.allSettled(registrations.map((registration) => registration.update()));
      await clearAppCaches();
      await Promise.allSettled(registrations.map((registration) => registration.unregister()));

      if (!sessionStorage.getItem("lb-sw-cleaned")) {
        sessionStorage.setItem("lb-sw-cleaned", "1");
        const url = new URL(window.location.href);
        url.searchParams.set("_fresh", Date.now().toString());
        window.location.replace(url.toString());
      }
    } catch {}
  };

  removeStaleServiceWorkers();
  startVersionCheck();
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
