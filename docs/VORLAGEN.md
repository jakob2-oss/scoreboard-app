# Spielvorlagen: Auswahl & Priorisierung

Ziel: Die App ist dort am wertvollsten, wo heute Stift und Papier nötig sind und
wo Rechenregeln Fehler provozieren. Bewertet wird jedes Spiel nach drei Kriterien
(je 1–3):

- **B – Beliebtheit** in Deutschland (inkl. regionaler Hochburgen)
- **N – Notier-Bedarf**: Wie viel muss man aufschreiben oder ausrechnen?
- **C – Community-Wert**: Lohnen sich Historie, Bilanzen und Ranglisten?

Datenlage: Es gibt keine aktuelle, repräsentative Rangliste aller Spiele. Belegt sind:
Rommé zählt laut Ipsos zu den Lieblingsspielen neben Monopoly und „Mensch ärgere
Dich nicht“; laut Statista sind „Mensch ärgere Dich nicht“, Monopoly und Catan am
verbreitetsten. Doppelkopf ist im Norden/Westen, Schafkopf im Süden am beliebtesten.
Wizard, Skyjo, Uno und Skip-Bo liegen in Shop-Bestsellerlisten weit vorn
(Momentaufnahmen, keine Verkaufszahlen). Der Rest ist Einschätzung.

## Stufe 1 – zuerst bauen

| Spiel | B/N/C | Was die Vorlage können muss |
|---|---|---|
| Rommé ✅ (im Prototyp) | 3/3/3 | Minuspunkte der Handkarten pro Runde, „Hand-Rommé“ zählt doppelt, Spielende bei Zielwert (z. B. 500) – niedrig gewinnt |
| Wizard ✅ (im Prototyp) | 3/3/3 | **Ansage vor der Runde**, Stiche nach der Runde; Treffer = 20 + 10 je Stich, sonst −10 je Abweichung; Rundenzahl = 60 ÷ Spieler; Hinweis, wenn Summe der Ansagen = Kartenzahl |
| Skat | 3/3/3 | Skatliste: Alleinspieler, Spielart, Spielwert, gewonnen/verloren (verloren = doppelt minus), Seeger-Fabian-Abrechnung (+50 / Gegnerpunkte) |
| Doppelkopf | 3/3/3 | Re/Kontra-Parteien **wechseln jede Runde**, Spielwert inkl. Ansagen und Sonderpunkte, Soli, Nullsumme pro Runde, Bock-Runden |
| Kniffel ✅ (im Prototyp) | 3/3/2 | Kategorien-Zettel mit Bonus (schon im Prototyp) |
| Skyjo ✅ (im Prototyp) | 3/3/2 | Punkte pro Runde, Ende ab 100, niedrig gewinnt; Wer beendet und nicht niedrigster ist, zählt doppelt |
| Phase 10 ✅ (im Prototyp) | 3/3/2 | Punkte pro Runde **plus Phase je Spieler** (1–10, geschafft ja/nein) |

## Stufe 2 – starker Bedarf, kleinere Zielgruppe

| Spiel | B/N/C | Was die Vorlage können muss |
|---|---|---|
| Schafkopf | 2/3/3 | Spielart (Sauspiel, Wenz, Solo), Tarif, Schneider/Schwarz, Laufende; Abrechnung in Geld oder Punkten, Nullsumme |
| Binokel | 1/3/3 | Reizen (Gebot), Melden, Stiche; Spieler verliert doppelt bei nicht erfülltem Gebot; Ziel z. B. 1000 |
| Canasta | 2/3/2 | 2 Teams, Basiswert (Canastas) + Kartenwerte, Ziel 5000; Mindestauslage je nach Spielstand anzeigen |
| Scrabble | 2/3/2 | Punkte pro Zug (viele Züge), Abzug der Restbuchstaben am Ende |
| Uno | 3/2/2 | Handkartenwerte pro Runde, der Gewinner bekommt die Punkte; Ziel 500 |
| Arschloch | 2/1/3 | **Rang pro Runde** (Präsident … Arschloch) statt Punkten; Statistik „wie oft Präsident“ |
| Qwixx und ähnliche Ankreuz-Würfelspiele | 3/2/2 | Ankreuz-Reihen statt Zahlen; Punkte über Anzahl der Kreuze (eigenes, neutrales Layout) |

## Stufe 3 – kaum Notier-Bedarf, aber Statistik-Wert

Bei Catan, Risiko, Monopoly, „Mensch ärgere Dich nicht“, Carcassonne, Zug um Zug,
Azul, 7 Wonders, Flügelschlag:

- **„Nur Ergebnis“-Vorlage:** Spiel wählen, Platzierung oder Siegpunkte am Ende
  eintragen, fertig. Das kostet kaum Aufwand und füttert Historie und Bilanzen. Damit
  ist es der günstigste Weg zum Community-Nutzen.
- **Endabrechnung als Kategorien:** Für 7 Wonders, Flügelschlag und Zug um Zug
  (mehrere Wertungskategorien am Spielende). Das lässt sich mit dem Kategorien-Baustein
  umsetzen.

## Stufe 4 – Wettkämpfe (später, Community-Treiber)

Tischtennis, Kicker, Boule, Mölkky, Darts, Schach: Duelle oder Teams, Sätze oder Legs,
Turnierbaum, Elo-artige Rangliste. Spezialregeln: Mölkky genau 50 (darüber zurück
auf 25), Darts Countdown von 501.

## Bausteine für die Engine

Aus der Liste ergeben sich wiederverwendbare Bausteine. Jede Vorlage ist eine
Kombination daraus, und der Baukasten für eigene Regeln nutzt dieselben Teile.

1. **Rundenpunkte** – Zahl pro Spieler und Runde (vorhanden)
2. **Kategorien** – feste Zeilen mit Bonusregeln (vorhanden)
3. **Ansage + Ergebnis** – zwei Eingaben pro Runde, Punkte per Formel (Wizard, Binokel, Skat)
4. **Formel-Regeln** – z. B. Verdopplung, Bonus, Abzug, Nullsumme
5. **Status je Spieler** – z. B. Phase 1–10
6. **Teams** – fest (Canasta) oder pro Runde wechselnd (Doppelkopf)
7. **Rang pro Runde** – Platzierung statt Punkten (Arschloch)
8. **Nur Ergebnis** – Platzierung oder Endpunkte ohne Runden
9. **Match** – Sätze, Legs, Countdown (Wettkämpfe)
10. **Abrechnung** – Punkte in Geld umrechnen (Skat, Schafkopf, Doppelkopf)

Für das Datenmodell heißt das: Eine Runde speichert pro Spieler nicht nur eine Zahl,
sondern ein kleines Objekt (z. B. `{ bid, tricks, score }` oder `{ rank }`), und die
Punkte werden aus Regeln berechnet. So bleiben Korrekturen und Statistiken
(z. B. „Ansage-Trefferquote bei Wizard“) möglich.

## Hinweis zu Namen

Spielenamen wie Kniffel, Wizard, Phase 10, Skyjo, Qwixx oder Uno sind Marken.
Als beschreibender Name einer Wertungsvorlage ist das üblich. Originale Blöcke,
Logos und Gestaltung übernehmen wir aber nicht, sondern bauen eigene, neutrale Layouts.
Vor einem öffentlichen Launch sollte das kurz rechtlich geprüft werden.
