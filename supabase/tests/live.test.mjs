// Teste le VRAI projet Supabase (celui de .env.local), comme le ferait l'appli : comptes anonymes,
// fonctions, règles d'accès, accès simultanés et mises à jour en direct (Realtime).
// Chaque compte créé est effacé à la fin (delete_my_account), avec tout ce qui lui est lié.
//
// Lancer avec : npm run test:live
// Pas lancé par `npm run check` ni par la CI : il a besoin d'Internet et crée de vrais comptes
// (Supabase limite le nombre d'inscriptions anonymes par heure).
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';

function loadEnv() {
  const env = {};
  const file = new URL('../../.env.local', import.meta.url);
  if (existsSync(file)) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m) env[m[1]] = m[2];
    }
  }
  return { ...env, ...process.env };
}

const env = loadEnv();
const BASE = env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SKIP =
  !BASE || !KEY ? 'EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY absents' : false;

// ---------------------------------------------------------------------------------------------
// Client minimal (HTTP + WebSocket), sans dépendance
// ---------------------------------------------------------------------------------------------

const accounts = [];

async function request(user, path, { method = 'GET', body, prefer } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      apikey: KEY,
      'Content-Type': 'application/json',
      ...(user ? { Authorization: `Bearer ${user.token}` } : {}),
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

async function signUp() {
  const res = await request(null, '/auth/v1/signup', { method: 'POST', body: { data: {} } });
  if (!res.ok) {
    throw new Error(`inscription anonyme refusée (${res.status}) : ${JSON.stringify(res.data)}`);
  }
  const user = { id: res.data.user.id, token: res.data.access_token };
  accounts.push(user);
  return user;
}

async function rpc(user, fn, args = {}) {
  const res = await request(user, `/rest/v1/rpc/${fn}`, { method: 'POST', body: args });
  if (!res.ok) throw new Error(`${fn} : ${res.data?.message ?? JSON.stringify(res.data)}`);
  return res.data;
}

/** L'appel doit être refusé ; renvoie le message d'erreur. */
async function refused(user, fn, args = {}) {
  const res = await request(user, `/rest/v1/rpc/${fn}`, { method: 'POST', body: args });
  assert.equal(res.ok, false, `${fn} aurait dû être refusé`);
  return res.data?.message ?? JSON.stringify(res.data);
}

async function select(user, path) {
  const res = await request(user, `/rest/v1/${path}`);
  assert.equal(res.status, 200, JSON.stringify(res.data));
  return res.data;
}

const enc = encodeURIComponent;
const T = (day, hour, minute = 0) => new Date(Date.UTC(2027, 5, day, hour, minute)).toISOString();
const sameTime = (a, b) => assert.equal(new Date(a).getTime(), new Date(b).getTime());

const createEvent = (user, o = {}) =>
  rpc(user, 'create_event', {
    p_slug_base: o.slug ?? 'test-rido',
    p_type: o.type ?? 'wedding',
    p_title: o.title ?? 'Test Rido',
    p_starts_at: o.starts ?? T(14, 19),
    p_ends_at: o.ends ?? T(15, 1),
    p_venue: o.venue ?? 'Domaine test',
    p_country: 'IL',
    p_directions: o.directions ?? ['outbound'],
    p_organizer_name: 'Org Test',
  });

const updateEvent = (user, id, o = {}) =>
  rpc(user, 'update_event', {
    p_id: id,
    p_type: 'wedding',
    p_title: o.title ?? 'Test Rido',
    p_starts_at: o.starts ?? T(14, 19),
    p_ends_at: o.ends ?? T(15, 1),
    p_venue: 'Domaine test',
    p_directions: o.directions ?? ['outbound'],
  });

const joinArgs = (eventId, role, o = {}) => ({
  p_event_id: eventId,
  p_first_name: o.first ?? 'Testeur',
  p_last_name: 'Secretnom',
  p_phone: o.phone ?? '+972520000000',
  p_zone_place_id: o.placeId === undefined ? '295629' : o.placeId,
  p_zone_name: o.zone ?? 'Ashdod',
  p_role: role,
  p_directions: o.directions ?? ['outbound'],
  p_party_size: o.party ?? 1,
});
const join = (user, eventId, role, o) => rpc(user, 'join_event', joinArgs(eventId, role, o));

const OUTBOUND = { outbound: { from: T(14, 17), to: T(14, 18) } };
const publish = (user, eventId, seats, legs = OUTBOUND) =>
  rpc(user, 'publish_car', { p_event_id: eventId, p_seats: seats, p_legs: legs });

const markFound = (user, eventId, legId, direction = 'outbound') =>
  rpc(user, 'mark_found', { p_event_id: eventId, p_direction: direction, p_driver_leg_id: legId });
const searchAgain = (user, eventId, direction = 'outbound') =>
  rpc(user, 'search_again', { p_event_id: eventId, p_direction: direction });

async function legOf(viewer, eventId, participantId, direction = 'outbound') {
  const rows = await select(
    viewer,
    `driver_legs?event_id=eq.${enc(eventId)}&participant_id=eq.${participantId}&direction=eq.${direction}&select=*`
  );
  return rows[0];
}

const bookingsOf = (viewer, legId) =>
  select(viewer, `bookings?driver_leg_id=eq.${legId}&select=*&order=created_at`);
const bookedSeats = async (viewer, legId) =>
  (await bookingsOf(viewer, legId)).reduce((sum, b) => sum + b.seats, 0);
const passengerLeg = async (viewer, participantId, direction = 'outbound') =>
  (
    await select(
      viewer,
      `passenger_legs?participant_id=eq.${participantId}&direction=eq.${direction}&select=*`
    )
  )[0];
const participantsOf = (viewer, eventId) =>
  select(viewer, `participants?event_id=eq.${enc(eventId)}&select=*`);

/** Vide une voiture : les passagers cherchent à nouveau, les places notées sont libérées. */
async function emptyCar(driver, eventId, legId, passengers) {
  await Promise.all(passengers.map((p) => searchAgain(p, eventId)));
  while ((await bookedSeats(driver, legId)) > 0)
    await rpc(driver, 'release_seat', { p_leg_id: legId });
}

/** Abonnement Realtime (protocole Phoenix de Supabase) aux changements d'une table. */
function subscribe(user, table, filter) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(
      `${BASE.replace(/^http/, 'ws')}/realtime/v1/websocket?apikey=${KEY}&vsn=1.0.0`
    );
    const events = [];
    const sub = { events, close: () => ws.close() };
    let done = false;
    const finish = (error) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (error) {
        ws.close();
        reject(error);
      } else resolve(sub);
    };
    const timer = setTimeout(() => finish(new Error('Realtime : pas de réponse')), 15000);
    ws.onopen = () =>
      ws.send(
        JSON.stringify({
          topic: `realtime:rido-test-${table}-${user.id}`,
          event: 'phx_join',
          ref: '1',
          join_ref: '1',
          payload: {
            config: {
              broadcast: { self: false },
              presence: { key: '' },
              postgres_changes: [
                { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) },
              ],
            },
            access_token: user.token,
          },
        })
      );
    ws.onmessage = (message) => {
      const msg = JSON.parse(message.data);
      if (msg.event === 'phx_reply' && msg.payload?.status === 'error') {
        finish(new Error(`Realtime : ${JSON.stringify(msg.payload.response)}`));
      } else if (msg.event === 'system' && msg.payload?.extension === 'postgres_changes') {
        finish(msg.payload.status === 'ok' ? null : new Error(`Realtime : ${msg.payload.message}`));
      } else if (msg.event === 'postgres_changes') {
        events.push(msg.payload.data);
      }
    };
    ws.onerror = () => finish(new Error('Realtime : connexion impossible'));
  });
}

async function waitFor(predicate, ms = 10000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (predicate()) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return predicate();
}

// ---------------------------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------------------------

describe('Supabase en conditions réelles', { skip: SKIP }, () => {
  /** org : organisateur ; d1, d2 : conducteurs ; p1…p4 : passagers ; x : inconnu (pas de lien). */
  const u = {};
  const events = [];
  const newEvent = async (user, o) => {
    const id = await createEvent(user, o);
    events.push(id);
    return id;
  };

  before(async () => {
    // Une inscription à la fois : Supabase limite les rafales.
    for (const name of ['org', 'd1', 'd2', 'p1', 'p2', 'p3', 'p4', 'x']) u[name] = await signUp();
  });

  after(async () => {
    // Tout le monde sauf l'inconnu efface son compte ; l'inconnu vérifie qu'il ne reste rien.
    const others = accounts.filter((a) => a !== u.x);
    const results = await Promise.all(
      others.map((a) => request(a, '/rest/v1/rpc/delete_my_account', { method: 'POST', body: {} }))
    );
    if (u.x) {
      for (const id of events) {
        assert.equal(
          await rpc(u.x, 'event_preview', { p_id: id }),
          null,
          `événement restant : ${id}`
        );
      }
      await rpc(u.x, 'delete_my_account');
    }
    assert.ok(
      results.every((r) => r.ok),
      'un compte de test n’a pas pu être effacé'
    );
  });

  describe('sans connexion', () => {
    it('ne lit aucune table', async () => {
      for (const t of [
        'events',
        'participants',
        'driver_legs',
        'passenger_legs',
        'bookings',
        'profiles',
      ]) {
        const res = await request(null, `/rest/v1/${t}?select=*&limit=1`);
        assert.ok(!res.ok || res.data.length === 0, `${t} lisible sans connexion`);
      }
    });

    it('n’appelle aucune fonction', async () => {
      for (const fn of ['create_event', 'event_preview', 'join_event', 'delete_my_account']) {
        const res = await request(null, `/rest/v1/rpc/${fn}`, { method: 'POST', body: {} });
        assert.equal(res.ok, false, `${fn} appelable sans connexion`);
      }
    });
  });

  describe('lien de partage et confidentialité', () => {
    let ev;
    let other;

    before(async () => {
      ev = await newEvent(u.org, { slug: 'mariage-test', directions: ['outbound', 'return'] });
      await join(u.d1, ev, 'driver', { phone: '+972521111111' });
      await publish(u.d1, ev, 3);
      await join(u.p1, ev, 'passenger', {
        phone: '+972522222222',
        party: 2,
        placeId: '293397',
        zone: 'Tel Aviv',
      });
      // Saisie libre (sans lieu de la base) : pourrait être une adresse exacte.
      await join(u.p2, ev, 'passenger', {
        phone: '+972523333333',
        placeId: '',
        zone: '12 rue Secrète',
      });
      other = await newEvent(u.d2, { slug: 'autre-fete' });
      await join(u.d2, other, 'driver', { phone: '+972524444444' });
    });

    it('donne un lien impossible à deviner', () => {
      assert.match(ev, /^mariage-test-[0-9a-f]{32}$/);
    });

    it('accepte un lien en hébreu', async () => {
      const id = await newEvent(u.org, { slug: 'חתונה של דנה', title: 'חתונה' });
      assert.match(id, /^חתונה-של-דנה-[0-9a-f]{32}$/);
    });

    it('montre l’invitation à qui a le lien, sans nom, numéro ni adresse', async () => {
      const preview = await rpc(u.x, 'event_preview', { p_id: ev });
      assert.equal(preview.title, 'Test Rido');
      assert.equal(preview.guests_count, 4);
      assert.equal(preview.seats_offered, 3);
      assert.deepEqual(
        preview.zones.map((z) => [z.name, z.count]),
        [
          ['Tel Aviv', 2],
          ['Ashdod', 1],
        ]
      );
      const text = JSON.stringify(preview);
      for (const secret of ['97252', 'Secretnom', 'Testeur', 'Secrète']) {
        assert.ok(!text.includes(secret), `l’aperçu contient « ${secret} »`);
      }
    });

    it('ne révèle rien d’un lien inconnu', async () => {
      assert.equal(
        await rpc(u.x, 'event_preview', { p_id: 'mariage-test-0123456789abcdef' }),
        null
      );
    });

    it('cache tout aux inconnus, même en listant toutes les tables', async () => {
      for (const t of [
        'events',
        'participants',
        'driver_legs',
        'passenger_legs',
        'bookings',
        'profiles',
      ]) {
        assert.deepEqual(await select(u.x, `${t}?select=*`), [], `${t} visible par un inconnu`);
      }
    });

    it('montre les inscrits et leurs numéros aux participants', async () => {
      const rows = await participantsOf(u.p1, ev);
      assert.deepEqual(rows.map((r) => r.phone).sort(), [
        '+972521111111',
        '+972522222222',
        '+972523333333',
      ]);
      assert.equal((await select(u.p2, `driver_legs?event_id=eq.${enc(ev)}&select=id`)).length, 1);
    });

    it('montre son événement à l’organisateur, même s’il ne s’y inscrit pas', async () => {
      assert.equal((await select(u.org, `events?id=eq.${enc(ev)}&select=id`)).length, 1);
      assert.equal((await participantsOf(u.org, ev)).length, 3);
    });

    it('ne montre pas les autres événements à un participant', async () => {
      assert.deepEqual(await participantsOf(u.p1, other), []);
      assert.deepEqual(await select(u.p1, `events?id=eq.${enc(other)}&select=id`), []);
      const mine = await select(u.p1, 'events?select=id');
      assert.deepEqual(
        mine.map((e) => e.id),
        [ev]
      );
    });

    it('refuse toute écriture directe dans les tables', async () => {
      const attempts = [
        [
          'POST',
          'events',
          {
            id: 'pirate-abc',
            type: 'other',
            title: 'x',
            starts_at: T(1, 1),
            ends_at: T(1, 2),
            venue: 'x',
            country: 'IL',
            directions: ['outbound'],
            organizer_id: u.p1.id,
          },
        ],
        ['PATCH', `events?id=eq.${enc(ev)}`, { title: 'Piraté' }],
        ['DELETE', `events?id=eq.${enc(ev)}`],
        [
          'POST',
          'participants',
          {
            event_id: ev,
            user_id: u.x.id,
            first_name: 'a',
            last_name: 'b',
            phone: '+972520000001',
            zone_name: 'z',
            role: 'passenger',
            directions: ['outbound'],
          },
        ],
        ['PATCH', `participants?event_id=eq.${enc(ev)}`, { phone: '+972529999999' }],
        ['DELETE', `participants?event_id=eq.${enc(ev)}`],
        ['PATCH', `driver_legs?event_id=eq.${enc(ev)}`, { total_seats: 8 }],
        ['DELETE', `driver_legs?event_id=eq.${enc(ev)}`],
        ['PATCH', `passenger_legs?event_id=eq.${enc(ev)}`, { found_elsewhere: true }],
        [
          'POST',
          'bookings',
          { event_id: ev, driver_leg_id: '00000000-0000-0000-0000-000000000000', seats: 1 },
        ],
        ['DELETE', `bookings?event_id=eq.${enc(ev)}`],
      ];
      for (const [method, path, body] of attempts) {
        const res = await request(u.p1, `/rest/v1/${path}`, {
          method,
          body,
          prefer: 'return=minimal',
        });
        assert.equal(res.ok, false, `${method} ${path.split('?')[0]} accepté`);
      }
      const [event] = await select(u.org, `events?id=eq.${enc(ev)}&select=title`);
      assert.equal(event.title, 'Test Rido');
      assert.equal((await participantsOf(u.org, ev)).length, 3);
    });

    it('réserve la modification et la suppression à l’organisateur', async () => {
      assert.match(
        await refused(u.p1, 'update_event', {
          p_id: ev,
          p_type: 'other',
          p_title: 'Piraté',
          p_starts_at: T(14, 19),
          p_ends_at: T(15, 1),
          p_venue: 'x',
          p_directions: ['outbound'],
        }),
        /event not found/
      );
      assert.match(await refused(u.x, 'delete_event', { p_id: ev }), /event not found/);
      assert.match(await refused(u.p1, 'delete_event', { p_id: ev }), /event not found/);
    });

    it('empêche de toucher à la voiture ou aux trajets des autres', async () => {
      const leg = await legOf(
        u.org,
        ev,
        (await participantsOf(u.org, ev)).find((p) => p.role === 'driver').id
      );
      assert.match(await refused(u.p1, 'take_seat', { p_leg_id: leg.id }), /ride not found/);
      assert.match(await refused(u.p1, 'release_seat', { p_leg_id: leg.id }), /ride not found/);
      assert.match(
        await refused(u.x, 'mark_found', {
          p_event_id: ev,
          p_direction: 'outbound',
          p_driver_leg_id: leg.id,
        }),
        /not a passenger/
      );
      assert.match(
        await refused(u.p1, 'publish_car', { p_event_id: ev, p_seats: 8, p_legs: OUTBOUND }),
        /not a driver/
      );
      // Passager d'un événement, voiture d'un autre événement.
      const otherLeg = (await select(u.d2, `driver_legs?event_id=eq.${enc(other)}&select=id`))[0];
      assert.equal(otherLeg, undefined); // d2 n'a pas encore publié
      await publish(u.d2, other, 2);
      const [{ id: otherLegId }] = await select(
        u.d2,
        `driver_legs?event_id=eq.${enc(other)}&select=id`
      );
      assert.match(
        await refused(u.p1, 'mark_found', {
          p_event_id: ev,
          p_direction: 'outbound',
          p_driver_leg_id: otherLegId,
        }),
        /ride not found/
      );
      assert.equal(await bookedSeats(u.d2, otherLegId), 0);
    });
  });

  describe('profil', () => {
    const profile = (user, phone) => ({
      user_id: user.id,
      first_name: 'Prénom',
      last_name: 'Nom',
      phone,
    });

    it('se crée, se lit et se modifie par soi-même uniquement', async () => {
      const created = await request(u.p3, '/rest/v1/profiles', {
        method: 'POST',
        body: profile(u.p3, '+972525555555'),
        prefer: 'return=minimal',
      });
      assert.ok(created.ok, JSON.stringify(created.data));
      const updated = await request(u.p3, `/rest/v1/profiles?user_id=eq.${u.p3.id}`, {
        method: 'PATCH',
        body: { car_seats: 5 },
        prefer: 'return=minimal',
      });
      assert.ok(updated.ok, JSON.stringify(updated.data));
      const [mine] = await select(u.p3, 'profiles?select=*');
      assert.equal(mine.car_seats, 5);
    });

    it('reste invisible et intouchable pour les autres', async () => {
      assert.deepEqual(await select(u.p4, 'profiles?select=*'), []);
      const forged = await request(u.p4, '/rest/v1/profiles', {
        method: 'POST',
        body: profile(u.p3, '+972526666666'),
        prefer: 'return=minimal',
      });
      assert.equal(forged.ok, false, 'profil créé au nom d’un autre');
      await request(u.p4, `/rest/v1/profiles?user_id=eq.${u.p3.id}`, {
        method: 'PATCH',
        body: { phone: '+972527777777' },
        prefer: 'return=minimal',
      });
      await request(u.p4, `/rest/v1/profiles?user_id=eq.${u.p3.id}`, {
        method: 'DELETE',
        prefer: 'return=minimal',
      });
      const [mine] = await select(u.p3, 'profiles?select=phone');
      assert.equal(mine.phone, '+972525555555');
    });

    it('refuse un numéro mal écrit', async () => {
      const res = await request(u.p4, '/rest/v1/profiles', {
        method: 'POST',
        body: profile(u.p4, '0612'),
        prefer: 'return=minimal',
      });
      assert.equal(res.ok, false);
    });
  });

  describe('données invalides', () => {
    let ev;
    before(async () => {
      ev = await newEvent(u.org, { slug: 'invalide' });
      await join(u.d1, ev, 'driver');
    });

    it('refuse un événement incohérent', async () => {
      const base = {
        p_slug_base: 'x',
        p_type: 'wedding',
        p_title: 'x',
        p_starts_at: T(14, 19),
        p_ends_at: T(15, 1),
        p_venue: 'x',
        p_country: 'IL',
        p_directions: ['outbound'],
      };
      for (const bad of [
        { p_ends_at: T(14, 18) },
        { p_type: 'party' },
        { p_title: 'x'.repeat(121) },
        { p_title: '   ' },
        { p_country: 'israel' },
        { p_directions: [] },
        { p_directions: ['outbound', 'outbound'] },
        { p_directions: ['ailleurs'] },
      ]) {
        await refused(u.org, 'create_event', { ...base, ...bad });
      }
    });

    it('refuse une inscription incohérente', async () => {
      await refused(u.p1, 'join_event', joinArgs(ev, 'passenger', { phone: '0612345678' }));
      await refused(u.p1, 'join_event', joinArgs(ev, 'passenger', { party: 9 }));
      await refused(u.p1, 'join_event', joinArgs(ev, 'passenger', { party: 0 }));
      await refused(u.p1, 'join_event', joinArgs(ev, 'chauffeur'));
      assert.match(
        await refused(u.p1, 'join_event', joinArgs(ev, 'passenger', { directions: ['return'] })),
        /direction not offered/
      );
      assert.match(
        await refused(u.p1, 'join_event', joinArgs('lien-inconnu-0123', 'passenger')),
        /event not found/
      );
      assert.equal((await participantsOf(u.org, ev)).length, 1);
    });

    it('refuse une voiture incohérente', async () => {
      await refused(u.d1, 'publish_car', { p_event_id: ev, p_seats: 9, p_legs: OUTBOUND });
      assert.match(
        await refused(u.d1, 'publish_car', { p_event_id: ev, p_seats: 3, p_legs: {} }),
        /at least one trip/
      );
      assert.match(
        await refused(u.d1, 'publish_car', {
          p_event_id: ev,
          p_seats: 3,
          p_legs: { return: { from: T(15, 1) } },
        }),
        /direction not offered/
      );
      await refused(u.d1, 'publish_car', {
        p_event_id: ev,
        p_seats: 3,
        p_legs: { outbound: { from: T(14, 18), to: T(14, 17) } },
      });
      assert.equal(await legOf(u.d1, ev, (await participantsOf(u.d1, ev))[0].id), undefined);
    });
  });

  describe('places et réservations', () => {
    let ev;
    let leg;
    const pid = {};

    before(async () => {
      ev = await newEvent(u.org, { slug: 'places' });
      pid.d1 = await join(u.d1, ev, 'driver');
      await publish(u.d1, ev, 3);
      leg = (await legOf(u.d1, ev, pid.d1)).id;
      pid.p1 = await join(u.p1, ev, 'passenger', { first: 'Paul', party: 2 });
      pid.p2 = await join(u.p2, ev, 'passenger', { first: 'Pia', party: 2 });
      pid.p3 = await join(u.p3, ev, 'passenger', { first: 'Pierre' });
    });

    it('réserve pour tout le groupe et refuse ce qui ne tient pas', async () => {
      await markFound(u.p1, ev, leg);
      assert.equal(await bookedSeats(u.d1, leg), 2);
      assert.match(
        await refused(u.p2, 'mark_found', {
          p_event_id: ev,
          p_direction: 'outbound',
          p_driver_leg_id: leg,
        }),
        /not enough free seats/
      );
      await markFound(u.p3, ev, leg);
      assert.equal(await bookedSeats(u.d1, leg), 3);
      assert.match(await refused(u.d1, 'take_seat', { p_leg_id: leg }), /car is full/);
      const [paul] = await bookingsOf(u.p3, leg);
      assert.equal(paul.name, 'Paul');
    });

    it('suit la taille du groupe, ou rend la place si le groupe ne tient plus', async () => {
      await join(u.p1, ev, 'passenger', { first: 'Paul', party: 3 }); // 2 → 3 : il manque une place
      assert.equal(await bookedSeats(u.d1, leg), 1);
      await join(u.p1, ev, 'passenger', { first: 'Paul', party: 2 });
      await markFound(u.p1, ev, leg);
      await join(u.p1, ev, 'passenger', { first: 'Paul', party: 1 }); // 2 → 1 : il garde sa place
      assert.equal(await bookedSeats(u.d1, leg), 2);
      assert.equal((await participantsOf(u.d1, ev)).length, 4);
    });

    it('ne descend jamais le nombre de places sous les places prises', async () => {
      await publish(u.d1, ev, 1);
      assert.equal((await legOf(u.d1, ev, pid.d1)).total_seats, 2);
      await publish(u.d1, ev, 3);
      assert.equal((await legOf(u.d1, ev, pid.d1)).total_seats, 3);
    });

    it('libère d’abord une place notée à la main, puis le dernier passager', async () => {
      await rpc(u.d1, 'take_seat', { p_leg_id: leg });
      assert.equal(await bookedSeats(u.d1, leg), 3);
      await rpc(u.d1, 'release_seat', { p_leg_id: leg }); // la place notée
      const left = await bookingsOf(u.d1, leg);
      assert.equal(left.length, 2);
      assert.ok(left.every((b) => b.passenger_leg_id !== null));
      await rpc(u.d1, 'release_seat', { p_leg_id: leg }); // Paul, réservé en dernier
      const [only] = await bookingsOf(u.d1, leg);
      assert.equal(only.name, 'Pierre');
    });

    it('« trouvé autrement » puis « je cherche encore »', async () => {
      await rpc(u.p2, 'mark_found', { p_event_id: ev, p_direction: 'outbound' });
      assert.equal((await passengerLeg(u.p2, pid.p2)).found_elsewhere, true);
      await searchAgain(u.p2, ev);
      assert.equal((await passengerLeg(u.p2, pid.p2)).found_elsewhere, false);
      await searchAgain(u.p3, ev);
      assert.equal(await bookedSeats(u.d1, leg), 0);
      assert.match(
        await refused(u.p2, 'search_again', { p_event_id: ev, p_direction: 'return' }),
        /no such trip/
      );
    });
  });

  describe('changement de rôle et annulation', () => {
    let ev;
    const pid = {};
    const carOf = async (who) => legOf(u.org, ev, pid[who]);

    before(async () => {
      ev = await newEvent(u.org, { slug: 'roles' });
      pid.d1 = await join(u.d1, ev, 'driver');
      await publish(u.d1, ev, 2);
      pid.d2 = await join(u.d2, ev, 'driver');
      await publish(u.d2, ev, 2);
      pid.p1 = await join(u.p1, ev, 'passenger');
      pid.p2 = await join(u.p2, ev, 'passenger');
    });

    it('un conducteur qui devient passager retire sa voiture ; ses passagers cherchent à nouveau', async () => {
      await markFound(u.p1, ev, (await carOf('d1')).id);
      assert.equal(await join(u.d1, ev, 'passenger'), pid.d1);
      assert.equal(await carOf('d1'), undefined);
      assert.deepEqual(await select(u.p1, `bookings?event_id=eq.${enc(ev)}&select=id`), []);
      assert.ok(await passengerLeg(u.d1, pid.d1));
    });

    it('un passager qui devient conducteur rend sa place', async () => {
      const car = (await carOf('d2')).id;
      await markFound(u.p1, ev, car);
      await join(u.p1, ev, 'driver');
      assert.equal(await passengerLeg(u.org, pid.p1), undefined);
      assert.equal(await bookedSeats(u.org, car), 0);
    });

    it('« je ne peux plus conduire » : la voiture disparaît, ses passagers restent inscrits', async () => {
      await markFound(u.p2, ev, (await carOf('d2')).id);
      await rpc(u.d2, 'cancel_driving', { p_event_id: ev });
      const people = await participantsOf(u.org, ev);
      assert.equal(
        people.find((p) => p.id === pid.d2),
        undefined
      );
      assert.ok(people.find((p) => p.id === pid.p2));
      assert.deepEqual(await select(u.p2, `bookings?event_id=eq.${enc(ev)}&select=id`), []);
      // d2 ne fait plus partie de l'événement : il ne le voit plus.
      assert.deepEqual(await participantsOf(u.d2, ev), []);
    });
  });

  describe('modification et suppression de l’événement', () => {
    let ev;
    const pid = {};

    before(async () => {
      ev = await newEvent(u.org, { slug: 'modif', directions: ['outbound', 'return'] });
      pid.d1 = await join(u.d1, ev, 'driver', { directions: ['outbound', 'return'] });
      await publish(u.d1, ev, 3, {
        outbound: { from: T(14, 17), to: T(14, 18) },
        return: { from: T(15, 1, 30) },
      });
      pid.p1 = await join(u.p1, ev, 'passenger', { directions: ['return'] });
      pid.p2 = await join(u.p2, ev, 'passenger', { directions: ['outbound', 'return'] });
      await markFound(u.p2, ev, (await legOf(u.d1, ev, pid.d1, 'return')).id, 'return');
    });

    it('décale les départs avec le nouvel horaire', async () => {
      await updateEvent(u.org, ev, {
        starts: T(14, 20),
        ends: T(15, 3),
        directions: ['outbound', 'return'],
      });
      const out = await legOf(u.d1, ev, pid.d1, 'outbound');
      const ret = await legOf(u.d1, ev, pid.d1, 'return');
      sameTime(out.departure_from, T(14, 18));
      sameTime(out.departure_to, T(14, 19));
      sameTime(ret.departure_from, T(15, 3, 30));
      assert.equal(ret.departure_to, null);
    });

    it('retirer le retour retire les trajets et les inscriptions qui en dépendent', async () => {
      await updateEvent(u.org, ev, { starts: T(14, 20), ends: T(15, 3), directions: ['outbound'] });
      const people = await participantsOf(u.org, ev);
      assert.equal(
        people.find((p) => p.id === pid.p1),
        undefined,
        'inscrit au retour seul : retiré'
      );
      assert.deepEqual(people.find((p) => p.id === pid.p2).directions, ['outbound']);
      assert.deepEqual(people.find((p) => p.id === pid.d1).directions, ['outbound']);
      assert.equal(await legOf(u.d1, ev, pid.d1, 'return'), undefined);
      assert.deepEqual(await select(u.p2, `bookings?event_id=eq.${enc(ev)}&select=id`), []);
      assert.deepEqual(
        await select(
          u.p2,
          `passenger_legs?participant_id=eq.${pid.p2}&direction=eq.return&select=id`
        ),
        []
      );
      const [event] = await select(u.p2, `events?id=eq.${enc(ev)}&select=directions,starts_at`);
      assert.deepEqual(event.directions, ['outbound']);
    });

    it('la suppression par l’organisateur efface tout', async () => {
      await rpc(u.org, 'delete_event', { p_id: ev });
      assert.equal(await rpc(u.x, 'event_preview', { p_id: ev }), null);
      assert.deepEqual(await participantsOf(u.d1, ev), []);
      assert.deepEqual(await select(u.d1, `driver_legs?event_id=eq.${enc(ev)}&select=id`), []);
    });
  });

  describe('accès simultanés', () => {
    let ev;
    let leg;
    const pid = {};
    const passengers = () => [u.p1, u.p2, u.p3, u.p4];

    before(async () => {
      ev = await newEvent(u.org, { slug: 'simultane' });
      pid.d1 = await join(u.d1, ev, 'driver');
      await publish(u.d1, ev, 2);
      leg = (await legOf(u.d1, ev, pid.d1)).id;
      for (const [i, p] of passengers().entries())
        pid[`p${i + 1}`] = await join(p, ev, 'passenger');
    });

    it('4 passagers, 2 places, au même instant : exactement 2 acceptés (5 essais)', async () => {
      for (let round = 1; round <= 5; round++) {
        const results = await Promise.allSettled(passengers().map((p) => markFound(p, ev, leg)));
        const won = results.filter((r) => r.status === 'fulfilled').length;
        const reasons = results.filter((r) => r.status === 'rejected').map((r) => r.reason.message);
        assert.equal(won, 2, `essai ${round} : ${won} acceptés`);
        assert.ok(
          reasons.every((m) => /not enough free seats/.test(m)),
          reasons.join(' | ')
        );
        assert.equal(await bookedSeats(u.d1, leg), 2);
        await emptyCar(u.d1, ev, leg, passengers());
      }
    });

    it('le conducteur note des places pendant que des passagers réservent : jamais plus que la voiture', async () => {
      for (let round = 1; round <= 3; round++) {
        const results = await Promise.allSettled([
          rpc(u.d1, 'take_seat', { p_leg_id: leg }),
          rpc(u.d1, 'take_seat', { p_leg_id: leg }),
          ...passengers().map((p) => markFound(p, ev, leg)),
        ]);
        assert.equal(results.filter((r) => r.status === 'fulfilled').length, 2, `essai ${round}`);
        assert.equal(await bookedSeats(u.d1, leg), 2);
        await emptyCar(u.d1, ev, leg, passengers());
      }
    });

    it('le conducteur réduit ses places pendant que des passagers réservent', async () => {
      await publish(u.d1, ev, 4);
      await Promise.allSettled([
        publish(u.d1, ev, 1),
        ...passengers().map((p) => markFound(p, ev, leg)),
      ]);
      const { total_seats } = await legOf(u.d1, ev, pid.d1);
      const booked = await bookedSeats(u.d1, leg);
      assert.ok(booked <= total_seats, `${booked} places prises pour ${total_seats}`);
      assert.ok(total_seats >= 1);
      await emptyCar(u.d1, ev, leg, passengers());
      await publish(u.d1, ev, 2);
    });

    it('un groupe qui grandit pendant que d’autres réservent : jamais plus que la voiture', async () => {
      await publish(u.d1, ev, 3);
      await markFound(u.p1, ev, leg);
      await Promise.allSettled([
        join(u.p1, ev, 'passenger', { party: 2 }),
        markFound(u.p2, ev, leg),
        markFound(u.p3, ev, leg),
      ]);
      const booked = await bookedSeats(u.d1, leg);
      assert.ok(booked <= 3, `${booked} places prises pour 3`);
      await emptyCar(u.d1, ev, leg, passengers());
      await join(u.p1, ev, 'passenger');
    });

    it('la même personne qui s’inscrit deux fois d’un coup n’a qu’une inscription', async () => {
      const lone = await newEvent(u.org, { slug: 'double' });
      const ids = await Promise.allSettled([
        join(u.p4, lone, 'passenger'),
        join(u.p4, lone, 'passenger'),
        join(u.p4, lone, 'passenger'),
      ]);
      assert.ok(ids.some((r) => r.status === 'fulfilled'));
      assert.equal((await participantsOf(u.org, lone)).length, 1);
      assert.equal(
        (await select(u.org, `passenger_legs?event_id=eq.${enc(lone)}&select=id`)).length,
        1
      );
    });
  });

  describe('mises à jour en direct (Realtime)', () => {
    let ev;
    let leg;
    const subs = [];

    before(async () => {
      ev = await newEvent(u.org, { slug: 'direct' });
      await join(u.d1, ev, 'driver');
      await publish(u.d1, ev, 2);
      leg = (await legOf(u.d1, ev, (await participantsOf(u.d1, ev))[0].id)).id;
    });

    after(() => subs.forEach((s) => s.close()));

    it('un participant voit arriver les inscriptions et les réservations ; un inconnu ne voit rien', async () => {
      const [member, memberBookings, stranger, strangerBookings] = await Promise.all([
        subscribe(u.d1, 'participants', `event_id=eq.${ev}`),
        subscribe(u.d1, 'bookings'),
        subscribe(u.x, 'participants'),
        subscribe(u.x, 'bookings'),
      ]);
      subs.push(member, memberBookings, stranger, strangerBookings);

      await join(u.p1, ev, 'passenger', { phone: '+972528888888' });
      await markFound(u.p1, ev, leg);

      assert.ok(
        await waitFor(() =>
          member.events.some((e) => e.type === 'INSERT' && e.record?.phone === '+972528888888')
        ),
        'le conducteur n’a pas reçu l’inscription'
      );
      assert.ok(
        await waitFor(() =>
          memberBookings.events.some((e) => e.type === 'INSERT' && e.record?.driver_leg_id === leg)
        ),
        'le conducteur n’a pas reçu la réservation'
      );
      await new Promise((r) => setTimeout(r, 2000));
      const leaked = [...stranger.events, ...strangerBookings.events].filter(
        (e) => e.type !== 'DELETE'
      );
      assert.deepEqual(leaked, [], 'un inconnu a reçu des données');
    });
  });
});
