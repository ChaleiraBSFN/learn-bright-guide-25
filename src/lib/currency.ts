// Preço do plano Buddy por moeda, escolhida a partir do idioma da interface.
// Valores fixos e arredondados (conversão aproximada de R$ 5,90).

export type PlanCurrency = 'BRL' | 'USD' | 'EUR' | 'JPY' | 'CNY';

type PlanPrice = {
  currency: PlanCurrency;
  amount: number;
  locale: string;
};

const LANG_PRICE: Record<string, PlanPrice> = {
  'pt-BR': { currency: 'BRL', amount: 5.9, locale: 'pt-BR' },
  en: { currency: 'USD', amount: 1.99, locale: 'en-US' },
  es: { currency: 'EUR', amount: 1.79, locale: 'es-ES' },
  fr: { currency: 'EUR', amount: 1.79, locale: 'fr-FR' },
  de: { currency: 'EUR', amount: 1.79, locale: 'de-DE' },
  it: { currency: 'EUR', amount: 1.79, locale: 'it-IT' },
  ja: { currency: 'JPY', amount: 300, locale: 'ja-JP' },
  zh: { currency: 'CNY', amount: 14.9, locale: 'zh-CN' },
  ru: { currency: 'USD', amount: 1.99, locale: 'ru-RU' },
};

export function getPlanPrice(lang?: string): PlanPrice {
  const normalized = !lang ? 'pt-BR' : lang === 'pt' ? 'pt-BR' : lang;
  return LANG_PRICE[normalized] ?? LANG_PRICE[normalized.split('-')[0]] ?? LANG_PRICE['pt-BR'];
}

export function formatPlanPrice(lang?: string): string {
  const { currency, amount, locale } = getPlanPrice(lang);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}
