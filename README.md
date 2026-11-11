# scoreboard-app

Punktezettel: digitaler Block für Spieleabende, als installierbare Web-App (PWA).
Später mit Historie, Statistik und Gruppen.

## App

- Live (nach Merge auf `main`): https://jakob2-oss.github.io/scoreboard-app/
- Installieren am iPhone: Link in Safari öffnen → Teilen → **Zum Home-Bildschirm**
- Stack: React + TypeScript + Vite, PWA über `vite-plugin-pwa`, Tests mit Vitest
- Jeder Push auf `main` baut, testet und veröffentlicht automatisch (`.github/workflows/deploy.yml`)

```bash
npm install
npm run dev      # Entwicklungsserver
npm test         # Tests: Spiel-Logik, Speicherung, Abläufe
npm run build    # Produktions-Build nach dist/
npx vite preview --port 4173 &   # gebaute App lokal starten
npm run e2e      # Klicktest im Browser (Playwright)
```

## Dokumente

- Arbeitsanweisungen für Claude: [CLAUDE.md](CLAUDE.md)
- Stand & nächste Schritte: [docs/STATUS.md](docs/STATUS.md)
- Entscheidungen: [docs/ENTSCHEIDUNGEN.md](docs/ENTSCHEIDUNGEN.md)
- Spielseiten: [docs/SPIELSEITEN.md](docs/SPIELSEITEN.md)

- Briefing & Phasenplan: [docs/BRIEFING.md](docs/BRIEFING.md)
- Design (festgeschrieben): [docs/DESIGN.md](docs/DESIGN.md)
- Datenmodell: [docs/DATENMODELL.md](docs/DATENMODELL.md)
- Spielvorlagen & Bausteine: [docs/VORLAGEN.md](docs/VORLAGEN.md)
- Klick-Prototyp (Referenz für UI und Abläufe): [prototype/punktezettel.html](prototype/punktezettel.html)

## Stand

- Phase 1 (Grundgerüst) fertig.
- Phase 2, Paket 1 (Spieler & Partie-Kern) fertig: Spieler anlegen, Überblick, Spielerseiten,
  Ziffernblock, Rückgängig, Speicherung auf dem Gerät.
- Freies Spiel: Gewinner, Spielende und Zählschritte frei wählbar; wird als eigene Vorlage
  gespeichert (beim Start oder spätestens beim Beenden) und erscheint unter „Meine Spiele“.
- Als Nächstes: Paket 2 (Spiele-Vorlagen mit eigenen Regeln), dann Paket 3 (Historie & Statistik).
