-- Informatik 5 · 27.11.2026: Tab/Fenster zu = Tier sofort wieder frei
--  - kind_pause(token): beim Schließen (pagehide) – Tier gilt sofort als frei; der Schlüssel bleibt gültig,
--    damit letzte Speicherungen noch ankommen.
--  - kind_lebt(token, geraet): Lebenszeichen jede Minute, solange die Seite offen ist (und nach Neuladen).
--  - „besetzt“ nur noch, wenn in den letzten 4 Minuten ein Lebenszeichen kam (vorher 75 Minuten).
--  - kind_speichern hält ein pausiertes Tier nicht mehr besetzt.
create or replace function kind_pause(p_token uuid) returns void
language sql security definer set search_path=public as
$$ update kinder set geraet=null, aktiv_seit=now()-interval '1 day' where token=p_token $$;
create or replace function kind_lebt(p_token uuid, p_geraet text) returns boolean
language plpgsql security definer set search_path=public as $$
begin
  if p_token is null or length(coalesce(p_geraet,''))>40 then return false; end if;
  update kinder set aktiv_seit=now(), geraet=p_geraet where token=p_token;
  return found;
end $$;
revoke all on function kind_pause(uuid), kind_lebt(uuid,text) from public;
grant execute on function kind_pause(uuid), kind_lebt(uuid,text) to anon, authenticated;

create or replace function public.kind_anmelden(p_klasse text, p_tier text, p_geraet text)
 returns json language plpgsql security definer set search_path to 'public' as $function$
declare k kinder; t uuid;
begin
  if not klasse_offen(p_klasse) then return json_build_object('fehler','zu'); end if;
  select * into k from kinder where klasse=p_klasse and tier=p_tier for update;
  if not found then return json_build_object('fehler','unbekannt'); end if;
  if k.token is not null and k.geraet is not null and k.aktiv_seit > now()-interval '4 minutes' and k.geraet is distinct from p_geraet then
    return json_build_object('fehler','besetzt'); end if;
  t:=gen_random_uuid();
  update kinder set token=t, geraet=p_geraet, aktiv_seit=now() where id=k.id;
  return json_build_object('token',t,'staende',coalesce((select json_object_agg(station,prog) from staende where kind_id=k.id),'{}'::json));
end $function$;

create or replace function public.kind_tiere(p_klasse text)
 returns json language sql stable security definer set search_path to 'public' as $function$
  select json_build_object('offen',klasse_offen(p_klasse),'liste',coalesce((select json_agg(json_build_object(
      'tier',k.tier,'besetzt',(k.token is not null and k.geraet is not null and k.aktiv_seit > now()-interval '4 minutes')) order by k.erstellt)
    from kinder k where k.klasse=p_klasse),'[]'::json)) $function$;

create or replace function public.kind_speichern(p_token uuid, p_station text, p_prog jsonb)
 returns boolean language plpgsql security definer set search_path to 'public' as $function$
declare kid uuid;
begin
  select id into kid from kinder where token=p_token;
  if kid is null then return false; end if;
  if length(p_prog::text)>20000 or length(p_station)>40 then return false; end if;
  insert into staende(kind_id,station,prog,geaendert) values(kid,p_station,p_prog - 'stern' - 'lnote',now())
    on conflict(kind_id,station) do update set
      prog=(excluded.prog - 'stern' - 'lnote')
        || case when staende.prog ? 'stern' and (staende.prog->'start') is not distinct from (excluded.prog->'start')
                then jsonb_build_object('stern',staende.prog->'stern') else '{}'::jsonb end
        || case when staende.prog ? 'lnote' then jsonb_build_object('lnote',staende.prog->'lnote') else '{}'::jsonb end
        || case when staende.prog ? 'lnote' and staende.prog ? 'fertig' and not (excluded.prog ? 'fertig')
                then jsonb_build_object('fertig',staende.prog->'fertig','erg',staende.prog->'erg') else '{}'::jsonb end,
      geaendert=now();
  update kinder set aktiv_seit=now() where id=kid and geraet is not null;   -- pausiertes Tier bleibt frei
  return true;
end $function$;
