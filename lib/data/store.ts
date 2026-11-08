import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { buildDemoData } from './demo';
import { appDataSchema, type AppData } from './types';

/*
 * Stockage local des données (AsyncStorage : fichier sur mobile, localStorage sur le web).
 * Au premier lancement, la démo est installée ; ensuite, tout ce que l'utilisateur fait est gardé.
 */

const STORAGE_KEY = 'rido.data';
const SAVE_DELAY_MS = 200;

let current: AppData = buildDemoData();
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

async function save(): Promise<void> {
  saveTimer = null;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Stockage plein ou indisponible : les données restent en mémoire pour cette session.
  }
}

/** Lit les données enregistrées au démarrage ; installe la démo si rien n'est enregistré ou lisible. */
export async function loadAppData(now: Date = new Date()): Promise<void> {
  let loaded: AppData | null = null;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = appDataSchema.safeParse(JSON.parse(raw));
      if (parsed.success) loaded = parsed.data;
    }
  } catch {
    loaded = null;
  }
  current = loaded ?? buildDemoData(now);
  emit();
  if (!loaded) await save();
}

export function getAppData(): AppData {
  return current;
}

/** Applique une action et l'enregistre (regroupée si plusieurs changements se suivent). */
export function updateAppData(change: (data: AppData) => AppData): void {
  current = change(current);
  emit();
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void save(), SAVE_DELAY_MS);
}

/** Enregistre tout de suite (avant un rechargement de l'appli, dans les tests). */
export async function flushAppData(): Promise<void> {
  if (saveTimer) clearTimeout(saveTimer);
  await save();
}

/** Remet les données de démonstration (outil de développement). */
export function resetDemoData(now: Date = new Date()): void {
  updateAppData(() => buildDemoData(now));
}

/** Les données de l'appli ; l'écran se met à jour à chaque changement. */
export function useAppData(): AppData {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
    () => current
  );
}
