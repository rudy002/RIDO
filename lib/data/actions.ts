import { eventSlug, uniqueSlug } from '@/lib/events/slug';
import type { EventDraft } from '@/lib/events/types';
import type { CountryCode } from '@/lib/phone/phone';
import type { UserProfile } from '@/lib/profile/types';
import type { Booking, CarDraft, RideDraft, TripDirection } from '@/lib/rides/types';

import { emptyData } from './demo';
import { createId } from './ids';
import { myParticipant } from './selectors';
import type { AppData, DriverLegRecord, Participant, PassengerLegRecord } from './types';

/*
 * Actions sur les données : fonctions pures (données → nouvelles données), qui gardent tout cohérent.
 * Le serveur fera les mêmes opérations ; seul le stockage changera.
 */

/** Adresses déjà prises par d'autres écrans (/events/new…) : jamais utilisées comme lien d'événement. */
export const RESERVED_SLUGS = ['new', 'past'];

const DEFAULT_CAR_SEATS = 3;

export function createEvent(
  data: AppData,
  draft: EventDraft,
  country: CountryCode
): { data: AppData; eventId: string } {
  const id = uniqueSlug(
    eventSlug(draft.name),
    (slug) => RESERVED_SLUGS.includes(slug) || data.events.some((event) => event.id === slug)
  );
  const organizerName = data.profile
    ? `${data.profile.firstName} ${data.profile.lastName}`.trim() || undefined
    : undefined;
  return {
    eventId: id,
    data: {
      ...data,
      events: [
        ...data.events,
        {
          id,
          type: draft.type,
          title: draft.name,
          startsAt: draft.startsAt,
          endsAt: draft.endsAt,
          venue: draft.venue,
          country,
          directions: draft.directions,
          organizerId: data.userId,
          ...(organizerName ? { organizerName } : {}),
        },
      ],
    },
  };
}

/** Retire des trajets de conducteur ; leurs passagers repassent en recherche. */
function removeDriverLegs(data: AppData, legIds: string[]): AppData {
  if (legIds.length === 0) return data;
  return {
    ...data,
    driverLegs: data.driverLegs.filter((leg) => !legIds.includes(leg.id)),
    passengerLegs: data.passengerLegs.map((leg) =>
      leg.foundWith && legIds.includes(leg.foundWith) ? withoutFound(leg) : leg
    ),
  };
}

const withoutFound = ({ foundWith: _foundWith, ...leg }: PassengerLegRecord): PassengerLegRecord =>
  leg;

/** Retire la place qu'occupait un passager dans une voiture. */
function removeBookingOf(data: AppData, passengerLegId: string): AppData {
  return {
    ...data,
    driverLegs: data.driverLegs.map((leg) =>
      leg.bookings.some((booking) => booking.passengerLegId === passengerLegId)
        ? { ...leg, bookings: leg.bookings.filter((b) => b.passengerLegId !== passengerLegId) }
        : leg
    ),
  };
}

/** Retire des recherches de passager, et les places qu'elles occupaient. */
function removePassengerLegs(data: AppData, legIds: string[]): AppData {
  let next = data;
  for (const id of legIds) next = removeBookingOf(next, id);
  return { ...next, passengerLegs: next.passengerLegs.filter((leg) => !legIds.includes(leg.id)) };
}

/**
 * Inscription (ou modification) de l'utilisateur à un événement (I2). Changer de rôle ou de trajets
 * retire ce qui ne s'applique plus, sans perdre le reste (places déjà trouvées, voiture déjà publiée).
 */
export function joinEvent(data: AppData, eventId: string, registration: RideDraft): AppData {
  const existing = myParticipant(data, eventId);
  const participant: Participant = {
    id: existing?.id ?? createId('p'),
    eventId,
    userId: data.userId,
    firstName: registration.firstName.trim(),
    lastName: registration.lastName.trim(),
    phone: registration.phone,
    zone: registration.zone,
    role: registration.role,
    directions: registration.directions,
    partySize: registration.role === 'driver' ? 1 : registration.partySize,
  };

  let next: AppData = {
    ...data,
    participants: existing
      ? data.participants.map((p) => (p.id === existing.id ? participant : p))
      : [...data.participants, participant],
  };

  const myDriverLegs = next.driverLegs.filter((leg) => leg.participantId === participant.id);
  const myPassengerLegs = next.passengerLegs.filter((leg) => leg.participantId === participant.id);

  if (participant.role === 'passenger') {
    next = removeDriverLegs(
      next,
      myDriverLegs.map((leg) => leg.id)
    );
    next = removePassengerLegs(
      next,
      myPassengerLegs
        .filter((leg) => !participant.directions.includes(leg.direction))
        .map((leg) => leg.id)
    );
    const added = participant.directions
      .filter((direction) => !myPassengerLegs.some((leg) => leg.direction === direction))
      .map((direction): PassengerLegRecord => ({
        id: createId('s'),
        eventId,
        participantId: participant.id,
        direction,
      }));
    next = {
      ...next,
      passengerLegs: [...next.passengerLegs, ...added],
      // Le nombre de personnes a pu changer : les places déjà réservées suivent.
      driverLegs: next.driverLegs.map((leg) => ({
        ...leg,
        bookings: leg.bookings.map((booking) =>
          myPassengerLegs.some((own) => own.id === booking.passengerLegId)
            ? { ...booking, name: participant.firstName, seats: participant.partySize }
            : booking
        ),
      })),
    };
  } else {
    next = removePassengerLegs(
      next,
      myPassengerLegs.map((leg) => leg.id)
    );
    next = removeDriverLegs(
      next,
      myDriverLegs
        .filter((leg) => !participant.directions.includes(leg.direction))
        .map((leg) => leg.id)
    );
  }

  // Première inscription sans profil : on le crée, pour ne pas tout ressaisir la prochaine fois.
  if (!next.profile) {
    next = {
      ...next,
      profile: {
        firstName: participant.firstName,
        lastName: participant.lastName,
        phone: participant.phone,
        car: { model: '', seats: DEFAULT_CAR_SEATS, usualDeparture: participant.zone },
        notifications: { nearbyRequests: true, departureReminder: true },
      },
    };
  }
  return next;
}

/** Publication (ou modification) de sa voiture pour un événement (C2). Les places déjà prises restent. */
export function publishCar(data: AppData, eventId: string, draft: CarDraft): AppData {
  const me = myParticipant(data, eventId);
  if (!me || me.role !== 'driver') return data;
  const directions = (Object.keys(draft.legs) as TripDirection[]).filter((d) => draft.legs[d]);
  const mine = data.driverLegs.filter((leg) => leg.participantId === me.id);

  let next = removeDriverLegs(
    data,
    mine.filter((leg) => !directions.includes(leg.direction)).map((leg) => leg.id)
  );
  const legs: DriverLegRecord[] = directions.map((direction) => {
    const window = draft.legs[direction];
    const existing = mine.find((leg) => leg.direction === direction);
    return {
      id: existing?.id ?? createId('d'),
      eventId,
      participantId: me.id,
      direction,
      departure: window ? { from: window.from, to: window.to } : existing!.departure,
      totalSeats: draft.seats,
      bookings: existing?.bookings ?? [],
    };
  });
  next = {
    ...next,
    driverLegs: [...next.driverLegs.filter((leg) => leg.participantId !== me.id), ...legs],
    participants: next.participants.map((p) => (p.id === me.id ? { ...p, directions } : p)),
  };
  return next;
}

/** Le conducteur note ou libère des places (C3). Un passager dont la place disparaît recherche à nouveau. */
export function setBookings(data: AppData, legId: string, bookings: Booking[]): AppData {
  const leg = data.driverLegs.find((d) => d.id === legId);
  if (!leg) return data;
  const kept = new Set(bookings.map((booking) => booking.passengerLegId).filter(Boolean));
  const dropped = leg.bookings
    .map((booking) => booking.passengerLegId)
    .filter((id): id is string => Boolean(id) && !kept.has(id));
  return {
    ...data,
    driverLegs: data.driverLegs.map((d) => (d.id === legId ? { ...d, bookings } : d)),
    passengerLegs: data.passengerLegs.map((p) => (dropped.includes(p.id) ? withoutFound(p) : p)),
  };
}

/**
 * Le passager a trouvé sa place (P1) : dans la voiture d'un conducteur (sa place y est réservée),
 * ou autrement (`null`).
 */
export function markFound(
  data: AppData,
  eventId: string,
  direction: TripDirection,
  driverLegId: string | null
): AppData {
  const me = myParticipant(data, eventId);
  const leg = data.passengerLegs.find(
    (p) => p.participantId === me?.id && p.direction === direction
  );
  if (!me || !leg) return data;
  let next = removeBookingOf(data, leg.id);
  if (driverLegId) {
    const booking: Booking = {
      id: `booking-${leg.id}`,
      name: me.firstName,
      seats: me.partySize,
      passengerLegId: leg.id,
    };
    next = {
      ...next,
      driverLegs: next.driverLegs.map((d) =>
        d.id === driverLegId ? { ...d, bookings: [...d.bookings, booking] } : d
      ),
    };
  }
  return {
    ...next,
    passengerLegs: next.passengerLegs.map((p) =>
      p.id === leg.id ? { ...p, foundWith: driverLegId } : p
    ),
  };
}

/** Le passager cherche à nouveau (sa place réservée est libérée). */
export function searchAgain(data: AppData, eventId: string, direction: TripDirection): AppData {
  const me = myParticipant(data, eventId);
  const leg = data.passengerLegs.find(
    (p) => p.participantId === me?.id && p.direction === direction
  );
  if (!leg) return data;
  const next = removeBookingOf(data, leg.id);
  return {
    ...next,
    passengerLegs: next.passengerLegs.map((p) => (p.id === leg.id ? withoutFound(p) : p)),
  };
}

/** « Je ne peux plus conduire » (C3) : la voiture et l'inscription disparaissent, les passagers recherchent. */
export function cancelDriving(data: AppData, eventId: string): AppData {
  const me = myParticipant(data, eventId);
  if (!me) return data;
  const next = removeDriverLegs(
    data,
    data.driverLegs.filter((leg) => leg.participantId === me.id).map((leg) => leg.id)
  );
  return { ...next, participants: next.participants.filter((p) => p.id !== me.id) };
}

export function updateProfile(data: AppData, profile: UserProfile): AppData {
  return { ...data, profile };
}

/** « Se déconnecter » : sans compte, cela efface tout ce que cet appareil a enregistré. */
export function signOut(_data: AppData): AppData {
  return emptyData(createId('user'));
}

const shift = (date: Date, ms: number) => new Date(date.getTime() + ms);

/**
 * Modification d'un événement par l'organisateur. Les départs des conducteurs suivent le
 * changement d'horaire (aller : décalage du début ; retour : décalage de la fin) ; un trajet
 * retiré emporte ses inscriptions, et une personne qui n'a plus aucun trajet est désinscrite.
 */
export function updateEvent(data: AppData, eventId: string, draft: EventDraft): AppData {
  const event = data.events.find((e) => e.id === eventId);
  if (!event) return data;
  const startShift = draft.startsAt.getTime() - event.startsAt.getTime();
  const endShift = draft.endsAt.getTime() - event.endsAt.getTime();
  const removed = event.directions.filter((direction) => !draft.directions.includes(direction));

  let next: AppData = {
    ...data,
    events: data.events.map((e) =>
      e.id === eventId
        ? {
            ...e,
            type: draft.type,
            title: draft.name,
            venue: draft.venue,
            startsAt: draft.startsAt,
            endsAt: draft.endsAt,
            directions: draft.directions,
          }
        : e
    ),
    driverLegs: data.driverLegs.map((leg) => {
      if (leg.eventId !== eventId) return leg;
      const ms = leg.direction === 'outbound' ? startShift : endShift;
      if (ms === 0) return leg;
      const departure = leg.departure.to
        ? { from: shift(leg.departure.from, ms), to: shift(leg.departure.to, ms) }
        : { from: shift(leg.departure.from, ms) };
      return { ...leg, departure };
    }),
  };

  if (removed.length > 0) {
    const inEvent = <T extends { eventId: string; direction: TripDirection }>(leg: T) =>
      leg.eventId === eventId && removed.includes(leg.direction);
    next = removeDriverLegs(
      next,
      next.driverLegs.filter(inEvent).map((leg) => leg.id)
    );
    next = removePassengerLegs(
      next,
      next.passengerLegs.filter(inEvent).map((leg) => leg.id)
    );
    next = {
      ...next,
      participants: next.participants
        .map((p) =>
          p.eventId === eventId
            ? { ...p, directions: p.directions.filter((d) => !removed.includes(d)) }
            : p
        )
        .filter((p) => p.directions.length > 0),
    };
  }
  return next;
}

/** Nombre de personnes inscrites aux trajets qu'une modification retirerait (pour prévenir). */
export function registrationsLostBy(data: AppData, eventId: string, draft: EventDraft): number {
  const event = data.events.find((e) => e.id === eventId);
  if (!event) return 0;
  const removed = event.directions.filter((direction) => !draft.directions.includes(direction));
  return data.participants.filter(
    (p) => p.eventId === eventId && p.directions.some((d) => removed.includes(d))
  ).length;
}

/** Suppression d'un événement et de tout ce qui s'y rattache. */
export function deleteEvent(data: AppData, eventId: string): AppData {
  return {
    ...data,
    events: data.events.filter((e) => e.id !== eventId),
    participants: data.participants.filter((p) => p.eventId !== eventId),
    driverLegs: data.driverLegs.filter((leg) => leg.eventId !== eventId),
    passengerLegs: data.passengerLegs.filter((leg) => leg.eventId !== eventId),
  };
}
