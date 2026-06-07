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

  // Fast version-fingerprint check: compares the currently loaded build's
  // asset hashes against a freshly fetched index.html. Baseline comes from
  // the live document so even the FIRST poll can detect a stale tab.
  const currentAssets = Array.from(
    document.querySelectorAll('script[src^="/assets/"], link[href^="/assets/"]')
  )
    .map((el) => el.getAttribute("src") || el.getAttribute("href") || "")
    .filter(Boolean)
    .sort()
    .join("|");
  let lastFingerprint: string = currentAssets;

  const fingerprintIndex = async () => {
    try {
      const res = await fetch(`/?_v=${Date.now()}`, {
        cache: "no-store",
        headers: { "cache-control": "no-cache", pragma: "no-cache" },
      });
      if (!res.ok) return;
      const text = await res.text();
      const assetRefs = (text.match(/\/assets\/[^"'\s>]+/g) || []).sort().join("|");
      const fp = assetRefs || text.length.toString();
      if (lastFingerprint && fp && lastFingerprint !== fp) {
        hardReload();
        return;
      }
      if (!lastFingerprint) lastFingerprint = fp;
    } catch {}
  };

  // Immediate check on boot — catches users opening a stale tab
  fingerprintIndex();

  // Poll every 2 seconds for updates (both SW + index fingerprint)
  setInterval(() => {
    forceUpdate();
    fingerprintIndex();
  }, 2 * 1000);

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
