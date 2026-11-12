import { tripsOf } from '@/lib/data/selectors';
import type { AppData } from '@/lib/data/types';
import { TRIP_DIRECTIONS, type TripDirection } from '@/lib/rides/types';

/** Le rappel arrive une heure avant le départ. */
export const REMINDER_LEAD_MS = 60 * 60_000;

/** Un rappel « départ dans une heure » à programmer sur le téléphone. */
export type Reminder = {
  /** Stable d'une fois sur l'autre : reprogrammer remplace l'ancien rappel. */
  id: string;
  at: Date;
  departure: Date;
  eventTitle: string;
  direction: TripDirection;
  /** Conducteur du passager (absent pour le conducteur lui-même). */
  driverFirstName?: string;
  /** L'écran à ouvrir : sa voiture (conducteur) ou ses conducteurs (passager). */
  url: string;
};

/**
 * Les rappels à programmer : un par trajet à venir où l'heure de départ est connue (le conducteur
 * pour sa voiture, le passager qui a sa place chez un conducteur de Rido). Rien si l'utilisateur
 * a coupé les rappels dans son profil, ni pour un départ trop proche ou passé.
 */
export function remindersFor(data: AppData, now: Date): Reminder[] {
  if (data.profile && !data.profile.notifications.departureReminder) return [];
  const reminders: Reminder[] = [];
  for (const trip of tripsOf(data, now).upcoming) {
    for (const direction of TRIP_DIRECTIONS) {
      const leg = trip.legs[direction];
      const departure = leg?.departure?.from;
      if (!leg || !departure) continue;
      const at = new Date(departure.getTime() - REMINDER_LEAD_MS);
      if (at.getTime() <= now.getTime()) continue;
      const driver = trip.role === 'passenger' && 'driver' in leg ? leg.driver : undefined;
      reminders.push({
        id: `${trip.id}:${direction}`,
        at,
        departure,
        eventTitle: trip.context.title,
        direction,
        ...(driver ? { driverFirstName: driver.firstName } : {}),
        url: `/e/${trip.id}/${trip.role === 'driver' ? 'my-car' : 'rides'}`,
      });
    }
  }
  return reminders.sort((a, b) => a.at.getTime() - b.at.getTime());
}
