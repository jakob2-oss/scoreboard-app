# Punktezettel – Arbeitsanweisungen für Claude

Diese Datei wird in jeder Sitzung automatisch geladen. Sie hält fest, was über einzelne
Gespräche hinaus gelten muss. Details stehen in `docs/`.

## Zusammenarbeit
- Jakob arbeitet nur am iPhone über Claude-Code-Cloud-Sitzungen. Kein Laptop.
- Claude schreibt Code, testet im Container, committet, pusht und öffnet einen Pull Request.
  Jakob merged in der GitHub-App, GitHub Actions veröffentlicht auf GitHub Pages.
- Kommunikation auf Deutsch, kompakt, handyfreundlich: kurze Absätze, Listen, Tabellen höchstens 3 Spalten.
- Konkrete Empfehlung statt Optionslisten. Bei echten Gestaltungsfragen Varianten als Screenshots zeigen.
- Pakete immer gründlich prüfen (siehe unten), bevor ein PR entsteht.

## Texte in der App (wichtig)
- Keine Erklär-Hinweise wie „Feld antippen zum Ändern“. Die Bedienung muss selbsterklärend sein.
- Keine Trennpunkte „·“ zwischen Textteilen. Lieber ganze Wörter: „Los mit 3 Spielern“, „Runde 2 von 10“.
- Keine Untertitel, die nur beschreiben, was ohnehin sichtbar ist.
- Regeln als kurzer Fließtext mit Hervorhebungen, nicht als Stichpunktliste.
- Keine Pfeile „→“ in Knöpfen, keine Funkel-Sterne als Deko, keine Etiketten wie „Beispiel“.
- Leere Zustände knapp benennen („Noch niemand ausgewählt“), nicht erklären, was zu tun ist.
- Keine Sätze, die den Nutzen der App erklären („damit die Partie in eure Bilanz einfließt“).

## Design
Festgeschrieben in `docs/DESIGN.md`: Hell „Papier & Indigo“, Dunkel „Mitternacht“, Schrift Jost,
flache geometrische Illustrationen im Stil von Two Dots, Punkte als Motiv, keine Konturen.
Spielseiten folgen `docs/SPIELSEITEN.md`. App-Icon: Würfel-Figur (`public/icon.svg`).

## Technik
- React + TypeScript + Vite, PWA. Daten lokal in IndexedDB (Dexie), Modell in `docs/DATENMODELL.md`.
- `src/game/engine.ts`: reine Spiel-Logik, keine Oberfläche. Neue Regeln immer hier und mit Tests.
- `src/store.ts`: App-Zustand und Abläufe. `src/ui/*`: Oberfläche.
- Der Klick-Prototyp `prototype/punktezettel.html` ist Referenz für UI und Abläufe noch nicht
  übertragener Teile (Spiele, Statistik). Er wird nicht mehr weiterentwickelt.
- Keine Secrets im Code, keine Spieldaten im Repo.

## Prüfen vor jedem PR
```bash
npx tsc -b && npm test && npm run build
npx vite preview --port 4173 &   # dann:
npm run e2e                      # Klicktest, muss „Alle Prüfungen bestanden“ melden
```
Zusätzlich Screenshots der geänderten Ansichten (Hell und Dunkel) ansehen.

## Git
- Arbeits-Branch laut Sitzung. Nach einem Merge den Branch per Fast-Forward auf `main` bringen,
  nie Force-Push.
- Commit-Nachrichten auf Deutsch, beschreibend.

## Stand und nächste Schritte
Immer zuerst `docs/STATUS.md` lesen und am Ende einer Arbeitseinheit aktualisieren.
Wichtige Entscheidungen in `docs/ENTSCHEIDUNGEN.md` festhalten.
