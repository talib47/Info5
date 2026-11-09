# Informatik 5 – Gestaltungs- und Qualitätsauftrag

Dieser Text ist der Arbeitsauftrag für jede Überarbeitung der Seite. Er beschreibt, für wen die Seite da ist, wie sie aussehen und sich anfühlen soll und woran jede Änderung gemessen wird.

## Wofür die Seite da ist

Eine Lehrkraft unterrichtet sechs Halbgruppen der 5. Klasse, jede eine Doppelstunde pro Woche, im PC-Raum einer Gesamtschule. Viele Kinder lesen schwach und haben wenig Erfahrung am Computer. Die Lehrkraft will **nur den Link öffnen lassen**: Die Kinder arbeiten selbstständig, die Lehrkraft geht herum, hilft und trägt am Ende die Note ein. Kein Drucken, keine Vorbereitung, ein ganzes Schuljahr lang, Jahr für Jahr.

Maßstab: So, als hätten eine Grundschul-Didaktikerin, ein Fachleiter Informatik, eine Produktdesignerin und jemand für Barrierefreiheit gemeinsam daran gearbeitet.

## Die Rolle

Arbeite als dieses Team. Triff Entscheidungen selbst und begründe sie kurz. Nichts wird übernommen, nur weil es schon da ist. Nichts wird hinzugefügt, was einem Kind in der Stunde nicht hilft.

## Gestaltung: „Rechenheft“

Die Seite ist kein Spiel und kein Dashboard. Sie ist ein **digitales Arbeitsheft**. Alle Entscheidungen kommen aus der Welt, die Fünftklässler kennen: kariertes Papier, Füller, Textmarker, der Stempel der Lehrkraft. Kästchen sind zugleich das Grundmotiv der Informatik (Pixel, Bits). Das ist das eine Wiedererkennungszeichen – alles andere bleibt still.

- **Papier und Tinte:** kühles Weiß, blassblaue Karolinien als Seitenhintergrund, Arbeitsfläche als weißes Blatt darauf. Text in Tintenblau-Schwarz. Eine einzige Aktionsfarbe: Königsblau (Füllertinte). Gelb nur als Textmarker für „Merke“. Rot und Grün nur für falsch und richtig.
- **Schrift:** Atkinson Hyperlegible (für gute Lesbarkeit entwickelt, I/l/1 und 0/O klar unterscheidbar), dazu die passende Mono für alles, was Code oder Binär ist. Keine zweite Zierschrift.
- **Form:** kleine Radien (Kontrollen 8 px), klare Linien statt Schatten, keine Pillen, keine Verläufe, keine farbigen Kreise um Rubriken.
- **Kästchen als System:** Fortschritt = ausgefüllte Kästchen. Jede Station hat ein 7×7-Pixelzeichen statt eines Emojis. Die Note erscheint als Stempel.
- **Emojis** nur noch als Inhalt (das Tier des Kindes, Bildkarten in Aufgaben), nie in Knöpfen, Überschriften oder Statusanzeigen.
- **Bewegung** nur als Antwort auf eine Handlung. Kein Konfetti. `prefers-reduced-motion` wird beachtet.
- **Dunkel:** Schiefertafel statt Schwarz, gleiche Regeln.

Nicht erlaubt, weil es nach Baukasten aussieht: lila Verlaufsflächen, Karten mit weichem Schatten, Großbuchstaben-Etiketten, „A · B · C“-Zeilen als Dekoration, Pillen-Chips, Emoji-Überschriften.

## Aufbau aus Sicht des Kindes

1. **Start:** Eine Sache steht groß da: die Station von heute und ein Knopf. Darunter der Lernpfad als ruhige Liste. Punkte und Rang klein.
2. **In der Station:** oben eine schmale Zeile (zurück, Station, Teil x von y, Punkte) und die Kästchen-Leiste. Dann nur die Aufgabe. „Weiter“ sitzt immer an derselben Stelle am unteren Rand und ist ohne Scrollen erreichbar.
3. **Ergebnis:** Stempel mit + / o / −, Punkte, „Zeig das deiner Lehrkraft“.
4. **Spielplatz:** ist Belohnung, nicht Navigation. Er erscheint erst, wenn die Station von heute geschafft ist, und steht nie über der Arbeit. In der Lehrer-Vorschau steht er am Ende.

## Pädagogische Regeln

- Ein Bildschirm, eine Aufgabe, eine Handlung. Arbeitsanweisung in höchstens zwei kurzen Sätzen, Verb zuerst.
- Einfache Wörter, kurze Sätze, kein Fachwort ohne Erklärung. Nicht kindisch: keine Verniedlichung, keine Ausrufezeichen-Ketten.
- Rückmeldung sofort, sachlich und mit Hinweis, was als Nächstes zu tun ist. Fehler sind normal; der zweite Fehlversuch markiert die Stelle.
- Kein Ton. Kein Zeitdruck. Kein Vergleich mit anderen Kindern.
- Jede Station füllt 60 Minuten und baut auf der vorigen auf; pro Tag eine neue Station.
- Bewertung bleibt durchschaubar: Punkte → + / o / −.

## Technik und Geräte

- Schul-PCs mit Firefox, 1366×768, Maus und Tastatur sind der Hauptfall. Alles muss dort ohne horizontales Scrollen und mit sichtbarem „Weiter“ funktionieren.
- Läuft ebenso in Chrome, Edge, Safari; iPad und iPhone über Touch-Varianten; Hell und Dunkel; Zoom bis 200 %.
- Keine fremden Server für Schriften oder Skripte, die Kinderdaten sehen könnten. Schriften liegen im Projekt.
- Tastaturbedienung, sichtbarer Fokus, Kontrast mindestens AA, Trefferflächen mindestens 44 px.
- Zurück-Taste des Browsers, Neuladen, zweiter Tab, abgelaufene Stunde: nichts geht verloren, nichts verwirrt.

## Für die Lehrkraft

- Die Lehrer-Ansicht folgt denselben Gestaltungsregeln, ist aber dichter.
- Auf einen Blick: wer ist wo, wer hängt, welche Note heute.
- Jede Station nennt ihren Lehrplanbezug.

## Abnahme

Vor jeder Veröffentlichung: alle Stationen automatisch als Kind durchspielen, Bildschirmfotos bei 1366×768, 390 px und im Dunkelmodus ansehen, auf Überlauf prüfen. Was nicht geprüft wurde, wird benannt.
