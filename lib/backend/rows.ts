import { z } from 'zod';

import {
  appDataSchema,
  DATA_VERSION,
  eventPreviewSchema,
  type AppData,
  type EventPreview,
} from '@/lib/data/types';

/*
 * Lignes renvoyées par le serveur (supabase/migrations), et leur conversion vers les données de
 * l'appli (lib/data/types). Les dates restent du texte ici : le schéma de l'appli les convertit,
 * et refuse tout ce qui ne correspond pas à ce que les écrans attendent.
 */

const text = z.string();
const optionalText = z.string().nullable();
const count = z.number().int();

export const eventRowSchema = z.object({
  id: text,
  type: text,
  title: text,
  starts_at: text,
  ends_at: text,
  venue: text,
  country: text,
  directions: z.array(text),
  organizer_id: text,
  organizer_name: optionalText,
});

export const participantRowSchema = z.object({
  id: text,
  event_id: text,
  user_id: text,
  first_name: text,
  last_name: text,
  phone: text,
  zone_place_id: optionalText,
  zone_name: text,
  role: text,
  directions: z.array(text),
  party_size: count,
});

export const driverLegRowSchema = z.object({
  id: text,
  event_id: text,
  participant_id: text,
  direction: text,
  departure_from: text,
  departure_to: optionalText,
  total_seats: count,
});

export const passengerLegRowSchema = z.object({
  id: text,
  event_id: text,
  participant_id: text,
  direction: text,
  found_elsewhere: z.boolean(),
});

export const bookingRowSchema = z.object({
  id: text,
  event_id: text,
  driver_leg_id: text,
  passenger_leg_id: optionalText,
  name: optionalText,
  seats: count,
  created_at: text,
});

export const profileRowSchema = z.object({
  user_id: text,
  first_name: text,
  last_name: text,
  phone: text,
  car_model: text,
  car_seats: count,
  usual_zone_place_id: optionalText,
  usual_zone_name: optionalText,
  notify_nearby: z.boolean(),
  notify_reminder: z.boolean(),
});

/** Réponse de la fonction `event_preview`. */
export const previewRowSchema = z.object({
  id: text,
  type: text,
  title: text,
  starts_at: text,
  ends_at: text,
  venue: text,
  country: text,
  directions: z.array(text),
  organizer_name: optionalText,
  guests_count: count,
  seats_offered: count,
  zones: z.array(z.object({ place_id: text, count })),
});

export type EventRow = z.infer<typeof eventRowSchema>;
export type ParticipantRow = z.infer<typeof participantRowSchema>;
export type DriverLegRow = z.infer<typeof driverLegRowSchema>;
export type PassengerLegRow = z.infer<typeof passengerLegRowSchema>;
export type BookingRow = z.infer<typeof bookingRowSchema>;
export type ProfileRow = z.infer<typeof profileRowSchema>;
export type PreviewRow = z.infer<typeof previewRowSchema>;

/** Tout ce que l'utilisateur a le droit de voir, tel que le serveur le renvoie. */
export type ServerRows = {
  events: EventRow[];
  participants: ParticipantRow[];
  driverLegs: DriverLegRow[];
  passengerLegs: PassengerLegRow[];
  bookings: BookingRow[];
  profile: ProfileRow | null;
};

const byCreation = (a: BookingRow, b: BookingRow) =>
  Date.parse(a.created_at) - Date.parse(b.created_at) || a.id.localeCompare(b.id);

/**
 * Les données de l'appli à partir des lignes du serveur. Le serveur range les places réservées à
 * part (`bookings`) : elles rejoignent ici la voiture (`bookings` du trajet) et le passager
 * (`foundWith`). Les aperçus d'événements où l'on s'est inscrit depuis sont retirés.
 */
export function toAppData(
  rows: ServerRows,
  userId: string,
  previews: EventPreview[] = []
): AppData {
  const bookingsOfCar = new Map<string, BookingRow[]>();
  const bookingOfPassenger = new Map<string, BookingRow>();
  for (const booking of [...rows.bookings].sort(byCreation)) {
    bookingsOfCar.set(booking.driver_leg_id, [
      ...(bookingsOfCar.get(booking.driver_leg_id) ?? []),
      booking,
    ]);
    if (booking.passenger_leg_id) bookingOfPassenger.set(booking.passenger_leg_id, booking);
  }
  const memberOf = new Set(rows.events.map((event) => event.id));
  const profile = rows.profile;

  return appDataSchema.parse({
    version: DATA_VERSION,
    userId,
    profile: profile
      ? {
          firstName: profile.first_name,
          lastName: profile.last_name,
          phone: profile.phone,
          car: {
            model: profile.car_model,
            seats: profile.car_seats,
            usualDeparture: profile.usual_zone_name
              ? { placeId: profile.usual_zone_place_id, name: profile.usual_zone_name }
              : null,
          },
          notifications: {
            nearbyRequests: profile.notify_nearby,
            departureReminder: profile.notify_reminder,
          },
        }
      : null,
    events: rows.events.map((event) => ({
      id: event.id,
      type: event.type,
      title: event.title,
      startsAt: event.starts_at,
      endsAt: event.ends_at,
      venue: event.venue,
      country: event.country,
      directions: event.directions,
      organizerId: event.organizer_id,
      ...(event.organizer_name ? { organizerName: event.organizer_name } : {}),
    })),
    participants: rows.participants.map((participant) => ({
      id: participant.id,
      eventId: participant.event_id,
      userId: participant.user_id,
      firstName: participant.first_name,
      lastName: participant.last_name,
      phone: participant.phone,
      zone: { placeId: participant.zone_place_id, name: participant.zone_name },
      role: participant.role,
      directions: participant.directions,
      partySize: participant.party_size,
    })),
    driverLegs: rows.driverLegs.map((leg) => ({
      id: leg.id,
      eventId: leg.event_id,
      participantId: leg.participant_id,
      direction: leg.direction,
      departure: {
        from: leg.departure_from,
        ...(leg.departure_to ? { to: leg.departure_to } : {}),
      },
      totalSeats: leg.total_seats,
      bookings: (bookingsOfCar.get(leg.id) ?? []).map((booking) => ({
        id: booking.id,
        seats: booking.seats,
        ...(booking.name ? { name: booking.name } : {}),
        ...(booking.passenger_leg_id ? { passengerLegId: booking.passenger_leg_id } : {}),
      })),
    })),
    passengerLegs: rows.passengerLegs.map((leg) => {
      const booking = bookingOfPassenger.get(leg.id);
      return {
        id: leg.id,
        eventId: leg.event_id,
        participantId: leg.participant_id,
        direction: leg.direction,
        // Une place réservée : la voiture ; trouvée autrement : null ; sinon il cherche encore.
        ...(booking
          ? { foundWith: booking.driver_leg_id }
          : leg.found_elsewhere
            ? { foundWith: null }
            : {}),
      };
    }),
    previews: previews.filter((preview) => !memberOf.has(preview.event.id)),
  });
}

/** L'aperçu d'un événement (lien reçu, pas encore inscrit). */
export function toEventPreview(row: PreviewRow): EventPreview {
  return eventPreviewSchema.parse({
    event: {
      id: row.id,
      type: row.type,
      title: row.title,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      venue: row.venue,
      country: row.country,
      directions: row.directions,
      organizerId: '',
      ...(row.organizer_name ? { organizerName: row.organizer_name } : {}),
    },
    guestsCount: row.guests_count,
    seatsOffered: row.seats_offered,
    zones: row.zones.map((zone) => ({ placeId: zone.place_id, count: zone.count })),
  });
}
