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

## Als Nächstes
1. **Paket 2b: Wizard.** Neuer Baustein `scoring: 'bids'` in `engine.ts` (Ansage und Stiche je Eintrag,
   Punkte über `src/rules/wizard.ts`), Überblick-Knopf „Ansagen“ dann „Stiche“, Geber rotiert.
   Ablauf, Spielerseite und Szene stehen im Prototyp (`wizPageBody`, `wizNext`, `SCENE.wizard`).
2. **Paket 2c: Kniffel** (`scoring: 'categories'`, Bonus 35 ab 63) und **Phase 10** (Haken je Runde,
   Rang erst nach Phase). Vorlagen im Prototyp (`DICE`, `phaseCard`).
3. **Spezialregeln im freien Spiel** (von Jakob vorgemerkt): eigene Sektion in der Konfiguration.
   Erste Regel: **Notizfelder** je Runde und Spieler, die rechts neben dem Punktwert stehen
   (wie die Ansage bei Wizard, aber ohne Verrechnung). Idee: `params.notes: [{ key, label }]`,
   Werte im Eintrag unter `values.notes`.
4. **Paket 3: Historie & Statistik**: Profile, Filter, Direktvergleich, Beispieldaten, JSON-Backup.
5. Später: Skat, Doppelkopf, Arschloch (Rang pro Runde), dann Accounts & Sync (Phase 4).

## Offene Punkte
- Gespeicherte Vorlagen lassen sich noch nicht bearbeiten oder löschen.
- Vorlagen zusammenführen (für Statistik) ist vorbereitet (`rules.key`), aber noch ohne Oberfläche.
- Anlass/Ort beim Speichern einer Partie fehlt noch (kommt mit Paket 3).
- JSON-Backup fehlt noch (wichtig gegen Datenverlust, Paket 3).

## Tests
- Unit-Tests: 44 (Logik, Speicherung, Abläufe)
- Klicktest `e2e/core.e2e.cjs`: 63 Prüfungen
