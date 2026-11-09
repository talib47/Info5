# Informatik 5

Stunden-Seite für Informatik in Jahrgang 5 (Erich-Kästner-Gesamtschule Homberg, T. Gündoğdu).

**Kein Login, keine Datenbank.** Die Kinder tippen ihren Vornamen und ihre Klasse ein, wählen die Station, lösen die Teile und zeigen am Ende die **Ergebniskarte** (Punkte, Notenvorschlag, gearbeitete Zeit, bei kreativen Stationen das eigene Werk). Alles bleibt nur im Browser des Geräts. „Nicht du?“ oben rechts löscht alles für das nächste Kind.

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

## Notenvorschlag

Aus den Prozent der Punkte: ab 90 % → 1, ab 75 % → 2, ab 60 % → 3, ab 45 % → 4, ab 20 % → 5. Nur ein Vorschlag; Kreativität und Mitarbeit bewertet die Lehrkraft.
