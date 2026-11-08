import type { EventType } from '@/lib/events/types';
import type { Departure, DriverLeg, TripDirection } from '@/lib/rides/types';

/**
 * Un trajet de l'utilisateur, dans son contexte (aujourd'hui un événement).
 * Le trajet reste du domaine « rides » ; le contexte n'est qu'une étiquette autour.
 */
export type TripContext = { kind: EventType; title: string; startsAt: Date };

/** Côté passager : place trouvée (avec un conducteur de Rido ou autrement) ou encore en recherche. */
export type PassengerLeg = {
  found: boolean;
  departure?: Departure;
  driver?: { firstName: string; lastName: string };
};

export type Trip =
  | {
      /** Identifiant de l'événement : un trajet par événement et par personne. */
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
