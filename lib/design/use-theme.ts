import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';

import { isLanguage, isRTLLanguage, DEFAULT_LANGUAGE, type Language } from '@/lib/i18n';

import { useAppearance } from './appearance';
import { fontsFor, withLanguageFonts } from './fonts';
import { theme, type ColorScheme } from './tokens';

export type AppTheme = Omit<ReturnType<typeof theme>, 'fonts'> & {
  fonts: ReturnType<typeof fontsFor>;
  scheme: ColorScheme;
  language: Language;
  isRTL: boolean;
};

export function buildTheme(scheme: ColorScheme, language: Language): AppTheme {
  const base = theme(scheme);
  return {
    ...base,
    fonts: fontsFor(language),
    typography: withLanguageFonts(base.typography, language),
    components: withLanguageFonts(base.components, language),
    scheme,
    language,
    isRTL: isRTLLanguage(language),
  };
}

/** Thème actif : clair/sombre (choix du profil, sinon le système), police et sens selon la langue. */
export function useTheme(): AppTheme {
  const system: ColorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const appearance = useAppearance();
  const scheme: ColorScheme = appearance === 'system' ? system : appearance;
  const { i18n } = useTranslation();
  const language = isLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;

  return useMemo(() => buildTheme(scheme, language), [scheme, language]);
}
