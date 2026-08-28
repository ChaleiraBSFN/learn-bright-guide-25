import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ptBR from './locales/pt-BR.json';

/**
 * Only the default locale ships in the main bundle. The other 8 languages are
 * fetched on demand (first render in that language), which keeps the initial
 * JS payload small and the first paint fast.
 */
const loaders: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  en: () => import('./locales/en.json'),
  es: () => import('./locales/es.json'),
  fr: () => import('./locales/fr.json'),
  ja: () => import('./locales/ja.json'),
  zh: () => import('./locales/zh.json'),
  ru: () => import('./locales/ru.json'),
  de: () => import('./locales/de.json'),
  it: () => import('./locales/it.json'),
};

export const SUPPORTED_LANGUAGES = ['pt-BR', ...Object.keys(loaders)];

const savedLanguage =
  (typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : null) || 'pt-BR';

const initialLanguage = SUPPORTED_LANGUAGES.includes(savedLanguage) ? savedLanguage : 'pt-BR';

i18n.use(initReactI18next).init({
  resources: { 'pt-BR': { translation: ptBR } },
  lng: 'pt-BR',
  fallbackLng: 'pt-BR',
  interpolation: { escapeValue: false },
});

const loaded = new Set(['pt-BR']);

/** Loads a locale bundle once, then activates it. */
export const loadLanguage = async (lng: string) => {
  if (!loaded.has(lng) && loaders[lng]) {
    try {
      const mod = await loaders[lng]();
      i18n.addResourceBundle(lng, 'translation', mod.default, true, true);
      loaded.add(lng);
    } catch {
      return;
    }
  }
};

/** Ensures the bundle is present before switching, so no raw keys flash. */
export const changeLanguage = async (lng: string) => {
  await loadLanguage(lng);
  await i18n.changeLanguage(lng);
};

/** Resolves once the saved language is ready — awaited before the first render. */
export const i18nReady: Promise<void> =
  initialLanguage === 'pt-BR' ? Promise.resolve() : changeLanguage(initialLanguage).then(() => undefined);

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  localStorage.setItem('i18nextLng', lng);
});

if (typeof window !== 'undefined') {
  document.documentElement.lang = initialLanguage;
}

export default i18n;
