import type { UserProfile } from './types';

// Profil d'exemple (maquette A3), en attendant les comptes.
export const DEMO_PROFILE: UserProfile = {
  firstName: 'David',
  lastName: 'Cohen',
  phone: '+972521234567',
  car: { model: 'Toyota Corolla grise', seats: 4, usualDeparture: 'Ashdod, centre-ville' },
  notifications: { nearbyRequests: true, departureReminder: true },
};
