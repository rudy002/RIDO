import type { Booking, Departure, RideRole, TripDirection, Zone } from '@/lib/rides/types';

import {
  DATA_VERSION,
  type AppData,
  type Participant,
  type PassengerLegRecord,
  type StoredEvent,
} from './types';

/*
 * Données de démonstration, recalculées par rapport à aujourd'hui pour que les événements soient
 * à venir. Une seule histoire cohérente sur tous les écrans : David Cohen (l'utilisateur) organise
 * le mariage de Léa et Samuel et y conduit, organise la bar mitzvah d'Eitan, et va aux 30 ans de Noa
 * en passager.
 */

export const DEMO_USER_ID = 'me';
export const DEMO_EVENT_ID = 'demo';

// Lieux GeoNames (lib/places/data/IL.json).
const ZONES = {
  ashdodKirya: { placeId: '11401067', name: 'Rova HaKirya, Ashdod' },
  ashdodYodAlef: { placeId: '11401085', name: 'Rova Yod Alef, Ashdod' },
  ashdodAlef: { placeId: '11401100', name: 'Rova Alef, Ashdod' },
  ashdodGimel: { placeId: '11401041', name: 'Rova Gimel, Ashdod' },
  ashdodBet: { placeId: '11401102', name: 'Rova Bet, Ashdod' },
  ganYavne: { placeId: '295080', name: 'Gan Yavne' },
  ashkelon: { placeId: '295620', name: 'Ashkelon' },
  kiryatGat: { placeId: '293842', name: 'Kiryat Gat' },
  telAviv: { placeId: '293397', name: 'Tel-Aviv' },
  florentin: { placeId: '8598981', name: 'Florentin, Tel-Aviv' },
} satisfies Record<string, Zone>;

/** Premier samedi au moins une semaine après `now`, à minuit. */
function weddingDay(now: Date): Date {
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
  day.setDate(day.getDate() + ((6 - day.getDay() + 7) % 7));
  return day;
}

/** `day` + `offsetDays`, à hh:mm. */
const at = (day: Date, offsetDays: number, hours: number, minutes = 0) =>
  new Date(day.getFullYear(), day.getMonth(), day.getDate() + offsetDays, hours, minutes);

type Builder = {
  data: AppData;
  event: (event: Omit<StoredEvent, 'country'>) => void;
  person: (
    id: string,
    eventId: string,
    identity: { userId?: string; firstName: string; lastName: string; phone: string },
    zone: Zone,
    role: RideRole,
    directions: TripDirection[],
    partySize?: number
  ) => void;
  drive: (
    id: string,
    participantId: string,
    direction: TripDirection,
    departure: Departure,
    totalSeats: number,
    bookings?: Booking[]
  ) => void;
  seek: (
    id: string,
    participantId: string,
    direction: TripDirection,
    foundWith?: string | null
  ) => void;
};

function builder(): Builder {
  const data: AppData = {
    version: DATA_VERSION,
    userId: DEMO_USER_ID,
    profile: {
      firstName: 'David',
      lastName: 'Cohen',
      phone: '+972521234567',
      car: { model: 'Toyota Corolla grise', seats: 4, usualDeparture: ZONES.ashdodKirya },
      notifications: { nearbyRequests: true, departureReminder: true },
    },
    events: [],
    participants: [],
    driverLegs: [],
    passengerLegs: [],
    previews: [],
  };
  const participant = (id: string): Participant => {
    const found = data.participants.find((p) => p.id === id);
    if (!found) throw new Error(`Participant de démo inconnu : ${id}`);
    return found;
  };

  return {
    data,
    event: (event) => data.events.push({ ...event, country: 'IL' }),
    person: (id, eventId, identity, zone, role, directions, partySize = 1) =>
      data.participants.push({
        id,
        eventId,
        userId: identity.userId ?? `user-${id}`,
        firstName: identity.firstName,
        lastName: identity.lastName,
        phone: identity.phone,
        zone,
        role,
        directions,
        partySize,
      }),
    drive: (id, participantId, direction, departure, totalSeats, bookings = []) => {
      const { eventId } = participant(participantId);
      data.driverLegs.push({
        id,
        eventId,
        participantId,
        direction,
        departure,
        totalSeats,
        bookings,
      });
    },
    seek: (id, participantId, direction, foundWith) => {
      const { eventId } = participant(participantId);
      const leg: PassengerLegRecord = { id, eventId, participantId, direction };
      if (foundWith !== undefined) leg.foundWith = foundWith;
      data.passengerLegs.push(leg);
    },
  };
}

const ME = { userId: DEMO_USER_ID, firstName: 'David', lastName: 'Cohen', phone: '+972521234567' };
const MYRIAM = {
  userId: 'user-myriam',
  firstName: 'Myriam',
  lastName: 'Benhamou',
  phone: '+972524567890',
};

/** Place réservée par un passager inscrit (liée à sa recherche). */
const seat = (passengerLegId: string, name: string, seats: number): Booking => ({
  id: `booking-${passengerLegId}`,
  name,
  seats,
  passengerLegId,
});
/** Places notées à la main par le conducteur (réservées par téléphone). */
const manual = (id: string, seats: number): Booking => ({ id, seats });

export function buildDemoData(now: Date = new Date()): AppData {
  const b = builder();
  const L = weddingDay(now);

  // Mariage de Léa et Samuel : organisé par David, qui y conduit.
  b.event({
    id: DEMO_EVENT_ID,
    type: 'wedding',
    title: 'Mariage de Léa et Samuel',
    startsAt: at(L, 0, 19, 30),
    endsAt: at(L, 1, 1, 0),
    venue: 'Domaine des Oliviers',
    directions: ['outbound', 'return'],
    organizerId: DEMO_USER_ID,
    organizerName: 'David Cohen',
  });
  const e = DEMO_EVENT_ID;
  b.person('p-david', e, ME, ZONES.ashdodKirya, 'driver', ['outbound', 'return']);
  b.person(
    'p-ruth',
    e,
    { firstName: 'Ruth', lastName: 'Azoulay', phone: '+972542345678' },
    ZONES.ganYavne,
    'driver',
    ['outbound', 'return']
  );
  b.person('p-myriam', e, MYRIAM, ZONES.ashdodYodAlef, 'driver', ['outbound']);
  b.person(
    'p-yoni',
    e,
    { firstName: 'Yoni', lastName: 'Attal', phone: '+972503456789' },
    ZONES.ashdodAlef,
    'driver',
    ['outbound']
  );
  b.person(
    'p-avi',
    e,
    { firstName: 'Avi', lastName: 'Mizrahi', phone: '+972525678901' },
    ZONES.florentin,
    'driver',
    ['outbound', 'return']
  );
  b.person(
    'p-dana',
    e,
    { firstName: 'Dana', lastName: 'Peretz', phone: '+972546789012' },
    ZONES.telAviv,
    'driver',
    ['outbound']
  );
  b.person(
    'p-sarahl',
    e,
    { firstName: 'Sarah', lastName: 'Levy', phone: '+972535678901' },
    ZONES.ashdodGimel,
    'driver',
    ['return']
  );
  b.person(
    'p-esther',
    e,
    { firstName: 'Esther', lastName: 'Azria', phone: '+972527890123' },
    ZONES.ashdodGimel,
    'passenger',
    ['outbound', 'return'],
    2
  );
  b.person(
    'p-nathan',
    e,
    { firstName: 'Nathan', lastName: 'Bensoussan', phone: '+972526789012' },
    ZONES.ashdodKirya,
    'passenger',
    ['outbound', 'return']
  );
  b.person(
    'p-rachel',
    e,
    { firstName: 'Rachel', lastName: 'Marciano', phone: '+972547890123' },
    ZONES.ashdodYodAlef,
    'passenger',
    ['outbound', 'return']
  );
  b.person(
    'p-paul',
    e,
    { firstName: 'Paul', lastName: 'Amsellem', phone: '+972528901234' },
    ZONES.ashkelon,
    'passenger',
    ['outbound']
  );
  b.person(
    'p-sarahd',
    e,
    { firstName: 'Sarah', lastName: 'Dahan', phone: '+972549012345' },
    ZONES.ashkelon,
    'passenger',
    ['outbound'],
    2
  );
  b.person(
    'p-michael',
    e,
    { firstName: 'Michaël', lastName: 'Ohana', phone: '+972500123456' },
    ZONES.kiryatGat,
    'passenger',
    ['outbound', 'return']
  );
  b.person(
    'p-noam',
    e,
    { firstName: 'Noam', lastName: 'Katz', phone: '+972521230987' },
    ZONES.florentin,
    'passenger',
    ['outbound'],
    2
  );
  b.person(
    'p-lior',
    e,
    { firstName: 'Lior', lastName: 'Ben-David', phone: '+972541239876' },
    ZONES.telAviv,
    'passenger',
    ['outbound', 'return']
  );

  b.drive('d-david-out', 'p-david', 'outbound', { from: at(L, 0, 18), to: at(L, 0, 18, 30) }, 3, [
    seat('s-esther-out', 'Esther', 2),
  ]);
  b.drive('d-david-ret', 'p-david', 'return', { from: at(L, 1, 0, 30), to: at(L, 1, 1) }, 3, [
    seat('s-nathan-ret', 'Nathan', 1),
  ]);
  b.drive('d-ruth-out', 'p-ruth', 'outbound', { from: at(L, 0, 18) }, 3, [manual('m-ruth', 1)]);
  b.drive('d-ruth-ret', 'p-ruth', 'return', { from: at(L, 1, 1, 30) }, 3);
  b.drive(
    'd-myriam-out',
    'p-myriam',
    'outbound',
    { from: at(L, 0, 18, 15), to: at(L, 0, 18, 45) },
    4,
    [manual('m-myriam', 3)]
  );
  b.drive('d-yoni-out', 'p-yoni', 'outbound', { from: at(L, 0, 17, 45) }, 3, [manual('m-yoni', 3)]);
  b.drive('d-avi-out', 'p-avi', 'outbound', { from: at(L, 0, 17, 30), to: at(L, 0, 18) }, 4);
  b.drive('d-avi-ret', 'p-avi', 'return', { from: at(L, 1, 1) }, 4, [
    seat('s-lior-ret', 'Lior', 1),
  ]);
  b.drive('d-dana-out', 'p-dana', 'outbound', { from: at(L, 0, 17, 45) }, 4);
  b.drive('d-sarahl-ret', 'p-sarahl', 'return', { from: at(L, 1, 1), to: at(L, 1, 1, 30) }, 4, [
    seat('s-esther-ret', 'Esther', 2),
  ]);

  b.seek('s-esther-out', 'p-esther', 'outbound', 'd-david-out');
  b.seek('s-esther-ret', 'p-esther', 'return', 'd-sarahl-ret');
  b.seek('s-nathan-out', 'p-nathan', 'outbound');
  b.seek('s-nathan-ret', 'p-nathan', 'return', 'd-david-ret');
  b.seek('s-rachel-out', 'p-rachel', 'outbound');
  b.seek('s-rachel-ret', 'p-rachel', 'return');
  b.seek('s-paul-out', 'p-paul', 'outbound');
  b.seek('s-sarahd-out', 'p-sarahd', 'outbound');
  b.seek('s-michael-out', 'p-michael', 'outbound');
  b.seek('s-michael-ret', 'p-michael', 'return');
  b.seek('s-noam-out', 'p-noam', 'outbound');
  b.seek('s-lior-out', 'p-lior', 'outbound', null);
  b.seek('s-lior-ret', 'p-lior', 'return', 'd-avi-ret');

  // Les 30 ans de Noa : organisés par une amie, David y va en passager avec Myriam.
  b.event({
    id: 'noa',
    type: 'birthday',
    title: 'Les 30 ans de Noa',
    startsAt: at(L, 6, 21),
    endsAt: at(L, 7, 2),
    venue: 'Rooftop Florentin',
    directions: ['outbound', 'return'],
    organizerId: 'user-noa',
    organizerName: 'Noa Friedman',
  });
  b.person('p-noa-me', 'noa', ME, ZONES.ashdodKirya, 'passenger', ['outbound', 'return']);
  b.person('p-noa-myriam', 'noa', MYRIAM, ZONES.ashdodYodAlef, 'driver', ['outbound']);
  b.person(
    'p-noa-yoni',
    'noa',
    { firstName: 'Yoni', lastName: 'Attal', phone: '+972503456789' },
    ZONES.ashdodAlef,
    'driver',
    ['return']
  );
  b.drive('d-noa-myriam-out', 'p-noa-myriam', 'outbound', { from: at(L, 6, 20, 15) }, 4, [
    seat('s-noa-me-out', 'David', 1),
  ]);
  b.drive('d-noa-yoni-ret', 'p-noa-yoni', 'return', { from: at(L, 7, 2) }, 3);
  b.seek('s-noa-me-out', 'p-noa-me', 'outbound', 'd-noa-myriam-out');
  b.seek('s-noa-me-ret', 'p-noa-me', 'return');

  // Bar mitzvah d'Eitan : organisée par David, tout le monde a déjà une place.
  b.event({
    id: 'eitan',
    type: 'barMitzvah',
    title: 'Bar mitzvah d’Eitan',
    startsAt: at(L, 21, 18),
    endsAt: at(L, 21, 23),
    venue: 'Salle Ha-Tamar',
    directions: ['outbound', 'return'],
    organizerId: DEMO_USER_ID,
    organizerName: 'David Cohen',
  });
  b.person(
    'p-shai',
    'eitan',
    { firstName: 'Shai', lastName: 'Levi', phone: '+972522345670' },
    ZONES.ashdodBet,
    'driver',
    ['outbound', 'return']
  );
  b.person(
    'p-orly',
    'eitan',
    { firstName: 'Orly', lastName: 'Cohen', phone: '+972543456701' },
    ZONES.ashdodGimel,
    'driver',
    ['outbound', 'return']
  );
  b.person(
    'p-tamar',
    'eitan',
    { firstName: 'Tamar', lastName: 'Levi', phone: '+972524567012' },
    ZONES.ashdodBet,
    'passenger',
    ['outbound', 'return'],
    2
  );
  b.person(
    'p-ido',
    'eitan',
    { firstName: 'Ido', lastName: 'Shalom', phone: '+972545670123' },
    ZONES.ashdodAlef,
    'passenger',
    ['outbound', 'return']
  );
  b.person(
    'p-ben',
    'eitan',
    { firstName: 'Ben', lastName: 'Amar', phone: '+972526701234' },
    ZONES.ashdodGimel,
    'passenger',
    ['outbound', 'return']
  );
  b.person(
    'p-gal',
    'eitan',
    { firstName: 'Gal', lastName: 'Dayan', phone: '+972547012345' },
    ZONES.ashdodKirya,
    'passenger',
    ['outbound', 'return']
  );
  b.person(
    'p-yael',
    'eitan',
    { firstName: 'Yael', lastName: 'Gabay', phone: '+972528012345' },
    ZONES.ganYavne,
    'passenger',
    ['outbound']
  );
  for (const direction of ['outbound', 'return'] as const) {
    const suffix = direction === 'outbound' ? 'out' : 'ret';
    b.drive(
      `d-shai-${suffix}`,
      'p-shai',
      direction,
      { from: direction === 'outbound' ? at(L, 21, 17) : at(L, 21, 23) },
      4,
      [seat(`s-tamar-${suffix}`, 'Tamar', 2), seat(`s-ido-${suffix}`, 'Ido', 1)]
    );
    b.drive(
      `d-orly-${suffix}`,
      'p-orly',
      direction,
      { from: direction === 'outbound' ? at(L, 21, 17, 15) : at(L, 21, 23) },
      3,
      [seat(`s-ben-${suffix}`, 'Ben', 1)]
    );
    b.seek(`s-tamar-${suffix}`, 'p-tamar', direction, `d-shai-${suffix}`);
    b.seek(`s-ido-${suffix}`, 'p-ido', direction, `d-shai-${suffix}`);
    b.seek(`s-ben-${suffix}`, 'p-ben', direction, `d-orly-${suffix}`);
    b.seek(`s-gal-${suffix}`, 'p-gal', direction, null);
  }
  b.seek('s-yael-out', 'p-yael', 'outbound', null);

  // Événements passés : deux organisés par David, un mariage où il était conducteur.
  b.event({
    id: 'maya',
    type: 'birthday',
    title: 'Anniversaire de Maya',
    startsAt: at(now, -45, 20),
    endsAt: at(now, -45, 23, 30),
    venue: 'Bar Lev',
    directions: ['outbound'],
    organizerId: DEMO_USER_ID,
    organizerName: 'David Cohen',
  });
  b.person('p-maya-me', 'maya', ME, ZONES.ashdodKirya, 'driver', ['outbound']);
  b.drive('d-maya-me-out', 'p-maya-me', 'outbound', { from: at(now, -45, 19, 15) }, 3, [
    manual('m-maya', 2),
  ]);

  b.event({
    id: 'fin-annee',
    type: 'other',
    title: 'Fête de fin d’année',
    startsAt: at(now, -120, 19),
    endsAt: at(now, -120, 23),
    venue: 'Plage de Lido',
    directions: ['outbound', 'return'],
    organizerId: DEMO_USER_ID,
    organizerName: 'David Cohen',
  });
  b.person('p-fin-me', 'fin-annee', ME, ZONES.ashdodKirya, 'passenger', ['outbound', 'return']);
  b.seek('s-fin-me-out', 'p-fin-me', 'outbound', null);
  b.seek('s-fin-me-ret', 'p-fin-me', 'return', null);

  b.event({
    id: 'yossi-dana',
    type: 'wedding',
    title: 'Mariage de Yossi et Dana',
    startsAt: at(now, -200, 19),
    endsAt: at(now, -199, 0, 30),
    venue: 'Jardins de Césarée',
    directions: ['outbound', 'return'],
    organizerId: 'user-yossi',
    organizerName: 'Yossi Amram',
  });
  b.person('p-yossi-me', 'yossi-dana', ME, ZONES.ashdodKirya, 'driver', ['outbound', 'return']);
  b.drive('d-yossi-me-out', 'p-yossi-me', 'outbound', { from: at(now, -200, 17) }, 4, [
    manual('m-yossi-out', 3),
  ]);
  b.drive('d-yossi-me-ret', 'p-yossi-me', 'return', { from: at(now, -199, 0, 30) }, 4, [
    manual('m-yossi-ret', 3),
  ]);

  return b.data;
}

/** Sans aucune donnée (après « Se déconnecter ») : un nouvel utilisateur anonyme. */
export function emptyData(userId: string): AppData {
  return {
    version: DATA_VERSION,
    userId,
    profile: null,
    events: [],
    participants: [],
    driverLegs: [],
    passengerLegs: [],
    previews: [],
  };
}
