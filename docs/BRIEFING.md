# Briefing: Spiele-Tracker-App (Punktezettel + Community)

## Produktidee
Eine App, mit der sich möglichst jedes Spiel tracken lässt.
- Core: flexibler Counter / Spielzettel. Runden, Punktzahlen usw. frei konfigurierbar.
- Community-Feature mit kompletter Historie: wer hat wie viel, wo und gegen wen gespielt.

**Use Case 1 – Stift & Papier ersetzen:** Punkteblätter für fast jedes Spiel.
**Use Case 2 – Statistik & Community:** Ergebnisse z. B. im Urlaub, Bilanz gegeneinander,
Stärken pro Spiel, Vergleiche.

## Technischer Ansatz
- PWA (installierbar über „Zum Home-Bildschirm“, offlinefähig). Native iOS ggf. später via Capacitor.
- React + TypeScript + Vite.
- Daten anfangs lokal; später Supabase (Auth, Postgres, Realtime) mit Zugriffsregeln (RLS) von Anfang an mitgedacht.
- Deployment: GitHub Actions → GitHub Pages bei jedem Push.
- Datenmodell sync-fähig: UUIDs, `createdAt`/`updatedAt`.
- Keine Spieldaten und keine Secrets im Repo.

## Phasen
1. ✅ Grundgerüst: Repo-Setup, Auto-Deployment, leere installierbare PWA.
2. Core (offline): Spieler, Runden flexibel/fest, Gewinner hoch/niedrig, Spielende Ziel/Runden,
   Kategorien-Zettel, Schnellzähler +/−, Rückgängig, Vorlagen.
3. Lokale Historie & Statistik: Partien mit Ort/Anlass, Siegquoten, direkter Vergleich.
4. Accounts & Sync: Gruppen, Partie per Link teilen, mehrere Handys auf einem Zettel.
5. Community: Profile, Ranglisten, Feed, Vergleiche.

## UI-Grundsätze
- Raster wie Papier: Spieler = Spalten, Runden = Zeilen, Summen unten fixiert.
- Zelle antippen → Ziffernblock als Bottom Sheet mit Schnelltasten, keine Systemtastatur.
- Einhändig, große Tippflächen, Bedienung unten. Dark Mode.
- Spielstart in max. 3 Taps: Vorlage → Spieler → los.
- Baukasten für eigene Regeln.

## Offen
- App-Name
