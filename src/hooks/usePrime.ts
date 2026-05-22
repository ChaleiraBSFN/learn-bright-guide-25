import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'lb_prime_state';
const PRIME_DURATION_MS = 10 * 60 * 1000; // 10 min
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 h
const EVENT_NAME = 'lb_prime_changed';

interface PrimeState {
  activatedAt: number; // ms
}

function read(): PrimeState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isPrimeActive(): boolean {
  const s = read();
  if (!s) return false;
  return Date.now() - s.activatedAt < PRIME_DURATION_MS;
}

export function usePrime() {
  const [now, setNow] = useState(Date.now());
  const [state, setState] = useState<PrimeState | null>(() => read());

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const sync = () => setState(read());
    const interval = setInterval(tick, 1000);
    window.addEventListener('storage', sync);
    window.addEventListener(EVENT_NAME, sync);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', sync);
      window.removeEventListener(EVENT_NAME, sync);
    };
  }, []);

  const activatedAt = state?.activatedAt ?? 0;
  const elapsed = now - activatedAt;
  const isActive = !!state && elapsed < PRIME_DURATION_MS;
  const activeRemainingMs = isActive ? PRIME_DURATION_MS - elapsed : 0;
  const cooldownRemainingMs =
    state && elapsed >= PRIME_DURATION_MS && elapsed < COOLDOWN_MS
      ? COOLDOWN_MS - elapsed
      : 0;
  const canActivate = !isActive && cooldownRemainingMs <= 0;

  const activate = useCallback(() => {
    if (!canActivate) return false;
    const next = { activatedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setState(next);
    window.dispatchEvent(new Event(EVENT_NAME));
    return true;
  }, [canActivate]);

  return {
    isActive,
    canActivate,
    activeRemainingMs,
    cooldownRemainingMs,
    activeProgress: isActive ? elapsed / PRIME_DURATION_MS : 0,
    activate,
    PRIME_DURATION_MS,
    COOLDOWN_MS,
  };
}

export function formatDuration(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
