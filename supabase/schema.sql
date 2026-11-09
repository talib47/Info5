-- Informatik 5: Datenbank (Supabase, Region EU/Frankfurt).
-- Pseudonym: Es gibt KEINE Namen in der Datenbank. Nur Klasse, Tier und Punkte.
-- Welches Kind welches Tier ist, steht nur im Browser der Lehrkraft.
-- Anmelden geht nur, wenn die Klasse offen ist: automatisch nach Stundenplan (deutsche Zeit, Sommer-/Winterzeit
-- automatisch, nicht in den Ferien) oder von der Lehrkraft von Hand geöffnet.
--
-- Einrichten:
-- 1. Neues Supabase-Projekt (Region Frankfurt), dieses Skript im SQL-Editor ausführen.
-- 2. Authentication → Providers → Email: „Allow new users to sign up“ AUS.
-- 3. Authentication → Users → „Add user“: eigene E-Mail und Passwort anlegen.
-- Kinder legt nur die Lehrkraft an (Lehrer-Ansicht → Klassenliste und Tiere zuteilen); kind_neu ist für Kinder gesperrt.
-- 4. Unten die letzte Zeile mit der eigenen E-Mail ausführen (macht dich zur Lehrkraft).
-- 5. URL und anon-Schlüssel in src/daten.js bei ONLINE eintragen. Den service_role-Schlüssel NIE eintragen.
-- Stundenplan und Ferien stehen in src/app.js; die Lehrer-Ansicht überträgt sie beim Öffnen automatisch hierher.

create table if not exists lehrkraefte(user_id uuid primary key references auth.users on delete cascade);

create table if not exists kinder(
  id uuid primary key default gen_random_uuid(),
  klasse text not null,
  tier text not null check (length(tier)<=20),
  token uuid,                 -- aktuelle Anmeldung
  geraet text,                -- welcher PC gerade angemeldet ist
  aktiv_seit timestamptz,     -- letzte Aktivität (für „besetzt“)
  erstellt timestamptz not null default now(),
  unique(klasse,tier)
);

create table if not exists staende(
  kind_id uuid not null references kinder on delete cascade,
  station text not null,
  prog jsonb not null,
  geaendert timestamptz not null default now(),
  primary key(kind_id,station)
);

-- Stundenplan: tag 1=Mo … 5=Fr, von = Beginn (deutsche Zeit), min = Dauer; offen ab puffer Minuten vorher bis Stundenende
create table if not exists stundenplan(klasse text not null, tag int not null, von time not null, min int not null, puffer int not null default 5);
create table if not exists ferien(von date not null, bis date not null);
-- Hand-Steuerung: offen_bis = von Hand geöffnet bis; zu_bis = von Hand geschlossen bis
create table if not exists freigaben(klasse text primary key, offen_bis timestamptz, zu_bis timestamptz);

alter table lehrkraefte enable row level security;
alter table kinder enable row level security;
alter table staende enable row level security;
alter table stundenplan enable row level security;
alter table ferien enable row level security;
alter table freigaben enable row level security;

create or replace function ist_lehrkraft() returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from lehrkraefte where user_id=auth.uid()) $$;

-- Lehrkräfte dürfen alles, Kinder (anon) direkt gar nichts – nur über die Funktionen unten.
do $$ declare t text; begin
  foreach t in array array['kinder','staende','stundenplan','ferien','freigaben'] loop
    execute format('drop policy if exists l_alles on %I', t);
    execute format('create policy l_alles on %I for all to authenticated using (ist_lehrkraft()) with check (ist_lehrkraft())', t);
  end loop; end $$;
drop policy if exists l_selbst on lehrkraefte; create policy l_selbst on lehrkraefte for select to authenticated using (user_id=auth.uid());

create or replace function klasse_offen(p_klasse text) returns boolean
language sql stable security definer set search_path=public as $$
  with j as (select (now() at time zone 'Europe/Berlin') as t), f as (select * from freigaben where klasse=p_klasse)
  select case
    when exists(select 1 from f where zu_bis>now()) then false
    when exists(select 1 from f where offen_bis>now()) then true
    when exists(select 1 from ferien, j where j.t::date between ferien.von and ferien.bis) then false
    else exists(select 1 from stundenplan s, j where s.klasse=p_klasse and s.tag=extract(isodow from j.t)
           and j.t::time >= s.von - make_interval(mins=>s.puffer) and j.t::time < s.von + make_interval(mins=>s.min))
  end $$;

create or replace function offene_klassen(p_klassen text[]) returns text[]
language sql stable security definer set search_path=public as $$ select coalesce(array_agg(k),'{}') from unnest(p_klassen) k where klasse_offen(k) $$;

-- „besetzt“ = an einem anderen Gerät in den letzten 75 Minuten aktiv
create or replace function kind_tiere(p_klasse text) returns json
language sql stable security definer set search_path=public as $$
  select json_build_object('offen',klasse_offen(p_klasse),'liste',coalesce((select json_agg(json_build_object(
      'tier',k.tier,'besetzt',(k.token is not null and k.aktiv_seit > now()-interval '75 minutes')) order by k.erstellt)
    from kinder k where k.klasse=p_klasse),'[]'::json)) $$;

create or replace function kind_neu(p_klasse text, p_tier text, p_geraet text) returns json
language plpgsql security definer set search_path=public as $$
declare t uuid;
begin
  if not klasse_offen(p_klasse) then return json_build_object('fehler','zu'); end if;
  if p_tier is null or length(p_tier)>20 then return json_build_object('fehler','unbekannt'); end if;
  if (select count(*) from kinder where klasse=p_klasse)>=40 then return json_build_object('fehler','voll'); end if;
  t:=gen_random_uuid();
  insert into kinder(klasse,tier,token,geraet,aktiv_seit) values(p_klasse,p_tier,t,p_geraet,now());
  return json_build_object('token',t,'staende','{}'::json);
exception when unique_violation then return json_build_object('fehler','vergeben');
end $$;

create or replace function kind_anmelden(p_klasse text, p_tier text, p_geraet text) returns json
language plpgsql security definer set search_path=public as $$
declare k kinder; t uuid;
begin
  if not klasse_offen(p_klasse) then return json_build_object('fehler','zu'); end if;
  select * into k from kinder where klasse=p_klasse and tier=p_tier for update;
  if not found then return json_build_object('fehler','unbekannt'); end if;
  if k.token is not null and k.aktiv_seit > now()-interval '75 minutes' and k.geraet is distinct from p_geraet then
    return json_build_object('fehler','besetzt'); end if;
  t:=gen_random_uuid();
  update kinder set token=t, geraet=p_geraet, aktiv_seit=now() where id=k.id;
  return json_build_object('token',t,'staende',coalesce((select json_object_agg(station,prog) from staende where kind_id=k.id),'{}'::json));
end $$;

create or replace function kind_speichern(p_token uuid, p_station text, p_prog jsonb) returns boolean
language plpgsql security definer set search_path=public as $$
declare kid uuid;
begin
  select id into kid from kinder where token=p_token;
  if kid is null then return false; end if;
  if length(p_prog::text)>20000 or length(p_station)>40 then return false; end if;
  insert into staende(kind_id,station,prog,geaendert) values(kid,p_station,p_prog,now())
    on conflict(kind_id,station) do update set prog=excluded.prog, geaendert=now();
  update kinder set aktiv_seit=now() where id=kid;
  return true;
end $$;

create or replace function kind_abmelden(p_token uuid) returns void
language sql security definer set search_path=public as $$ update kinder set token=null, geraet=null where token=p_token $$;

revoke all on function klasse_offen(text), offene_klassen(text[]), kind_tiere(text), kind_neu(text,text,text), kind_anmelden(text,text,text), kind_speichern(uuid,text,jsonb), kind_abmelden(uuid) from public;
grant execute on function klasse_offen(text), offene_klassen(text[]), kind_tiere(text), kind_neu(text,text,text), kind_anmelden(text,text,text), kind_speichern(uuid,text,jsonb), kind_abmelden(uuid) to anon, authenticated;

-- Zum Schluss mit der eigenen E-Mail:
-- insert into lehrkraefte(user_id) select id from auth.users where email='DEINE@EMAIL.de';
revoke execute on function kind_neu(text,text,text) from anon, authenticated, public;
