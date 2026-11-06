/** Ce que l'utilisateur garde d'un trajet à l'autre (A3). */
export type UserProfile = {
  firstName: string;
  lastName: string;
  /** E.164. */
  phone: string;
  car: { model: string; seats: number; usualDeparture: string };
  notifications: { nearbyRequests: boolean; departureReminder: boolean };
};

export type CarField = 'model' | 'seats' | 'usualDeparture';
