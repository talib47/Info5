-- Informatik 5 · Änderung vom 19.11.2026 (2): Schalter der Lehrkraft für einzelne Stationen
-- klassen.stationen = {stationId: true (offen) | false (zu)}; ohne Eintrag gilt „automatisch, eine pro Schulwoche“.
alter table klassen add column if not exists stationen jsonb not null default '{}'::jsonb;
do $$ begin
  if not exists(select 1 from pg_constraint where conname='klassen_stationen_check') then
    alter table klassen add constraint klassen_stationen_check check (jsonb_typeof(stationen)='object' and length(stationen::text)<=4000); end if;
end $$;
grant update (stationen) on klassen to authenticated;

create or replace function plan_alle() returns json
language sql stable security definer set search_path=public as $$
  select json_build_object(
    'klassen',coalesce((select json_agg(json_build_object('klasse',klasse,'modus',modus,'start',start,'stationen',stationen) order by klasse) from klassen),'[]'::json),
    'plan',coalesce((select json_agg(json_build_object('klasse',s.klasse,'tag',s.tag,'von',to_char(s.von,'HH24:MI'),'min',s.min,'gruppe',s.gruppe) order by s.klasse,s.tag,s.von)
                     from stundenplan s join klassen k on k.klasse=s.klasse),'[]'::json)) $$;
