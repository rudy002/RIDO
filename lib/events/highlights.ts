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
  const unmatched = legs.reduce((sum, leg) => sum + leg.unmatched.length, 0);
  return {
    status: event.guestsCount > 0 && unmatched === 0 ? 'allSet' : 'needs',
    freeSeats: legs[0]?.freeSeats ?? 0,
    unmatched,
  };
}
