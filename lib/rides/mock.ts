import type { DriverLeg, RideMatch, RideRequest, TripDirection } from './types';

// Données d'exemple (maquette P1), en attendant le backend.
export const DEMO_PASSENGER = { firstName: 'Esther', zone: 'Ashdod', partySize: 2 };

const day = (hours: number, minutes = 0) => new Date(2025, 5, 14, hours, minutes);
const night = (hours: number, minutes = 0) => new Date(2025, 5, 15, hours, minutes);

export const DEMO_MATCHES: RideMatch[] = [
  {
    offer: {
      id: 'out-david',
      direction: 'outbound',
      driver: { id: 'david', phone: '+972521234567', firstName: 'David', lastName: 'Cohen' },
      home: { city: 'Ashdod', area: 'Centre-ville' },
      departure: { from: day(18), to: day(18, 30) },
      seats: { total: 4, free: 3 },
    },
  },
  {
    offer: {
      id: 'out-ruth',
      direction: 'outbound',
      driver: { id: 'ruth', phone: '+972542345678', firstName: 'Ruth', lastName: 'Azoulay' },
      home: { city: 'Yavne' },
      departure: { from: day(18) },
      seats: { total: 3, free: 2 },
    },
    distanceKm: 12,
  },
  {
    offer: {
      id: 'out-yoni',
      direction: 'outbound',
      driver: { id: 'yoni', phone: '+972503456789', firstName: 'Yoni', lastName: 'Attal' },
      home: { city: 'Ashdod', area: 'La marina' },
      departure: { from: day(17, 45) },
      seats: { total: 3, free: 0 },
    },
  },
  {
    offer: {
      id: 'out-myriam',
      direction: 'outbound',
      driver: { id: 'myriam', phone: '+972524567890', firstName: 'Myriam', lastName: 'Benhamou' },
      home: { city: 'Ashdod', area: 'Youd-Alef' },
      departure: { from: day(18, 15), to: day(18, 45) },
      seats: { total: 4, free: 1 },
    },
  },
  {
    offer: {
      id: 'ret-david',
      direction: 'return',
      driver: { id: 'david', phone: '+972521234567', firstName: 'David', lastName: 'Cohen' },
      home: { city: 'Ashdod', area: 'Centre-ville' },
      departure: { from: night(0, 30), to: night(1) },
      seats: { total: 4, free: 2 },
    },
  },
  {
    offer: {
      id: 'ret-sarah',
      direction: 'return',
      driver: { id: 'sarah', phone: '+972535678901', firstName: 'Sarah', lastName: 'Levy' },
      home: { city: 'Ashdod', area: 'Youd-Alef' },
      departure: { from: night(1), to: night(1, 30) },
      seats: { total: 4, free: 4 },
    },
  },
  {
    offer: {
      id: 'ret-ruth',
      direction: 'return',
      driver: { id: 'ruth', phone: '+972542345678', firstName: 'Ruth', lastName: 'Azoulay' },
      home: { city: 'Yavne' },
      departure: { from: night(1, 30) },
      seats: { total: 3, free: 2 },
    },
    distanceKm: 12,
  },
];

export function findMockMatch(rideId: string): RideMatch | undefined {
  return DEMO_MATCHES.find(({ offer }) => offer.id === rideId);
}

/** Le trajet du même conducteur dans l'autre sens, s'il le fait. */
export function findMockOtherLeg(match: RideMatch): RideMatch | undefined {
  return DEMO_MATCHES.find(
    ({ offer }) =>
      offer.driver.id === match.offer.driver.id && offer.direction !== match.offer.direction
  );
}

// Données d'exemple côté conducteur (maquette C3).
export const DEMO_DRIVER = { firstName: 'David', zone: 'Ashdod' };

export const DEMO_DRIVER_LEGS: Partial<Record<TripDirection, DriverLeg>> = {
  outbound: {
    departure: { from: day(18), to: day(18, 30) },
    totalSeats: 3,
    bookings: [{ id: 'esther', name: 'Esther', seats: 2 }],
  },
  return: {
    departure: { from: night(0, 30) },
    totalSeats: 3,
    bookings: [{ id: 'esther', name: 'Esther', seats: 2 }],
  },
};

export const DEMO_REQUESTS: RideRequest[] = [
  {
    id: 'req-nathan',
    direction: 'outbound',
    passenger: {
      id: 'nathan',
      firstName: 'Nathan',
      lastName: 'Bensoussan',
      phone: '+972526789012',
    },
    home: { city: 'Ashdod', area: 'Centre-ville' },
    partySize: 1,
  },
  {
    id: 'req-rachel',
    direction: 'outbound',
    passenger: { id: 'rachel', firstName: 'Rachel', lastName: 'Marciano', phone: '+972547890123' },
    home: { city: 'Ashdod', area: 'Youd-Alef' },
    partySize: 1,
  },
  {
    id: 'req-rachel-back',
    direction: 'return',
    passenger: { id: 'rachel', firstName: 'Rachel', lastName: 'Marciano', phone: '+972547890123' },
    home: { city: 'Ashdod', area: 'Youd-Alef' },
    partySize: 1,
  },
];
