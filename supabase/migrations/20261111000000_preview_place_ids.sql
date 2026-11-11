-- Rido — mise à jour n° 2 (à exécuter une fois, après 20261109000000_init.sql).
--
-- 1. L'aperçu public d'un événement ne renvoie plus aucun nom de zone, seulement l'identifiant du
--    lieu dans la liste de l'appli (GeoNames, chiffres uniquement) : l'appli affiche le nom depuis sa
--    propre liste, dans la langue de chacun. Un texte saisi (ou envoyé par une appli modifiée) ne
--    peut donc jamais apparaître dans l'aperçu.
-- 2. Un identifiant de lieu ne contient que des chiffres.
-- 3. Quand un groupe change de taille, ses voitures sont verrouillées toujours dans le même ordre :
--    deux changements simultanés ne peuvent plus se bloquer l'un l'autre.
--
-- Tout ou rien : en cas d'erreur, rien n'est modifié.

begin;

-- Une ancienne valeur non numérique (impossible depuis l'appli) devient une saisie libre.
update public.participants set zone_place_id = null where zone_place_id !~ '^[0-9]{1,12}$';
update public.profiles set usual_zone_place_id = null where usual_zone_place_id !~ '^[0-9]{1,12}$';

alter table public.participants
  add constraint participants_zone_place_id_digits check (zone_place_id ~ '^[0-9]{1,12}$');
alter table public.profiles
  add constraint profiles_usual_zone_place_id_digits check (usual_zone_place_id ~ '^[0-9]{1,12}$');

create or replace function public.event_preview(p_id text)
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
    -- Identifiants de lieux seulement, jamais de nom : l'appli les traduit avec sa liste.
    'zones', coalesce(
      (select jsonb_agg(jsonb_build_object('place_id', z.zone_place_id, 'count', z.n)
                        order by z.n desc, z.zone_place_id)
         from (select p.zone_place_id, sum(p.party_size) as n
                 from public.participants p where p.event_id = e.id and p.zone_place_id is not null
                group by p.zone_place_id) z),
      '[]'::jsonb)
  );
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

-- `create or replace` garde les droits existants ; on les réaffirme quand même.
revoke all on function public.event_preview(text) from public, anon;
grant execute on function public.event_preview(text) to authenticated;
revoke all on function public.join_event(text, text, text, text, text, text, text, text[], int) from public, anon;
grant execute on function public.join_event(text, text, text, text, text, text, text, text[], int) to authenticated;

commit;
