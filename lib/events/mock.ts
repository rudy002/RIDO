import type { CountryCode } from '@/lib/phone/phone';
import { addMinutes } from '@/lib/rides/time-slots';

import { eventSlug, uniqueSlug } from './slug';
import type { DirectionOverview, EventDraft, EventSummary } from './types';
import type { TripDirection } from '@/lib/rides/types';

// Données d'exemple (maquettes I1 et I2), en attendant le backend.
export const DEMO_EVENT: EventSummary = {
  id: 'demo',
  type: 'wedding',
  title: 'Mariage de Léa et Samuel',
  startsAt: new Date(2025, 5, 14, 19, 30),
  endsAt: new Date(2025, 5, 15, 1, 0),
  venue: 'Domaine des Oliviers',
  country: 'IL',
  organizerName: 'Léa Cohen',
  seatsOffered: 14,
  guestsCount: 23,
  outboundWindow: { from: new Date(2025, 5, 14, 18, 0), to: new Date(2025, 5, 14, 19, 30) },
  returnAround: new Date(2025, 5, 15, 1, 0),
  activeZones: [
    { zone: 'Ashdod', count: 5 },
    { zone: 'Tel-Aviv', count: 8 },
    { zone: 'Yavne', count: 1 },
  ],
  directions: ['outbound', 'return'],
};

// En mémoire seulement : un événement créé disparaît au redémarrage de l'appli (pas encore de serveur).
// Second événement d'exemple, où tout le monde a déjà un trajet (maquette A2).
export const DEMO_EVENT_ALL_SET: EventSummary = {
  id: 'eitan',
  type: 'barMitzvah',
  title: 'Bar mitzvah d’Eitan',
  startsAt: new Date(2025, 6, 5, 18, 0),
  endsAt: new Date(2025, 6, 5, 23, 0),
  venue: 'Salle Ha-Tamar',
  country: 'IL',
  seatsOffered: 6,
  guestsCount: 8,
  outboundWindow: { from: new Date(2025, 6, 5, 16, 30), to: new Date(2025, 6, 5, 18, 0) },
  returnAround: new Date(2025, 6, 5, 23, 0),
  activeZones: [{ zone: 'Ashdod', count: 4 }],
  directions: ['outbound', 'return'],
};

const MOCK_EVENTS: Record<string, EventSummary> = {
  [DEMO_EVENT.id]: DEMO_EVENT,
  [DEMO_EVENT_ALL_SET.id]: DEMO_EVENT_ALL_SET,
};

/** Créneau conseillé pour l'aller : l'heure et demie avant le début. */
const OUTBOUND_LEAD_MINUTES = 90;

export function findMockEvent(id: string): EventSummary | undefined {
  return MOCK_EVENTS[id];
}

/** Enregistre un événement créé par l'organisateur (O1) et lui donne un identifiant de lien. */
export function createMockEvent(draft: EventDraft, country: CountryCode): EventSummary {
  const id = uniqueSlug(eventSlug(draft.name), (slug) => slug in MOCK_EVENTS);
  const event: EventSummary = {
    id,
    type: draft.type,
    title: draft.name,
    startsAt: draft.startsAt,
    endsAt: draft.endsAt,
    venue: draft.venue,
    country,
    seatsOffered: 0,
    guestsCount: 0,
    outboundWindow: {
      from: addMinutes(draft.startsAt, -OUTBOUND_LEAD_MINUTES),
      to: draft.startsAt,
    },
    returnAround: draft.endsAt,
    activeZones: [],
    directions: draft.directions,
  };
  MOCK_EVENTS[id] = event;
  return event;
}

// Données d'exemple du tableau de bord organisateur (maquette O3).
export const DEMO_OVERVIEW: Record<TripDirection, DirectionOverview> = {
  outbound: {
    drivers: 6,
    freeSeats: 14,
    unmatched: [
      { id: 'paul', name: 'Paul Amsellem', city: 'Ashkelon', partySize: 1, phone: '+972528901234' },
      {
        id: 'sarah-d',
        name: 'Sarah Dahan',
        city: 'Ashkelon',
        partySize: 2,
        phone: '+972549012345',
      },
      {
        id: 'michael',
        name: 'Michaël Ohana',
        city: 'Kiryat Gat',
        partySize: 1,
        phone: '+972500123456',
      },
    ],
    zones: [
      { zone: 'Ashdod', seats: 6, requests: 3 },
      { zone: 'Tel-Aviv', seats: 8, requests: 5 },
      { zone: 'Ashkelon', seats: 0, requests: 3 },
    ],
  },
  return: {
    drivers: 5,
    freeSeats: 11,
    unmatched: [],
    zones: [
      { zone: 'Ashdod', seats: 5, requests: 2 },
      { zone: 'Tel-Aviv', seats: 6, requests: 4 },
      { zone: 'Ashkelon', seats: 2, requests: 2 },
    ],
  },
};

/** Événements créés sur cet appareil (démo comprise). */
export function countMockEvents(): number {
  return Object.keys(MOCK_EVENTS).length;
}

const ALL_SET_OVERVIEW: DirectionOverview = {
  drivers: 2,
  freeSeats: 2,
  unmatched: [],
  zones: [{ zone: 'Ashdod', seats: 6, requests: 4 }],
};

const EMPTY_OVERVIEW: DirectionOverview = { drivers: 0, freeSeats: 0, unmatched: [], zones: [] };

/** Chiffres d'un événement ; vides pour un événement tout juste créé. */
export function overviewOf(id: string): Record<TripDirection, DirectionOverview> {
  if (id === DEMO_EVENT.id) return DEMO_OVERVIEW;
  if (id === DEMO_EVENT_ALL_SET.id) return { outbound: ALL_SET_OVERVIEW, return: ALL_SET_OVERVIEW };
  return { outbound: EMPTY_OVERVIEW, return: EMPTY_OVERVIEW };
}

/** Les événements que l'utilisateur organise (sur cet appareil), du plus proche au plus lointain. */
export function listMockEvents(): EventSummary[] {
  return Object.values(MOCK_EVENTS).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

export const DEMO_PAST_EVENTS_COUNT = 2;
