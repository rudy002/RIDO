import type { EventType } from '@/lib/events/types';
import type { Departure, DriverLeg, TripDirection } from '@/lib/rides/types';

/**
 * Un trajet de l'utilisateur, dans son contexte (aujourd'hui un événement).
 * Le trajet reste du domaine « rides » ; le contexte n'est qu'une étiquette autour.
 */
export type TripContext = { kind: EventType; title: string; startsAt: Date };

/** Côté passager : avec qui il part, ou rien tant qu'il cherche encore. */
export type PassengerLeg = {
  departure?: Departure;
  driver?: { firstName: string; lastName: string };
};

export type Trip =
  | {
      id: string;
      context: TripContext;
      role: 'driver';
      legs: Partial<Record<TripDirection, DriverLeg>>;
    }
  | {
      id: string;
      context: TripContext;
      role: 'passenger';
      legs: Partial<Record<TripDirection, PassengerLeg>>;
    };
