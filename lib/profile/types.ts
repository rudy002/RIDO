import type { Zone } from '@/lib/rides/types';

/** Ce que l'utilisateur garde d'un trajet à l'autre (A3), pour ne pas tout ressaisir. */
export type UserProfile = {
  firstName: string;
  lastName: string;
  /** E.164. */
  phone: string;
  car: { model: string; seats: number; usualDeparture: Zone | null };
  notifications: { nearbyRequests: boolean; departureReminder: boolean };
};

export type CarField = 'model' | 'seats' | 'usualDeparture';
