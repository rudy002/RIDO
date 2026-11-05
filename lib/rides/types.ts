import { z } from 'zod';

// Domaine central du covoiturage : indépendant de l'événement (cf. CLAUDE.md).

export const RIDE_ROLES = ['driver', 'passenger'] as const;
export type RideRole = (typeof RIDE_ROLES)[number];

export const TRIP_DIRECTIONS = ['outbound', 'return'] as const;
export type TripDirection = (typeof TRIP_DIRECTIONS)[number];

export type TimeWindow = { from: Date; to: Date };

/** Zone de départ et nombre de personnes qui y sont déjà inscrites. */
export type ZoneActivity = { zone: string; count: number };

/** Ce qu'un participant déclare pour rejoindre un covoiturage. */
export const rideDraftSchema = z.object({
  role: z.enum(RIDE_ROLES),
  directions: z.array(z.enum(TRIP_DIRECTIONS)).min(1),
  zone: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  firstName: z.string().trim().min(1),
  /** Format international E.164 (« +972521234567 »), utilisable pour l'appel et WhatsApp. */
  phone: z.string().regex(/^\+\d{6,15}$/),
});

export type RideDraft = z.infer<typeof rideDraftSchema>;
