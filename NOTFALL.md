# Notfall: So kommst du immer an die Noten

Die Noten liegen an vier Stellen. Fällt eine aus, gibt es die nächste. Für nichts davon brauchst du Claude.

## 1. Notfall-Datei (der einfachste Weg)

In der Lehrer-Ansicht: **„Notfall-Datei: alle Noten speichern“**. Das ist eine Tabelle (`Informatik5-Noten-JJJJ-MM-TT.csv`), die sich mit Excel öffnen lässt: Klasse, Name, Tier, Station, Stand, Note, Punkte, Fehlversuche, Minuten, Datum.

Die Datei wird außerdem **einmal am Tag automatisch heruntergeladen**, sobald du die Lehrer-Ansicht öffnest und es neue Noten gibt. Sie landet im Download-Ordner. Lege sie ab und zu auf IServ oder einen Stick.

Eine Kopie der letzten Notenliste liegt zusätzlich im Browser, mit dem du die Lehrer-Ansicht zuletzt geöffnet hast.

## 2. Abschluss-Protokoll (lässt sich nicht löschen)

Jede fertige Station wird in der Datenbank zusätzlich in die Tabelle `abschluesse` geschrieben. Dort kann die Seite nichts ändern oder löschen – auch nicht, wenn ein Stand zurückgesetzt, ein Tier gelöscht oder eine Station „verbessert“ wird. Jeder Versuch bleibt stehen.

## 3. Stündliche Sicherung in der Datenbank

Die Datenbank kopiert jede Stunde alle Kinder, Stände und das Protokoll in die Tabelle `sicherungen` (ein Eintrag pro Tag, 60 Tage zurück).

## 4. Direkt in Supabase nachsehen (wenn die Webseite nicht läuft)

1. https://supabase.com/dashboard öffnen und anmelden, Projekt **Informatik5**.
2. Links **Table Editor** → Ansicht **notenliste** (oder Tabelle `abschluesse`).
3. Oben rechts **Export → CSV**. Das ist die Notenliste mit Klasse, Tier, Station, Note, Punkten und Datum.

Die Namen stehen dort nicht (nur Tiere). Welches Kind welches Tier hat, steht in deiner gesicherten Namensliste und auf den Kärtchen.

Einen älteren Tag zurückholen: Tabelle `sicherungen`, Zeile des Tages, Spalte `inhalt` kopieren.

## Was passiert, wenn …

| Fall | Folge |
|---|---|
| Internet fällt in der Stunde aus | Die Kinder arbeiten weiter. Der Stand bleibt auf dem PC und wird gesendet, sobald die Verbindung zurück ist – auch erst bei der nächsten Anmeldung desselben Tiers an diesem PC. |
| Ein Kind löscht den Browser-Verlauf | Nichts geht verloren, der Stand liegt in der Datenbank. |
| Du löschst aus Versehen einen Stand oder ein Tier | Die fertigen Stationen stehen weiter im Protokoll und in der Notfall-Datei. |
| Die Webseite (GitHub) ist nicht erreichbar | Noten über Weg 4 oder die letzte Notfall-Datei. |
| Supabase pausiert das Projekt (nach etwa einer Woche ganz ohne Zugriff) | Im Dashboard auf **Restore** klicken. Die Daten bleiben erhalten. Ein automatischer Zugriff zweimal pro Woche soll das verhindern. |
| Du hast dein Passwort geändert | Die Noten sind nicht betroffen. Nur die verschlüsselte Namensliste muss neu geladen werden (Datei „Namensliste sichern“). |
| Claude steht nicht mehr zur Verfügung | Die Seite läuft unverändert weiter. Der ganze Code liegt in diesem GitHub-Projekt, die Daten in deinem Supabase-Projekt. |

## Vor den Ferien und am Schuljahresende

Notfall-Datei speichern und zusammen mit der Namensliste auf IServ ablegen.
