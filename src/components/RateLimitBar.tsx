import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

const STORAGE_KEY = "rate_limit_until";

/** Trigger the global rate-limit bar. `seconds` defaults to 60s (typical Gemini per-minute reset). */
export function triggerRateLimit(seconds = 60) {
  const until = Date.now() + seconds * 1000;
  localStorage.setItem(STORAGE_KEY, String(until));
  window.dispatchEvent(new CustomEvent("rate-limit-hit", { detail: { until } }));
}

export function RateLimitBar() {
  const [until, setUntil] = useState<number | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const ts = Number(stored);
    return ts > Date.now() ? ts : null;
  });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const onHit = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setUntil(detail.until);
    };
    window.addEventListener("rate-limit-hit", onHit);
    return () => window.removeEventListener("rate-limit-hit", onHit);
  }, []);

  useEffect(() => {
    if (!until) return;
    const id = setInterval(() => {
      const t = Date.now();
      if (t >= until) {
        localStorage.removeItem(STORAGE_KEY);
        setUntil(null);
      } else {
        setNow(t);
      }
    }, 200);
    return () => clearInterval(id);
  }, [until]);

  if (!until) return null;

  const remainingMs = Math.max(0, until - now);
  const remainingSec = Math.ceil(remainingMs / 1000);
  const totalMs = 60_000; // assumed window
  const pct = Math.min(100, (remainingMs / totalMs) * 100);

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] pointer-events-none">
      <div className="h-1.5 w-full bg-red-200 dark:bg-red-950">
        <div
          className="h-full bg-red-600 transition-[width] duration-200 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="pointer-events-auto mx-auto mt-1 flex w-fit items-center gap-2 rounded-b-lg border-2 border-red-600 bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
        <AlertTriangle className="h-3.5 w-3.5" />
        <span>
          Limite de requisições atingido — aguarde {remainingSec}s
        </span>
      </div>
    </div>
  );
}
