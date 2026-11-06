import AsyncStorage from '@react-native-async-storage/async-storage';
import { DevSettings, I18nManager, Platform } from 'react-native';

import { isRTLLanguage, type Language } from './index';

const LAST_ATTEMPT_KEY = 'rido.directionReloadAt';
/** Pas deux rechargements à moins de 15 s d'intervalle : évite une boucle si le sens ne s'applique pas. */
const RETRY_DELAY_MS = 15_000;

/** Le sens d'affichage (gauche-droite / droite-gauche) ne correspond pas encore à la langue. */
export function directionMismatch(language: Language): boolean {
  return Platform.OS !== 'web' && I18nManager.isRTL !== isRTLLanguage(language);
}

/**
 * Recharge l'appli pour appliquer le sens d'affichage, si c'est possible ici.
 * En développement (Expo Go) : rechargement immédiat. Dans l'appli publiée, ce mécanisme reste
 * à valider au premier build (rechargement via expo-updates, ou simple redémarrage manuel).
 * Renvoie `false` si l'utilisateur doit fermer et rouvrir l'appli lui-même.
 */
export async function reloadForDirection(): Promise<boolean> {
  if (!__DEV__) return false;
  const last = Number(await AsyncStorage.getItem(LAST_ATTEMPT_KEY));
  if (Date.now() - last < RETRY_DELAY_MS) return false;
  await AsyncStorage.setItem(LAST_ATTEMPT_KEY, String(Date.now()));
  DevSettings.reload();
  return true;
}
