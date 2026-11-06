import type { CountryCode } from '@/lib/phone/phone';
import { addMinutes } from '@/lib/rides/time-slots';

import { eventSlug, uniqueSlug } from './slug';
import type { EventDraft, EventSummary } from './types';

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
const MOCK_EVENTS: Record<string, EventSummary> = { [DEMO_EVENT.id]: DEMO_EVENT };

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
