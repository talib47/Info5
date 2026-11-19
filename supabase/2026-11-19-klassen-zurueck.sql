-- Rückweg zu 2026-11-19-klassen.sql: wieder wie vorher (jede Lehrkraft sieht alles). Daten bleiben erhalten.
-- Danach die App auf den Stand vor der Änderung zurücksetzen (git revert).
begin;
do $$ declare t text; begin
  foreach t in array array['kinder','staende','stundenplan','freigaben'] loop
    execute format('drop policy if exists l_eigene on %I', t);
    execute format('drop policy if exists l_alles on %I', t);
    execute format('create policy l_alles on %I for all to authenticated using (ist_lehrkraft()) with check (ist_lehrkraft())', t);
  end loop; end $$;
drop policy if exists a_lesen on abschluesse; create policy a_lesen on abschluesse for select to authenticated using (ist_lehrkraft());
drop policy if exists s_lesen on sicherungen; create policy s_lesen on sicherungen for select to authenticated using (ist_lehrkraft());
drop policy if exists lu_lehrkraft on lehrer_uebergabe; create policy lu_lehrkraft on lehrer_uebergabe for all to authenticated using (ist_lehrkraft()) with check (ist_lehrkraft());
-- Tabelle klassen, Spalte stundenplan.gruppe und die neuen Funktionen stören die alte App nicht und bleiben.
commit;
