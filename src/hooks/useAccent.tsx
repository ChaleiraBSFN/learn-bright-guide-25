import { useCallback, useEffect, useState } from 'react';

export interface AccentPreset {
  key: string;
  label: string;
  primary: string;
  accent: string;
  swatch: string;
}

const KEY = 'lb_accent';

export const ACCENT_PRESETS: AccentPreset[] = [
  { key: 'default', label: 'Learn Buddy', primary: '', accent: '', swatch: 'hsl(215 85% 45%)' },
  { key: 'teal', label: 'Teal', primary: '178 72% 36%', accent: '168 76% 42%', swatch: 'hsl(178 72% 36%)' },
  { key: 'violet', label: 'Violeta', primary: '265 72% 52%', accent: '292 76% 56%', swatch: 'hsl(265 72% 52%)' },
  { key: 'amber', label: 'Âmbar', primary: '32 92% 46%', accent: '45 94% 50%', swatch: 'hsl(32 92% 46%)' },
  { key: 'rose', label: 'Rosé', primary: '345 78% 48%', accent: '12 84% 54%', swatch: 'hsl(345 78% 48%)' },
  { key: 'emerald', label: 'Esmeralda', primary: '158 72% 36%', accent: '142 70% 42%', swatch: 'hsl(158 72% 36%)' },
];

export const applyAccent = (key: string) => {
  const preset = ACCENT_PRESETS.find((p) => p.key === key) ?? ACCENT_PRESETS[0];
  const root = document.documentElement;
  if (!preset.primary) {
    root.style.removeProperty('--primary');
    root.style.removeProperty('--accent');
    root.style.removeProperty('--ring');
    return;
  }
  root.style.setProperty('--primary', preset.primary);
  root.style.setProperty('--accent', preset.accent);
  root.style.setProperty('--ring', preset.primary);
};

export const useAccent = () => {
  const [accent, setAccentState] = useState<string>(() => localStorage.getItem(KEY) || 'default');

  useEffect(() => {
    applyAccent(accent);
    localStorage.setItem(KEY, accent);
  }, [accent]);

  const setAccent = useCallback((key: string) => setAccentState(key), []);
  const resetAccent = useCallback(() => setAccentState('default'), []);

  return { accent, setAccent, resetAccent };
};

if (typeof window !== 'undefined') {
  try {
    applyAccent(localStorage.getItem(KEY) || 'default');
  } catch {
    /* ignore */
  }
}
