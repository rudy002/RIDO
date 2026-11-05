import { I18nManager, Platform } from 'react-native';

import { isRTLLanguage, type Language } from './index';

/**
 * Aligne le sens de l'interface (RTL pour l'hébreu) sur la langue.
 * Sur iOS/Android, le changement de sens ne s'applique qu'au prochain lancement de l'appli.
 */
export function applyDirection(language: Language): void {
  const rtl = isRTLLanguage(language);

  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = rtl ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
    return;
  }

  I18nManager.allowRTL(rtl);
  if (I18nManager.isRTL !== rtl) I18nManager.forceRTL(rtl);
}
