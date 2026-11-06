import type { RideMatch } from './types';

// Données d'exemple (maquette P1), en attendant le backend.
export const DEMO_PASSENGER = { firstName: 'Esther', zone: 'Ashdod', partySize: 2 };

const day = (hours: number, minutes = 0) => new Date(2025, 5, 14, hours, minutes);
const night = (hours: number, minutes = 0) => new Date(2025, 5, 15, hours, minutes);

export const DEMO_MATCHES: RideMatch[] = [
  {
    offer: {
      id: 'out-david',
      direction: 'outbound',
      driver: { firstName: 'David', lastName: 'Cohen' },
      home: { city: 'Ashdod', area: 'Centre' },
      departure: { from: day(18), to: day(18, 30) },
      seats: { total: 4, free: 3 },
    },
  },
  {
    offer: {
      id: 'out-ruth',
      direction: 'outbound',
      driver: { firstName: 'Ruth', lastName: 'Azoulay' },
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
      driver: { firstName: 'Yoni', lastName: 'Attal' },
      home: { city: 'Ashdod', area: 'La marina' },
      departure: { from: day(17, 45) },
      seats: { total: 3, free: 0 },
    },
  },
  {
    offer: {
      id: 'out-myriam',
      direction: 'outbound',
      driver: { firstName: 'Myriam', lastName: 'Benhamou' },
      home: { city: 'Ashdod', area: 'Youd-Alef' },
      departure: { from: day(18, 15), to: day(18, 45) },
      seats: { total: 4, free: 1 },
    },
  },
  {
    offer: {
      id: 'ret-david',
      direction: 'return',
      driver: { firstName: 'David', lastName: 'Cohen' },
      home: { city: 'Ashdod', area: 'Centre' },
      departure: { from: night(1) },
      seats: { total: 4, free: 3 },
    },
  },
  {
    offer: {
      id: 'ret-sarah',
      direction: 'return',
      driver: { firstName: 'Sarah', lastName: 'Levy' },
      home: { city: 'Ashdod', area: 'Youd-Alef' },
      departure: { from: night(0, 30), to: night(1) },
      seats: { total: 4, free: 3 },
    },
  },
  {
    offer: {
      id: 'ret-ruth',
      direction: 'return',
      driver: { firstName: 'Ruth', lastName: 'Azoulay' },
      home: { city: 'Yavne' },
      departure: { from: night(1, 30) },
      seats: { total: 3, free: 2 },
    },
    distanceKm: 12,
  },
];
