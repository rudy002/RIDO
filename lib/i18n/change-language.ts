import { I18nManager, Platform } from 'react-native';

import i18n, { detectLanguage, isRTLLanguage, type Language } from './index';
import { saveLanguageOverride } from './language-override';
import { applyDirection } from './rtl';

/**
 * Change la langue de l'appli et la retient. `null` : revenir à la langue du téléphone.
 * Le passage vers ou depuis l'hébreu (droite à gauche) ne s'applique qu'au prochain lancement
 * sur iOS et Android : `needsRestart` le signale.
 */
export async function changeAppLanguage(
  choice: Language | null
): Promise<{ language: Language; needsRestart: boolean }> {
  const language = choice ?? detectLanguage();
  await saveLanguageOverride(choice);
  const needsRestart = Platform.OS !== 'web' && isRTLLanguage(language) !== I18nManager.isRTL;
  await i18n.changeLanguage(language);
  applyDirection(language);
  return { language, needsRestart };
}

/** Nom de chaque langue dans sa propre langue, comme dans tous les sélecteurs de langue. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  fr: 'Français',
  en: 'English',
  he: 'עברית',
};
