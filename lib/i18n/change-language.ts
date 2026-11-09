import i18n, { detectLanguage, type Language } from './index';
import { saveLanguageOverride } from './language-override';

/** Change la langue de l'appli et la retient. `null` : revenir à la langue du téléphone. */
export async function changeAppLanguage(choice: Language | null): Promise<void> {
  await saveLanguageOverride(choice);
  await i18n.changeLanguage(choice ?? detectLanguage());
}

/** Nom de chaque langue dans sa propre langue, comme dans tous les sélecteurs de langue. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  fr: 'Français',
  en: 'English',
  he: 'עברית',
};
