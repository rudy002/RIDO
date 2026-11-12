import type { SupabaseClient } from '@supabase/supabase-js';

import { eventSlug } from '@/lib/events/slug';
import type { EventDraft } from '@/lib/events/types';
import type { CountryCode } from '@/lib/phone/phone';
import type { UserProfile } from '@/lib/profile/types';
import type { CarDraft, RideDraft, TripDirection } from '@/lib/rides/types';

import { toBackendError } from './errors';

/*
 * Les actions de l'appli, envoyées au serveur. Chacune appelle une fonction de la base
 * (supabase/migrations), qui vérifie les droits et les places : l'appli ne décide de rien seule.
 */

async function call<T = void>(
  client: SupabaseClient,
  fn: string,
  args: Record<string, unknown>
): Promise<T> {
  const { data, error } = await client.rpc(fn, args);
  if (error) throw toBackendError(error);
  return data as T;
}

/** Renvoie le lien (identifiant) choisi par le serveur. */
export function createEvent(
  client: SupabaseClient,
  draft: EventDraft,
  country: CountryCode,
  organizerName?: string
): Promise<string> {
  return call<string>(client, 'create_event', {
    p_slug_base: eventSlug(draft.name),
    p_type: draft.type,
    p_title: draft.name,
    p_starts_at: draft.startsAt.toISOString(),
    p_ends_at: draft.endsAt.toISOString(),
    p_venue: draft.venue,
    p_country: country,
    p_directions: draft.directions,
    p_organizer_name: organizerName ?? null,
  });
}

export function updateEvent(client: SupabaseClient, eventId: string, draft: EventDraft) {
  return call(client, 'update_event', {
    p_id: eventId,
    p_type: draft.type,
    p_title: draft.name,
    p_starts_at: draft.startsAt.toISOString(),
    p_ends_at: draft.endsAt.toISOString(),
    p_venue: draft.venue,
    p_directions: draft.directions,
  });
}

export function deleteEvent(client: SupabaseClient, eventId: string) {
  return call(client, 'delete_event', { p_id: eventId });
}

export function joinEvent(client: SupabaseClient, eventId: string, draft: RideDraft) {
  return call<string>(client, 'join_event', {
    p_event_id: eventId,
    p_first_name: draft.firstName.trim(),
    p_last_name: draft.lastName.trim(),
    p_phone: draft.phone,
    // Saisie libre : pas d'identifiant de lieu.
    p_zone_place_id: draft.zone.placeId ?? '',
    p_zone_name: draft.zone.name,
    p_role: draft.role,
    p_directions: draft.directions,
    p_party_size: draft.role === 'driver' ? 1 : draft.partySize,
  });
}

export function publishCar(client: SupabaseClient, eventId: string, draft: CarDraft) {
  const legs: Partial<Record<TripDirection, { from: string; to: string }>> = {};
  for (const direction of ['outbound', 'return'] as const) {
    const window = draft.legs[direction];
    if (window) legs[direction] = { from: window.from.toISOString(), to: window.to.toISOString() };
  }
  return call(client, 'publish_car', { p_event_id: eventId, p_seats: draft.seats, p_legs: legs });
}

export function takeSeat(client: SupabaseClient, legId: string) {
  return call(client, 'take_seat', { p_leg_id: legId });
}

export function releaseSeat(client: SupabaseClient, legId: string) {
  return call(client, 'release_seat', { p_leg_id: legId });
}

/** `driverLegId` : la voiture où le passager a sa place ; `null` : trouvée autrement. */
export function markFound(
  client: SupabaseClient,
  eventId: string,
  direction: TripDirection,
  driverLegId: string | null
) {
  return call(client, 'mark_found', {
    p_event_id: eventId,
    p_direction: direction,
    p_driver_leg_id: driverLegId,
  });
}

export function searchAgain(client: SupabaseClient, eventId: string, direction: TripDirection) {
  return call(client, 'search_again', { p_event_id: eventId, p_direction: direction });
}

export function cancelDriving(client: SupabaseClient, eventId: string) {
  return call(client, 'cancel_driving', { p_event_id: eventId });
}

export async function saveProfile(client: SupabaseClient, userId: string, profile: UserProfile) {
  const { error } = await client.from('profiles').upsert({
    user_id: userId,
    first_name: profile.firstName.trim(),
    last_name: profile.lastName.trim(),
    phone: profile.phone,
    car_model: profile.car.model,
    car_seats: profile.car.seats,
    usual_zone_place_id: profile.car.usualDeparture?.placeId ?? null,
    usual_zone_name: profile.car.usualDeparture?.name ?? null,
    notify_nearby: profile.notifications.nearbyRequests,
    notify_reminder: profile.notifications.departureReminder,
  });
  if (error) throw toBackendError(error);
}

/** Ce téléphone reçoit les notifications de ce compte, dans cette langue. */
export function registerPushToken(client: SupabaseClient, token: string, language: string) {
  return call(client, 'register_push_token', { p_token: token, p_language: language });
}

/** Efface le compte de cet appareil et tout ce qui lui est lié (« Se déconnecter »). */
export function deleteAccount(client: SupabaseClient) {
  return call(client, 'delete_my_account', {});
}
