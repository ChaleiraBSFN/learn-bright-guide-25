import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ptBR from './locales/pt-BR.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ja from './locales/ja.json';
import zh from './locales/zh.json';
import ru from './locales/ru.json';
import de from './locales/de.json';
import it from './locales/it.json';

const resources = {
  'pt-BR': { translation: ptBR },
  'en': { translation: en },
  'es': { translation: es },
  'fr': { translation: fr },
  'ja': { translation: ja },
  'zh': { translation: zh },
  'ru': { translation: ru },
  'de': { translation: de },
  'it': { translation: it },
};

// Get saved language or default to pt-BR
const savedLanguage = typeof window !== 'undefined' 
  ? localStorage.getItem('i18nextLng') || 'pt-BR'
  : 'pt-BR';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'pt-BR',
    interpolation: {
      escapeValue: false,
    },
  });

// Sync HTML lang attribute when language changes
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  localStorage.setItem('i18nextLng', lng);
});

// Set initial lang
if (typeof window !== 'undefined') {
  document.documentElement.lang = savedLanguage;
}

export default i18n;