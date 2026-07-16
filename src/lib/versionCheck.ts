// Auto-update checker: polls index.html and reloads when a new build is detected.
// Compares the built JS/CSS assets referenced by index.html to detect deploys.

const POLL_INTERVAL_MS = 5_000;
const STORAGE_KEY = "lb-build-signature";

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

  const check = async () => {
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
    if (stored !== latest) triggerReload();
  };

  window.setTimeout(check, 250);
  setInterval(check, POLL_INTERVAL_MS);
  window.addEventListener("focus", check);
  document.addEventListener("visibilitychange", check);
  window.addEventListener("pageshow", check);
  window.addEventListener("online", check);
};