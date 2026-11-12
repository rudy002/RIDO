import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useSyncExternalStore } from 'react';

import { BackendError, toBackendError, type BackendErrorKind } from '@/lib/backend/errors';
import type { LiveChange, LiveHandlers } from '@/lib/backend/realtime';
import { deleteAccount } from '@/lib/backend/remote';
import { fetchEventPreview, fetchServerData } from '@/lib/backend/sync';

import { buildDemoData, DEMO_USER_ID, emptyData } from './demo';
import { appDataSchema, type AppData } from './types';

/*
 * Les données de l'appli, en mémoire, avec une copie sur l'appareil (AsyncStorage : fichier sur
 * mobile, localStorage sur le web) pour s'ouvrir tout de suite, même sans réseau.
 *
 * Avec le serveur (`connectBackend`) : il fait foi. Chaque action s'affiche aussitôt à l'écran, part
 * au serveur, puis les données sont relues ; si le serveur refuse, l'écran revient à la vérité du
 * serveur et la raison est signalée (`useSyncError`). Les changements faits par les autres arrivent
 * en direct (lib/backend/realtime.ts) et déclenchent une relecture.
 * Sans serveur (tests, développement hors ligne) : tout reste sur l'appareil, avec la démo.
 */

const STORAGE_KEY = 'rido.data';
const SAVE_DELAY_MS = 200;
/** Au-delà, une relecture est abandonnée (réseau bloqué) : la suivante pourra repartir. */
const REFRESH_TIMEOUT_MS = 20_000;

function withTimeout<T>(task: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new BackendError('offline', 'refresh timed out')),
      REFRESH_TIMEOUT_MS
    );
  });
  return Promise.race([task, timeout]).finally(() => clearTimeout(timer));
}

/** Ce que les données utilisent du serveur (lib/backend/supabase.ts). */
export type Backend = {
  user(): Promise<{ client: SupabaseClient; userId: string }>;
  forget(): Promise<void>;
  /** Mises à jour en direct ; renvoie de quoi se désabonner. */
  subscribe(handlers: LiveHandlers): () => void;
};

/** Plusieurs changements rapprochés (une réservation touche plusieurs tables) : une seule relecture. */
const LIVE_REFRESH_DELAY_MS = 300;
let stopLive: (() => void) | null = null;
let liveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleLiveRefresh(): void {
  if (liveTimer) clearTimeout(liveTimer);
  liveTimer = setTimeout(() => {
    liveTimer = null;
    void refresh().catch(() => undefined);
  }, LIVE_REFRESH_DELAY_MS);
}

/** Une ligne que l'appareil connaît (seules ses suppressions le concernent). */
function isKnown(id: string): boolean {
  return (
    current.events.some((event) => event.id === id) ||
    current.participants.some((participant) => participant.id === id) ||
    current.passengerLegs.some((leg) => leg.id === id) ||
    current.driverLegs.some(
      (leg) => leg.id === id || leg.bookings.some((booking) => booking.id === id)
    )
  );
}

function onLiveChange(change: LiveChange): void {
  if (change.kind === 'deleted' && change.id !== null && !isKnown(change.id)) return;
  scheduleLiveRefresh();
}

/** (Ré)abonne l'appareil aux changements du serveur, pour le compte actuel. */
function startLiveUpdates(server: Backend): void {
  stopLiveUpdates();
  stopLive = server.subscribe({ onChange: onLiveChange, onConnected: scheduleLiveRefresh });
}

function stopLiveUpdates(): void {
  stopLive?.();
  stopLive = null;
  if (liveTimer) clearTimeout(liveTimer);
  liveTimer = null;
}

type Remote<T> = (client: SupabaseClient, userId: string) => Promise<T>;

let backend: Backend | null = null;
let current: AppData = buildDemoData();
let syncError: BackendErrorKind | null = null;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;
/** Actions envoyées au serveur et pas encore confirmées. */
let pendingActions = 0;
let refreshing: Promise<void> | null = null;
let refreshAgain = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function save(): Promise<void> {
  saveTimer = null;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Stockage plein ou indisponible : les données restent en mémoire pour cette session.
  }
}

function setData(data: AppData): void {
  current = data;
  emit();
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void save(), SAVE_DELAY_MS);
}

/** Relie les données au serveur (au démarrage, avant `loadAppData`). `null` : sans serveur. */
export function connectBackend(next: Backend | null): void {
  stopLiveUpdates();
  backend = next;
}

export function isBackendConnected(): boolean {
  return backend !== null;
}

async function readStored(): Promise<AppData | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = appDataSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Au démarrage : la copie enregistrée s'affiche tout de suite. Avec le serveur, elle est ensuite
 * relue en arrière-plan (jamais la démo) ; sans serveur, la démo est installée la première fois.
 */
export async function loadAppData(now: Date = new Date()): Promise<void> {
  const stored = await readStored();
  if (backend) {
    current = stored && stored.userId !== DEMO_USER_ID ? stored : emptyData('');
    emit();
    void refresh().catch(() => undefined);
    startLiveUpdates(backend);
    return;
  }
  current = stored ?? buildDemoData(now);
  emit();
  if (!stored) await save();
}

/**
 * Relit tout ce que l'utilisateur voit sur le serveur. Pendant qu'une action est en route, la
 * relecture attend la fin de l'action (sinon elle effacerait ce qui vient de s'afficher).
 */
export function refresh(): Promise<void> {
  const server = backend;
  if (!server) return Promise.resolve();
  if (refreshing) {
    refreshAgain = true;
    return refreshing;
  }
  refreshing = (async () => {
    try {
      do {
        refreshAgain = false;
        const data = await withTimeout(
          server
            .user()
            .then(({ client, userId }) => fetchServerData(client, userId, current.previews))
        );
        if (backend !== server) return;
        // Une relecture plus récente a été demandée, ou une action est en route : ces données
        // sont peut-être déjà dépassées, on ne les affiche pas.
        if (!refreshAgain && pendingActions === 0) setData(data);
      } while (refreshAgain);
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/**
 * Une action : `local` l'affiche aussitôt ; `remote` l'envoie au serveur. En cas de refus, la
 * raison est signalée, les données reviennent à celles du serveur, et l'erreur est relancée.
 * Sans serveur, seule `local` s'applique.
 */
export async function perform<T>(
  local: (data: AppData) => AppData,
  remote: Remote<T>
): Promise<T | undefined> {
  const before = current;
  setData(local(current));
  const server = backend;
  if (!server) return undefined;

  pendingActions += 1;
  let result: T;
  try {
    const { client, userId } = await server.user();
    result = await remote(client, userId);
  } catch (error) {
    pendingActions -= 1;
    const reason = toBackendError(error);
    reportSyncError(reason.kind);
    // La vérité du serveur ; sans réseau, ce qu'il y avait avant l'action.
    await refresh().catch(() => setData(before));
    throw reason;
  }
  pendingActions -= 1;
  await refresh().catch(() => undefined);
  return result;
}

/** Applique un changement sur l'appareil seulement (sans serveur, ou dans les tests). */
export function updateAppData(change: (data: AppData) => AppData): void {
  setData(change(current));
}

/**
 * L'aperçu d'un événement ouvert par un lien, où l'on n'est pas inscrit. `false` si le lien ne
 * mène à rien.
 */
export async function loadEventPreview(eventId: string): Promise<boolean> {
  const server = backend;
  if (!server) return false;
  try {
    const { client } = await server.user();
    const preview = await fetchEventPreview(client, eventId);
    if (!preview) return false;
    setData({
      ...current,
      previews: [...current.previews.filter((p) => p.event.id !== eventId), preview],
    });
    return true;
  } catch (error) {
    reportSyncError(toBackendError(error).kind);
    return false;
  }
}

/**
 * « Se déconnecter » : efface le compte sur le serveur et tout ce que l'appareil garde ; un nouveau
 * compte invisible est créé pour la suite.
 */
export async function eraseAccount(): Promise<void> {
  const server = backend;
  if (!server) return;
  try {
    const { client } = await server.user();
    await deleteAccount(client);
    await server.forget();
  } catch (error) {
    const reason = toBackendError(error);
    reportSyncError(reason.kind);
    throw reason;
  }
  setData(emptyData(''));
  await refresh().catch(() => undefined);
  // Nouveau compte : l'abonnement repart avec lui.
  startLiveUpdates(server);
}

export function getAppData(): AppData {
  return current;
}

/** Enregistre tout de suite (avant un rechargement de l'appli, dans les tests). */
export async function flushAppData(): Promise<void> {
  if (saveTimer) clearTimeout(saveTimer);
  await save();
}

/** Remet les données de démonstration (outil de développement, sans serveur). */
export function resetDemoData(now: Date = new Date()): void {
  setData(buildDemoData(now));
}

/** Les données de l'appli ; l'écran se met à jour à chaque changement. */
export function useAppData(): AppData {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => current
  );
}

function reportSyncError(kind: BackendErrorKind): void {
  syncError = kind;
  emit();
}

export function dismissSyncError(): void {
  if (syncError === null) return;
  syncError = null;
  emit();
}

export function getSyncError(): BackendErrorKind | null {
  return syncError;
}

/** La raison du dernier refus du serveur, à expliquer à l'utilisateur (`null` : rien à signaler). */
export function useSyncError(): BackendErrorKind | null {
  return useSyncExternalStore(
    subscribe,
    () => syncError,
    () => syncError
  );
}
