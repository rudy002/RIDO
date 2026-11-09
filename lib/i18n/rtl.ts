import { Platform } from 'react-native';

import { isRTLLanguage, type Language } from './index';

/** Sur le web, aligne aussi la page elle-même (`dir`, `lang`) sur la langue. */
export function applyDocumentDirection(language: Language): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  document.documentElement.dir = isRTLLanguage(language) ? 'rtl' : 'ltr';
  document.documentElement.lang = language;
}
