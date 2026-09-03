// Auto-update checker: polls index.html and reloads only when a genuinely new
// build is detected. Designed to never cause reload loops or screen flicker:
//  - disabled in dev, inside the editor iframe and on preview hosts
//  - polls slowly (60s) and only while the tab is visible
//  - requires the same new signature twice in a row before acting
//  - reloads at most once per browser session

const POLL_INTERVAL_MS = 60_000;
const STORAGE_KEY = "lb-build-signature";
const RELOADED_KEY = "lb-build-reloaded";

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost = () => {
  const h = window.location.hostname;
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h.includes("id-preview--") ||
    h.includes("lovableproject.com") ||
    h.includes("sandbox") ||
    h.endsWith(".lovable.app")
  );
};

const extractSignature = (html: string): string | null => {
  // Match Vite's emitted assets (e.g. /assets/index-ABC123.js or CSS chunks).
  const matches = html.match(/\/assets\/[^"'<>\s]+\.(?:js|css)/g);
  if (!matches || matches.length === 0) return null;
  return Array.from(new Set(matches)).sort().join("|");
};

const fetchCurrentSignature = async (): Promise<string | null> => {
  try {
    const url = new URL(window.location.origin);
    url.searchParams.set("_fresh", Date.now().toString());

    const res = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
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
    if (sessionStorage.getItem(RELOADED_KEY)) return;
    sessionStorage.setItem(RELOADED_KEY, "1");
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
  const url = new URL(window.location.href);
  url.searchParams.set("_v", Date.now().toString());
  window.location.replace(url.toString());
};

export const startVersionCheck = () => {
  if (typeof window === "undefined") return;
  if (import.meta.env.DEV) return;
  if (isInIframe || isPreviewHost()) return;

  // Capture initial signature from the currently loaded document.
  const initial = extractSignature(document.documentElement.outerHTML);
  if (!initial) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, initial);
  } catch {}

  let pendingSignature: string | null = null;

  const check = async () => {
    if (reloading) return;
    if (document.visibilityState !== "visible") return;
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
    if (stored === latest) {
      pendingSignature = null;
      return;
    }
    // Confirm the change twice before reloading (avoids CDN/race flicker).
    if (pendingSignature !== latest) {
      pendingSignature = latest;
      return;
    }
    triggerReload();
  };

  window.setInterval(check, POLL_INTERVAL_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void check();
  });
};
