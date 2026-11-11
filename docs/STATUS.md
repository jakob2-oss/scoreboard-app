# Status

Wird am Ende jeder Arbeitseinheit aktualisiert. Stand: 11.11.2026 (nach PR #3)

## Fertig
- **Phase 1:** Grundgerüst, PWA, Deployment auf GitHub Pages (PR #1)
- **Phase 2, Paket 1:** Spieler & Partie-Kern (PR #2)
  - Überblick als Spielbrett, Spielerseiten zum Wischen, Ziffernblock, Rückgängig
  - Speicherung auf dem Gerät nach dem Datenmodell
- **Freies Spiel** (PR #3, offen)
  - Name, Gewinner, Spielende, bis zu drei Zählschritte
  - Eigene Vorlagen: beim Start oder spätestens beim Beenden gespeichert, unter „Meine Spiele“
  - Beenden und speichern jederzeit über „Beenden“
  - Spielseiten-Layout (`src/ui/GamePage.tsx`) mit Szene und Icon für das freie Spiel
  - Spielerreihenfolge per Drag-and-drop
  - App-Icon Würfel-Figur

## Als Nächstes
1. **Paket 2: Spiele mit eigenen Regeln** nach `docs/SPIELSEITEN.md`:
   Wizard, Rommé, Kniffel, Skyjo, Phase 10. Vorlage für UI und Regeln ist der Prototyp.
2. **Paket 3: Historie & Statistik**: Profile, Filter, Direktvergleich, Beispieldaten, JSON-Backup.
3. Später: Skat, Doppelkopf, Arschloch (Rang pro Runde), dann Accounts & Sync (Phase 4).

## Offene Punkte
- Gespeicherte Vorlagen lassen sich noch nicht bearbeiten oder löschen.
- Vorlagen zusammenführen (für Statistik) ist vorbereitet (`rules.key`), aber noch ohne Oberfläche.
- Anlass/Ort beim Speichern einer Partie fehlt noch (kommt mit Paket 3).
- JSON-Backup fehlt noch (wichtig gegen Datenverlust, Paket 3).

## Tests
- Unit-Tests: 42 (Logik, Speicherung, Abläufe)
- Klicktest `e2e/core.e2e.cjs`: 56 Prüfungen
