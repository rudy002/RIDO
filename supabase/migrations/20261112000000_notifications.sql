-- Rido — mise à jour n° 3 (à exécuter une fois, après 20261111000000_preview_place_ids.sql).
--
-- 1. Un refus normal (lien ou trajet qui n'existe plus) répond « introuvable » (404) au lieu de
--    « panne du serveur » (500) : seuls les codes d'erreur des fonctions changent.
-- 2. Notifications sur le téléphone : une place réservée ou rendue, une voiture qui ne roule plus,
--    un événement modifié ou supprimé. Envoyées par le service gratuit d'Expo.
--
-- Tout ou rien : en cas d'erreur, rien n'est modifié.

begin;

-- ---------------------------------------------------------------------------------------------
-- 1. Codes d'erreur (fonctions inchangées sinon)
-- ---------------------------------------------------------------------------------------------

create or replace function public.update_event(
  p_id text,
  p_type text,
  p_title text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_venue text,
  p_directions text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.require_user();
  e public.events%rowtype;
  v_start_shift interval;
  v_end_shift interval;
  v_removed text[];
begin
  select * into e from public.events where id = p_id and organizer_id = v_uid for update;
  if not found then
    raise exception 'event not found' using errcode = 'PT404';
  end if;
  v_start_shift := p_starts_at - e.starts_at;
  v_end_shift := p_ends_at - e.ends_at;
  v_removed := array(select dir from unnest(e.directions) as dir where not (dir = any (p_directions)));

  update public.events
     set type = p_type, title = btrim(p_title), starts_at = p_starts_at, ends_at = p_ends_at,
         venue = btrim(p_venue), directions = p_directions
   where id = p_id;

  update public.driver_legs
     set departure_from = departure_from + (case direction when 'outbound' then v_start_shift else v_end_shift end),
         departure_to = departure_to + (case direction when 'outbound' then v_start_shift else v_end_shift end)
   where event_id = p_id;

  if cardinality(v_removed) > 0 then
    delete from public.driver_legs where event_id = p_id and direction = any (v_removed);
    delete from public.passenger_legs where event_id = p_id and direction = any (v_removed);
    -- Sans plus aucun trajet, la personne n'est plus inscrite.
    delete from public.participants where event_id = p_id and directions <@ v_removed;
    update public.participants
       set directions = array(select dir from unnest(directions) as dir where not (dir = any (v_removed)))
     where event_id = p_id;
  end if;
end
$$;

create or replace function public.delete_event(p_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.require_user();
begin
  delete from public.events where id = p_id and organizer_id = v_uid;
  if not found then
    raise exception 'event not found' using errcode = 'PT404';
  end if;
end
$$;

create or replace function public.join_event(
  p_event_id text,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_zone_place_id text,
  p_zone_name text,
  p_role text,
  p_directions text[],
  p_party_size int default 1
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.require_user();
  e public.events%rowtype;
  v_pid uuid;
  v_party int;
  rec record;
  v_car public.driver_legs%rowtype;
  v_booked int;
begin
  select * into e from public.events where id = p_event_id;
  if not found then
    raise exception 'event not found' using errcode = 'PT404';
  end if;
  if not public.valid_directions(p_directions) or not (p_directions <@ e.directions) then
    raise exception 'direction not offered by this event' using errcode = 'P0001';
  end if;
  v_party := case when p_role = 'driver' then 1 else coalesce(p_party_size, 1) end;

  insert into public.participants
    (event_id, user_id, first_name, last_name, phone, zone_place_id, zone_name, role, directions, party_size)
  values
    (p_event_id, v_uid, btrim(p_first_name), btrim(p_last_name), p_phone, nullif(p_zone_place_id, ''),
     btrim(p_zone_name), p_role, p_directions, v_party)
  on conflict (event_id, user_id) do update
    set first_name = excluded.first_name, last_name = excluded.last_name, phone = excluded.phone,
        zone_place_id = excluded.zone_place_id, zone_name = excluded.zone_name, role = excluded.role,
        directions = excluded.directions, party_size = excluded.party_size
  returning id into v_pid;

  if p_role = 'passenger' then
    -- Ses éventuelles voitures disparaissent ; leurs passagers repassent en recherche (cascade).
    delete from public.driver_legs where participant_id = v_pid;
    delete from public.passenger_legs where participant_id = v_pid and not (direction = any (p_directions));
    insert into public.passenger_legs (event_id, participant_id, direction)
      select p_event_id, v_pid, dir from unnest(p_directions) as dir
      on conflict (participant_id, direction) do nothing;

    -- Toujours le même ordre de verrouillage des voitures (voir 3. en tête de fichier).
    for rec in
      select b.id, b.seats, b.driver_leg_id
        from public.bookings b
        join public.passenger_legs pl on pl.id = b.passenger_leg_id
       where pl.participant_id = v_pid
       order by b.driver_leg_id
    loop
      select * into v_car from public.driver_legs where id = rec.driver_leg_id for update;
      select coalesce(sum(seats), 0) into v_booked from public.bookings where driver_leg_id = v_car.id;
      if v_party <= v_car.total_seats - v_booked + rec.seats then
        update public.bookings set seats = v_party, name = btrim(p_first_name) where id = rec.id;
      else
        delete from public.bookings where id = rec.id;  -- le groupe ne tient plus : il cherche à nouveau
      end if;
    end loop;
  else
    delete from public.passenger_legs where participant_id = v_pid;
    delete from public.driver_legs where participant_id = v_pid and not (direction = any (p_directions));
  end if;
  return v_pid;
end
$$;

create or replace function public.take_seat(p_leg_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.require_user();
  v_leg public.driver_legs%rowtype;
  v_booked int;
begin
  select l.* into v_leg
    from public.driver_legs l
    join public.participants p on p.id = l.participant_id
   where l.id = p_leg_id and p.user_id = v_uid
     for update of l;
  if not found then
    raise exception 'ride not found' using errcode = 'PT404';
  end if;
  select coalesce(sum(seats), 0) into v_booked from public.bookings where driver_leg_id = v_leg.id;
  if v_booked >= v_leg.total_seats then
    raise exception 'car is full' using errcode = 'P0001';
  end if;
  insert into public.bookings (event_id, driver_leg_id, seats) values (v_leg.event_id, v_leg.id, 1);
end
$$;

create or replace function public.release_seat(p_leg_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.require_user();
  v_leg public.driver_legs%rowtype;
  v_booking uuid;
begin
  select l.* into v_leg
    from public.driver_legs l
    join public.participants p on p.id = l.participant_id
   where l.id = p_leg_id and p.user_id = v_uid
     for update of l;
  if not found then
    raise exception 'ride not found' using errcode = 'PT404';
  end if;
  select id into v_booking from public.bookings
   where driver_leg_id = v_leg.id
   order by (passenger_leg_id is null) desc, created_at desc
   limit 1;
  if v_booking is not null then
    delete from public.bookings where id = v_booking;
  end if;
end
$$;

create or replace function public.mark_found(p_event_id text, p_direction text, p_driver_leg_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.require_user();
  me public.participants%rowtype;
  v_pl public.passenger_legs%rowtype;
  v_car public.driver_legs%rowtype;
  v_booked int;
begin
  select * into me from public.participants
   where event_id = p_event_id and user_id = v_uid and role = 'passenger';
  if not found then
    raise exception 'not a passenger of this event' using errcode = 'P0001';
  end if;
  select * into v_pl from public.passenger_legs where participant_id = me.id and direction = p_direction;
  if not found then
    raise exception 'no such trip for this passenger' using errcode = 'PT404';
  end if;

  delete from public.bookings where passenger_leg_id = v_pl.id;
  if p_driver_leg_id is null then
    update public.passenger_legs set found_elsewhere = true where id = v_pl.id;
  else
    select * into v_car from public.driver_legs
     where id = p_driver_leg_id and event_id = p_event_id and direction = p_direction for update;
    if not found then
      raise exception 'ride not found' using errcode = 'PT404';
    end if;
    select coalesce(sum(seats), 0) into v_booked from public.bookings where driver_leg_id = v_car.id;
    if v_car.total_seats - v_booked < me.party_size then
      raise exception 'not enough free seats' using errcode = 'P0001';
    end if;
    insert into public.bookings (event_id, driver_leg_id, passenger_leg_id, name, seats)
    values (p_event_id, v_car.id, v_pl.id, me.first_name, me.party_size);
    update public.passenger_legs set found_elsewhere = false where id = v_pl.id;
  end if;
end
$$;

create or replace function public.search_again(p_event_id text, p_direction text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.require_user();
  v_pl uuid;
begin
  select pl.id into v_pl
    from public.passenger_legs pl
    join public.participants p on p.id = pl.participant_id
   where p.event_id = p_event_id and p.user_id = v_uid and pl.direction = p_direction;
  if v_pl is null then
    raise exception 'no such trip for this passenger' using errcode = 'PT404';
  end if;
  delete from public.bookings where passenger_leg_id = v_pl;
  update public.passenger_legs set found_elsewhere = false where id = v_pl;
end
$$;

-- ---------------------------------------------------------------------------------------------
-- 2. Notifications
-- ---------------------------------------------------------------------------------------------

-- Envoi des requêtes HTTP depuis la base (Supabase). Absent ailleurs (tests locaux) : les
-- notifications sont alors seulement préparées dans `push_outbox`.
do $$
begin
  create extension if not exists pg_net with schema extensions;
exception
  when others then null;
end
$$;

-- Les appareils à prévenir : un « jeton » Expo par téléphone, et sa langue.
create table public.push_tokens (
  token text primary key check (token ~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]{10,100}\]$'),
  user_id uuid not null references auth.users (id) on delete cascade,
  language text not null default 'fr' check (language in ('fr', 'he', 'en')),
  updated_at timestamptz not null default now()
);
create index push_tokens_user_idx on public.push_tokens (user_id);

-- Les notifications préparées (7 jours), pour comprendre un envoi manqué et pour les tests.
create table public.push_outbox (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  url text not null,
  created_at timestamptz not null default now()
);
create index push_outbox_user_idx on public.push_outbox (user_id);

-- Personne n'y accède directement : seulement les fonctions ci-dessous.
alter table public.push_tokens enable row level security;
alter table public.push_outbox enable row level security;
revoke all on public.push_tokens, public.push_outbox from anon, authenticated;

-- Le téléphone enregistre son jeton (à chaque ouverture : il peut changer).
create function public.register_push_token(p_token text, p_language text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.require_user();
begin
  -- Un jeton déjà rattaché à un autre compte n'est jamais repris : connaître le jeton d'un autre
  -- téléphone ne permet pas de détourner ses notifications. Un téléphone qui change de compte
  -- (« Se déconnecter ») a vu l'ancien effacé, et son jeton avec.
  insert into public.push_tokens (token, user_id, language)
  values (p_token, v_uid, coalesce(p_language, 'fr'))
  on conflict (token) do update
    set language = excluded.language, updated_at = now()
    where public.push_tokens.user_id = v_uid;
end
$$;

-- Le téléphone ne veut plus de notifications (permission retirée).
create function public.unregister_push_token(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.require_user();
begin
  delete from public.push_tokens where token = p_token and user_id = v_uid;
end
$$;

-- Texte d'une notification, dans la langue du téléphone. Paramètres : name, event, direction
-- (outbound / return), seats.
create function public.push_text(p_kind text, p_language text, p_params jsonb)
returns table (title text, body text)
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_lang text := case when p_language in ('fr', 'he', 'en') then p_language else 'fr' end;
  v_texts jsonb := '{
    "booked": {
      "fr": ["Nouvelle réservation", "{name} a réservé {seats} dans ta voiture ({direction}) · {event}"],
      "en": ["New booking", "{name} booked {seats} in your car ({direction}) · {event}"],
      "he": ["הזמנה חדשה", "{name} הזמין/ה {seats} ברכב שלך ({direction}) · {event}"]
    },
    "seat_released": {
      "fr": ["Place libérée", "{name} a libéré sa place dans ta voiture ({direction}) · {event}"],
      "en": ["Seat freed", "{name} gave up their seat in your car ({direction}) · {event}"],
      "he": ["מקום התפנה", "{name} ויתר/ה על המקום ברכב שלך ({direction}) · {event}"]
    },
    "seat_released_by_driver": {
      "fr": ["Ta place n’est plus réservée", "{name} a libéré ta place ({direction}) · {event}. Tu cherches à nouveau."],
      "en": ["Your seat is no longer booked", "{name} freed your seat ({direction}) · {event}. You are looking again."],
      "he": ["המקום שלך כבר לא שמור", "{name} פינה/תה את המקום שלך ({direction}) · {event}. חוזרים לחפש."]
    },
    "ride_cancelled": {
      "fr": ["Trajet annulé", "Ton conducteur ne fait plus ce trajet ({direction}) · {event}. Tu cherches à nouveau."],
      "en": ["Ride cancelled", "Your driver is no longer making this trip ({direction}) · {event}. You are looking again."],
      "he": ["הנסיעה בוטלה", "הנהג/ת כבר לא נוסע/ת ({direction}) · {event}. חוזרים לחפש."]
    },
    "event_changed": {
      "fr": ["{event} a changé", "L’organisateur a modifié l’événement. Vérifie l’heure et ton trajet."],
      "en": ["{event} has changed", "The organizer updated the event. Check the time and your ride."],
      "he": ["{event} השתנה", "המארגן/ת עדכן/ה את האירוע. כדאי לבדוק את השעה והנסיעה."]
    },
    "event_deleted": {
      "fr": ["{event} est annulé", "L’organisateur a supprimé l’événement et son covoiturage."],
      "en": ["{event} is cancelled", "The organizer deleted the event and its carpool."],
      "he": ["{event} בוטל", "המארגן/ת מחק/ה את האירוע ואת הסעות השיתוף."]
    }
  }';
  v_words jsonb := '{
    "outbound": {"fr": "aller", "en": "outbound", "he": "הלוך"},
    "return": {"fr": "retour", "en": "return", "he": "חזור"},
    "seat_one": {"fr": "une place", "en": "one seat", "he": "מקום אחד"},
    "seat_many": {"fr": "{n} places", "en": "{n} seats", "he": "{n} מקומות"}
  }';
  v_pair jsonb := v_texts -> p_kind -> v_lang;
  v_seats int := coalesce((p_params ->> 'seats')::int, 1);
  v_values jsonb;
  v_key text;
begin
  if v_pair is null then
    raise exception 'unknown notification %', p_kind;
  end if;
  v_values := jsonb_build_object(
    'name', coalesce(p_params ->> 'name', ''),
    'event', coalesce(p_params ->> 'event', ''),
    'direction', coalesce(v_words -> (p_params ->> 'direction') ->> v_lang, ''),
    'seats', case when v_seats = 1 then v_words -> 'seat_one' ->> v_lang
                  else replace(v_words -> 'seat_many' ->> v_lang, '{n}', v_seats::text) end
  );
  title := v_pair ->> 0;
  body := v_pair ->> 1;
  for v_key in select jsonb_object_keys(v_values) loop
    title := replace(title, '{' || v_key || '}', v_values ->> v_key);
    body := replace(body, '{' || v_key || '}', v_values ->> v_key);
  end loop;
  return next;
end
$$;

-- Prévient un utilisateur sur tous ses téléphones. Jamais celui qui fait l'action, ni un
-- utilisateur sans téléphone enregistré. `p_url` : l'écran à ouvrir (« /e/<id>/my-car »).
create function public.notify_user(p_user uuid, p_kind text, p_params jsonb, p_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_messages jsonb := '[]'::jsonb;
  v_title text;
  v_body text;
  t record;
  m record;
begin
  if p_user is null or p_user is not distinct from auth.uid() then
    return;
  end if;
  for t in select token, language from public.push_tokens where user_id = p_user order by updated_at desc loop
    select * into m from public.push_text(p_kind, t.language, p_params);
    -- Le journal garde le texte du téléphone utilisé le plus récemment.
    v_title := coalesce(v_title, m.title);
    v_body := coalesce(v_body, m.body);
    v_messages := v_messages || jsonb_build_object(
      'to', t.token, 'title', m.title, 'body', m.body, 'sound', 'default',
      'channelId', 'default', 'data', jsonb_build_object('url', p_url));
  end loop;
  if jsonb_array_length(v_messages) = 0 then
    return;
  end if;

  insert into public.push_outbox (user_id, kind, title, body, url)
  values (p_user, p_kind, v_title, v_body, p_url);
  delete from public.push_outbox where created_at < now() - interval '7 days';

  -- Service d'envoi d'Expo (gratuit), après la fin de la transaction.
  if to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') is not null then
    execute 'select net.http_post(url := $1, body := $2)'
      using 'https://exp.host/--/api/v2/push/send', v_messages;
  end if;
end
$$;

-- Une place réservée : le conducteur est prévenu (pas pour une place qu'il note lui-même).
create function public.on_booking_inserted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v record;
begin
  if new.passenger_leg_id is null then
    return null;
  end if;
  select p.user_id, l.direction, e.id as event_id, e.title into v
    from public.driver_legs l
    join public.participants p on p.id = l.participant_id
    join public.events e on e.id = l.event_id
   where l.id = new.driver_leg_id;
  if found then
    perform public.notify_user(v.user_id, 'booked',
      jsonb_build_object('name', new.name, 'seats', new.seats, 'direction', v.direction, 'event', v.title),
      '/e/' || v.event_id || '/my-car');
  end if;
  return null;
end
$$;

-- Une place qui disparaît :
--  - le passager l'a rendue → le conducteur est prévenu ;
--  - le conducteur l'a libérée → le passager est prévenu ;
--  - la voiture a disparu (conducteur qui ne conduit plus…) → le passager est prévenu ;
--  - l'événement a été supprimé → rien ici (une seule notification, celle de la suppression).
create function public.on_booking_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events%rowtype;
  v_driver record;
  v_passenger uuid;
  v_url text;
begin
  if old.passenger_leg_id is null then
    return null;
  end if;
  select * into v_event from public.events where id = old.event_id;
  if not found then
    return null;
  end if;
  select p.user_id into v_passenger
    from public.passenger_legs pl join public.participants p on p.id = pl.participant_id
   where pl.id = old.passenger_leg_id;
  select p.user_id, p.first_name, l.direction into v_driver
    from public.driver_legs l join public.participants p on p.id = l.participant_id
   where l.id = old.driver_leg_id;
  v_url := '/e/' || v_event.id || '/rides';

  if v_driver.user_id is null then
    perform public.notify_user(v_passenger, 'ride_cancelled',
      jsonb_build_object('event', v_event.title,
                         'direction', (select direction from public.passenger_legs where id = old.passenger_leg_id)),
      v_url);
  elsif v_driver.user_id is not distinct from auth.uid() then
    perform public.notify_user(v_passenger, 'seat_released_by_driver',
      jsonb_build_object('name', v_driver.first_name, 'direction', v_driver.direction, 'event', v_event.title),
      v_url);
  else
    perform public.notify_user(v_driver.user_id, 'seat_released',
      jsonb_build_object('name', old.name, 'direction', v_driver.direction, 'event', v_event.title),
      '/e/' || v_event.id || '/my-car');
  end if;
  return null;
end
$$;

-- L'événement change (date, heures, lieu, nom, trajets) : tous les inscrits sont prévenus.
create function public.on_event_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  if (new.title, new.starts_at, new.ends_at, new.venue, new.directions)
     is not distinct from (old.title, old.starts_at, old.ends_at, old.venue, old.directions) then
    return null;
  end if;
  for v_user in select distinct user_id from public.participants where event_id = new.id loop
    perform public.notify_user(v_user, 'event_changed', jsonb_build_object('event', new.title),
      '/e/' || new.id);
  end loop;
  return null;
end
$$;

-- L'événement est supprimé : les inscrits sont prévenus avant que tout disparaisse.
create function public.on_event_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  for v_user in select distinct user_id from public.participants where event_id = old.id loop
    perform public.notify_user(v_user, 'event_deleted', jsonb_build_object('event', old.title), '/');
  end loop;
  return old;
end
$$;

create trigger bookings_notify_insert after insert on public.bookings
  for each row execute function public.on_booking_inserted();
create trigger bookings_notify_delete after delete on public.bookings
  for each row execute function public.on_booking_deleted();
create trigger events_notify_update after update on public.events
  for each row execute function public.on_event_updated();
create trigger events_notify_delete before delete on public.events
  for each row execute function public.on_event_deleted();

-- Droits : seules les deux fonctions du téléphone sont appelables ; le reste ne sert qu'à la base.
revoke all on function public.register_push_token(text, text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;
revoke all on function public.unregister_push_token(text) from public, anon;
grant execute on function public.unregister_push_token(text) to authenticated;
revoke all on function public.push_text(text, text, jsonb) from public, anon, authenticated;
revoke all on function public.notify_user(uuid, text, jsonb, text) from public, anon, authenticated;
revoke all on function public.on_booking_inserted() from public, anon, authenticated;
revoke all on function public.on_booking_deleted() from public, anon, authenticated;
revoke all on function public.on_event_updated() from public, anon, authenticated;
revoke all on function public.on_event_deleted() from public, anon, authenticated;

commit;
