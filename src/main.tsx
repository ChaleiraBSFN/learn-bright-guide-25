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

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (isInIframe || isPreviewHost) {
  navigator.serviceWorker?.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
} else {
  let reloading = false;
  const hardReload = async () => {
    if (reloading) return;
    reloading = true;
    try {
      if ("caches" in window) {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      }
    } catch {}
    // cache-buster ensures the next navigation skips any HTTP cache
    const url = new URL(window.location.href);
    url.searchParams.set("_v", Date.now().toString());
    window.location.replace(url.toString());
  };

  navigator.serviceWorker?.addEventListener("controllerchange", hardReload);

  const updateSW = registerSW({
    onNeedRefresh() {
      hardReload();
    },
    onOfflineReady() {
      console.log("App ready for offline use");
    },
    immediate: true,
  });

  const forceUpdate = () => updateSW(true).catch(() => {});

  // Fast version-fingerprint check: fetches index.html bypassing any cache,
  // compares its hash, and triggers a hard reload when the build changes.
  // This catches new deploys even when the service worker is slow to notice.
  let lastFingerprint: string | null = null;
  const fingerprintIndex = async () => {
    try {
      const res = await fetch(`/?_v=${Date.now()}`, {
        cache: "no-store",
        headers: { "cache-control": "no-cache", pragma: "no-cache" },
      });
      if (!res.ok) return;
      const text = await res.text();
      // Hash only the asset references (script/link tags carry the build hash)
      const assetRefs = (text.match(/(?:src|href)="\/assets\/[^"]+"/g) || []).join("|");
      const fp = assetRefs || text.length.toString();
      if (lastFingerprint && lastFingerprint !== fp) {
        hardReload();
        return;
      }
      lastFingerprint = fp;
    } catch {}
  };

  fingerprintIndex();

  // Poll every 3 seconds for updates (both SW + index fingerprint)
  setInterval(() => {
    forceUpdate();
    fingerprintIndex();
  }, 3 * 1000);

  const onWake = () => {
    forceUpdate();
    fingerprintIndex();
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") onWake();
  });
  window.addEventListener("focus", onWake);
  window.addEventListener("online", onWake);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted || window.matchMedia("(display-mode: standalone)").matches) {
      onWake();
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
