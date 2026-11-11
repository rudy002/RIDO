import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import type { AppData, EventPreview } from '@/lib/data/types';

import {
  bookingRowSchema,
  driverLegRowSchema,
  eventRowSchema,
  participantRowSchema,
  passengerLegRowSchema,
  previewRowSchema,
  profileRowSchema,
  toAppData,
  toEventPreview,
} from './rows';

/*
 * Lecture des données sur le serveur. Les règles d'accès de la base ne renvoient que ce que
 * l'utilisateur a le droit de voir : les événements qu'il organise ou où il est inscrit, et son
 * profil. On peut donc tout demander, sans filtre.
 */

/** Le serveur renvoie au plus 1000 lignes par demande : au-delà, on demande la suite. */
const PAGE_SIZE = 1000;

async function selectAll<T>(
  client: SupabaseClient,
  table: string,
  schema: z.ZodType<T>,
  /** Ordre stable, pour que les pages se suivent sans trou ni doublon. */
  key = 'id'
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from(table)
      .select('*')
      .order(key)
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...z.array(schema).parse(data));
    if (data.length < PAGE_SIZE) return rows;
  }
}

/** Tout ce que l'utilisateur voit, au format de l'appli. */
export async function fetchServerData(
  client: SupabaseClient,
  userId: string,
  previews: EventPreview[] = []
): Promise<AppData> {
  const [events, participants, driverLegs, passengerLegs, bookings, profiles] = await Promise.all([
    selectAll(client, 'events', eventRowSchema),
    selectAll(client, 'participants', participantRowSchema),
    selectAll(client, 'driver_legs', driverLegRowSchema),
    selectAll(client, 'passenger_legs', passengerLegRowSchema),
    selectAll(client, 'bookings', bookingRowSchema),
    selectAll(client, 'profiles', profileRowSchema, 'user_id'),
  ]);
  const profile = profiles.find((row) => row.user_id === userId) ?? null;
  return toAppData(
    { events, participants, driverLegs, passengerLegs, bookings, profile },
    userId,
    previews
  );
}

/** L'aperçu d'un événement pour qui a reçu le lien ; `null` si le lien ne mène à rien. */
export async function fetchEventPreview(
  client: SupabaseClient,
  eventId: string
): Promise<EventPreview | null> {
  const { data, error } = await client.rpc('event_preview', { p_id: eventId });
  if (error) throw error;
  return data === null ? null : toEventPreview(previewRowSchema.parse(data));
}
