-- =====================================================================
-- Informatik 5 · Änderung vom 19.11.2026: Klassen gehören einer Lehrkraft
--  - neue Tabelle klassen (mit „Stationen öffnen“: woche / frei / tag)
--  - Stundenplan bekommt die Gruppe und wird von jeder Lehrkraft selbst gepflegt
--  - jede Lehrkraft sieht und ändert nur Kinder, Stände, Freigaben, Abschlüsse und Stundenplan IHRER Klassen
--  - Kinder bekommen Klassen und Stundenplan (ohne Namen) über plan_alle()
-- Bestehende Daten werden nicht verändert: 5B, 5D, 5E gehören danach der bisherigen (einzigen) Lehrkraft,
-- wochenweise ab 09.11.2026. Läuft als ein Block: Geht etwas schief, ändert sich gar nichts.
-- =====================================================================
begin;

do $$ begin
  if (select count(*) from lehrkraefte)<>1 then raise exception 'Erwartet genau eine Lehrkraft, gefunden: %',(select count(*) from lehrkraefte); end if;
end $$;

-- 1. Klassen ----------------------------------------------------------
create table if not exists klassen(
  klasse text primary key check (klasse ~ '^[0-9A-ZÄÖÜ][0-9A-ZÄÖÜ-]{0,11}$'),
  lehrkraft uuid not null references auth.users(id) on delete restrict,
  modus text not null default 'woche' check (modus in ('woche','frei','tag')),
  start date,
  angelegt timestamptz not null default now(),
  geaendert timestamptz not null default now(),
  check (modus<>'woche' or start is not null));
create unique index if not exists klassen_name_gross_klein on klassen(lower(klasse));
alter table klassen enable row level security;

insert into klassen(klasse,lehrkraft,modus,start)
  select k,(select user_id from lehrkraefte),'woche','2026-11-09' from unnest(array['5B','5D','5E']) k
  on conflict (klasse) do nothing;

-- Gehört die Klasse der angemeldeten Lehrkraft?
create or replace function meine_klasse(p_klasse text) returns boolean
language sql stable security definer set search_path=public as
$$ select ist_lehrkraft() and exists(select 1 from klassen where klasse=p_klasse and lehrkraft=auth.uid()) $$;
revoke all on function meine_klasse(text) from public;
grant execute on function meine_klasse(text) to authenticated;

-- Lehrkraft: eigene Klassen lesen; ändern nur „Stationen öffnen“ (Name und Besitzer bleiben fest)
drop policy if exists k_eigene_lesen on klassen;
create policy k_eigene_lesen on klassen for select to authenticated using (lehrkraft=auth.uid() and ist_lehrkraft());
drop policy if exists k_eigene_aendern on klassen;
create policy k_eigene_aendern on klassen for update to authenticated using (lehrkraft=auth.uid() and ist_lehrkraft()) with check (lehrkraft=auth.uid());
revoke all on klassen from anon, authenticated;
grant select on klassen to authenticated;
grant update (modus,start,geaendert) on klassen to authenticated;

-- 2. Stundenplan --------------------------------------------------------
alter table stundenplan add column if not exists gruppe smallint;
do $$ begin
  if not exists(select 1 from pg_constraint where conname='stundenplan_gruppe_check') then
    alter table stundenplan add constraint stundenplan_gruppe_check check (gruppe is null or gruppe in (1,2)); end if;
end $$;
update stundenplan set gruppe=case when (klasse,tag,von) in (('5B',1,'09:05'),('5D',3,'10:20'),('5E',1,'08:00')) then 1
                                   when (klasse,tag,von) in (('5B',3,'11:25'),('5D',4,'13:40'),('5E',5,'10:20')) then 2 end
  where gruppe is null and klasse in ('5B','5D','5E');

-- Unterricht einer Klasse ersetzen (nur eigene Klasse; geprüft)
create or replace function unterricht_schreiben(p_klasse text, p_stunden jsonb) returns void
language plpgsql security definer set search_path=public as $$
declare n int;
begin
  if jsonb_typeof(p_stunden)<>'array' then raise exception 'Stunden fehlen'; end if;
  n:=jsonb_array_length(p_stunden);
  if n<1 or n>12 then raise exception 'Zwischen 1 und 12 Stunden'; end if;
  if exists(select 1 from jsonb_to_recordset(p_stunden) as x(tag int, von time, min int, gruppe smallint)
            where x.tag not between 1 and 5 or x.von is null or x.min not between 15 and 180
               or x.von < '07:00' or x.von + make_interval(mins=>x.min) > '18:00' or (x.gruppe is not null and x.gruppe not in (1,2))) then
    raise exception 'Ungültige Stunde'; end if;
  delete from stundenplan where klasse=p_klasse;
  insert into stundenplan(klasse,tag,von,min,gruppe,puffer)
    select p_klasse,x.tag,x.von,x.min,x.gruppe,5 from jsonb_to_recordset(p_stunden) as x(tag int, von time, min int, gruppe smallint);
end $$;
revoke all on function unterricht_schreiben(text,jsonb) from public, anon, authenticated;

create or replace function klasse_anlegen(p_klasse text, p_modus text, p_start date, p_stunden jsonb) returns boolean
language plpgsql security definer set search_path=public as $$
begin
  if not ist_lehrkraft() then raise exception 'Nur für Lehrkräfte'; end if;
  if exists(select 1 from klassen where lower(klasse)=lower(p_klasse)) then return false; end if;
  insert into klassen(klasse,lehrkraft,modus,start) values(p_klasse,auth.uid(),p_modus,p_start);
  perform unterricht_schreiben(p_klasse,p_stunden);
  return true;
exception when unique_violation then return false;
end $$;

create or replace function klasse_unterricht(p_klasse text, p_stunden jsonb) returns void
language plpgsql security definer set search_path=public as $$
begin
  if not meine_klasse(p_klasse) then raise exception 'Nicht deine Klasse'; end if;
  perform unterricht_schreiben(p_klasse,p_stunden);
end $$;
revoke all on function klasse_anlegen(text,text,date,jsonb), klasse_unterricht(text,jsonb) from public, anon;
grant execute on function klasse_anlegen(text,text,date,jsonb), klasse_unterricht(text,jsonb) to authenticated;

-- Für die Anmeldeseite der Kinder: Klassen, Regel und Stundenplan – keine Namen, keine Lehrkraft
create or replace function plan_alle() returns json
language sql stable security definer set search_path=public as $$
  select json_build_object(
    'klassen',coalesce((select json_agg(json_build_object('klasse',klasse,'modus',modus,'start',start) order by klasse) from klassen),'[]'::json),
    'plan',coalesce((select json_agg(json_build_object('klasse',s.klasse,'tag',s.tag,'von',to_char(s.von,'HH24:MI'),'min',s.min,'gruppe',s.gruppe) order by s.klasse,s.tag,s.von)
                     from stundenplan s join klassen k on k.klasse=s.klasse),'[]'::json)) $$;
revoke all on function plan_alle() from public;
grant execute on function plan_alle() to anon, authenticated;

-- 3. Jede Lehrkraft nur ihre Klassen -------------------------------------
drop policy if exists l_alles on kinder;
drop policy if exists l_eigene on kinder;
create policy l_eigene on kinder for all to authenticated using (meine_klasse(klasse)) with check (meine_klasse(klasse));

drop policy if exists l_alles on staende;
drop policy if exists l_eigene on staende;
create policy l_eigene on staende for all to authenticated
  using (exists(select 1 from kinder k where k.id=kind_id and meine_klasse(k.klasse)))
  with check (exists(select 1 from kinder k where k.id=kind_id and meine_klasse(k.klasse)));

drop policy if exists l_alles on freigaben;
drop policy if exists l_eigene on freigaben;
create policy l_eigene on freigaben for all to authenticated using (meine_klasse(klasse)) with check (meine_klasse(klasse));

-- Stundenplan: lesen die eigenen; schreiben nur über klasse_anlegen / klasse_unterricht
drop policy if exists l_alles on stundenplan;
drop policy if exists l_eigene on stundenplan;
create policy l_eigene on stundenplan for select to authenticated using (meine_klasse(klasse));

drop policy if exists a_lesen on abschluesse;
create policy a_lesen on abschluesse for select to authenticated using (meine_klasse(klasse));

-- Sicherungen enthalten alle Klassen: nicht mehr über die App lesbar (die App braucht sie nicht; Zugriff über das Supabase-Dashboard)
drop policy if exists s_lesen on sicherungen;
-- Einmalige Namens-Übergabe ist erledigt (Tabelle leer): niemand liest oder schreibt sie mehr über die App
drop policy if exists lu_lehrkraft on lehrer_uebergabe;

-- Ferien gelten für alle (jede Lehrkraft schreibt dieselben Ferien aus app.js): bleibt wie gehabt.

commit;
