import * as remote from '@/lib/backend/remote';
import type { EventDraft } from '@/lib/events/types';
import type { CountryCode } from '@/lib/phone/phone';
import type { UserProfile } from '@/lib/profile/types';
import type { Booking, CarDraft, RideDraft, TripDirection } from '@/lib/rides/types';

import * as actions from './actions';
import { eraseAccount, getAppData, isBackendConnected, perform, updateAppData } from './store';

/*
 * Ce que les écrans font : chaque action s'affiche aussitôt (lib/data/actions) et part au serveur
 * (lib/backend/remote). Elles renvoient `false` (ou `null`) si le serveur a refusé : la raison est
 * déjà signalée à l'utilisateur (useSyncError), l'écran n'a plus qu'à ne pas avancer.
 */

const succeeded = (task: Promise<unknown>): Promise<boolean> =>
  task.then(
    () => true,
    () => false
  );

const fullName = ({ firstName, lastName }: UserProfile) =>
  `${firstName} ${lastName}`.trim() || undefined;

/** Renvoie le lien (identifiant) de l'événement créé. */
export async function createEvent(draft: EventDraft, country: CountryCode): Promise<string | null> {
  const data = getAppData();
  if (!isBackendConnected()) {
    const created = actions.createEvent(data, draft, country);
    updateAppData(() => created.data);
    return created.eventId;
  }
  const organizerName = data.profile ? fullName(data.profile) : undefined;
  try {
    // Le lien vient du serveur : rien à afficher avant sa réponse.
    const id = await perform(
      (current) => current,
      (client) => remote.createEvent(client, draft, country, organizerName)
    );
    return id ?? null;
  } catch {
    return null;
  }
}

export function updateEvent(eventId: string, draft: EventDraft): Promise<boolean> {
  return succeeded(
    perform(
      (data) => actions.updateEvent(data, eventId, draft),
      (client) => remote.updateEvent(client, eventId, draft)
    )
  );
}

export function deleteEvent(eventId: string): Promise<boolean> {
  return succeeded(
    perform(
      (data) => actions.deleteEvent(data, eventId),
      (client) => remote.deleteEvent(client, eventId)
    )
  );
}

/** Inscription (ou modification). La première fois, le profil est aussi gardé pour la suite. */
export function joinEvent(eventId: string, draft: RideDraft): Promise<boolean> {
  const before = getAppData();
  const newProfile = before.profile ? null : actions.joinEvent(before, eventId, draft).profile;
  return succeeded(
    perform(
      (data) => actions.joinEvent(data, eventId, draft),
      async (client, userId) => {
        await remote.joinEvent(client, eventId, draft);
        // Le profil n'est qu'une commodité : son échec ne remet pas l'inscription en cause.
        if (newProfile) await remote.saveProfile(client, userId, newProfile).catch(() => undefined);
      }
    )
  );
}

export function publishCar(eventId: string, draft: CarDraft): Promise<boolean> {
  return succeeded(
    perform(
      (data) => actions.publishCar(data, eventId, draft),
      (client) => remote.publishCar(client, eventId, draft)
    )
  );
}

/**
 * Le conducteur note ou libère des places : `after` est la liste voulue (lib/rides/bookings). Le
 * serveur applique la même règle de libération que l'appli.
 */
export function changeSeats(legId: string, before: Booking[], after: Booking[]): Promise<boolean> {
  const beforeIds = new Set(before.map((booking) => booking.id));
  const afterIds = new Set(after.map((booking) => booking.id));
  const released = before.filter((booking) => !afterIds.has(booking.id)).length;
  const taken = after.filter((booking) => !beforeIds.has(booking.id)).length;
  return succeeded(
    perform(
      (data) => actions.setBookings(data, legId, after),
      async (client) => {
        for (let i = 0; i < released; i += 1) await remote.releaseSeat(client, legId);
        for (let i = 0; i < taken; i += 1) await remote.takeSeat(client, legId);
      }
    )
  );
}

export function markFound(
  eventId: string,
  direction: TripDirection,
  driverLegId: string | null
): Promise<boolean> {
  return succeeded(
    perform(
      (data) => actions.markFound(data, eventId, direction, driverLegId),
      (client) => remote.markFound(client, eventId, direction, driverLegId)
    )
  );
}

export function searchAgain(eventId: string, direction: TripDirection): Promise<boolean> {
  return succeeded(
    perform(
      (data) => actions.searchAgain(data, eventId, direction),
      (client) => remote.searchAgain(client, eventId, direction)
    )
  );
}

export function cancelDriving(eventId: string): Promise<boolean> {
  return succeeded(
    perform(
      (data) => actions.cancelDriving(data, eventId),
      (client) => remote.cancelDriving(client, eventId)
    )
  );
}

export function updateProfile(profile: UserProfile): Promise<boolean> {
  return succeeded(
    perform(
      (data) => actions.updateProfile(data, profile),
      (client, userId) => remote.saveProfile(client, userId, profile)
    )
  );
}

/** « Se déconnecter » : sans compte, cela efface tout ce qui concerne cet appareil. */
export async function signOut(): Promise<boolean> {
  if (!isBackendConnected()) {
    updateAppData(actions.signOut);
    return true;
  }
  return succeeded(eraseAccount());
}
