// Auto-update checker: polls index.html and reloads when a new build is detected.
// Compares the hashed JS entry referenced in <head> to detect deploys.

const POLL_INTERVAL_MS = 60_000; // 1 minute
const STORAGE_KEY = "lb-build-signature";

const extractSignature = (html: string): string | null => {
  // Match the hashed Vite entry script (e.g. /assets/index-ABC123.js) or any modulepreload/script with a hash.
  const matches = html.match(/\/assets\/[A-Za-z0-9_-]+\.[a-f0-9]{6,}\.(?:js|css)/g);
  if (!matches || matches.length === 0) return null;
  return Array.from(new Set(matches)).sort().join("|");
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

  setInterval(check, POLL_INTERVAL_MS);
  window.addEventListener("focus", check);
  document.addEventListener("visibilitychange", check);
};
