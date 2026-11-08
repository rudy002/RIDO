import { eventHighlights, type OrganizedEvent } from '@/lib/events/highlights';
import type {
  DirectionOverview,
  EventSummary,
  UnmatchedGuest,
  ZoneDemand,
} from '@/lib/events/types';
import type { Language } from '@/lib/i18n';
import { freeSeats } from '@/lib/rides/bookings';
import {
  TRIP_DIRECTIONS,
  type DriverLeg,
  type RideMatch,
  type RideOffer,
  type RideRequest,
  type TripDirection,
  type ZoneActivity,
} from '@/lib/rides/types';
import type { PassengerLeg, Trip } from '@/lib/trips/types';

import { cityKeyOf, describeZone, isNearby, relateZones } from './matching';
import type {
  AppData,
  DriverLegRecord,
  Participant,
  PassengerLegRecord,
  StoredEvent,
} from './types';

/** Le créneau conseillé pour l'aller : l'heure et demie avant le début. */
const OUTBOUND_LEAD_MS = 90 * 60_000;

export function eventById(data: AppData, id: string): StoredEvent | undefined {
  return data.events.find((event) => event.id === id);
}

export function participantById(data: AppData, id: string): Participant | undefined {
  return data.participants.find((participant) => participant.id === id);
}

/** L'inscription de l'utilisateur de cet appareil à un événement, s'il y en a une. */
export function myParticipant(data: AppData, eventId: string): Participant | undefined {
  return data.participants.find(
    (participant) => participant.eventId === eventId && participant.userId === data.userId
  );
}

export function isOrganizer(data: AppData, event: StoredEvent): boolean {
  return event.organizerId === data.userId;
}

/** Sens réellement concernés : ceux de l'inscription, parmi ceux que l'organisateur a ouverts. */
export function directionsOf(event: StoredEvent, participant?: Participant): TripDirection[] {
  return TRIP_DIRECTIONS.filter(
    (direction) =>
      event.directions.includes(direction) &&
      (!participant || participant.directions.includes(direction))
  );
}

const driverLegsOfEvent = (data: AppData, eventId: string, direction?: TripDirection) =>
  data.driverLegs.filter(
    (leg) => leg.eventId === eventId && (!direction || leg.direction === direction)
  );

const passengerLegsOfEvent = (data: AppData, eventId: string, direction?: TripDirection) =>
  data.passengerLegs.filter(
    (leg) => leg.eventId === eventId && (!direction || leg.direction === direction)
  );

const freeSeatsOf = (leg: DriverLegRecord) => freeSeats(leg.bookings, leg.totalSeats);
const isSearching = (leg: PassengerLegRecord) => leg.foundWith === undefined;

/** Ce qu'un invité voit d'un événement (I1, I2, O2…), chiffres calculés sur les inscriptions. */
export function eventSummary(data: AppData, event: StoredEvent, language: Language): EventSummary {
  const participants = data.participants.filter((participant) => participant.eventId === event.id);
  const firstDirection = TRIP_DIRECTIONS.find((direction) => event.directions.includes(direction));

  const zones = new Map<string, ZoneActivity>();
  for (const participant of participants) {
    const key = cityKeyOf(participant.zone);
    const zone = zones.get(key) ?? {
      zone: describeZone(participant.zone, language).city,
      count: 0,
    };
    zone.count += participant.partySize;
    zones.set(key, zone);
  }

  return {
    id: event.id,
    type: event.type,
    title: event.title,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    venue: event.venue,
    country: event.country,
    organizerName: event.organizerName,
    seatsOffered: firstDirection
      ? driverLegsOfEvent(data, event.id, firstDirection).reduce(
          (sum, leg) => sum + leg.totalSeats,
          0
        )
      : 0,
    guestsCount: participants.reduce((sum, participant) => sum + participant.partySize, 0),
    outboundWindow: {
      from: new Date(event.startsAt.getTime() - OUTBOUND_LEAD_MS),
      to: event.startsAt,
    },
    returnAround: event.endsAt,
    activeZones: [...zones.values()].sort(
      (a, b) => b.count - a.count || a.zone.localeCompare(b.zone)
    ),
    directions: event.directions,
  };
}

/** Un trajet de conducteur, tel qu'un passager le voit (P1, T). */
export function offerView(
  data: AppData,
  leg: DriverLegRecord,
  language: Language
): RideOffer | undefined {
  const driver = participantById(data, leg.participantId);
  if (!driver) return undefined;
  return {
    id: leg.id,
    direction: leg.direction,
    driver: {
      id: driver.id,
      firstName: driver.firstName,
      lastName: driver.lastName,
      phone: driver.phone,
    },
    home: describeZone(driver.zone, language),
    departure: leg.departure,
    seats: { total: leg.totalSeats, free: freeSeatsOf(leg) },
  };
}

/** Le trajet du même conducteur dans l'autre sens, s'il le fait. */
export function otherLegOf(data: AppData, leg: DriverLegRecord): DriverLegRecord | undefined {
  return data.driverLegs.find(
    (other) => other.participantId === leg.participantId && other.direction !== leg.direction
  );
}

/**
 * Conducteurs utiles à un passager (P1) : de sa ville ou d'une ville voisine, plus ceux qu'on ne
 * peut pas situer (saisie libre) ; même ville d'abord, puis du plus proche au plus loin.
 */
export function matchesFor(data: AppData, passenger: Participant, language: Language): RideMatch[] {
  const matches: (RideMatch & { order: number })[] = [];
  for (const leg of driverLegsOfEvent(data, passenger.eventId)) {
    if (leg.participantId === passenger.id || !passenger.directions.includes(leg.direction))
      continue;
    const driver = participantById(data, leg.participantId);
    const offer = offerView(data, leg, language);
    if (!driver || !offer) continue;
    const relation = relateZones(passenger.zone, driver.zone);
    if (!isNearby(relation) && !relation.unknown) continue;
    matches.push({
      offer,
      sameCity: relation.sameCity,
      ...(relation.distanceKm !== undefined ? { distanceKm: relation.distanceKm } : {}),
      order: relation.sameCity ? 0 : (relation.distanceKm ?? Number.MAX_SAFE_INTEGER),
    });
  }
  return matches
    .sort(
      (a, b) =>
        a.order - b.order || a.offer.departure.from.getTime() - b.offer.departure.from.getTime()
    )
    .map(({ order: _order, ...match }) => match);
}

/** Où en est la recherche d'un passager, sens par sens (P1, A1). */
export function passengerStatusOf(
  data: AppData,
  passenger: Participant
): Partial<Record<TripDirection, PassengerLeg & { legId: string; offerId?: string }>> {
  const status: Partial<Record<TripDirection, PassengerLeg & { legId: string; offerId?: string }>> =
    {};
  for (const leg of data.passengerLegs) {
    if (leg.participantId !== passenger.id) continue;
    if (leg.foundWith === undefined) {
      status[leg.direction] = { legId: leg.id, found: false };
      continue;
    }
    const offerLeg = leg.foundWith
      ? data.driverLegs.find((d) => d.id === leg.foundWith)
      : undefined;
    const driver = offerLeg ? participantById(data, offerLeg.participantId) : undefined;
    status[leg.direction] = {
      legId: leg.id,
      found: true,
      ...(offerLeg ? { offerId: offerLeg.id, departure: offerLeg.departure } : {}),
      ...(driver ? { driver: { firstName: driver.firstName, lastName: driver.lastName } } : {}),
    };
  }
  return status;
}

/** Les trajets d'un conducteur, sens par sens (C3). */
export function driverLegsOf(
  data: AppData,
  driver: Participant
): Partial<Record<TripDirection, DriverLegRecord>> {
  const legs: Partial<Record<TripDirection, DriverLegRecord>> = {};
  for (const leg of data.driverLegs) {
    if (leg.participantId === driver.id) legs[leg.direction] = leg;
  }
  return legs;
}

/** Passagers qui cherchent encore, près de chez le conducteur (C3), les plus proches d'abord. */
export function nearbyRequests(
  data: AppData,
  driver: Participant,
  language: Language
): RideRequest[] {
  const requests: (RideRequest & { order: number })[] = [];
  for (const leg of passengerLegsOfEvent(data, driver.eventId)) {
    if (!isSearching(leg) || leg.participantId === driver.id) continue;
    const passenger = participantById(data, leg.participantId);
    if (!passenger) continue;
    const relation = relateZones(driver.zone, passenger.zone);
    if (!isNearby(relation) && !relation.unknown) continue;
    requests.push({
      id: leg.id,
      direction: leg.direction,
      passenger: {
        id: passenger.id,
        firstName: passenger.firstName,
        lastName: passenger.lastName,
        phone: passenger.phone,
      },
      home: describeZone(passenger.zone, language),
      partySize: passenger.partySize,
      order: relation.sameCity ? 0 : (relation.distanceKm ?? Number.MAX_SAFE_INTEGER),
    });
  }
  return requests.sort((a, b) => a.order - b.order).map(({ order: _order, ...request }) => request);
}

/**
 * Vue de l'organisateur (O3), sens par sens. « Sans solution » : un passager qui cherche encore et
 * pour qui aucun conducteur de sa ville ou d'une ville voisine n'a assez de places libres.
 */
export function eventOverview(
  data: AppData,
  event: StoredEvent,
  language: Language
): Partial<Record<TripDirection, DirectionOverview>> {
  const overview: Partial<Record<TripDirection, DirectionOverview>> = {};

  for (const direction of directionsOf(event)) {
    const legs = driverLegsOfEvent(data, event.id, direction);
    const searching = passengerLegsOfEvent(data, event.id, direction).filter(isSearching);
    const zones = new Map<string, ZoneDemand>();
    const zoneOf = (participant: Participant) => {
      const key = cityKeyOf(participant.zone);
      const zone = zones.get(key) ?? {
        zone: describeZone(participant.zone, language).city,
        seats: 0,
        requests: 0,
      };
      zones.set(key, zone);
      return zone;
    };

    for (const leg of legs) {
      const driver = participantById(data, leg.participantId);
      if (driver) zoneOf(driver).seats += freeSeatsOf(leg);
    }

    const unmatched: UnmatchedGuest[] = [];
    for (const leg of searching) {
      const passenger = participantById(data, leg.participantId);
      if (!passenger) continue;
      zoneOf(passenger).requests += passenger.partySize;
      const solvable = legs.some((driverLeg) => {
        const driver = participantById(data, driverLeg.participantId);
        return (
          driver !== undefined &&
          driver.id !== passenger.id &&
          freeSeatsOf(driverLeg) >= passenger.partySize &&
          isNearby(relateZones(passenger.zone, driver.zone))
        );
      });
      if (!solvable) {
        unmatched.push({
          id: leg.id,
          participantId: passenger.id,
          name: `${passenger.firstName} ${passenger.lastName}`,
          city: describeZone(passenger.zone, language).city,
          partySize: passenger.partySize,
          phone: passenger.phone,
        });
      }
    }

    overview[direction] = {
      drivers: legs.length,
      freeSeats: legs.reduce((sum, leg) => sum + freeSeatsOf(leg), 0),
      unmatched,
      // Les demandes d'abord : c'est là que l'organisateur peut agir.
      zones: [...zones.values()].sort(
        (a, b) => b.requests - a.requests || b.seats - a.seats || a.zone.localeCompare(b.zone)
      ),
    };
  }
  return overview;
}

/** Les trajets de l'utilisateur, à venir (du plus proche) et passés (du plus récent) (A1). */
export function tripsOf(data: AppData, now: Date): { upcoming: Trip[]; past: Trip[] } {
  const trips: { trip: Trip; event: StoredEvent }[] = [];
  for (const participant of data.participants) {
    if (participant.userId !== data.userId) continue;
    const event = eventById(data, participant.eventId);
    if (!event) continue;
    const context = { kind: event.type, title: event.title, startsAt: event.startsAt };

    if (participant.role === 'driver') {
      const legs: Partial<Record<TripDirection, DriverLeg>> = {};
      for (const [direction, leg] of Object.entries(driverLegsOf(data, participant)) as [
        TripDirection,
        DriverLegRecord,
      ][]) {
        legs[direction] = {
          departure: leg.departure,
          totalSeats: leg.totalSeats,
          bookings: leg.bookings,
        };
      }
      trips.push({ event, trip: { id: event.id, context, role: 'driver', legs } });
    } else {
      const status = passengerStatusOf(data, participant);
      const legs: Partial<Record<TripDirection, PassengerLeg>> = {};
      for (const direction of directionsOf(event, participant)) {
        const leg = status[direction];
        legs[direction] = leg
          ? { found: leg.found, departure: leg.departure, driver: leg.driver }
          : { found: false };
      }
      trips.push({ event, trip: { id: event.id, context, role: 'passenger', legs } });
    }
  }

  const isPast = ({ event }: { event: StoredEvent }) => event.endsAt.getTime() < now.getTime();
  const byStart = (a: { event: StoredEvent }, b: { event: StoredEvent }) =>
    a.event.startsAt.getTime() - b.event.startsAt.getTime();
  return {
    upcoming: trips
      .filter((t) => !isPast(t))
      .sort(byStart)
      .map(({ trip }) => trip),
    past: trips
      .filter(isPast)
      .sort((a, b) => byStart(b, a))
      .map(({ trip }) => trip),
  };
}

/** Les événements que l'utilisateur organise, à venir et terminés (A2). */
export function organizedEvents(
  data: AppData,
  now: Date,
  language: Language
): { upcoming: OrganizedEvent[]; past: OrganizedEvent[] } {
  const events = data.events
    .filter((event) => isOrganizer(data, event))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    .map((event) => {
      const summary = eventSummary(data, event, language);
      return {
        event: summary,
        highlights: eventHighlights(summary, eventOverview(data, event, language)),
      };
    });
  const isPast = ({ event }: OrganizedEvent) => event.endsAt.getTime() < now.getTime();
  return { upcoming: events.filter((e) => !isPast(e)), past: events.filter(isPast).reverse() };
}
