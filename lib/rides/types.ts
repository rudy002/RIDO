import { z } from 'zod';

// Domaine central du covoiturage : indépendant de l'événement (cf. CLAUDE.md).

export const RIDE_ROLES = ['driver', 'passenger'] as const;
export type RideRole = (typeof RIDE_ROLES)[number];

export const TRIP_DIRECTIONS = ['outbound', 'return'] as const;
export type TripDirection = (typeof TRIP_DIRECTIONS)[number];

export type TimeWindow = { from: Date; to: Date };

/** Zone de départ et nombre de personnes qui y sont déjà inscrites. */
export type ZoneActivity = { zone: string; count: number };

/**
 * Zone de départ : un lieu de la base (ville ou quartier, identifiant GeoNames) pour pouvoir
 * mettre les gens en relation, ou une saisie libre (« Autre ») quand le lieu n'y est pas.
 */
export const zoneSchema = z.object({
  placeId: z.string().nullable(),
  name: z.string().trim().min(1),
});

export type Zone = z.infer<typeof zoneSchema>;

/** Ce qu'un participant déclare pour rejoindre un covoiturage. */
export const rideDraftSchema = z.object({
  role: z.enum(RIDE_ROLES),
  directions: z.array(z.enum(TRIP_DIRECTIONS)).min(1),
  zone: zoneSchema,
  lastName: z.string().trim().min(1),
  firstName: z.string().trim().min(1),
  /** Format international E.164 (« +972521234567 »), utilisable pour l'appel et WhatsApp. */
  phone: z.string().regex(/^\+\d{6,15}$/),
});

export type RideDraft = z.infer<typeof rideDraftSchema>;

/** Heure de départ : un créneau (« entre 18h00 et 18h30 ») ou une heure approximative (`to` absent). */
export type Departure = { from: Date; to?: Date };

/** Un trajet proposé par un conducteur, dans un sens donné. */
export type RideOffer = {
  id: string;
  direction: TripDirection;
  driver: {
    id: string;
    firstName: string;
    lastName: string;
    /** E.164 ; visible seulement des participants (contact direct). */
    phone: string;
  };
  /** Zone du conducteur : ville et, si connu, quartier. Jamais d'adresse exacte. */
  home: { city: string; area?: string };
  departure: Departure;
  /** Places passagers de la voiture, et combien restent libres. */
  seats: { total: number; free: number };
};

/** Un trajet vu par un passager : distance entre sa zone et celle du conducteur. */
export type RideMatch = {
  offer: RideOffer;
  /** En km ; absent quand le conducteur part de la même ville. */
  distanceKm?: number;
};

export const MIN_FREE_SEATS = 1;
export const MAX_FREE_SEATS = 8;

/** Ce qu'un conducteur publie : places libres et créneau de départ pour chaque sens choisi. */
export type CarDraft = {
  seats: number;
  legs: Partial<Record<TripDirection, TimeWindow>>;
};

/** Places réservées dans une voiture : par un passager (nommé) ou notées à la main par le conducteur. */
export type Booking = { id: string; name?: string; seats: number };

/** Un trajet vu par son conducteur : la voiture et qui y a une place. */
export type DriverLeg = {
  departure: Departure;
  totalSeats: number;
  bookings: Booking[];
};

/** Un passager qui cherche un trajet, dans un sens donné. */
export type RideRequest = {
  id: string;
  direction: TripDirection;
  passenger: { id: string; firstName: string; lastName: string; phone: string };
  home: { city: string; area?: string };
  /** Nombre de personnes à emmener (lui compris). */
  partySize: number;
};
