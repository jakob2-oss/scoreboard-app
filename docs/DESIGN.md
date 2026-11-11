# Design (festgeschrieben, v1)

Leitbild: **gemütlicher Spieleabend im Stil flacher, geometrischer Spiel-Illustrationen.**
Ruhige Flächen, keine Konturen, weiche Schatten. Farbe kommt von den Spielern und den
Spielwelten, die Oberfläche selbst bleibt zurückhaltend.

Referenz-Umsetzung: `prototype/punktezettel.html`. Tokens in der App: `src/styles/tokens.css`.

## Farben

Zwei Themen mit Umschalter. Ohne eigene Wahl folgt die App dem System.

| Rolle | Hell: Papier & Indigo | Dunkel: Mitternacht |
|---|---|---|
| Hintergrund `--bg` | `#f3f0ea` | `#272748` |
| Fläche `--surface` | `#ffffff` | `#33335c` |
| Text `--fg` | `#2e2b4f` | `#f7eedc` |
| Gedämpft `--muted` | `#7c7896` | `#a9a6c8` |
| Hauptaktion `--primary` | `#4644a6` (Indigo) | `#f07a4f` (Koralle) |
| Hervorhebung `--sun` | `#f5c25b` | `#f3b847` |
| Gut / Schlecht | `#2f9a6f` / `#d9534a` | `#6fcf97` / `#ff8a7a` |

**Spielerfarben** (für beide Themen): Koralle `#ef7a5c`, Türkis `#3fb39b`, Senf `#f0b13e`,
Rosa `#e2709a`, Himmelblau `#5fa8d3`, Violett `#9a7ad6`, Grün `#7cb85a`, Orange `#f09a4a`.
Text auf Spielerfarbe wird nach Helligkeit automatisch weiß oder dunkel gesetzt.

**Spielwelten** (Szene und Icon je Spiel, gleich in beiden Themen):

| Spiel | Grundfarbe | Akzent |
|---|---|---|
| Wizard | Nachtviolett `#2f2563` | `#7a5cc9` |
| Rommé | Koralle `#e8684f` | Kartentisch-Grün `#2f6f62` |
| Kniffel | Petrol `#2f8f86` | Senf `#f6c565` |
| Skyjo | Himmelblau `#78bde6` | Kartenfarben −2 bis 12 |
| Phase 10 | Warmes Orange `#f6b85e` | Stufen in Rot, Blau, Grün, Gelb |

## Schrift

- **Jost** (geometrisch, Futura-artig) für alles: Text, Überschriften, Zahlen.
- **Abschnittstitel** in Großbuchstaben, gesperrt (`letter-spacing: .16em`), 12 px.
- **Schriftzug** zweizeilig: PUNKTE in Koralle, ZETTEL in Textfarbe, gesperrt.
- Zahlen mit festen Ziffernbreiten (`tabular-nums`).

## Formen

- **Punkte** sind das wiederkehrende Motiv: Seitenanzeige, Schnelltasten, Phasen-Fortschritt,
  Avatare, Aufzählungen.
- **Kacheln** mit großem Radius (16–22 px) statt Tabellenlinien; leere Felder als Punkt.
- **Pillen** für Tasten und Knöpfe, Hauptknöpfe in Versalien.
- **Avatare**: runder Kreis in Spielerfarbe mit Initiale.
- **Schatten** weich und flach (`--soft`), keine Konturen, keine harten Sticker-Schatten.
- **Hervorhebung im Fließtext** wie mit Textmarker in der jeweiligen Akzentfarbe.

## Illustration

Flach, geometrisch, in Schichten (Hintergrund-Fläche, Himmel mit Sternen, Hügel, Vordergrund),
ohne Umrisse. Das Logo-Motiv ist ein echter Punktezettel mit Bleistift, Würfel und Spielfigur.
Spielszenen folgen demselben Aufbau. Alle Illustrationen sind eigene Zeichnungen.

## Abläufe

- **Start in max. 3 Taps:** Spiel → (Spielseite) „Los“ mit den letzten Spielern.
- **Der Überblick ist die Zentrale.** Unten ein Knopf für den nächsten Schritt
  („Runde 3 eintragen“, „Ansagen“, „Stiche“, „Zug · Name“).
- **Eingabe auf den Spielerseiten**, Spieler für Spieler. Nach dem letzten Spieler geht es
  automatisch zurück in den Überblick.
- **Bearbeiten bleibt überall möglich:** Zelle antippen, zur Spielerseite wischen, Runde im
  Verlauf antippen. Rückgängig ist immer erreichbar.
- **Bedienung unten** im Daumenbereich, große Tippflächen, keine Systemtastatur für Zahlen.

## Texte

Kurz, freundlich, in ganzen Sätzen. Regeln als kurzer Fließtext mit hervorgehobenen
Kernpunkten und einem Rechenbeispiel statt Stichpunktlisten.
