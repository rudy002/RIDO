import type { SupabaseClient } from '@supabase/supabase-js';

/*
 * Mises à jour en direct (Supabase Realtime). Le serveur prévient l'appli quand une ligne change
 * dans une table publiée (supabase/migrations) :
 * - ajout ou modification : seulement si l'utilisateur a le droit de voir la ligne (règles d'accès) ;
 * - suppression : sans filtre, avec l'identifiant seul (rien de personnel). L'appli ignore celles
 *   qui ne concernent rien de ce qu'elle connaît.
 */

export const LIVE_TABLES = [
  'events',
  'participants',
  'driver_legs',
  'passenger_legs',
  'bookings',
] as const;

/** Un changement sur le serveur : à relire (`changed`), ou une ligne supprimée (`deleted`). */
export type LiveChange = { kind: 'changed' } | { kind: 'deleted'; id: string | null };

export type LiveHandlers = {
  onChange: (change: LiveChange) => void;
  /** Abonnement (re)établi : des changements ont pu être manqués pendant la coupure. */
  onConnected: () => void;
};

function deletedId(old: unknown): string | null {
  if (typeof old !== 'object' || old === null || !('id' in old)) return null;
  return typeof old.id === 'string' ? old.id : null;
}

/** S'abonne aux changements ; renvoie de quoi se désabonner. */
export function subscribeToChanges(client: SupabaseClient, handlers: LiveHandlers): () => void {
  // Un nom propre à chaque abonnement : se réabonner (nouveau compte) ne réutilise pas l'ancien.
  const channel = client.channel(`rido-live-${Date.now().toString(36)}`);
  for (const table of LIVE_TABLES) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
      handlers.onChange(
        payload.eventType === 'DELETE'
          ? { kind: 'deleted', id: deletedId(payload.old) }
          : { kind: 'changed' }
      );
    });
  }
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') handlers.onConnected();
  });
  return () => {
    void client.removeChannel(channel);
  };
}
