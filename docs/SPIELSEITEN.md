# Spielseiten (Layout für Paket 2)

Jedes Spiel hat eine eigene Seite. Aufbau (Baustein `src/ui/GamePage.tsx`, fertig für das freie Spiel):

1. **Szene** oben (240 px, unten abgerundet): flache, geometrische Illustration der Spielwelt
2. **Rundes Icon** überlappt die Szene, Hintergrund in hellem Ton der Spielfarbe
3. **Titel** in gesperrten Großbuchstaben
4. **So wird gezählt:** kurzer Fließtext mit Textmarker-Hervorhebungen und ein Rechenbeispiel als Kacheln
5. **Optionen**, nur wenn das Spiel welche hat (z. B. Spielende)
6. **Unten:** „Los mit N Spielern“ (letzte Runde) und „Spieler“ zum Ändern

In der Liste auf der Startseite erscheint dasselbe Icon klein.

| Spiel | Szene | Icon |
|---|---|---|
| Freies Spiel ✅ | Indigo mit leeren Zetteln, Bleistift, Farbpunkten | leerer Zettel mit Bleistift |
| Wizard | Nachthimmel, Zauberturm, Mond, schwebende Karten | Zauberhut mit Stern |
| Rommé | Korallroter Raum, große Kartenfarben, Kartenfächer auf grünem Tisch | drei aufgefächerte Karten |
| Kniffel | Petrol mit Sonne, vier bunte Würfel | zwei Würfel |
| Skyjo | Himmel mit Wolken, Zahlkarten −2 bis 12 | vier Zahlkarten |
| Phase 10 | Orange, Treppe aus Stufen 1–10, Zielflagge | drei Stufen mit Flagge |

Szenen, Icons, Regeltexte und Rechenbeispiele liegen fertig im Prototyp
(`prototype/punktezettel.html`: `SCENE`, `GAME_ICON`, `RULES`) und werden 1:1 übernommen.

## Regeln und Abläufe je Spiel (Kurzfassung)
- **Wizard:** Ansage und Stiche je Runde; Treffer 20 + 10 je Stich, sonst −10 je Abweichung;
  Runden = 60 ÷ Spieler; Geber rotiert. Überblick-Knopf „Ansagen“, danach „Stiche“.
- **Rommé:** Strafpunkte, wenigste gewinnen, Ende bei 500/1000/offen; Tasten „Raus 0“, +5, +10, +20, ×2.
- **Kniffel:** 13 Kategorien, Bonus 35 ab 63 oben; Knopf „Zug: Name“; Werte je Kategorie als Tasten.
- **Skyjo:** Strafpunkte bis 100; Tasten −1, +1, +5, +10, ×2 (Beender nicht niedrigster).
- **Phase 10:** Haken „Geschafft?“ je Runde, Phasenanzeige mit 10 Punkten,
  Rangfolge erst Phase dann Punkte; Ende, wenn jemand Phase 10 schafft.
