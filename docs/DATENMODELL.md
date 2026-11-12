# Datenmodell (Entwurf v1)

Rahmen: Die App ist vorerst **intern** (Jakob + Freundeskreis). Das Modell ist trotzdem so
angelegt, dass Sync (Phase 4), Community (Phase 5) und eine spätere Veröffentlichung
**ohne Umbau** möglich sind.

## Grundregeln für alle Datensätze

Jeder Datensatz hat:

| Feld | Zweck |
|---|---|
| `id` | UUID, auf dem Gerät erzeugt (funktioniert offline, keine Kollisionen beim Sync) |
| `createdAt` / `updatedAt` | ISO-Zeitstempel; `updatedAt` entscheidet bei Sync-Konflikten |
| `deletedAt` | Löschen = markieren statt entfernen, damit Löschungen auf andere Geräte kommen |

Weitere Regeln:

- **Punkte werden berechnet, nicht getippt gespeichert.** Gespeichert werden die Eingaben
  (z. B. Ansage und Stiche), die Punkte ergeben sich aus den Regeln. Korrekturen und
  Statistiken wie „Ansage-Trefferquote“ bleiben so möglich.
- **Eine Partie friert ihre Regeln ein.** Beim Start wird eine Kopie der Vorlage in die
  Partie geschrieben. Spätere Regeländerungen ändern alte Ergebnisse nicht.
- **Rückgängig ist lokal.** Die Undo-Liste lebt nur auf dem Gerät und wird nicht synchronisiert.

## Objekte

### Spieler (`players`)
Eine Person am Tisch, **ohne Account**.

| Feld | Inhalt |
|---|---|
| `name`, `color` | Anzeige |
| `linkedUserId` | leer; später der Account, der diesen Spieler „übernommen“ hat |
| `mergedIntoId` | leer; gesetzt, wenn zwei Einträge dieselbe Person sind („Anna“ und „Anna M.“) |

Warum so: Am Tisch muss man jeden in Sekunden anlegen können, ohne Anmeldung. Später kann
Anna ihren Spieler mit ihrem Account verknüpfen, und ihre ganze Historie gehört ihr.
Doppelte Einträge lassen sich zusammenführen, ohne Partien umzuschreiben.

### Vorlage (`templates`)
Regeln als **Konfiguration aus Bausteinen**, nicht als eigener Code pro Spiel.

| Feld | Inhalt |
|---|---|
| `key`, `version` | z. B. `wizard`, `1` (eingebaute Vorlagen stehen im Code) |
| `name` | Anzeigename |
| `scoring` | Baustein: `rounds` · `bids` · `categories` · `rank` · `result` |
| `win` | `high` oder `low` |
| `end` | `none` · `target` (Wert) · `rounds` (Anzahl oder Formel wie 60 ÷ Spieler) |
| `players` | `{ min, max }` |
| `params` | Baustein-Details, z. B. Kategorien und Bonus bei Kniffel, Punkteformel bei Wizard |
| `custom` | `true` für selbst gebaute Vorlagen |
| `params.steps` | Zählschritte für die Schnelltasten (freies Spiel), z. B. `[1, 5, 10]` |

Eigene Vorlagen (freies Spiel) bekommen einen eigenen `key` und werden in der Tabelle
`templates` gespeichert, spätestens beim Beenden der ersten Partie. Partien verweisen über
`rules.key` auf ihre Vorlage. So lassen sich Statistiken je eigenem Spiel bilden und Vorlagen
später zusammenführen.

### Partie (`games`)

| Feld | Inhalt |
|---|---|
| `rules` | eingefrorene Kopie der Vorlage (`key` + `version` + Inhalt) |
| `status` | `running` · `finished` · `abandoned` |
| `startedAt` / `finishedAt` | Zeitpunkte |
| `seats` | Reihenfolge am Tisch: `[{ playerId, seat, team? }]` |
| `eventId` | optional: Anlass (siehe unten) |
| `place` | optional: Ort als Text („Cusco“) |
| `groupId` | leer; ab Phase 4 die Gruppe, mit der geteilt wird |

### Runde (`rounds`)
`gameId`, `index` (1, 2, 3 …). Bei Kategorie-Spielen gibt es keine Runden, dort zählen nur Einträge.

### Eintrag (`entries`)
**Die kleinste Einheit, eine Eingabe pro Spieler und Runde bzw. Kategorie.**

| Feld | Inhalt |
|---|---|
| `gameId`, `roundId` oder `categoryKey`, `playerId` | Zuordnung |
| `values` | je nach Baustein: `{ score }` · `{ bid, tricks }` · `{ rank }` · `{ phase, score }` |
| `updatedBy` | Gerät bzw. später der Account (für „wer hat das eingetragen“) |

Warum einzeln: Wenn zwei Handys denselben Zettel bearbeiten, gibt es nur dann einen
Konflikt, wenn beide **dieselbe Zelle** ändern. Das löst `updatedAt` (letzte Änderung gewinnt).

### Ergebnis (`results`)
Beim Beenden pro Spieler: `gameId`, `playerId`, `total`, `place`.
Das ist ein Zwischenspeicher für schnelle Statistiken und lässt sich jederzeit aus den
Einträgen neu berechnen.

### Anlass (`events`)
In der App „Serie“. z. B. „Südamerika 2026“: `name`, optional `from` / `to`, `points` (Platzpunkte,
Vorschlag 3, 2, 1). Partien verweisen per `eventId` darauf. Damit gibt es später „Bilanz im Urlaub“ auf Knopfdruck.

### Später (Phase 4/5, nur vorgemerkt)
- `users`: Account (Supabase Auth)
- `groups` + `group_members`: Wer sieht welche Partien
- Zugriffsregeln (Row Level Security): Man sieht nur Partien der eigenen Gruppen

## Speicherung

| Phase | Wo |
|---|---|
| 2–3 (intern, offline) | IndexedDB auf dem Gerät (über die Bibliothek Dexie) |
| ab 4 (Sync) | dieselben Tabellen zusätzlich in Supabase, Region EU |

- **Backup:** Export und Import als JSON-Datei. Das kommt früh, weil Safari Daten von
  Websites nach etwa 7 Tagen ohne Nutzung löscht. Als Home-Bildschirm-App passiert das
  nicht, ein Backup ist trotzdem Pflicht.
- **Keine Spieldaten im Repo**, keine Secrets im Code.

## Statistik (abgeleitet, nichts davon wird extra gespeichert)
- Siege und Siegquote pro Spieler, gesamt / pro Spiel / pro Anlass
- Direkter Vergleich A gegen B (gemeinsame Partien, wer lag vorn)
- Spielspezifisch, z. B. Wizard-Ansage-Trefferquote, Kniffel-Bonusquote

## Bewusst vereinfacht, solange die App intern ist
- Keine Accounts, kein Login
- Kein Impressum und keine Datenschutzerklärung nötig, solange nur Bekannte die App nutzen.
  Löschen bleibt aber jederzeit möglich (Spieler, Partie, alles).
- Vor einer Veröffentlichung: Datenschutzerklärung, Impressum, Einwilligung beim
  Verknüpfen von Spielern, Markennamen der Vorlagen prüfen.

## Offene Punkte
- Spieler-Sonderfälle in laufender Partie (später einsteigen, aussteigen): als `seats` mit
  `joinedAtRound` / `leftAtRound` lösen, sobald nötig.
- Teams, die pro Runde wechseln (Doppelkopf): wahrscheinlich `values.team` im Eintrag.
