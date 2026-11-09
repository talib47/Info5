# Informatik 5

Stunden-Seite für Informatik in Jahrgang 5 (Erich-Kästner-Gesamtschule Homberg, T. Gündoğdu).

## Anmeldung der Kinder (ohne Tippen, ohne Namen)

1. Kind tippt **Klasse** → **sein Tier** → fertig. Beim ersten Mal: „Ich bin neu hier“ und ein freies Tier aussuchen.
2. Anmelden geht nur **während der eigenen Stunde**: Stundenplan und Ferien stehen oben in `src/app.js` (`STUNDENPLAN`, `FERIEN`, `PUFFER` = Minuten vor Beginn). Deutsche Zeit, Sommer-/Winterzeit automatisch. Die Lehrkraft kann unter `#lehrer` jederzeit von Hand öffnen oder schließen.
3. Ist ein Tier an einem anderen PC angemeldet, ist es grau („besetzt“). Lösen: Lehrer-Ansicht → „abmelden“, oder nach 75 Minuten automatisch.
4. Am Ende der Station zeigt das Kind die **Ergebniskarte**.

Vornamen gibt es nur in der Lehrer-Ansicht und nur im Browser der Lehrkraft („Namensliste sichern“). In der Datenbank stehen nur Klasse, Tier und Punkte.

## Speicher

- **Vorschau** (Standard): alles nur im Browser dieses Geräts.
- **Lehrer-Vorschau** (`#v`, Knopf „Stationen ansehen“ in der Lehrer-Ansicht): alle Stationen und Teile frei durchklicken, ohne zu lösen, nichts wird gespeichert.
- **Online**: nach dem Okay der Schule `supabase/schema.sql` in einem Supabase-Projekt (Region Frankfurt) ausführen, Anleitung steht oben in der Datei. Dann in `src/daten.js` bei `ONLINE` URL und anon-Schlüssel eintragen, `python3 build.py`, committen. Den service_role-Schlüssel nie eintragen.

Link für die Kinder: `talib47.github.io/Info5/` – eine bestimmte Station direkt: `talib47.github.io/Info5/#s/pixel`

## Bauen

Quelltext in `src/`. Nach jeder Änderung `python3 build.py` ausführen und `index.html` **und** `version.txt` committen. Die Seite lädt neue Versionen von selbst.

## Neue Station anlegen

Eine Datei `src/stationen/NN-name.js` mit `station({...})`:

- `id` (für den Link `#s/id`), `nr` (Reihenfolge), `ico`, `titel`, `kurz`, `kreativ` (true = Lehrkraft bewertet Kreativität)
- `schritte`: Liste von `{titel, punkte, zeige(el, ctx)}`. `zeige` baut den Teil in `el`. Wenn gelöst: `ctx.geschafft(punkte)`. Eigene Daten in `ctx.daten` ablegen und `ctx.speichern()` aufrufen.
- optional `ergebnis(daten)` (HTML für die Ergebniskarte) und `nachErgebnis(daten)`.

Bausteine in `src/app.js`: `pixelRaster`, `farbLeiste`, `toast`, `esc`.

Klassenliste jedes Schuljahr oben in `src/app.js` (`KLASSEN`) anpassen. Geplante Stationen stehen in `BALD` und erscheinen grau.

## Bewertung

Wie im Notenbuch: **+** ab 75 % der Punkte, **o** ab 40 %, sonst **−** (Grenzen `PLUS_AB`, `O_AB` in `src/app.js`). Die Lehrer-Ansicht zeigt unter „Für das Notenbuch · heute“ alle Zeichen des Tages zum Übertragen.
