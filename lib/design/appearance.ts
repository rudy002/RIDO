import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

export const APPEARANCES = ['system', 'light', 'dark'] as const;
export type Appearance = (typeof APPEARANCES)[number];

const STORAGE_KEY = 'rido.appearance';

let current: Appearance = 'system';
const listeners = new Set<() => void>();

function isAppearance(value: string | null): value is Appearance {
  return APPEARANCES.some((appearance) => appearance === value);
}

function emit() {
  listeners.forEach((listener) => listener());
}

/** Lit le choix enregistré (au démarrage de l'appli). */
export async function loadAppearance(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (isAppearance(stored) && stored !== current) {
      current = stored;
      emit();
    }
  } catch {
    // Stockage indisponible : on garde « Automatique ».
  }
}

/** Automatique (suit le téléphone), clair ou sombre ; retenu pour les prochains lancements. */
export async function setAppearance(appearance: Appearance): Promise<void> {
  current = appearance;
  emit();
  await AsyncStorage.setItem(STORAGE_KEY, appearance);
}

/** Apparence choisie dans le profil. */
export function useAppearance(): Appearance {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
    () => current
  );
}
