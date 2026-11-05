import type { EventSummary } from './types';

// Données d'exemple (maquettes I1 et I2), en attendant le backend.
export const DEMO_EVENT: EventSummary = {
  id: 'demo',
  type: 'wedding',
  title: 'Léa et Samuel',
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
};

const MOCK_EVENTS: Record<string, EventSummary> = { [DEMO_EVENT.id]: DEMO_EVENT };

export function findMockEvent(id: string): EventSummary | undefined {
  return MOCK_EVENTS[id];
}
