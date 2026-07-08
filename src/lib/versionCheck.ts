// Auto-update checker: polls index.html and reloads when a new build is detected.
// Compares the hashed JS/CSS entries and the build timestamp comment in <head>.

const POLL_INTERVAL_MS = 5_000; // 5 seconds in preview/iframe, throttled elsewhere
const STORAGE_KEY = "lb-build-signature";

const isPreview =
  (typeof window !== "undefined" &&
    (window.location.hostname.includes("id-preview--") ||
      window.location.hostname.includes("lovableproject.com") ||
      window.location.hostname.includes("lovable.app"))) ||
  (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

const extractSignature = (html: string): string | null => {
  // Match the hashed Vite entry script (e.g. /assets/index-ABC123.js) or any modulepreload/script with a hash.
  const assetMatches = html.match(/\/assets\/[A-Za-z0-9_-]+\.[a-f0-9]{6,}\.(?:js|css)/g);
  const assets = assetMatches ? Array.from(new Set(assetMatches)).sort().join("|") : "";
  // Also capture the build timestamp comment so any HTML-only change triggers a reload.
  const buildTimestamp = html.match(/<!-- Build timestamp: ([^\s]+) -->/)?.[1] || "";
  const combined = `${buildTimestamp}::${assets}`;
  return combined.length > 2 ? combined : null;
};

const fetchCurrentSignature = async (): Promise<string | null> => {
  try {
    const res = await fetch(`/?_v=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    return extractSignature(html);
  } catch {
    return null;
  }
};

let reloading = false;
const triggerReload = () => {
  if (reloading) return;
  reloading = true;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
  const url = new URL(window.location.href);
  url.searchParams.set("_v", Date.now().toString());
  window.location.replace(url.toString());
};

export const startVersionCheck = () => {
  if (typeof window === "undefined") return;

  // Capture initial signature from the currently loaded document.
  const initial = extractSignature(document.documentElement.outerHTML);
  if (initial) {
    try {
      sessionStorage.setItem(STORAGE_KEY, initial);
    } catch {}
  }

  let lastCheck = 0;
  const check = async () => {
    if (document.visibilityState !== "visible") return;
    const now = Date.now();
    if (now - lastCheck < (isPreview ? 5_000 : POLL_INTERVAL_MS)) return;
    lastCheck = now;
    const latest = await fetchCurrentSignature();
    if (!latest) return;
    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem(STORAGE_KEY);
    } catch {}
    if (!stored) {
      try {
        sessionStorage.setItem(STORAGE_KEY, latest);
      } catch {}
      return;
    }
    if (stored !== latest) triggerReload();
  };

  setInterval(check, isPreview ? 5_000 : POLL_INTERVAL_MS);
  window.addEventListener("focus", check);
  document.addEventListener("visibilitychange", check);
};
