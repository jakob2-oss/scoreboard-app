# Status

Wird am Ende jeder Arbeitseinheit aktualisiert. Stand: 11.11.2026 (PR #4 offen)

## Fertig
- **Phase 1:** Grundgerüst, PWA, Deployment auf GitHub Pages (PR #1)
- **Phase 2, Paket 1:** Spieler & Partie-Kern (PR #2)
  - Überblick als Spielbrett, Spielerseiten zum Wischen, Ziffernblock, Rückgängig
  - Speicherung auf dem Gerät nach dem Datenmodell
- **Freies Spiel** (PR #3)
  - Name, Gewinner, Spielende, bis zu drei Zählschritte
  - Eigene Vorlagen: beim Start oder spätestens beim Beenden gespeichert, unter „Meine Spiele“
  - Beenden und speichern jederzeit über „Beenden“
  - Spielseiten-Layout (`src/ui/GamePage.tsx`) mit Szene und Icon für das freie Spiel
  - Spielerreihenfolge per Drag-and-drop
  - App-Icon Würfel-Figur

- **Paket 2a** (PR #4): feste Spiele
  - Rahmen: `src/game/games.ts` (Regeln, Texte, Optionen), `src/ui/art.ts` (`GAME_ART`: Icon, Szene),
    `src/ui/GameInfo.tsx` (Spielseite), eigene Schnelltasten über `params.quick` (add, set, mul)
  - Rommé und Skyjo spielbar, Direktstart mit den letzten Spielern
  - Freies Spiel: eigene Zählschritte per Eingabefeld

- **Paket 2b:** Wizard
  - `scoring: 'bids'` in `engine.ts`: `fieldOf`, `setField`, `bidPhase`, `inputOrder`; Punkte über `src/rules/wizard.ts`
  - Ablauf: „Ansagen Runde n“, zurück zum Überblick, „Stiche Runde n“, Geber rotiert
  - Spielerseite mit Feldern Ansage und Stiche (`BidEntry` in `Game.tsx`), Tasten 0 bis Kartenzahl tragen ein und springen weiter
  - Zelle im Überblick antippen öffnet bei Wizard die Spielerseite der Runde

- **Paket 2c:** weitere Spiele und Baustein „Nur das Ergebnis“
  - Uno (bis 500) und Scrabble (×2, ×3) als Rundenspiele
  - `params.resultOnly` + `params.unit`: genau eine Eingabe je Spieler, Knopf „Ergebnis eintragen“,
    kein Verlauf. Siedler (Siegpunkte, hoch gewinnt), Monopoly und „Anderes Spiel“ (Platz 1 bis 6, niedrig gewinnt)
  - Startseite: Gruppen „Neues Spiel“ und „Nur das Ergebnis“
  - Kompakte Szenen über Helfer in `src/ui/art.ts` (`sky`, `unoCard`, `tile`, `hex`, `house`, `podium`)

## Als Nächstes
1. **Paket 2d: Kniffel** (`scoring: 'categories'`, Bonus 35 ab 63) und **Phase 10** (Haken je Runde,
   Rang erst nach Phase). Vorlagen im Prototyp (`DICE`, `phaseCard`).
2. **Spezialregeln im freien Spiel** (von Jakob vorgemerkt): eigene Sektion in der Konfiguration.
   Erste Regel: **Notizfelder** je Runde und Spieler, die rechts neben dem Punktwert stehen
   (wie die Ansage bei Wizard, aber ohne Verrechnung). Idee: `params.notes: [{ key, label }]`,
   Werte im Eintrag unter `values.notes`.
3. **Paket 3: Historie & Statistik**: Profile, Filter, Direktvergleich, Beispieldaten, JSON-Backup.
4. Später: Skat, Doppelkopf, Arschloch (Rang pro Runde), dann Accounts & Sync (Phase 4).

## Offene Punkte
- Bei „Nur das Ergebnis“ steht auf der Spielerseite noch „Punkte“ in der Karte, auch wenn ein Platz eingetragen wird.
- „Anderes Spiel“ hat noch kein Namensfeld; Idee: Name wählbar, dann eigene Vorlage wie beim freien Spiel.
- Gespeicherte Vorlagen lassen sich noch nicht bearbeiten oder löschen.
- Vorlagen zusammenführen (für Statistik) ist vorbereitet (`rules.key`), aber noch ohne Oberfläche.
- Anlass/Ort beim Speichern einer Partie fehlt noch (kommt mit Paket 3).
- JSON-Backup fehlt noch (wichtig gegen Datenverlust, Paket 3).

## Tests
- Unit-Tests: 52 (Logik, Speicherung, Abläufe)
- Klicktest `e2e/core.e2e.cjs`: 79 Prüfungen
