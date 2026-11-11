// Teste le schéma Supabase sur une vraie base Postgres (PGlite, en mémoire) où l'on recrée ce que
// Supabase fournit : les rôles « anon » / « authenticated » et auth.uid().
// Lancer avec : npm run test:db
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { before, describe, it } from 'node:test';

import { PGlite } from '@electric-sql/pglite';

// Toutes les mises à jour de la base, dans l'ordre (comme sur Supabase).
// `MIGRATION_FILE` remplace la mise à jour du même nom par une autre version (pour vérifier que les
// tests détectent une faille).
const MIGRATIONS_DIR = new URL('../migrations/', import.meta.url);
const MIGRATIONS = readdirSync(MIGRATIONS_DIR)
  .filter((name) => name.endsWith('.sql'))
  .sort()
  .map((name) =>
    process.env.MIGRATION_FILE && basename(process.env.MIGRATION_FILE) === name
      ? process.env.MIGRATION_FILE
      : new URL(name, MIGRATIONS_DIR)
  );

const db = new PGlite();

// Ce que Supabase fournit d'office.
const SUPABASE_STUBS = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid());
  create function auth.uid() returns uuid language sql stable
    as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant usage on schema public to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`;

const users = {};

async function newUser(name) {
  const { rows } = await db.query('insert into auth.users default values returning id');
  users[name] = rows[0].id;
}

/** Exécute `fn` comme un utilisateur connecté (ou anonyme, sans connexion, si `name` est null). */
async function as(name, fn) {
  const role = name === null ? 'anon' : 'authenticated';
  await db.exec(
    `set role ${role}; select set_config('request.jwt.claim.sub', '${users[name] ?? ''}', false)`
  );
  try {
    return await fn();
  } finally {
    await db.exec('reset role');
  }
}

const q = async (sql, params) => (await db.query(sql, params)).rows;
const rpc = (name, ...args) => {
  const marks = args.map((_, i) => `$${i + 1}`).join(', ');
  return q(`select public.${name}(${marks}) as result`, args).then((rows) => rows[0].result);
};

const T = (day, hour, minute = 0) => new Date(Date.UTC(2027, 5, day, hour, minute)).toISOString();
const EVENT = {
  type: 'wedding',
  title: 'Mariage de Léa et Samuel',
  starts: T(14, 19, 30),
  ends: T(15, 1),
  venue: 'Domaine des Oliviers',
  country: 'IL',
  directions: ['outbound', 'return'],
};

async function createEvent(user, overrides = {}) {
  const e = { ...EVENT, ...overrides };
  return as(user, () =>
    rpc(
      'create_event',
      'lea-samuel',
      e.type,
      e.title,
      e.starts,
      e.ends,
      e.venue,
      e.country,
      e.directions,
      'Léa Cohen'
    )
  );
}

const join = (user, eventId, role, extra = {}) =>
  as(user, () =>
    rpc(
      'join_event',
      eventId,
      extra.first ?? user,
      extra.last ?? 'Test',
      extra.phone ?? '+972521234567',
      extra.placeId ?? '295629',
      extra.zone ?? 'Ashdod',
      role,
      extra.directions ?? ['outbound', 'return'],
      extra.party ?? 1
    )
  );

const publish = (user, eventId, seats, legs) =>
  as(user, () => rpc('publish_car', eventId, seats, JSON.stringify(legs)));
const outboundLeg = { outbound: { from: T(14, 18), to: T(14, 18, 30) } };

const count = (sql, params) => q(sql, params).then((rows) => Number(rows[0].n));
const legOf = (participantFirstName, direction) =>
  q(
    `select l.id from public.driver_legs l join public.participants p on p.id = l.participant_id
      where p.first_name = $1 and l.direction = $2`,
    [participantFirstName, direction]
  ).then((rows) => rows[0]?.id);

before(async () => {
  await db.exec(SUPABASE_STUBS);
  for (const file of MIGRATIONS) await db.exec(readFileSync(file, 'utf8'));
  for (const name of ['olivia', 'ben', 'carol', 'dan', 'eve']) await newUser(name);
});

describe('création et lien secret', () => {
  it('donne à l’événement un lien avec une partie aléatoire', async () => {
    const id = await createEvent('olivia');
    assert.match(id, /^lea-samuel-[0-9a-f]{32}$/);
    const other = await createEvent('olivia');
    assert.notEqual(id, other);
    assert.ok(id.length <= 80);
  });

  it('accepte un nom en hébreu et ne renvoie jamais un lien vide', async () => {
    const hebrew = await as('olivia', () =>
      rpc(
        'create_event',
        'החתונה של לאה',
        EVENT.type,
        'x',
        EVENT.starts,
        EVENT.ends,
        'מקום',
        'IL',
        EVENT.directions,
        null
      )
    );
    assert.match(hebrew, /^החתונה-של-לאה-[0-9a-f]{32}$/);
    const empty = await as('olivia', () =>
      rpc(
        'create_event',
        '!!!',
        EVENT.type,
        '!!!',
        EVENT.starts,
        EVENT.ends,
        'x',
        'IL',
        EVENT.directions,
        null
      )
    );
    assert.match(empty, /^evenement-[0-9a-f]{32}$/);
  });

  it('refuse les données invalides', async () => {
    await assert.rejects(createEvent('olivia', { ends: EVENT.starts }), /check/i);
    await assert.rejects(createEvent('olivia', { directions: [] }), /check/i);
    await assert.rejects(createEvent('olivia', { directions: ['outbound', 'outbound'] }), /check/i);
    await assert.rejects(createEvent('olivia', { type: 'autre' }), /check/i);
  });

  it('exige d’être connecté', async () => {
    await assert.rejects(createEvent(null), /permission denied/i);
  });
});

describe('confidentialité', () => {
  let eventId;
  before(async () => {
    eventId = await createEvent('olivia');
    await join('ben', eventId, 'passenger', { first: 'Ben', phone: '+972521110001' });
  });

  it('ne montre un événement qu’à son organisateur et à ses participants', async () => {
    assert.equal(
      await as('olivia', () =>
        count('select count(*) n from public.events where id = $1', [eventId])
      ),
      1
    );
    assert.equal(
      await as('ben', () => count('select count(*) n from public.events where id = $1', [eventId])),
      1
    );
    assert.equal(
      await as('carol', () =>
        count('select count(*) n from public.events where id = $1', [eventId])
      ),
      0
    );
  });

  it('cache les inscrits et leurs numéros à qui n’a que le lien', async () => {
    assert.equal(await as('carol', () => count('select count(*) n from public.participants')), 0);
    assert.equal(await as('carol', () => count('select count(*) n from public.driver_legs')), 0);
    assert.equal(await as('carol', () => count('select count(*) n from public.bookings')), 0);
    const seen = await as('ben', () =>
      q('select phone from public.participants where event_id = $1', [eventId])
    );
    assert.deepEqual(
      seen.map((r) => r.phone),
      ['+972521110001']
    );
  });

  it('donne un aperçu sans aucune donnée personnelle', async () => {
    const preview = await as('carol', () => rpc('event_preview', eventId));
    assert.equal(preview.title, EVENT.title);
    assert.equal(preview.guests_count, 1);
    assert.deepEqual(preview.zones, [{ place_id: '295629', count: 1 }]);
    const text = JSON.stringify(preview);
    assert.doesNotMatch(text, /972521110001|Ben|Ashdod/);
    assert.equal(await as('carol', () => rpc('event_preview', 'inconnu-0000000000')), null);
  });

  it('interdit toute écriture directe dans les tables', async () => {
    await assert.rejects(
      as('ben', () =>
        q(
          "insert into public.events (id, type, title, starts_at, ends_at, venue, country, directions, organizer_id) values ('pirate-1234567890','other','x',now(),now() + interval '1 hour','x','IL','{outbound}',$1)",
          [users.ben]
        )
      ),
      /permission denied/i
    );
    await assert.rejects(
      as('ben', () => q('update public.participants set role = $1', ['driver'])),
      /permission denied/i
    );
    await assert.rejects(
      as('ben', () => q('delete from public.events')),
      /permission denied/i
    );
    await assert.rejects(
      as('ben', () =>
        q(
          'insert into public.bookings (event_id, driver_leg_id, seats) values ($1, gen_random_uuid(), 1)',
          [eventId]
        )
      ),
      /permission denied/i
    );
  });

  it('refuse qu’un inconnu modifie ou supprime l’événement', async () => {
    await assert.rejects(
      as('carol', () =>
        rpc(
          'update_event',
          eventId,
          'other',
          'Piraté',
          EVENT.starts,
          EVENT.ends,
          'x',
          EVENT.directions
        )
      ),
      /event not found/
    );
    await assert.rejects(
      as('ben', () => rpc('delete_event', eventId)),
      /event not found/
    );
    assert.equal(await count('select count(*) n from public.events where id = $1', [eventId]), 1);
  });

  it('refuse de s’inscrire sans être connecté ou à un trajet non proposé', async () => {
    await assert.rejects(
      as(null, () =>
        rpc(
          'join_event',
          eventId,
          'A',
          'B',
          '+972521234567',
          null,
          'x',
          'passenger',
          ['outbound'],
          1
        )
      ),
      /permission denied/i
    );
    const outboundOnly = await createEvent('olivia', { directions: ['outbound'] });
    await assert.rejects(
      join('carol', outboundOnly, 'passenger', { directions: ['return'] }),
      /direction not offered/
    );
  });

  it('garde le profil privé', async () => {
    await as('ben', () =>
      q(
        "insert into public.profiles (user_id, first_name, last_name, phone) values ($1, 'Ben', 'Test', '+972521110001')",
        [users.ben]
      )
    );
    assert.equal(await as('carol', () => count('select count(*) n from public.profiles')), 0);
    assert.equal(await as('ben', () => count('select count(*) n from public.profiles')), 1);
    await assert.rejects(
      as('carol', () =>
        q(
          "insert into public.profiles (user_id, first_name, last_name, phone) values ($1, 'X', 'Y', '+972521110002')",
          [users.ben]
        )
      ),
      /row-level security/i
    );
  });

  it('refuse un numéro de téléphone invalide', async () => {
    await assert.rejects(join('dan', eventId, 'passenger', { phone: '0521234567' }), /check/i);
  });
});

describe('voitures et places', () => {
  let eventId;
  before(async () => {
    eventId = await createEvent('olivia');
    await join('olivia', eventId, 'driver', { first: 'Olivia' });
    await publish('olivia', eventId, 3, outboundLeg);
  });

  const outboundOf = async () => legOf('Olivia', 'outbound');

  it('publie la voiture avec ses horaires et ses places', async () => {
    const [leg] = await q(
      'select total_seats, departure_from, departure_to from public.driver_legs where id = $1',
      [await outboundOf()]
    );
    assert.equal(leg.total_seats, 3);
    assert.equal(new Date(leg.departure_from).toISOString(), T(14, 18));
    assert.equal(
      await count(
        "select count(*) n from public.driver_legs where direction = 'return' and event_id = $1",
        [eventId]
      ),
      0
    );
  });

  it('réserve la place d’un passager, et refuse de dépasser la capacité', async () => {
    await join('ben', eventId, 'passenger', { first: 'Ben', party: 2, directions: ['outbound'] });
    const car = await outboundOf();
    await as('ben', () => rpc('mark_found', eventId, 'outbound', car));
    assert.equal(
      await count('select coalesce(sum(seats),0) n from public.bookings where driver_leg_id = $1', [
        car,
      ]),
      2
    );

    await join('carol', eventId, 'passenger', {
      first: 'Carol',
      party: 2,
      directions: ['outbound'],
    });
    await assert.rejects(
      as('carol', () => rpc('mark_found', eventId, 'outbound', car)),
      /not enough free seats/
    );
    assert.equal(
      await count('select coalesce(sum(seats),0) n from public.bookings where driver_leg_id = $1', [
        car,
      ]),
      2
    );
  });

  it('garde l’ancienne réservation quand la nouvelle est refusée', async () => {
    const car = await outboundOf();
    await join('dan', eventId, 'passenger', { first: 'Dan', party: 3, directions: ['outbound'] });
    await assert.rejects(
      as('dan', () => rpc('mark_found', eventId, 'outbound', car)),
      /not enough free seats/
    );
    // Ben (2 places) est toujours là.
    assert.equal(
      await count(
        "select count(*) n from public.bookings where driver_leg_id = $1 and name = 'Ben'",
        [car]
      ),
      1
    );
  });

  it('ne laisse pas deux passagers prendre la dernière place', async () => {
    const car = await outboundOf();
    await join('eve', eventId, 'passenger', { first: 'Eve', party: 1, directions: ['outbound'] });
    await as('eve', () => rpc('mark_found', eventId, 'outbound', car));
    await join('carol', eventId, 'passenger', {
      first: 'Carol',
      party: 1,
      directions: ['outbound'],
    });
    await assert.rejects(
      as('carol', () => rpc('mark_found', eventId, 'outbound', car)),
      /not enough free seats/
    );
    assert.equal(
      await count('select coalesce(sum(seats),0) n from public.bookings where driver_leg_id = $1', [
        car,
      ]),
      3
    );
  });

  it('ne descend jamais sous les places déjà prises en modifiant la voiture', async () => {
    const car = await outboundOf();
    await publish('olivia', eventId, 1, outboundLeg);
    assert.equal(
      await count('select total_seats n from public.driver_legs where id = $1', [car]),
      3
    );
  });

  it('suit la taille du groupe si elle tient, sinon remet le passager en recherche', async () => {
    const car = await outboundOf();
    // Ben passe de 2 à 3 : plus de place (Eve en prend 1 sur 3).
    await join('ben', eventId, 'passenger', { first: 'Ben', party: 3, directions: ['outbound'] });
    assert.equal(
      await count(
        "select count(*) n from public.bookings where driver_leg_id = $1 and name = 'Ben'",
        [car]
      ),
      0
    );
    // Eve reste réservée.
    assert.equal(
      await count(
        "select count(*) n from public.bookings where driver_leg_id = $1 and name = 'Eve'",
        [car]
      ),
      1
    );
  });

  it('permet de chercher à nouveau, ou d’avoir trouvé ailleurs', async () => {
    const car = await outboundOf();
    await as('eve', () => rpc('search_again', eventId, 'outbound'));
    assert.equal(
      await count(
        "select count(*) n from public.bookings where driver_leg_id = $1 and name = 'Eve'",
        [car]
      ),
      0
    );
    await as('eve', () => rpc('mark_found', eventId, 'outbound', null));
    const [{ found_elsewhere: elsewhere }] = await q(
      `select pl.found_elsewhere from public.passenger_legs pl join public.participants p on p.id = pl.participant_id
        where p.first_name = 'Eve' and pl.direction = 'outbound'`
    );
    assert.equal(elsewhere, true);
  });

  it('note et libère des places à la main, d’abord les siennes', async () => {
    const car = await outboundOf();
    const free = () =>
      count(
        'select total_seats - coalesce((select sum(seats) from public.bookings where driver_leg_id = l.id), 0) n from public.driver_legs l where id = $1',
        [car]
      );
    assert.equal(await free(), 3);
    await as('olivia', () => rpc('take_seat', car));
    assert.equal(await free(), 2);
    await as('carol', () => rpc('mark_found', eventId, 'outbound', car));
    assert.equal(await free(), 1);
    await as('olivia', () => rpc('release_seat', car)); // retire la place notée à la main
    assert.equal(
      await count(
        "select count(*) n from public.bookings where driver_leg_id = $1 and name = 'Carol'",
        [car]
      ),
      1
    );
    assert.equal(await free(), 2);
    await as('olivia', () => rpc('take_seat', car));
    await as('olivia', () => rpc('take_seat', car));
    await assert.rejects(
      as('olivia', () => rpc('take_seat', car)),
      /car is full/
    );
    await assert.rejects(
      as('ben', () => rpc('take_seat', car)),
      /ride not found/
    );
  });

  it('remet les passagers en recherche quand le conducteur ne peut plus conduire', async () => {
    const car = await outboundOf();
    await as('olivia', () => rpc('cancel_driving', eventId));
    assert.equal(await count('select count(*) n from public.driver_legs where id = $1', [car]), 0);
    assert.equal(
      await count('select count(*) n from public.bookings where driver_leg_id = $1', [car]),
      0
    );
    assert.equal(
      await count(
        "select count(*) n from public.participants where event_id = $1 and first_name = 'Olivia'",
        [eventId]
      ),
      0
    );
    // Carol existe toujours et cherche à nouveau.
    assert.equal(
      await count(
        "select count(*) n from public.participants where event_id = $1 and first_name = 'Carol'",
        [eventId]
      ),
      1
    );
  });
});

describe('changement de rôle', () => {
  it('retire la voiture d’un conducteur qui devient passager', async () => {
    const eventId = await createEvent('olivia');
    await join('ben', eventId, 'driver', { first: 'Ben' });
    await publish('ben', eventId, 3, { ...outboundLeg, return: { from: T(15, 0, 30), to: null } });
    await join('carol', eventId, 'passenger', { first: 'Carol', directions: ['outbound'] });
    const car = await legOf('Ben', 'outbound');
    await as('carol', () => rpc('mark_found', eventId, 'outbound', car));

    await join('ben', eventId, 'passenger', { first: 'Ben' });
    assert.equal(
      await count('select count(*) n from public.driver_legs where event_id = $1', [eventId]),
      0
    );
    assert.equal(
      await count('select count(*) n from public.bookings where event_id = $1', [eventId]),
      0
    );
    assert.equal(
      await count(
        "select count(*) n from public.passenger_legs pl join public.participants p on p.id = pl.participant_id where p.first_name = 'Ben' and p.event_id = $1",
        [eventId]
      ),
      2
    );
  });
});

describe('modification et suppression d’un événement', () => {
  let eventId;
  before(async () => {
    eventId = await createEvent('olivia');
    await join('olivia', eventId, 'driver', { first: 'Olivia' });
    await publish('olivia', eventId, 3, {
      ...outboundLeg,
      return: { from: T(15, 0, 30), to: T(15, 1) },
    });
    await join('ben', eventId, 'passenger', { first: 'Ben', directions: ['outbound'] });
    await join('carol', eventId, 'driver', { first: 'Carol', directions: ['return'] });
    await publish('carol', eventId, 2, { return: { from: T(15, 1), to: null } });
  });

  it('décale les départs avec l’horaire de l’événement', async () => {
    // Une semaine plus tard, une heure plus tôt pour le début, deux heures plus tard pour la fin.
    await as('olivia', () =>
      rpc(
        'update_event',
        eventId,
        'wedding',
        'Mariage décalé',
        T(21, 18, 30),
        T(22, 3),
        'Nouveau domaine',
        EVENT.directions
      )
    );
    const [event] = await q('select title, venue from public.events where id = $1', [eventId]);
    assert.deepEqual(event, { title: 'Mariage décalé', venue: 'Nouveau domaine' });
    const out = (
      await q('select departure_from f, departure_to t from public.driver_legs where id = $1', [
        await legOf('Olivia', 'outbound'),
      ])
    )[0];
    assert.equal(new Date(out.f).toISOString(), T(21, 17));
    assert.equal(new Date(out.t).toISOString(), T(21, 17, 30));
    const ret = (
      await q('select departure_from f, departure_to t from public.driver_legs where id = $1', [
        await legOf('Olivia', 'return'),
      ])
    )[0];
    assert.equal(new Date(ret.f).toISOString(), T(22, 2, 30));
    assert.equal(new Date(ret.t).toISOString(), T(22, 3));
  });

  it('retire les inscriptions d’un trajet supprimé', async () => {
    await as('olivia', () =>
      rpc(
        'update_event',
        eventId,
        'wedding',
        'Mariage décalé',
        T(21, 18, 30),
        T(22, 3),
        'Nouveau domaine',
        ['outbound']
      )
    );
    assert.equal(
      await count(
        "select count(*) n from public.driver_legs where event_id = $1 and direction = 'return'",
        [eventId]
      ),
      0
    );
    // Carol ne faisait que le retour : elle n'est plus inscrite. Olivia et Ben restent sur l'aller.
    assert.equal(
      await count(
        "select count(*) n from public.participants where event_id = $1 and first_name = 'Carol'",
        [eventId]
      ),
      0
    );
    const olivia = await q(
      "select directions from public.participants where event_id = $1 and first_name = 'Olivia'",
      [eventId]
    );
    assert.deepEqual(olivia[0].directions, ['outbound']);
    assert.equal(
      await count(
        "select count(*) n from public.participants where event_id = $1 and first_name = 'Ben'",
        [eventId]
      ),
      1
    );
  });

  it('supprime l’événement et tout ce qui s’y rattache', async () => {
    await as('olivia', () => rpc('delete_event', eventId));
    for (const table of ['events', 'participants', 'driver_legs', 'passenger_legs', 'bookings']) {
      assert.equal(
        await count(
          `select count(*) n from public.${table} where ${table === 'events' ? 'id' : 'event_id'} = $1`,
          [eventId]
        ),
        0,
        table
      );
    }
  });
});

describe('données personnelles', () => {
  it('ne met jamais une saisie libre dans l’aperçu public', async () => {
    const eventId = await createEvent('olivia');
    await join('ben', eventId, 'passenger', {
      first: 'Ben',
      placeId: '',
      zone: '12 rue des Lilas',
    });
    await join('carol', eventId, 'passenger', { first: 'Carol' });
    const preview = await as('dan', () => rpc('event_preview', eventId));
    assert.equal(preview.guests_count, 2);
    assert.deepEqual(preview.zones, [{ place_id: '295629', count: 1 }]);
    assert.doesNotMatch(JSON.stringify(preview), /Lilas/);
  });

  it('ne met jamais dans l’aperçu un texte déguisé en lieu (appli modifiée)', async () => {
    const eventId = await createEvent('olivia');
    // Faux identifiant numérique, nom inventé : seul l'identifiant sort, jamais le texte.
    await join('ben', eventId, 'passenger', { placeId: '999999999', zone: '12 rue des Lilas' });
    const preview = await as('dan', () => rpc('event_preview', eventId));
    assert.deepEqual(preview.zones, [{ place_id: '999999999', count: 1 }]);
    assert.doesNotMatch(JSON.stringify(preview), /Lilas/);
  });

  it('refuse un identifiant de lieu qui n’est pas un numéro', async () => {
    const eventId = await createEvent('olivia');
    await assert.rejects(
      join('ben', eventId, 'passenger', { placeId: '12 rue des Lilas' }),
      /participants_zone_place_id_digits/
    );
    await assert.rejects(
      as('ben', () =>
        q(
          `insert into public.profiles (user_id, first_name, last_name, phone, usual_zone_place_id)
           values ($1, 'Ben', 'Test', '+972521234567', 'chez moi')`,
          [users.ben]
        )
      ),
      /profiles_usual_zone_place_id_digits/
    );
  });

  it('efface vraiment un utilisateur, sans toucher aux autres', async () => {
    await newUser('frank');
    await newUser('gina');
    const hisEvent = await createEvent('frank');
    const herEvent = await createEvent('gina');
    await join('gina', hisEvent, 'passenger', { first: 'Gina' });
    await join('frank', herEvent, 'driver', { first: 'Frank', phone: '+972529998877' });
    await publish('frank', herEvent, 3, outboundLeg);
    await join('carol', herEvent, 'passenger', { first: 'Carol', directions: ['outbound'] });
    await as('carol', async () =>
      rpc('mark_found', herEvent, 'outbound', await legOf('Frank', 'outbound'))
    );

    await as('frank', () => rpc('delete_my_account'));

    assert.equal(await count('select count(*) n from auth.users where id = $1', [users.frank]), 0);
    assert.equal(await count('select count(*) n from public.events where id = $1', [hisEvent]), 0);
    assert.equal(
      await count("select count(*) n from public.participants where phone = '+972529998877'"),
      0
    );
    assert.equal(
      await count('select count(*) n from public.bookings where event_id = $1', [herEvent]),
      0
    );
    assert.equal(await count('select count(*) n from public.events where id = $1', [herEvent]), 1);
    assert.equal(
      await count(
        "select count(*) n from public.participants where event_id = $1 and first_name = 'Carol'",
        [herEvent]
      ),
      1
    );
  });

  it('refuse l’effacement sans être connecté', async () => {
    await assert.rejects(
      as(null, () => rpc('delete_my_account')),
      /permission denied/i
    );
  });
});
