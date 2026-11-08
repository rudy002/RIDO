import { TRIP_DIRECTIONS, type TripDirection } from '@/lib/rides/types';

import type { DirectionOverview, EventSummary } from './types';

export type EventHighlights = {
  status: 'needs' | 'allSet';
  freeSeats: number;
  unmatched: number;
};

/**
 * Ce qu'une carte d'événement résume : les places libres du premier trajet organisé, et tous les
 * invités encore sans solution. « Tout est résolu » seulement s'il y a des inscrits et aucun en attente.
 */
export function eventHighlights(
  event: Pick<EventSummary, 'directions' | 'guestsCount'>,
  overview: Partial<Record<TripDirection, DirectionOverview>>
): EventHighlights {
  const legs = TRIP_DIRECTIONS.filter((direction) => event.directions.includes(direction))
    .map((direction) => overview[direction])
    .filter((leg): leg is DirectionOverview => leg !== undefined);
  // Des personnes, pas des trajets : sans solution à l'aller et au retour, on ne compte qu'une fois.
  const unmatched = new Set(
    legs.flatMap((leg) => leg.unmatched.map((guest) => guest.participantId))
  ).size;
  return {
    status: event.guestsCount > 0 && unmatched === 0 ? 'allSet' : 'needs',
    freeSeats: legs[0]?.freeSeats ?? 0,
    unmatched,
  };
}

/** Un événement qu'on organise, avec ce que sa carte résume (A2). */
export type OrganizedEvent = { event: EventSummary; highlights: EventHighlights };
