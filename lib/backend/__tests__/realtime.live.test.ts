/**
 * Mises à jour en direct sur le VRAI projet Supabase (.env.local) : un participant est prévenu quand
 * quelqu'un s'inscrit ou réserve ; un inconnu ne reçoit rien de ces changements. Tout est effacé à
 * la fin. Lancé seulement par `npm run test:live`.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { subscribeToChanges, type LiveChange } from '@/lib/backend/realtime';

// Lus dans .env.local par jest.live.config.js.
const URL = process.env.RIDO_LIVE_URL;
const KEY = process.env.RIDO_LIVE_ANON_KEY;
const LIVE = process.env.RIDO_LIVE_TESTS === '1' && Boolean(URL && KEY);

type User = { client: SupabaseClient; id: string };
const users: User[] = [];
const stops: (() => void)[] = [];

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

/** S'abonne et attend que l'abonnement soit actif ; renvoie les changements reçus. */
function listen(user: User): Promise<LiveChange[]> {
  const received: LiveChange[] = [];
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('abonnement sans réponse')), 15_000);
    stops.push(
      subscribeToChanges(user.client, {
        onChange: (change) => received.push(change),
        onConnected: () => {
          clearTimeout(timer);
          resolve(received);
        },
      })
    );
  });
}

async function waitFor(check: () => boolean, ms = 10_000): Promise<boolean> {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (check()) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return check();
}

const at = (hour: number) => new Date(Date.UTC(2027, 5, 14, hour)).toISOString();

(LIVE ? describe : describe.skip)('mises à jour en direct sur le vrai Supabase', () => {
  jest.setTimeout(60_000);

  afterAll(async () => {
    stops.forEach((stop) => stop());
    await Promise.all(users.map((user) => user.client.rpc('delete_my_account')));
    // Ferme les connexions en direct, sans quoi le test ne se termine pas.
    await Promise.all(users.map((user) => user.client.removeAllChannels()));
    users.forEach((user) => void user.client.realtime.disconnect());
  });

  it('prévient les participants, et seulement eux', async () => {
    const driver = await signUp();
    const passenger = await signUp();
    const stranger = await signUp();

    const eventId = await call<string>(driver, 'create_event', {
      p_slug_base: 'direct-test',
      p_type: 'other',
      p_title: 'Direct',
      p_starts_at: at(16),
      p_ends_at: at(22),
      p_venue: 'Ici',
      p_country: 'IL',
      p_directions: ['outbound'],
    });
    const join = (user: User, role: string, phone: string) =>
      call(user, 'join_event', {
        p_event_id: eventId,
        p_first_name: 'Test',
        p_last_name: 'Direct',
        p_phone: phone,
        p_zone_place_id: '295629',
        p_zone_name: 'Ashdod',
        p_role: role,
        p_directions: ['outbound'],
      });
    await join(driver, 'driver', '+972521110010');
    await call(driver, 'publish_car', {
      p_event_id: eventId,
      p_seats: 3,
      p_legs: { outbound: { from: at(15) } },
    });

    const [driverSees, strangerSees] = await Promise.all([listen(driver), listen(stranger)]);

    // Une inscription, puis une réservation.
    await join(passenger, 'passenger', '+972521110011');
    const { data: legs } = await driver.client.from('driver_legs').select('id');
    await call(passenger, 'mark_found', {
      p_event_id: eventId,
      p_direction: 'outbound',
      p_driver_leg_id: legs?.[0]?.id,
    });

    expect(
      await waitFor(() => driverSees.filter((change) => change.kind === 'changed').length >= 2)
    ).toBe(true);
    // Le temps que d'éventuelles fuites arrivent.
    await new Promise((r) => setTimeout(r, 2000));
    expect(strangerSees.filter((change) => change.kind === 'changed')).toEqual([]);

    // Le passager change d'avis : le conducteur voit la suppression de la réservation.
    const before = driverSees.length;
    await call(passenger, 'search_again', { p_event_id: eventId, p_direction: 'outbound' });
    expect(
      await waitFor(() =>
        driverSees.slice(before).some((change) => change.kind === 'deleted' && change.id !== null)
      )
    ).toBe(true);
  });
});
