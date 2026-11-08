import { z } from 'zod';

import { EVENT_TYPES } from '@/lib/events/types';
import { isCountryCode } from '@/lib/phone/phone';
import { RIDE_ROLES, TRIP_DIRECTIONS, zoneSchema } from '@/lib/rides/types';

/*
 * Données de l'appli, enregistrées sur l'appareil en attendant le serveur.
 * Le serveur reprendra exactement ces enregistrements ; les écrans ne lisent que les sélecteurs.
 */

const direction = z.enum(TRIP_DIRECTIONS);
const date = z.coerce.date();

export const storedEventSchema = z.object({
  id: z.string(),
  type: z.enum(EVENT_TYPES),
  title: z.string(),
  startsAt: date,
  endsAt: date,
  venue: z.string(),
  country: z.string().refine(isCountryCode),
  directions: z.array(direction).min(1),
  /** Utilisateur qui a créé l'événement. */
  organizerId: z.string(),
  organizerName: z.string().optional(),
});

/** Une personne inscrite au covoiturage d'un événement (une inscription par personne et par événement). */
export const participantSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  userId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  /** E.164. */
  phone: z.string(),
  zone: zoneSchema,
  role: z.enum(RIDE_ROLES),
  directions: z.array(direction).min(1),
  partySize: z.number().int().min(1),
});

const bookingSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  seats: z.number().int().min(1),
  passengerLegId: z.string().optional(),
});

/** Un trajet proposé par un conducteur, dans un sens. */
export const driverLegSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  participantId: z.string(),
  direction,
  departure: z.object({ from: date, to: date.optional() }),
  totalSeats: z.number().int().min(1),
  bookings: z.array(bookingSchema),
});

/** La recherche d'un passager, dans un sens. */
export const passengerLegSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  participantId: z.string(),
  direction,
  /**
   * Trajet (`DriverLegRecord`) où il a trouvé sa place ; `null` : place trouvée autrement
   * (ami, taxi…) ; absent : il cherche encore.
   */
  foundWith: z.string().nullable().optional(),
});

export const profileSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  car: z.object({
    model: z.string(),
    seats: z.number().int().min(1),
    usualDeparture: zoneSchema.nullable(),
  }),
  notifications: z.object({ nearbyRequests: z.boolean(), departureReminder: z.boolean() }),
});

export const DATA_VERSION = 1;

export const appDataSchema = z.object({
  version: z.literal(DATA_VERSION),
  /** Identifiant de l'utilisateur de cet appareil (sans compte pour l'instant). */
  userId: z.string(),
  profile: profileSchema.nullable(),
  events: z.array(storedEventSchema),
  participants: z.array(participantSchema),
  driverLegs: z.array(driverLegSchema),
  passengerLegs: z.array(passengerLegSchema),
});

export type StoredEvent = z.infer<typeof storedEventSchema>;
export type Participant = z.infer<typeof participantSchema>;
export type DriverLegRecord = z.infer<typeof driverLegSchema>;
export type PassengerLegRecord = z.infer<typeof passengerLegSchema>;
export type AppData = z.infer<typeof appDataSchema>;
