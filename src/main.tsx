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

const isLovablePreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com") ||
  window.location.hostname.endsWith(".lovable.app");

const isPreviewOrEditor = isInIframe || isLovablePreviewHost;

const isAppCache = (name: string) =>
  /(^|-)precache-v\d+-|(^|-)runtime-|(^|-)googleAnalytics-/.test(name) ||
  name.includes("workbox") ||
  name.includes("supabase-api") ||
  name.includes("vite") ||
  name.includes("learn-buddy") ||
  name.includes("studdy-buddy");

const reloadOnceWithFreshUrl = (key: string) => {
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {}

  const url = new URL(window.location.href);
  url.searchParams.set("_fresh", Date.now().toString());
  window.location.replace(url.toString());
};

const removeStaleServiceWorkersAndCaches = async (forcePreviewFreshness = false) => {
  try {
    const registrations = await navigator.serviceWorker?.getRegistrations();

    await Promise.allSettled(
      registrations?.map((registration) => registration.update()) ?? []
    );

    let deletedCacheCount = 0;
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      const staleCacheNames = forcePreviewFreshness
        ? cacheNames
        : cacheNames.filter(isAppCache);

      deletedCacheCount = staleCacheNames.length;
      await Promise.allSettled(staleCacheNames.map((name) => caches.delete(name)));
    }

    await Promise.allSettled(
      registrations?.map((registration) => registration.unregister()) ?? []
    );

    if (
      forcePreviewFreshness &&
      ((registrations?.length ?? 0) > 0 || deletedCacheCount > 0 || navigator.serviceWorker?.controller)
    ) {
      reloadOnceWithFreshUrl("lb-preview-freshness-reloaded-v2");
    }
  } catch {}
};

removeStaleServiceWorkersAndCaches(isPreviewOrEditor);
startVersionCheck();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);