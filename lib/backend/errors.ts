import { isAuthRetryableFetchError } from '@supabase/supabase-js';

/**
 * Pourquoi une action n'a pas abouti, en termes que l'appli sait expliquer :
 * - `offline` : pas de connexion ;
 * - `full` : plus assez de places dans la voiture ;
 * - `gone` : l'événement ou le trajet n'existe plus (supprimé, modifié entre-temps) ;
 * - `unknown` : autre refus du serveur.
 */
export type BackendErrorKind = 'offline' | 'full' | 'gone' | 'unknown';

export class BackendError extends Error {
  constructor(
    readonly kind: BackendErrorKind,
    message: string
  ) {
    super(message);
    this.name = 'BackendError';
  }
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }
  return String(error);
}

// Messages des fonctions du serveur (supabase/migrations) et des navigateurs ou téléphones hors ligne.
const FULL = /not enough free seats|car is full/i;
const GONE =
  /event not found|ride not found|no such trip|not a (driver|passenger)|direction not offered/i;
const OFFLINE = /network request failed|failed to fetch|fetch failed|load failed|networkerror/i;

export function toBackendError(error: unknown): BackendError {
  if (error instanceof BackendError) return error;
  const message = messageOf(error);
  if (FULL.test(message)) return new BackendError('full', message);
  if (GONE.test(message)) return new BackendError('gone', message);
  if (isAuthRetryableFetchError(error) || OFFLINE.test(message)) {
    return new BackendError('offline', message);
  }
  return new BackendError('unknown', message);
}
