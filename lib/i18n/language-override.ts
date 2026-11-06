import AsyncStorage from '@react-native-async-storage/async-storage';

import { isLanguage, type Language } from './index';

const STORAGE_KEY = 'rido.languageOverride';

/** Langue choisie à la main (outil de développement), prioritaire sur celle du téléphone. */
export async function loadLanguageOverride(): Promise<Language | null> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return isLanguage(value) ? value : null;
  } catch {
    return null;
  }
}

/** `null` : revenir à la langue du téléphone. */
export async function saveLanguageOverride(language: Language | null): Promise<void> {
  if (language) await AsyncStorage.setItem(STORAGE_KEY, language);
  else await AsyncStorage.removeItem(STORAGE_KEY);
}
