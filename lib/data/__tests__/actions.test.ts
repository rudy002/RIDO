import {
  cancelDriving,
  deleteEvent,
  createEvent,
  joinEvent,
  markFound,
  publishCar,
  registrationsLostBy,
  searchAgain,
  setBookings,
  signOut,
  updateEvent,
} from '../actions';
import { buildDemoData, DEMO_EVENT_ID } from '../demo';
import { eventOverview, myParticipant, passengerStatusOf } from '../selectors';

const NOW = new Date(2025, 5, 2, 10, 0);
const KIRYA = { placeId: '11401067', name: 'Rova HaKirya, Ashdod' };
const registration = {
  firstName: 'David',
  lastName: 'Cohen',
  phone: '+972521234567',
  zone: KIRYA,
  directions: ['outbound' as const, 'return' as const],
  partySize: 1,
};
const legOf = (data: ReturnType<typeof buildDemoData>, id: string) =>
  data.passengerLegs.find((leg) => leg.id === id);

describe('actions', () => {
  it('crée un événement avec un lien libre, jamais celui d’un autre écran', () => {
    const data = buildDemoData(NOW);
    const draft = {
      type: 'birthday' as const,
      name: 'New',
      venue: 'Chez moi',
      startsAt: new Date(2025, 6, 1, 20),
      endsAt: new Date(2025, 6, 1, 23),
      directions: ['outbound' as const],
    };
    const created = createEvent(data, draft, 'IL');
    expect(created.eventId).toBe('new-2');
    const event = created.data.events.find((e) => e.id === 'new-2');
    expect(event).toMatchObject({ organizerId: 'me', organizerName: 'David Cohen', country: 'IL' });
    expect(
      createEvent(created.data, { ...draft, name: 'Mariage de Léa et Samuel' }, 'IL').eventId
    ).toBe('lea-samuel');
  });

  it('inscrit un passager et lui ouvre une recherche par trajet', () => {
    const { data, eventId } = createEvent(
      buildDemoData(NOW),
      {
        type: 'other',
        name: 'Pique-nique',
        venue: 'Parc',
        startsAt: new Date(2025, 6, 1, 12),
        endsAt: new Date(2025, 6, 1, 16),
        directions: ['outbound', 'return'],
      },
      'IL'
    );
    const joined = joinEvent(data, eventId, { ...registration, role: 'passenger', partySize: 3 });
    const me = myParticipant(joined, eventId)!;
    expect(me).toMatchObject({ role: 'passenger', partySize: 3 });
    expect(Object.keys(passengerStatusOf(joined, me)).sort()).toEqual(['outbound', 'return']);
  });

  it('passe de conducteur à passager sans laisser de passager dans une voiture disparue', () => {
    const data = buildDemoData(NOW);
    const switched = joinEvent(data, DEMO_EVENT_ID, { ...registration, role: 'passenger' });

    expect(switched.driverLegs.some((leg) => leg.participantId === 'p-david')).toBe(false);
    expect(legOf(switched, 's-esther-out')?.foundWith).toBeUndefined();
    expect(legOf(switched, 's-nathan-ret')?.foundWith).toBeUndefined();
    expect(switched.passengerLegs.filter((leg) => leg.participantId === 'p-david')).toHaveLength(2);
  });

  it('publie la voiture et garde les places déjà prises en la modifiant', () => {
    const data = buildDemoData(NOW);
    const edited = publishCar(data, DEMO_EVENT_ID, {
      seats: 4,
      legs: {
        outbound: { from: new Date(2025, 5, 14, 18, 15), to: new Date(2025, 5, 14, 18, 45) },
      },
    });
    const mine = edited.driverLegs.filter((leg) => leg.participantId === 'p-david');
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({ id: 'd-david-out', totalSeats: 4 });
    expect(mine[0].bookings.map((b) => b.name)).toEqual(['Esther']);
    // Le retour n'est plus proposé : Nathan, qui y avait sa place, recherche à nouveau.
    expect(legOf(edited, 's-nathan-ret')?.foundWith).toBeUndefined();
    expect(myParticipant(edited, DEMO_EVENT_ID)?.directions).toEqual(['outbound']);
  });

  it('réserve la place du passager qui a trouvé, et la libère s’il recherche', () => {
    const data = buildDemoData(NOW);
    const found = markFound(data, 'noa', 'return', 'd-noa-yoni-ret');
    const yoni = found.driverLegs.find((leg) => leg.id === 'd-noa-yoni-ret')!;
    expect(yoni.bookings).toEqual([
      { id: 'booking-s-noa-me-ret', name: 'David', seats: 1, passengerLegId: 's-noa-me-ret' },
    ]);
    expect(legOf(found, 's-noa-me-ret')?.foundWith).toBe('d-noa-yoni-ret');

    const again = searchAgain(found, 'noa', 'return');
    expect(again.driverLegs.find((leg) => leg.id === 'd-noa-yoni-ret')?.bookings).toEqual([]);
    expect(legOf(again, 's-noa-me-ret')?.foundWith).toBeUndefined();

    const elsewhere = markFound(data, 'noa', 'return', null);
    expect(legOf(elsewhere, 's-noa-me-ret')?.foundWith).toBeNull();
  });

  it('remet en recherche un passager dont le conducteur libère la place', () => {
    const data = buildDemoData(NOW);
    const freed = setBookings(data, 'd-david-out', []);
    expect(legOf(freed, 's-esther-out')?.foundWith).toBeUndefined();
    const wedding = freed.events.find((e) => e.id === DEMO_EVENT_ID)!;
    expect(eventOverview(freed, wedding, 'fr').outbound?.freeSeats).toBe(14);
  });

  it('retire la voiture et l’inscription de celui qui ne peut plus conduire', () => {
    const cancelled = cancelDriving(buildDemoData(NOW), DEMO_EVENT_ID);
    expect(myParticipant(cancelled, DEMO_EVENT_ID)).toBeUndefined();
    expect(legOf(cancelled, 's-esther-out')?.foundWith).toBeUndefined();
  });

  it('efface tout à la déconnexion, avec un nouvel utilisateur', () => {
    const out = signOut(buildDemoData(NOW));
    expect(out.userId).not.toBe('me');
    expect(out.profile).toBeNull();
    expect(out.events).toEqual([]);
  });
});

describe('modification d’un événement', () => {
  const data = buildDemoData(NOW);
  const wedding = data.events.find((e) => e.id === DEMO_EVENT_ID)!;
  const draft = {
    type: wedding.type,
    name: 'Mariage de Léa et Samuel',
    venue: 'Nouveau domaine',
    startsAt: new Date(2025, 5, 21, 20, 30),
    endsAt: new Date(2025, 5, 22, 2, 0),
    directions: ['outbound' as const, 'return' as const],
  };

  it('décale les départs des conducteurs avec l’horaire de l’événement', () => {
    const edited = updateEvent(data, DEMO_EVENT_ID, draft);
    const event = edited.events.find((e) => e.id === DEMO_EVENT_ID)!;
    expect(event).toMatchObject({ venue: 'Nouveau domaine', startsAt: draft.startsAt });
    // Début décalé d'une semaine + 1 h, fin d'une semaine + 1 h : 18h00 → 19h00 le 21.
    expect(edited.driverLegs.find((l) => l.id === 'd-david-out')?.departure).toEqual({
      from: new Date(2025, 5, 21, 19, 0),
      to: new Date(2025, 5, 21, 19, 30),
    });
    expect(edited.driverLegs.find((l) => l.id === 'd-david-ret')?.departure.from).toEqual(
      new Date(2025, 5, 22, 1, 30)
    );
  });

  it('retire les inscriptions d’un trajet supprimé, et prévient avant', () => {
    const outboundOnly = { ...draft, directions: ['outbound' as const] };
    expect(registrationsLostBy(data, DEMO_EVENT_ID, outboundOnly)).toBe(9);
    const edited = updateEvent(data, DEMO_EVENT_ID, outboundOnly);
    expect(
      edited.driverLegs.some((l) => l.eventId === DEMO_EVENT_ID && l.direction === 'return')
    ).toBe(false);
    expect(
      edited.passengerLegs.some((l) => l.eventId === DEMO_EVENT_ID && l.direction === 'return')
    ).toBe(false);
    // Sarah Levy ne conduisait qu'au retour : elle n'est plus inscrite.
    expect(edited.participants.some((p) => p.id === 'p-sarahl')).toBe(false);
    expect(edited.participants.find((p) => p.id === 'p-david')?.directions).toEqual(['outbound']);
  });

  it('supprime l’événement et tout ce qui s’y rattache', () => {
    const deleted = deleteEvent(data, DEMO_EVENT_ID);
    expect(deleted.events.some((e) => e.id === DEMO_EVENT_ID)).toBe(false);
    expect(deleted.participants.some((p) => p.eventId === DEMO_EVENT_ID)).toBe(false);
    expect(deleted.driverLegs.some((l) => l.eventId === DEMO_EVENT_ID)).toBe(false);
  });
});

describe('capacité des voitures', () => {
  const ESTHER_LEG = 's-esther-out';

  it('ne descend jamais sous les places déjà prises', () => {
    const edited = publishCar(buildDemoData(NOW), DEMO_EVENT_ID, {
      seats: 1,
      legs: { outbound: { from: new Date(2025, 5, 14, 18), to: new Date(2025, 5, 14, 18, 30) } },
    });
    expect(edited.driverLegs.find((leg) => leg.id === 'd-david-out')?.totalSeats).toBe(2);
    expect(legOf(edited, ESTHER_LEG)?.foundWith).toBe('d-david-out');
  });

  it('refuse une réservation pour laquelle il manque des places', () => {
    const data = buildDemoData(NOW);
    const full = setBookings(data, 'd-noa-yoni-ret', [{ id: 'm', seats: 3 }]);
    const refused = markFound(full, 'noa', 'return', 'd-noa-yoni-ret');
    expect(refused).toBe(full);
    expect(legOf(refused, 's-noa-me-ret')?.foundWith).toBeUndefined();
  });

  const noaMe = (data: ReturnType<typeof buildDemoData>) =>
    data.participants.find((p) => p.id === 'p-noa-me')!;

  it('suit la taille du groupe si elle tient, sinon remet le passager en recherche', () => {
    const base = buildDemoData(NOW);
    const me = noaMe(base);
    const registration2 = {
      role: 'passenger' as const,
      directions: me.directions,
      zone: me.zone,
      firstName: me.firstName,
      lastName: me.lastName,
      phone: me.phone,
    };
    const grown = joinEvent(base, 'noa', { ...registration2, partySize: 3 });
    expect(grown.driverLegs.find((l) => l.id === 'd-noa-myriam-out')?.bookings[0].seats).toBe(3);

    const tooMany = joinEvent(base, 'noa', { ...registration2, partySize: 5 });
    expect(tooMany.driverLegs.find((l) => l.id === 'd-noa-myriam-out')?.bookings).toEqual([]);
    expect(legOf(tooMany, 's-noa-me-out')?.foundWith).toBeUndefined();
  });
});
