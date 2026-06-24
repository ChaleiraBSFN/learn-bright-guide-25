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
  window.location.hostname.includes("lovableproject.com");

if (isInIframe || isPreviewHost) {
  navigator.serviceWorker?.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
} else {
  const isAppCache = (name: string) =>
    /(^|-)precache-v\d+-|(^|-)runtime-|(^|-)googleAnalytics-/.test(name) ||
    name.includes("workbox") ||
    name.includes("supabase-api");

  const removeStaleServiceWorkers = async () => {
    try {
      const registrations = await navigator.serviceWorker?.getRegistrations();
      if (!registrations?.length) return;

      await Promise.allSettled(registrations.map((registration) => registration.update()));

      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.allSettled(
          cacheNames.filter(isAppCache).map((name) => caches.delete(name))
        );
      }

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
