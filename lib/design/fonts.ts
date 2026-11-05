import {
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import {
  Rubik_600SemiBold,
  Rubik_700Bold,
  Rubik_800ExtraBold,
  Rubik_900Black,
} from '@expo-google-fonts/rubik';

import type { Language } from '@/lib/i18n';

import { fonts } from './tokens';

/** Fichiers de police à charger au démarrage (useFonts). */
export const FONT_ASSETS = {
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  Rubik_600SemiBold,
  Rubik_700Bold,
  Rubik_800ExtraBold,
  Rubik_900Black,
};

type FontWeightKey = keyof typeof fonts;

/** Rubik pour l'hébreu, mêmes graisses que Nunito (600 à 900). */
const RUBIK: Record<FontWeightKey, string> = {
  semibold: 'Rubik_600SemiBold',
  bold: 'Rubik_700Bold',
  extrabold: 'Rubik_800ExtraBold',
  black: 'Rubik_900Black',
};

export function fontsFor(language: Language): Record<FontWeightKey, string> {
  return language === 'he' ? RUBIK : fonts;
}

/**
 * Remplace, dans un objet de styles, chaque `fontFamily` Nunito par la police de la langue.
 * Permet de garder `tokens.ts` comme source unique sans y dupliquer chaque style.
 */
export function withLanguageFonts<T>(styles: T, language: Language): T {
  const target = fontsFor(language);
  if (target === fonts) return styles;

  const replacements = new Map<string, string>(
    (Object.keys(fonts) as FontWeightKey[]).map((weight) => [fonts[weight], target[weight]])
  );

  const visit = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(visit);
    if (value === null || typeof value !== 'object') return value;
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        key === 'fontFamily' && typeof entry === 'string'
          ? (replacements.get(entry) ?? entry)
          : visit(entry),
      ])
    );
  };

  return visit(styles) as T;
}
