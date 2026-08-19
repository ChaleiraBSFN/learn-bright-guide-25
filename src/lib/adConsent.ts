export type AdConsent = 'personalized' | 'basic';

export const AD_CONSENT_KEY = 'lb-ad-consent';
export const AD_CONSENT_EVENT = 'lb-ad-consent-change';

export const getAdConsent = (): AdConsent | null => {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(AD_CONSENT_KEY);
    return value === 'personalized' || value === 'basic' ? value : null;
  } catch {
    return null;
  }
};

export const setAdConsent = (consent: AdConsent) => {
  try {
    window.localStorage.setItem(AD_CONSENT_KEY, consent);
  } catch {
    /* storage blocked */
  }

  if (consent === 'basic') {
    (window.adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = 1;
  }

  window.dispatchEvent(new CustomEvent(AD_CONSENT_EVENT, { detail: consent }));
};

/** Applies the stored choice to the AdSense queue before any ad request. */
export const applyAdConsent = () => {
  if (typeof window === 'undefined') return;
  if (getAdConsent() !== 'personalized') {
    (window.adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = 1;
  }
};

declare global {
  interface Window {
    adsbygoogle?: unknown[] & { requestNonPersonalizedAds?: number };
  }
}
