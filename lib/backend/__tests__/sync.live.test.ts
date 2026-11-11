/**
 * Lecture sur le VRAI projet Supabase (.env.local) : de vrais comptes créent un événement, s'y
 * inscrivent et réservent, puis chacun lit ce qu'il voit, converti pour les écrans. Tout est effacé
 * à la fin. Lancé seulement par `npm run test:live` (Internet et vrais comptes nécessaires).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { fetchEventPreview, fetchServerData } from '@/lib/backend/sync';
import {
  eventById,
  eventOverview,
  eventSummary,
  isOrganizer,
  matchesFor,
  organizedEvents,
  passengerStatusOf,
  tripsOf,
} from '@/lib/data/selectors';
import type { AppData } from '@/lib/data/types';

// Lus dans .env.local par jest.live.config.js.
const URL = process.env.RIDO_LIVE_URL;
const KEY = process.env.RIDO_LIVE_ANON_KEY;
const LIVE = process.env.RIDO_LIVE_TESTS === '1' && Boolean(URL && KEY);

type User = { client: SupabaseClient; id: string };
const users: User[] = [];

async function signUp(): Promise<User> {
  const client = createClient(URL ?? '', KEY ?? '', {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInAnonymously();
  if (error || !data.user) throw error ?? new Error('pas de compte');
  const user = { client, id: data.user.id };
  users.push(user);
  return user;
}

async function call<T>(user: User, fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await user.client.rpc(fn, args);
  if (error) throw new Error(`${fn} : ${error.message}`);
  return data as T;
}

const at = (hour: number, minute = 0) =>
  new Date(Date.UTC(2027, 5, 14, hour, minute)).toISOString();

(LIVE ? describe : describe.skip)('lecture sur le vrai Supabase', () => {
  jest.setTimeout(60_000);

  let org: User;
  let driver: User;
  let paul: User;
  let pia: User;
  let stranger: User;
  let eventId: string;
  let otherEventId: string;

  beforeAll(async () => {
    org = await signUp();
    driver = await signUp();
    paul = await signUp();
    pia = await signUp();
    stranger = await signUp();

    eventId = await call<string>(org, 'create_event', {
      p_slug_base: 'lecture-test',
      p_type: 'wedding',
      p_title: 'Mariage test',
      p_starts_at: at(16, 30),
      p_ends_at: at(22),
      p_venue: 'Domaine test',
      p_country: 'IL',
      p_directions: ['outbound', 'return'],
      p_organizer_name: 'Léa',
    });
    const joinAs = (user: User, role: string, extra: Record<string, unknown>) =>
      call(user, 'join_event', {
        p_event_id: eventId,
        p_last_name: 'Test',
        p_zone_place_id: '295629',
        p_zone_name: 'Ashdod',
        p_role: role,
        p_directions: ['outbound', 'return'],
        p_party_size: 1,
        ...extra,
      });
    await joinAs(driver, 'driver', { p_first_name: 'Dan', p_phone: '+972521110001' });
    await call(driver, 'publish_car', {
      p_event_id: eventId,
      p_seats: 4,
      p_legs: {
        outbound: { from: at(15), to: at(15, 30) },
        return: { from: at(22, 30) },
      },
    });
    await joinAs(paul, 'passenger', {
      p_first_name: 'Paul',
      p_phone: '+972521110002',
      p_party_size: 2,
    });
    await joinAs(pia, 'passenger', {
      p_first_name: 'Pia',
      p_phone: '+972521110003',
      p_zone_place_id: '',
      p_zone_name: 'Chez ma tante',
    });

    const paulData = await fetchServerData(paul.client, paul.id);
    const carOut = paulData.driverLegs.find((leg) => leg.direction === 'outbound');
    if (!carOut) throw new Error('voiture absente');
    await call(paul, 'mark_found', {
      p_event_id: eventId,
      p_direction: 'outbound',
      p_driver_leg_id: carOut.id,
    });
    await call(paul, 'mark_found', { p_event_id: eventId, p_direction: 'return' });
    await call(driver, 'take_seat', { p_leg_id: carOut.id });

    const profile = await paul.client.from('profiles').insert({
      user_id: paul.id,
      first_name: 'Paul',
      last_name: 'Test',
      phone: '+972521110002',
      usual_zone_place_id: '295629',
      usual_zone_name: 'Ashdod',
    });
    if (profile.error) throw new Error(profile.error.message);

    // Un autre événement, où Paul n'est pas : il ne doit jamais le voir.
    otherEventId = await call<string>(stranger, 'create_event', {
      p_slug_base: 'autre-test',
      p_type: 'other',
      p_title: 'Autre',
      p_starts_at: at(10),
      p_ends_at: at(12),
      p_venue: 'Ailleurs',
      p_country: 'IL',
      p_directions: ['outbound'],
    });
  });

  afterAll(async () => {
    await Promise.all(users.map((user) => user.client.rpc('delete_my_account')));
  });

  it('un passager lit son événement, sa place réservée et son profil', async () => {
    const data = await fetchServerData(paul.client, paul.id);
    expect(data.events.map((event) => event.id)).toEqual([eventId]);
    expect(data.participants).toHaveLength(3);
    const me = data.participants.find((p) => p.userId === paul.id);
    if (!me) throw new Error('inscription absente');
    expect(me.partySize).toBe(2);

    const status = passengerStatusOf(data, me);
    expect(status.outbound).toMatchObject({ found: true, driver: { firstName: 'Dan' } });
    expect(status.return).toMatchObject({ found: true });
    expect(status.return).not.toHaveProperty('offerId');

    const car = matchesFor(data, me, 'fr').find((m) => m.offer.direction === 'outbound');
    // 4 places : Paul et son groupe (2) + une place notée par le conducteur.
    expect(car?.offer.seats).toEqual({ total: 4, free: 1 });
    expect(car?.offer.departure.from).toEqual(new Date(at(15)));

    expect(tripsOf(data, new Date('2027-01-01')).upcoming).toHaveLength(1);
    expect(data.profile?.car.usualDeparture).toEqual({ placeId: '295629', name: 'Ashdod' });
  });

  it('le conducteur voit sa voiture et qui y a une place', async () => {
    const data = await fetchServerData(driver.client, driver.id);
    const car = data.driverLegs.find((leg) => leg.direction === 'outbound');
    expect(car?.bookings.map((b) => [b.name, b.seats, Boolean(b.passengerLegId)])).toEqual([
      ['Paul', 2, true],
      [undefined, 1, false],
    ]);
    expect(data.profile).toBeNull();
  });

  it('l’organisateur, sans être inscrit, voit son tableau de bord', async () => {
    const data = await fetchServerData(org.client, org.id);
    const event = eventById(data, eventId);
    if (!event) throw new Error('événement absent');
    expect(isOrganizer(data, event)).toBe(true);
    expect(organizedEvents(data, new Date('2027-01-01'), 'fr').upcoming).toHaveLength(1);
    const overview = eventOverview(data, event, 'fr');
    // Pia (adresse libre) cherche encore à l'aller et au retour.
    expect(overview.outbound?.unmatched.map((guest) => guest.name)).toEqual(['Pia Test']);
    expect(overview.outbound?.freeSeats).toBe(1);
    expect(eventSummary(data, event, 'fr').guestsCount).toBe(4);
  });

  it('quelqu’un qui a seulement le lien voit l’invitation, sans rien de personnel', async () => {
    expect(await fetchServerData(stranger.client, stranger.id)).toMatchObject({
      events: [{ id: otherEventId }],
      participants: [],
    });
    const preview = await fetchEventPreview(stranger.client, eventId);
    if (!preview) throw new Error('aperçu absent');
    const data: AppData = await fetchServerData(stranger.client, stranger.id, [preview]);
    const event = eventById(data, eventId);
    if (!event) throw new Error('événement absent');
    expect(isOrganizer(data, event)).toBe(false);
    const summary = eventSummary(data, event, 'fr');
    expect(summary).toMatchObject({
      title: 'Mariage test',
      organizerName: 'Léa',
      guestsCount: 4,
      seatsOffered: 4,
    });
    // Dan (1) + Paul et son groupe (2) à Ashdod ; l'adresse libre de Pia n'apparaît pas.
    expect(summary.activeZones).toEqual([{ zone: 'Ashdod', count: 3 }]);
    expect(JSON.stringify(data)).not.toMatch(/97252|Chez ma tante|Paul|Pia|Dan/);
  });

  it('un lien inconnu ne mène à rien', async () => {
    expect(await fetchEventPreview(stranger.client, 'inconnu-0123456789abcdef')).toBeNull();
  });
});
