// Données de démonstration à date fixe, pour les tests des écrans.
import { buildDemoData, DEMO_EVENT_ID } from '../demo';
import {
  driverLegsOf,
  eventById,
  eventOverview,
  eventSummary,
  matchesFor,
  myParticipant,
  nearbyRequests,
  organizedEvents,
  participantById,
  passengerStatusOf,
  tripsOf,
} from '../selectors';

/** Lundi 2 juin 2025 : le mariage de la démo tombe le samedi 14 juin. */
export const NOW = new Date(2025, 5, 2, 10, 0);
export const DEMO = buildDemoData(NOW);

const wedding = eventById(DEMO, DEMO_EVENT_ID)!;

export const WEDDING = eventSummary(DEMO, wedding, 'fr');
export const WEDDING_OVERVIEW = eventOverview(DEMO, wedding, 'fr');

/** P1 vu par Esther (Ashdod, 2 personnes). */
const esther = participantById(DEMO, 'p-esther')!;
export const ESTHER = { firstName: esther.firstName, zone: 'Rova Gimel, Ashdod', partySize: 2 };
export const ESTHER_MATCHES = matchesFor(DEMO, esther, 'fr');
export const ESTHER_STATUS = passengerStatusOf(DEMO, esther);

/** C3 vu par David. */
const david = myParticipant(DEMO, DEMO_EVENT_ID)!;
export const DAVID_LEGS = driverLegsOf(DEMO, david);
export const DAVID_REQUESTS = nearbyRequests(DEMO, david, 'fr');

export const TRIPS = tripsOf(DEMO, NOW);
export const ORGANIZED = organizedEvents(DEMO, NOW, 'fr');
