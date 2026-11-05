import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import fr from './locales/fr.json';
import he from './locales/he.json';

export const LANGUAGES = ['fr', 'he', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'fr';

const RTL_LANGUAGES: readonly Language[] = ['he'];

export function isLanguage(value: string | null | undefined): value is Language {
  return LANGUAGES.some((language) => language === value);
}

export function isRTLLanguage(language: Language): boolean {
  return RTL_LANGUAGES.includes(language);
}

/** Première langue du système prise en charge par l'appli, sinon le français. */
export function detectLanguage(): Language {
  const supported = getLocales()
    .map((locale) => locale.languageCode)
    .find(isLanguage);
  return supported ?? DEFAULT_LANGUAGE;
}

export function currentLanguage(): Language {
  return isLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;
}

export const resources = {
  fr: { translation: fr },
  he: { translation: he },
  en: { translation: en },
} as const;

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: detectLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: { escapeValue: false },
  });
}

export default i18n;
