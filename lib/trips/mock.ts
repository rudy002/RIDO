import type { Trip } from './types';

// Données d'exemple de l'accueil « Mes trajets » (maquette A1), en attendant le backend.
export const DEMO_USER = { firstName: 'David' };

export const DEMO_UPCOMING_TRIPS: Trip[] = [
  {
    id: 'trip-lea-samuel',
    context: {
      kind: 'wedding',
      title: 'Mariage de Léa et Samuel',
      startsAt: new Date(2025, 5, 14, 19, 30),
    },
    role: 'driver',
    legs: {
      outbound: {
        departure: { from: new Date(2025, 5, 14, 18), to: new Date(2025, 5, 14, 18, 30) },
        totalSeats: 3,
        bookings: [{ id: 'esther', name: 'Esther', seats: 2 }],
      },
      return: {
        departure: { from: new Date(2025, 5, 15, 0, 30), to: new Date(2025, 5, 15, 1) },
        totalSeats: 3,
        bookings: [{ id: 'nathan', name: 'Nathan', seats: 1 }],
      },
    },
  },
  {
    id: 'trip-noa',
    context: { kind: 'birthday', title: 'Les 30 ans de Noa', startsAt: new Date(2025, 5, 20, 21) },
    role: 'passenger',
    legs: {
      outbound: {
        departure: { from: new Date(2025, 5, 20, 20, 15) },
        driver: { firstName: 'Myriam', lastName: 'Benhamou' },
      },
      return: {},
    },
  },
];

export const DEMO_PAST_TRIPS_COUNT = 3;
