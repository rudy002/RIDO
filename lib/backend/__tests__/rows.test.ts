import {
  toAppData,
  toEventPreview,
  type BookingRow,
  type PreviewRow,
  type ServerRows,
} from '@/lib/backend/rows';
import {
  driverLegsOf,
  eventById,
  eventSummary,
  isOrganizer,
  matchesFor,
  passengerStatusOf,
  tripsOf,
} from '@/lib/data/selectors';
import type { EventPreview } from '@/lib/data/types';

const ME = 'user-me';
const EVENT = 'mariage-0123456789abcdef0123456789abcdef';

const person = (id: string, userId: string, role: string, extra: Record<string, unknown> = {}) => ({
  id,
  event_id: EVENT,
  user_id: userId,
  first_name: id,
  last_name: 'Test',
  phone: '+972521234567',
  zone_place_id: '295629',
  zone_name: 'Ashdod',
  role,
  directions: ['outbound', 'return'],
  party_size: 1,
  ...extra,
});

const booking = (
  id: string,
  car: string,
  passengerLeg: string | null,
  createdAt: string,
  seats = 1
): BookingRow => ({
  id,
  event_id: EVENT,
  driver_leg_id: car,
  passenger_leg_id: passengerLeg,
  name: passengerLeg ? 'Paul' : null,
  seats,
  created_at: createdAt,
});

function serverRows(): ServerRows {
  return {
    events: [
      {
        id: EVENT,
        type: 'wedding',
        title: 'Mariage de Léa et Samuel',
        starts_at: '2027-06-14T16:30:00+00:00',
        ends_at: '2027-06-14T22:00:00+00:00',
        venue: 'Domaine des Oliviers',
        country: 'IL',
        directions: ['outbound', 'return'],
        organizer_id: 'user-org',
        organizer_name: null,
      },
    ],
    participants: [
      person('driver', 'user-driver', 'driver'),
      person('paul', ME, 'passenger', { party_size: 2 }),
      person('pia', 'user-pia', 'passenger', { zone_place_id: null, zone_name: 'Chez ma tante' }),
    ],
    driverLegs: [
      {
        id: 'car-out',
        event_id: EVENT,
        participant_id: 'driver',
        direction: 'outbound',
        departure_from: '2027-06-14T15:00:00+00:00',
        departure_to: '2027-06-14T15:30:00+00:00',
        total_seats: 4,
      },
      {
        id: 'car-back',
        event_id: EVENT,
        participant_id: 'driver',
        direction: 'return',
        departure_from: '2027-06-14T22:30:00+00:00',
        departure_to: null,
        total_seats: 3,
      },
    ],
    passengerLegs: [
      {
        id: 'paul-out',
        event_id: EVENT,
        participant_id: 'paul',
        direction: 'outbound',
        found_elsewhere: false,
      },
      {
        id: 'paul-back',
        event_id: EVENT,
        participant_id: 'paul',
        direction: 'return',
        found_elsewhere: true,
      },
      {
        id: 'pia-out',
        event_id: EVENT,
        participant_id: 'pia',
        direction: 'outbound',
        found_elsewhere: false,
      },
      {
        id: 'pia-back',
        event_id: EVENT,
        participant_id: 'pia',
        direction: 'return',
        found_elsewhere: false,
      },
    ],
    // Dans le désordre : l'appli les range par ordre de réservation.
    bookings: [
      booking('manual', 'car-out', null, '2027-06-01T10:00:05.5+00:00'),
      booking('paul-seat', 'car-out', 'paul-out', '2027-06-01T10:00:01.123456+00:00', 2),
    ],
    profile: null,
  };
}

describe('conversion des données du serveur', () => {
  it('range les places réservées dans la voiture, dans l’ordre de réservation', () => {
    const data = toAppData(serverRows(), ME);
    const car = data.driverLegs.find((leg) => leg.id === 'car-out');
    expect(car?.bookings).toEqual([
      { id: 'paul-seat', name: 'Paul', seats: 2, passengerLegId: 'paul-out' },
      { id: 'manual', seats: 1 },
    ]);
    expect(data.driverLegs.find((leg) => leg.id === 'car-back')?.bookings).toEqual([]);
  });

  it('donne à chaque passager son état : réservé, trouvé autrement, ou cherche encore', () => {
    const legs = new Map(toAppData(serverRows(), ME).passengerLegs.map((leg) => [leg.id, leg]));
    expect(legs.get('paul-out')?.foundWith).toBe('car-out');
    expect(legs.get('paul-back')?.foundWith).toBeNull();
    expect(legs.get('pia-out')).not.toHaveProperty('foundWith');
  });

  it('convertit les dates, les horaires et les zones', () => {
    const data = toAppData(serverRows(), ME);
    expect(data.events[0].startsAt).toEqual(new Date('2027-06-14T16:30:00Z'));
    expect(data.events[0]).not.toHaveProperty('organizerName');
    const back = data.driverLegs.find((leg) => leg.id === 'car-back');
    expect(back?.departure).toEqual({ from: new Date('2027-06-14T22:30:00Z') });
    const pia = data.participants.find((p) => p.id === 'pia');
    expect(pia?.zone).toEqual({ placeId: null, name: 'Chez ma tante' });
  });

  it('donne aux écrans ce qu’ils attendent', () => {
    const data = toAppData(serverRows(), ME);
    const paul = data.participants.find((p) => p.id === 'paul');
    if (!paul) throw new Error('paul absent');
    expect(passengerStatusOf(data, paul).outbound).toMatchObject({
      found: true,
      offerId: 'car-out',
    });
    expect(passengerStatusOf(data, paul).return).toMatchObject({ found: true });
    expect(
      matchesFor(data, paul, 'fr')
        .map((m) => m.offer.id)
        .sort()
    ).toEqual(['car-back', 'car-out']);
    const car = matchesFor(data, paul, 'fr').find((m) => m.offer.id === 'car-out');
    expect(car?.offer.seats).toEqual({ total: 4, free: 1 });
    expect(tripsOf(data, new Date('2027-06-01')).upcoming).toHaveLength(1);
    const driver = data.participants.find((p) => p.id === 'driver');
    if (!driver) throw new Error('conducteur absent');
    expect(Object.keys(driverLegsOf(data, driver)).sort()).toEqual(['outbound', 'return']);
  });

  it('reprend le profil', () => {
    const rows = serverRows();
    rows.profile = {
      user_id: ME,
      first_name: 'Paul',
      last_name: 'Test',
      phone: '+972521234567',
      car_model: '',
      car_seats: 3,
      usual_zone_place_id: '295629',
      usual_zone_name: 'Ashdod',
      notify_nearby: true,
      notify_reminder: false,
    };
    expect(toAppData(rows, ME).profile).toEqual({
      firstName: 'Paul',
      lastName: 'Test',
      phone: '+972521234567',
      car: { model: '', seats: 3, usualDeparture: { placeId: '295629', name: 'Ashdod' } },
      notifications: { nearbyRequests: true, departureReminder: false },
    });
    expect(toAppData(serverRows(), ME).profile).toBeNull();
  });

  it('refuse des données que les écrans ne sauraient pas afficher', () => {
    const rows = serverRows();
    rows.participants[0] = person('driver', 'user-driver', 'chauffeur');
    expect(() => toAppData(rows, ME)).toThrow();
  });
});

const previewRow: PreviewRow = {
  id: 'fete-0123456789abcdef0123456789abcdef',
  type: 'birthday',
  title: 'Les 30 ans de Noa',
  starts_at: '2027-06-20T17:00:00+00:00',
  ends_at: '2027-06-20T22:00:00+00:00',
  venue: 'Rooftop',
  country: 'IL',
  directions: ['outbound'],
  organizer_name: 'Noa',
  guests_count: 7,
  seats_offered: 5,
  zones: [
    { place_id: '293397', count: 3 }, // Tel-Aviv
    { place_id: '8598981', count: 2 }, // Florentin, un quartier de Tel-Aviv
    { place_id: '295629', count: 1 }, // Ashdod
    { place_id: '999999999', count: 1 }, // inconnu de la liste de l'appli
  ],
};

describe('invitation reçue par lien (pas encore inscrit)', () => {
  const preview: EventPreview = toEventPreview(previewRow);

  it('ne fait jamais passer l’invité pour l’organisateur, même avant que son compte soit prêt', () => {
    for (const userId of ['', 'user-1']) {
      const data = toAppData({ ...serverRows(), events: [] }, userId, [preview]);
      const event = eventById(data, preview.event.id);
      if (!event) throw new Error('aperçu absent');
      expect(isOrganizer(data, event)).toBe(false);
    }
  });

  it('donne l’événement sans son organisateur', () => {
    expect(preview.event).toMatchObject({
      title: 'Les 30 ans de Noa',
      organizerId: '',
      organizerName: 'Noa',
    });
    expect(preview.event.startsAt).toEqual(new Date('2027-06-20T17:00:00Z'));
  });

  it('affiche les chiffres du serveur et les villes de la liste de l’appli, dans la langue de chacun', () => {
    const data = toAppData({ ...serverRows(), events: [] }, ME, [preview]);
    const event = eventById(data, preview.event.id);
    if (!event) throw new Error('aperçu absent');
    const summary = eventSummary(data, event, 'fr');
    expect(summary.guestsCount).toBe(7);
    expect(summary.seatsOffered).toBe(5);
    // Le quartier rejoint sa ville ; l'identifiant inconnu n'apparaît pas.
    expect(summary.activeZones).toEqual([
      { zone: 'Tel-Aviv', count: 5 },
      { zone: 'Ashdod', count: 1 },
    ]);
    expect(eventSummary(data, event, 'he').activeZones[0].zone).toBe('תל אביב-יפו');
  });

  it('oublie l’aperçu une fois inscrit : les vraies données prennent le relais', () => {
    const joined = serverRows();
    joined.events[0] = { ...joined.events[0], id: preview.event.id };
    const data = toAppData(joined, ME, [preview]);
    expect(data.previews).toEqual([]);
  });
});
