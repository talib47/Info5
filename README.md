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

## Lernpfad (17 Stationen à 60 Minuten)

Die Kinder gehen die Stationen der Reihe nach. Pro Tag öffnet sich höchstens **eine neue** Station (`EINE_PRO_TAG` in `src/app.js`), damit schnelle Kinder der Klasse nicht davonlaufen. Wer heute fertig ist, darf auf den **🎮 Spielplatz** (Bonus-Spiele ohne Note, Stand nur auf dem Gerät). Für jede Station gibt es ein Abzeichen 🥇🥈🥉 (= Note + / o / −), die gesammelten Punkte ergeben Sterne und einen Rang.

| Nr. | Station | Kapitel | Kernlehrplan NRW (Inhaltsfeld) |
|---|---|---|---|
| 1 | 🖱️ Maus- & Tasten-Profi | Fit am Computer | Informatiksysteme |
| 2 | 🖥️ Was steckt im Computer? (EVA, Hardware/Software) | Fit am Computer | Informatiksysteme |
| 3 | 📁 Ordnung im Computer (Dateien, Ordner, Pfade) | Fit am Computer | Informatiksysteme |
| 4 | ⌨️ Tipp-Training (Zehn-Finger) | Fit am Computer | Informatiksysteme |
| 5 | 🔐 Passwort-Werkstatt | Sicher im Netz | Informatik, Mensch und Gesellschaft |
| 6 | 🎣 Echt oder Fake? (Phishing, Falschmeldungen) | Sicher im Netz | Informatik, Mensch und Gesellschaft |
| 7 | 💬 Nett im Netz (Cybermobbing, Recht am Bild) | Sicher im Netz | Informatik, Mensch und Gesellschaft |
| 8 | 🎨 Pixel-Werkstatt (Bilder codieren, komprimieren, Prüfbit) | Daten & Codes | Information und Daten |
| 9 | 0️⃣ Geheimsprache Binär (Bits, Bytes, Buchstaben-Code) | Daten & Codes | Information und Daten |
| 10 | 🕵️ Geheimschrift (Caesar, Gartenzaun) | Daten & Codes | Information und Daten |
| 11 | 🧭 Algorithmen im Alltag (Sequenz, Wiederholung, Verzweigung) | Algorithmen | Algorithmen |
| 12 | 🤖 Robo-Labyrinth (Programmieren, Debugging) | Algorithmen | Algorithmen |
| 13 | 🔁 Schleifen-Profi | Algorithmen | Algorithmen |
| 14 | 🔍 Suchen & Sortieren (binäre Suche, Waage, Bubblesort) | Algorithmen | Algorithmen |
| 15 | 🥤 Automaten überall (Zustände, Übergänge) | Automaten & KI | Automaten und KI |
| 16 | 🧠 Wie lernt eine KI? (Entscheidungsbaum, Trainingsdaten) | Automaten & KI | Automaten und KI |
| 17 | 👣 Meine Daten-Spuren (Datenschutz) + Abschluss-Mission | Ich & meine Daten | Informatik, Mensch und Gesellschaft |

Spielplatz: Pixel-Atelier, Robo-Bonus, Rätsel-Ecke, Tipp-Rennen, KI-Zeichnen, Zahlen-Detektiv.

Die Lehrer-Ansicht zeigt unter „📚 Lernpfad & Lehrplan“ alle Stationen mit KLP-Bezug.

## Neue Station anlegen

Eine Datei `src/stationen/NN-name.js` mit `station({...})` (Hilfs-Konstanten in `{ … }` einschließen, alle Dateien teilen sich einen Namensraum):

- `id` (für den Link `#s/id`), `nr` (Reihenfolge), `ico`, `titel`, `kurz`, `kapitel` (`fit`, `netz`, `daten`, `algo`, `ki`, `ich`), `klp` (Lehrplanbezug), `kreativ` (true = Lehrkraft bewertet Kreativität), `spiel` (true = Spielplatz, ohne Note)
- `schritte`: Liste von Teilen. Am einfachsten mit den fertigen Bausteinen:
  - `src/stationen/00-bausteine.js`: `sortieren`, `reihenfolge`, `paare`, `fehlerSuche`, `entscheidung`, `ordnerPfad`, `eingabe`, `tippen`, `tastenMissionen`, `mausParcours`, `malRoboter` (auch mit Schleifen `3x(R M)`), `info`
  - `src/stationen/00-spezial.js`: `auswaehlen`, `robo` (Labyrinth, Schleifen, `max`, `vorgabe` mit Bug), `binaerTresor`, `caesarRad`, `automat`, `ampelBauen`, `baumFolgen`, `baumBauen`, `kiTrainer`, `kiZeichnen`, `passwortTester`, `pinKnacker`, `zahlRaten`, `waage`, `tauschSortieren`
- Jeder Teil hat `titel`, `punkte`, optional `merke` (gelber Merkkasten). Eigene Teile: `{titel, punkte, zeige(el, ctx)}`; `ctx.pruefer` (wird von „Weiter“ aufgerufen), `ctx.loesung` (Knopf „🔑 Lösung zeigen“ in der Vorschau), `ctx.geschafft(punkte)`, `ctx.fehler()` (−2 Punkte, höchstens die Hälfte), `ctx.daten` + `ctx.speichern()`.
- optional `ergebnis(daten)` (HTML für die Ergebniskarte) und `nachErgebnis(daten)`.

Klassenliste jedes Schuljahr oben in `src/app.js` (`KLASSEN`), dazu `STUNDENPLAN` und `FERIEN` anpassen.

## Bewertung

Wie im Notenbuch: **+** ab 75 % der Punkte, **o** ab 40 %, sonst **−** (Grenzen `PLUS_AB`, `O_AB` in `src/app.js`). Jeder falsche Versuch kostet 2 Punkte (höchstens die Hälfte des Teils). Die Lehrer-Ansicht zeigt unter „Für das Notenbuch · heute“ alle Zeichen des Tages zum Übertragen.
