-- Rido — schéma initial (Supabase / Postgres).
--
-- Principe de sécurité :
--   * Les applis ne peuvent que LIRE, et seulement ce que les règles d'accès (RLS) autorisent :
--     les participants d'un événement (et son organisateur) voient cet événement, rien d'autre.
--   * Toute écriture passe par les fonctions plus bas (SECURITY DEFINER), qui vérifient qui a le
--     droit de faire quoi et qui contrôlent les places d'une voiture en une seule opération.
--   * Le lien d'un événement contient une partie aléatoire : il ne se devine pas.
--
-- À exécuter une seule fois (Supabase → SQL Editor). Tout ou rien : en cas d'erreur, rien n'est créé.

begin;

-- ---------------------------------------------------------------------------------------------
-- Outils
-- ---------------------------------------------------------------------------------------------

-- Sens de trajet valides : « outbound » et/ou « return », sans doublon.
create function public.valid_directions(p_directions text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_directions is not null
    and cardinality(p_directions) between 1 and 2
    and p_directions <@ array['outbound', 'return']::text[]
    and cardinality(p_directions) = (select count(distinct dir) from unnest(p_directions) as dir)
$$;

-- ---------------------------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------------------------

-- Profil de l'utilisateur de cet appareil (repris à chaque inscription).
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null check (length(btrim(first_name)) between 1 and 60),
  last_name text not null check (length(btrim(last_name)) between 1 and 60),
  phone text not null check (phone ~ '^\+[0-9]{6,15}$'),
  car_model text not null default '' check (length(car_model) <= 80),
  car_seats int not null default 3 check (car_seats between 1 and 8),
  usual_zone_place_id text check (length(usual_zone_place_id) <= 32),
  usual_zone_name text check (length(usual_zone_name) <= 120),
  notify_nearby boolean not null default true,
  notify_reminder boolean not null default true,
  created_at timestamptz not null default now()
);

-- Un événement ; `id` est le lien de partage (« lea-samuel-3f9a1c7b2d4e5f6a7b8c9d0e1f2a3b4c »).
create table public.events (
  id text primary key
    check (length(id) between 3 and 80 and id ~ '^[a-z0-9א-ת]+(-[a-z0-9א-ת]+)*$'),
  type text not null check (type in ('wedding', 'barMitzvah', 'birthday', 'festival', 'other')),
  title text not null check (length(btrim(title)) between 1 and 120),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  venue text not null check (length(btrim(venue)) between 1 and 160),
  country text not null check (country ~ '^[A-Z]{2}$'),
  directions text[] not null check (public.valid_directions(directions)),
  organizer_id uuid not null references auth.users (id) on delete cascade,
  organizer_name text check (length(organizer_name) <= 120),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

-- Une personne inscrite au covoiturage d'un événement (une inscription par personne et événement).
create table public.participants (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  first_name text not null check (length(btrim(first_name)) between 1 and 60),
  last_name text not null check (length(btrim(last_name)) between 1 and 60),
  phone text not null check (phone ~ '^\+[0-9]{6,15}$'),
  zone_place_id text check (length(zone_place_id) <= 32),
  zone_name text not null check (length(btrim(zone_name)) between 1 and 120),
  role text not null check (role in ('driver', 'passenger')),
  directions text[] not null check (public.valid_directions(directions)),
  party_size int not null default 1 check (party_size between 1 and 8),
  created_at timestamptz not null default now(),
  unique (event_id, user_id),
  check (role = 'passenger' or party_size = 1)
);

-- Le trajet d'un conducteur, dans un sens.
create table public.driver_legs (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events (id) on delete cascade,
  participant_id uuid not null references public.participants (id) on delete cascade,
  direction text not null check (direction in ('outbound', 'return')),
  departure_from timestamptz not null,
  departure_to timestamptz,
  total_seats int not null check (total_seats between 1 and 8),
  created_at timestamptz not null default now(),
  unique (participant_id, direction),
  check (departure_to is null or departure_to >= departure_from)
);

-- La recherche d'un passager, dans un sens. Il « cherche encore » tant qu'il n'a ni réservation
-- (table `bookings`) ni `found_elsewhere` : l'état se déduit, il ne peut pas se contredire.
create table public.passenger_legs (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events (id) on delete cascade,
  participant_id uuid not null references public.participants (id) on delete cascade,
  direction text not null check (direction in ('outbound', 'return')),
  found_elsewhere boolean not null default false,
  created_at timestamptz not null default now(),
  unique (participant_id, direction)
);

-- Places prises dans une voiture : par un passager (nommé) ou notées à la main par le conducteur
-- (une place chacune, sans passager).
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events (id) on delete cascade,
  driver_leg_id uuid not null references public.driver_legs (id) on delete cascade,
  passenger_leg_id uuid unique references public.passenger_legs (id) on delete cascade,
  name text check (length(name) <= 60),
  seats int not null check (seats between 1 and 8),
  created_at timestamptz not null default now(),
  check (passenger_leg_id is not null or seats = 1)
);

create index events_organizer_idx on public.events (organizer_id);
create index participants_event_idx on public.participants (event_id);
create index participants_user_idx on public.participants (user_id);
create index driver_legs_event_idx on public.driver_legs (event_id);
create index driver_legs_participant_idx on public.driver_legs (participant_id);
create index passenger_legs_event_idx on public.passenger_legs (event_id);
create index passenger_legs_participant_idx on public.passenger_legs (participant_id);
create index bookings_event_idx on public.bookings (event_id);
create index bookings_driver_leg_idx on public.bookings (driver_leg_id);

-- ---------------------------------------------------------------------------------------------
-- Règles d'accès (RLS)
-- ---------------------------------------------------------------------------------------------

-- L'utilisateur est-il l'organisateur ou un participant de cet événement ?
create function public.is_event_member(p_event_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.events e where e.id = p_event_id and e.organizer_id = auth.uid())
      or exists (select 1 from public.participants p where p.event_id = p_event_id and p.user_id = auth.uid())
$$;

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.participants enable row level security;
alter table public.driver_legs enable row level security;
alter table public.passenger_legs enable row level security;
alter table public.bookings enable row level security;

-- Chacun gère son propre profil.
create policy profiles_own on public.profiles
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Lecture seule, réservée aux membres de l'événement.
create policy events_read on public.events
  for select to authenticated using (public.is_event_member(id));
create policy participants_read on public.participants
  for select to authenticated using (public.is_event_member(event_id));
create policy driver_legs_read on public.driver_legs
  for select to authenticated using (public.is_event_member(event_id));
create policy passenger_legs_read on public.passenger_legs
  for select to authenticated using (public.is_event_member(event_id));
create policy bookings_read on public.bookings
  for select to authenticated using (public.is_event_member(event_id));

-- Droits sur les tables : lecture seulement (le profil se modifie directement).
revoke all on all tables in schema public from anon, authenticated;
grant select on public.events, public.participants, public.driver_legs,
  public.passenger_legs, public.bookings to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Fonctions (toutes les écritures)
-- ---------------------------------------------------------------------------------------------

create function public.require_user()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  return v_uid;
end
$$;

-- Aperçu public d'un événement, pour celui qui n'a que le lien : aucun nom ni numéro, seulement des
-- totaux et les zones déjà actives. Seuls les lieux de la base (ville ou quartier) y figurent : une
-- saisie libre pourrait contenir une adresse exacte.
create function public.event_preview(p_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  e public.events%rowtype;
  v_first text;
begin
  perform public.require_user();
  select * into e from public.events where id = p_id;
  if not found then
    return null;
  end if;
  v_first := case when 'outbound' = any (e.directions) then 'outbound' else 'return' end;
  return jsonb_build_object(
    'id', e.id,
    'type', e.type,
    'title', e.title,
    'starts_at', e.starts_at,
    'ends_at', e.ends_at,
    'venue', e.venue,
    'country', e.country,
    'directions', to_jsonb(e.directions),
    'organizer_name', e.organizer_name,
    'guests_count', coalesce((select sum(p.party_size) from public.participants p where p.event_id = e.id), 0),
    'seats_offered', coalesce(
      (select sum(l.total_seats) from public.driver_legs l where l.event_id = e.id and l.direction = v_first), 0),
    'zones', coalesce(
      (select jsonb_agg(jsonb_build_object('place_id', z.zone_place_id, 'name', z.zone_name, 'count', z.n)
                        order by z.n desc, z.zone_name)
         from (select p.zone_place_id, p.zone_name, sum(p.party_size) as n
                 from public.participants p where p.event_id = e.id and p.zone_place_id is not null
                group by p.zone_place_id, p.zone_name) z),
      '[]'::jsonb)
  );
end
$$;

-- Création d'un événement. `p_slug_base` (« lea-samuel ») reçoit une partie aléatoire : c'est le lien.
create function public.create_event(
  p_slug_base text,
  p_type text,
  p_title text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_venue text,
  p_country text,
  p_directions text[],
  p_organizer_name text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.require_user();
  v_base text;
  v_id text;
begin
  v_base := btrim(regexp_replace(lower(coalesce(nullif(btrim(p_slug_base), ''), p_title)), '[^a-z0-9א-ת]+', '-', 'g'), '-');
  v_base := btrim(left(v_base, 30), '-');
  if v_base = '' then
    v_base := 'evenement';
  end if;
  loop
    -- 32 caractères aléatoires (122 bits) : le lien est la seule clé d'accès, il doit être impossible à deviner.
    v_id := v_base || '-' || replace(gen_random_uuid()::text, '-', '');
    exit when not exists (select 1 from public.events where id = v_id);
  end loop;

  insert into public.events (id, type, title, starts_at, ends_at, venue, country, directions, organizer_id, organizer_name)
  values (v_id, p_type, btrim(p_title), p_starts_at, p_ends_at, btrim(p_venue), p_country, p_directions, v_uid,
          nullif(btrim(p_organizer_name), ''));
  return v_id;
end
$$;

-- Modification par l'organisateur. Les départs des conducteurs suivent le nouvel horaire (aller :
-- décalage du début ; retour : décalage de la fin). Un trajet retiré emporte ses inscriptions.
create function public.update_event(
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
    raise exception 'event not found' using errcode = 'P0002';
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

create function public.delete_event(p_id text)
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
    raise exception 'event not found' using errcode = 'P0002';
  end if;
end
$$;

-- Inscription (ou modification de l'inscription) à un événement. Changer de rôle ou de trajets retire
-- ce qui ne s'applique plus ; les réservations suivent la taille du groupe si tout le monde tient.
create function public.join_event(
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
    raise exception 'event not found' using errcode = 'P0002';
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

    for rec in
      select b.id, b.seats, b.driver_leg_id
        from public.bookings b
        join public.passenger_legs pl on pl.id = b.passenger_leg_id
       where pl.participant_id = v_pid
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

-- Publication (ou modification) de sa voiture. `p_legs` : {"outbound": {"from": …, "to": …}, "return": …}.
-- Le nombre de places ne descend jamais sous les places déjà prises.
create function public.publish_car(p_event_id text, p_seats int, p_legs jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.require_user();
  me public.participants%rowtype;
  e public.events%rowtype;
  v_dir text;
  v_dirs text[] := '{}';
  v_from timestamptz;
  v_to timestamptz;
  v_existing uuid;
  v_booked int;
begin
  select * into me from public.participants where event_id = p_event_id and user_id = v_uid;
  if not found or me.role <> 'driver' then
    raise exception 'not a driver of this event' using errcode = 'P0001';
  end if;
  select * into e from public.events where id = p_event_id;

  for v_dir in select jsonb_object_keys(p_legs) loop
    if v_dir not in ('outbound', 'return') or not (v_dir = any (e.directions)) then
      raise exception 'direction not offered by this event' using errcode = 'P0001';
    end if;
    v_from := (p_legs -> v_dir ->> 'from')::timestamptz;
    v_to := nullif(p_legs -> v_dir ->> 'to', '')::timestamptz;

    select id into v_existing from public.driver_legs
     where participant_id = me.id and direction = v_dir for update;
    select coalesce(sum(seats), 0) into v_booked from public.bookings where driver_leg_id = v_existing;

    insert into public.driver_legs (event_id, participant_id, direction, departure_from, departure_to, total_seats)
    values (p_event_id, me.id, v_dir, v_from, v_to, greatest(p_seats, v_booked, 1))
    on conflict (participant_id, direction) do update
      set departure_from = excluded.departure_from, departure_to = excluded.departure_to,
          total_seats = excluded.total_seats;
    v_dirs := v_dirs || v_dir;
  end loop;

  if cardinality(v_dirs) = 0 then
    raise exception 'at least one trip is required' using errcode = 'P0001';
  end if;
  -- Un trajet retiré emporte ses réservations (cascade) : ses passagers cherchent à nouveau.
  delete from public.driver_legs where participant_id = me.id and not (direction = any (v_dirs));
  update public.participants set directions = v_dirs where id = me.id;
end
$$;

-- Le conducteur note une place prise (réservée par téléphone, par exemple).
create function public.take_seat(p_leg_id uuid)
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
    raise exception 'ride not found' using errcode = 'P0002';
  end if;
  select coalesce(sum(seats), 0) into v_booked from public.bookings where driver_leg_id = v_leg.id;
  if v_booked >= v_leg.total_seats then
    raise exception 'car is full' using errcode = 'P0001';
  end if;
  insert into public.bookings (event_id, driver_leg_id, seats) values (v_leg.event_id, v_leg.id, 1);
end
$$;

-- Le conducteur libère une place : d'abord une place notée à la main, sinon la dernière réservation
-- d'un passager (qui cherche alors à nouveau).
create function public.release_seat(p_leg_id uuid)
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
    raise exception 'ride not found' using errcode = 'P0002';
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

-- Le passager a trouvé sa place : dans la voiture d'un conducteur (sa place y est réservée), ou
-- autrement (`p_driver_leg_id` vide). Refusé s'il ne reste pas assez de places pour tout le groupe.
create function public.mark_found(p_event_id text, p_direction text, p_driver_leg_id uuid default null)
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
    raise exception 'no such trip for this passenger' using errcode = 'P0002';
  end if;

  delete from public.bookings where passenger_leg_id = v_pl.id;
  if p_driver_leg_id is null then
    update public.passenger_legs set found_elsewhere = true where id = v_pl.id;
  else
    select * into v_car from public.driver_legs
     where id = p_driver_leg_id and event_id = p_event_id and direction = p_direction for update;
    if not found then
      raise exception 'ride not found' using errcode = 'P0002';
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

-- Le passager cherche à nouveau : sa place réservée est libérée.
create function public.search_again(p_event_id text, p_direction text)
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
    raise exception 'no such trip for this passenger' using errcode = 'P0002';
  end if;
  delete from public.bookings where passenger_leg_id = v_pl;
  update public.passenger_legs set found_elsewhere = false where id = v_pl;
end
$$;

-- « Je ne peux plus conduire » : la voiture et l'inscription disparaissent, les passagers cherchent.
create function public.cancel_driving(p_event_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.require_user();
begin
  delete from public.participants
   where event_id = p_event_id and user_id = v_uid and role = 'driver';
end
$$;

-- « Se déconnecter » sans compte : efface vraiment l'utilisateur côté serveur. Tout ce qui lui est lié
-- disparaît en cascade (profil, inscriptions, voitures, événements qu'il organise).
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.require_user();
begin
  delete from auth.users where id = v_uid;
end
$$;

-- Seules les personnes connectées (anonymes comprises) peuvent appeler ces fonctions.
do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as sig
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind = 'f'
  loop
    execute format('revoke all on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated', f.sig);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------------------------
-- Mises à jour en direct (Realtime) : les règles d'accès ci-dessus s'y appliquent aussi.
-- ---------------------------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array['events', 'participants', 'driver_legs', 'passenger_legs', 'bookings']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when undefined_object then null;   -- pas de Realtime ici (tests locaux)
      when duplicate_object then null;   -- déjà publiée
    end;
  end loop;
end
$$;

commit;
