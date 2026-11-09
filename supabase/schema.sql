-- Informatik 5: Datenbank (Supabase, Region EU/Frankfurt).
-- Pseudonym: Es gibt KEINE Namen in der Datenbank. Nur Klasse, Tier, Geheimtier und Punkte.
-- Kinder legen sich beim ersten Mal selbst an (Tier + Geheimtier), aber nur, wenn die Lehrkraft die Klasse freigeschaltet hat.
-- Welches Kind welches Tier ist, steht nur im Browser der Lehrkraft.
--
-- Einrichten:
-- 1. Neues Supabase-Projekt (Region Frankfurt), dieses Skript im SQL-Editor ausführen.
-- 2. Authentication → Providers → Email: „Allow new users to sign up“ AUS.
-- 3. Authentication → Users → „Add user“: eigene E-Mail und Passwort anlegen.
-- 4. Unten die letzte Zeile mit der eigenen E-Mail ausführen (macht dich zur Lehrkraft).
-- 5. URL und anon-Schlüssel in src/app.js bei ONLINE eintragen. Den service_role-Schlüssel NIE eintragen.

create table if not exists lehrkraefte(user_id uuid primary key references auth.users on delete cascade);

create table if not exists kinder(
  id uuid primary key default gen_random_uuid(),
  klasse text not null,
  tier text not null,
  geheim text,                -- Geheimtier; null = Kind wählt beim nächsten Anmelden ein neues
  gesperrt boolean not null default false,
  fehlversuche int not null default 0,
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

create table if not exists freigaben(klasse text primary key, bis timestamptz not null);

alter table lehrkraefte enable row level security;
alter table kinder enable row level security;
alter table staende enable row level security;
alter table freigaben enable row level security;

create or replace function ist_lehrkraft() returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from lehrkraefte where user_id=auth.uid()) $$;

-- Lehrkräfte dürfen alles, Kinder (anon) direkt gar nichts – nur über die Funktionen unten.
drop policy if exists l_alles on kinder;    create policy l_alles on kinder    for all to authenticated using (ist_lehrkraft()) with check (ist_lehrkraft());
drop policy if exists l_alles on staende;   create policy l_alles on staende   for all to authenticated using (ist_lehrkraft()) with check (ist_lehrkraft());
drop policy if exists l_alles on freigaben; create policy l_alles on freigaben for all to authenticated using (ist_lehrkraft()) with check (ist_lehrkraft());
drop policy if exists l_selbst on lehrkraefte; create policy l_selbst on lehrkraefte for select to authenticated using (user_id=auth.uid());

-- „besetzt“ = an einem anderen Gerät in den letzten 75 Minuten aktiv
create or replace function kind_tiere(p_klasse text) returns table(tier text, besetzt boolean, gesperrt boolean, neu_geheim boolean, offen boolean)
language sql stable security definer set search_path=public as $$
  select k.tier,
         (k.token is not null and k.aktiv_seit > now()-interval '75 minutes'),
         k.gesperrt,
         k.geheim is null,
         exists(select 1 from freigaben f where f.klasse=p_klasse and f.bis>now())
  from kinder k where k.klasse=p_klasse order by k.erstellt $$;

create or replace function kind_neu(p_klasse text, p_tier text, p_geheim text, p_geraet text) returns json
language plpgsql security definer set search_path=public as $$
declare t uuid;
begin
  if not exists(select 1 from freigaben where klasse=p_klasse and bis>now()) then return json_build_object('fehler','zu'); end if;
  if length(p_tier)>20 or length(p_geheim)>20 or p_tier is null or p_geheim is null then return json_build_object('fehler','unbekannt'); end if;
  if (select count(*) from kinder where klasse=p_klasse)>=40 then return json_build_object('fehler','voll'); end if;
  t:=gen_random_uuid();
  insert into kinder(klasse,tier,geheim,token,geraet,aktiv_seit) values(p_klasse,p_tier,p_geheim,t,p_geraet,now());
  return json_build_object('token',t,'staende','{}'::json);
exception when unique_violation then return json_build_object('fehler','vergeben');
end $$;

create or replace function kind_anmelden(p_klasse text, p_tier text, p_geheim text, p_geraet text) returns json
language plpgsql security definer set search_path=public as $$
declare k kinder; t uuid;
begin
  if not exists(select 1 from freigaben where klasse=p_klasse and bis>now()) then return json_build_object('fehler','zu'); end if;
  select * into k from kinder where klasse=p_klasse and tier=p_tier for update;
  if not found then return json_build_object('fehler','unbekannt'); end if;
  if k.gesperrt then return json_build_object('fehler','gesperrt'); end if;
  if k.token is not null and k.aktiv_seit > now()-interval '75 minutes' and k.geraet is distinct from p_geraet then
    return json_build_object('fehler','besetzt'); end if;
  if k.geheim is null then  -- Lehrkraft hat zurückgesetzt: neues Geheimtier übernehmen
    update kinder set geheim=p_geheim where id=k.id;
  elsif k.geheim<>p_geheim then
    update kinder set fehlversuche=fehlversuche+1, gesperrt=(fehlversuche+1>=2) where id=k.id;
    return json_build_object('fehler', case when k.fehlversuche+1>=2 then 'gesperrt' else 'falsch' end);
  end if;
  t:=gen_random_uuid();
  update kinder set token=t, geraet=p_geraet, aktiv_seit=now(), fehlversuche=0 where id=k.id;
  return json_build_object('token',t,'staende',coalesce((select json_object_agg(station,prog) from staende where kind_id=k.id),'{}'::json));
end $$;

create or replace function kind_speichern(p_token uuid, p_station text, p_prog jsonb) returns boolean
language plpgsql security definer set search_path=public as $$
declare kid uuid;
begin
  select id into kid from kinder where token=p_token and not gesperrt;
  if kid is null then return false; end if;
  if length(p_prog::text)>20000 then return false; end if;
  insert into staende(kind_id,station,prog,geaendert) values(kid,p_station,p_prog,now())
    on conflict(kind_id,station) do update set prog=excluded.prog, geaendert=now();
  update kinder set aktiv_seit=now() where id=kid;
  return true;
end $$;

create or replace function kind_abmelden(p_token uuid) returns void
language sql security definer set search_path=public as $$ update kinder set token=null, geraet=null where token=p_token $$;

revoke all on function kind_tiere(text), kind_anmelden(text,text,text,text), kind_neu(text,text,text,text), kind_speichern(uuid,text,jsonb), kind_abmelden(uuid) from public;
grant execute on function kind_tiere(text), kind_anmelden(text,text,text,text), kind_neu(text,text,text,text), kind_speichern(uuid,text,jsonb), kind_abmelden(uuid) to anon, authenticated;

-- Zum Schluss mit der eigenen E-Mail:
-- insert into lehrkraefte(user_id) select id from auth.users where email='DEINE@EMAIL.de';
