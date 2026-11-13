# Entscheidungen

Kurzes Protokoll, damit Begründungen nicht verloren gehen. Neueste oben.

| Datum | Entscheidung | Warum |
|---|---|---|
| 12.11.2026 | Spielszenen und Icons nur in Pastelltönen und Palettenfarben, keine gesättigten Flächen | Knallige Farben wirken KI-generiert |
| 12.11.2026 | Spiele ohne Mitschreiben (Siedler, Monopoly) über „Nur das Ergebnis“: eine Eingabe je Spieler, Siegpunkte oder Platz | Kaum Aufwand am Tisch, füllt trotzdem Historie und Bilanz |
| 11.11.2026 | Freies Spiel bekommt später eine Sektion „Spezialregeln“, zuerst Notizfelder ohne Verrechnung | Deckt Spiele ab, bei denen man sich etwas merken muss, ohne feste Vorlage |
| 11.11.2026 | Feste Spiele als Daten (`games.ts`) mit eigener Spielseite, keine Kopie in „Meine Spiele“ | Einheitliches Layout, Statistik über festen Schlüssel |
| 11.11.2026 | App-Icon Würfel-Figur, In-App-Logo bleibt die Landschafts-Illustration | Große Figur wirkt auf dem Home-Bildschirm, Logo in der App gefiel |
| 11.11.2026 | Ein freies Spiel statt fester Zettel, jede Konfiguration wird eigene Vorlage | Flexibel; eigener Schlüssel ermöglicht Statistik je Spiel |
| 11.11.2026 | Vorlage spätestens beim Beenden automatisch speichern | Nichts geht verloren, Vorlagen später zusammenführbar |
| 11.11.2026 | Keine Erklärtexte, keine „·“-Trennpunkte | Wirkt sonst KI-generiert, Bedienung soll selbsterklärend sein |
| 11.11.2026 | Jeder Spieler hat eine feste Farbe | Wiedererkennung und Statistik über Partien hinweg |
| 11.11.2026 | Überblick ist die Zentrale, Eingabe Spieler für Spieler, danach zurück | Natürlicher Ablauf am Tisch (Wizard: Ansagen, spielen, Stiche) |
| 11.11.2026 | Design „Papier & Indigo“ / „Mitternacht“, Jost, Two-Dots-Stil | Stimmungsvoll, ruhig, nicht überladen |
| 11.11.2026 | Intern zuerst, Datenmodell aber veröffentlichungsfähig | Kein Login/Datenschutz-Aufwand jetzt, kein Umbau später |
| 11.11.2026 | Werte speichern statt Punkte, Regeln pro Partie eingefroren | Korrigierbar, Statistik möglich, alte Partien bleiben richtig |
| 11.11.2026 | PWA mit React/TS/Vite, GitHub Pages, PRs zum Live-Schalten | iPhone ohne Mac, kostenlos, Kontrolle über jede Version |

## 12.11.2026: Spieleabende als Serien
Spieleabende und Spieleserien werden ein Objekt „Serie“ (Tabelle `events`, im Datenmodell schon vorgesehen).
Partien verweisen per `eventId` darauf, auch nachträglich. Teilen mit einer Gruppe kommt mit dem Sync (Phase 4).
Wertung: Platzpunkte (anpassbar) als Summe; dazu Schnitt pro Partie für Spieler, die nicht immer dabei sind,
und Quote geschlagener Gegner für unterschiedlich große Runden. Das freie Feld „Anlass oder Ort“ entfällt.

## 12.11.2026: Leistung als maßgebliche Kennzahl
Rohe Siegquote bevorzugt kleine Runden. Leistung = Siege ÷ erwartete Siege, Erwartung je Partie 1 ÷ Spieleranzahl,
geteilte Siege anteilig. Angezeigt als Faktor („2,0×“). Standard in Profil, Serie und Duell.

## 12.11.2026: Leistung bewertet jeden Platz
Statt nur Siegen zählt jede Platzierung: geschlagene Gegner (Gleichstand halb) geteilt durch die erwarteten (Spieler − 1) ÷ 2.
1,0× = Durchschnitt, 2,0× = immer gewonnen. Größere Runden wiegen mehr, weil mehr Gegner im Spiel sind.

## 12.11.2026: Freies Spiel ist eine Einmal-Partie
„Eigene Vorlage erstellen“ legt ein eigenes Spiel an. Das „Freie Spiel“ wird nicht mehr automatisch als Vorlage gespeichert
(nur per Schalter), damit „Meine Spiele“ nicht mit „Freies Spiel vom …“ volläuft. Die Partie landet trotzdem im Verlauf.
Notizfelder zählen nie zur Summe; ihre Summen je Spieler stehen beim Beenden in `Result.extra` (`n:<Feld>`).

## 12.11.2026: Feedback über das Teilen-Menü
Kein fester Empfänger im Code (Repo ist öffentlich, keine E-Mail-Adresse). Tester schicken den Text über das Teilen-Menü
ihres Geräts, Version und Gerät hängen automatisch an.

## 12.11.2026: App-Hintergrund bleibt Mitternachtsblau
Varianten Pflaume, Petrol und Dämmerung wurden gezeigt; Jakob bleibt beim Indigo des Designs „Mitternacht“,
mit langsam bewegten Formen darüber, die zum jeweiligen Spiel passen (Variante A erweitert).

## 12.11.2026: Gestaltung nur bei Spielerprofilen, feste Spiele bleiben
Profilbild und Farbe der Spieler werden anpassbar (offline alle, später mit Accounts nur das eigene Profil und Offline-Spieler).
Feste Spielseiten bleiben gleich; wer ein festes Spiel anpassen will, speichert es als eigenes Spiel (Kopie mit `params.base`).

## 12.11.2026: Mehrere laufende Partien
Eine neue Partie parkt die laufende (leere werden verworfen); die Nachfrage „speichern oder verwerfen“ entfällt.
Alle laufenden Partien stehen auf der Startseite, zuletzt geänderte zuerst.

## 12.11.2026: Tisch-Modus für Leben und Deckel
Spiele wie Schwimmen und Schocken werden nicht als Zettel, sondern am Tisch erfasst: ein Raum mit Holzwand, Lampe und Regal,
darunter ein voller runder Tisch, die Spieler sitzen darum. Antippen verliert ein Leben bzw. öffnet die Deckel-Auswahl;
Sitzplätze lassen sich durch Ziehen tauschen (zählt nicht als Spielzug, Rückgängig lässt sie in Ruhe).
Annahmen: Schwimmen mit 3 Leben plus Schwimmen; Schocken mit 13 Deckeln, zwei Hälften, bei verschiedenen Verlierern Finale.

## 12.11.2026: Tisch-Modus als Bar
Der erste Entwurf (helle Holzwand mit Pastell-Dingen) wirkte zu kindlich. Neu: eine Bar mit dunkler Rückwand,
Spiegel und Flaschenregal, Neon-Zeichen, Messinglampen, Schachbrettboden und Spieltisch mit grünem Filz. Feste Farben
in beiden Modi. Leben liegen bei Schwimmen als Münzen vor jedem Spieler auf dem Tisch, Deckel bei Schocken als Stapel.

## 12.11.2026: Tisch nur von oben, Handy in der Mitte
Die Bar mit Rückwand wird ersetzt durch einen ovalen Kneipentisch von oben auf Terrakotta-Fliesen, voll mit Bier
(Weizen, Pils, Maß, Caña), Rotwein, Oliven, Tapas, Brotkorb und Servietten. Namensschilder sind zum jeweiligen Platz
gedreht, Phase steht zweimal in der Mitte (für beide Seiten). Plätze liegen in gleichen Abständen auf dem Oval.
Phasen sind Teil der Vorlage: `params.swim` (Schwimmen nach dem letzten Leben) und `params.halves` (Hälften bis zum Verlieren).

## 12.11.2026: Hintergrund am Tisch
Statt Terrakotta-Fliesen ein tiefes Mitternachtsblau mit großen, weichen Formen (Indigo, Petrol, Pflaume), die sehr langsam
treiben, sich drehen und atmen; unter dem Tisch ein warmer Lichtschein. So hebt sich das Holz klar ab.
Bei „Bewegung reduzieren“ steht alles still.

## 12.11.2026: Zweite Phase bei Deckel-Spielen (Chic)
Deckel-Spiele haben eine wählbare zweite Phase (`params.phase2`), sobald die Mitte leer ist:
„Weitergeben“ (Schocken: Sieger gibt dem Verlierer) oder „Zurück in die Mitte“ (Chic: wer dann keine Deckel hat, ist raus;
danach spielen Sieger ihre Deckel zurück in die Mitte, ohne Deckel ist man raus, wer zuletzt Deckel hat, verliert die Hälfte).
Schock aus nimmt bei Chic in Phase 1 den Rest der Mitte; in Phase 2 gibt es „Alle“ zum Zurückspielen.

## 12.11.2026: Verliererseite bei Deckel-Spielen
Bei Schocken und Chic zählt, wer verliert. Die Ergebnisseite zeigt dann statt des feiernden Otters einen traurigen Otter
mit einem Stapel Bierdeckel (der oberste rutscht weg), gedämpftes Zimmer ohne Konfetti, Band „ALLE DECKEL“.
Weitere Varianten (Regenwolke, Rechnung, Holzlöffel) liegen in `loserRoom()` in `src/ui/trophy.ts`.

## 12.11.2026: Neuer Name „Oina no?“, neues Icon, Revanche-Knopf
Die App heißt „Oina no?“ (mit Fragezeichen) (schwäbisch für „noch eine Runde“). Icon: cremefarbener Würfel mit einem Auge in Koralle,
leicht gekippt, auf Mitternachtsblau mit weicher Form (Entwurf W1 auf dem Hintergrund von W3). Schriftzug auf der
Startseite „OINA / NO“ statt „PUNKTE / ZETTEL“. Interne Namen (Datenbank `punktezettel`, Sicherungsformat) bleiben,
damit vorhandene Daten und Sicherungen weiter funktionieren.
Auf der Ergebnisseite startet „Oina no“ nach dem Speichern sofort eine neue Partie mit denselben Regeln, Spielern und Plätzen.

## 12.11.2026: Updates auf dem iPhone
Die App vom Homescreen startet auf iOS oft nicht neu und blieb so auf alten Versionen. Sie fragt jetzt beim
Zurückkehren in die App und alle 30 Minuten nach einer neuen Version und lädt sie selbst (`registerSW` in `src/main.tsx`).
Version steigt mit jedem größeren Paket (0.9.0: Tisch-Modus, Chic, Oina no?).

## 12.11.2026: Startseite mit Logo statt Bild
Das alte Punktezettel-Bild (Nachtlandschaft mit eigenem Oval) ist ersetzt durch den Würfel aus dem App-Icon, darunter
„OINA NO?“; inzwischen als Logo-Block: Würfel links, so hoch wie die zwei Zeilen „OINA“ (Koralle wie das Würfelauge) und „NO?“ rechts. Der Würfel rollt alle paar Sekunden leicht. Hintergrundformen berühren die
Oberkante nicht mehr, damit unter der Statusleiste keine harte Kante entsteht.

## 12.11.2026: Serien als eigener Bereich, Abende und Serien gleich
Spieleabende und Serien (Urlaub, Turnier) sind dasselbe: eine Serie. Eigener Reiter „Serien“ in der unteren Leiste.
Eine Serie wird gestartet und läuft (`GameEvent.active`), bis sie beendet wird (`endedAt`); höchstens eine läuft.
Solange sie läuft, ist sie beim Speichern vorgewählt und steht als Karte auf der Startseite (Partien, wer führt).
Beendet zeigt sie eine Abschlussseite: Otter mit Pokal (Band „GESAMTSIEG“), wer die Serie gewinnt, Auszeichnungen
(Meiste Siege, Längste Siegesserie, Allrounder, Pechvogel; `seriesAwards` in `stats.ts`). Fortsetzen ist möglich.

## 12.11.2026: Startseite: Name und Bild als ein Banner
Jakob möchte das verspielte Bild mit Zettel, Stift, Würfel und Figur behalten, aber nicht so wuchtig getrennt vom Namen.
Jetzt ein Banner: „OINA NO?“ links, das Bild rechts auf einer gemeinsamen organischen Fläche (unregelmäßige Kante,
darin drei Formen, die langsam treiben, drehen und atmen). Die Suche steht als Pille mit Lupe frei darunter,
nicht überlappend; der Hell/Dunkel-Schalter oben links in der Fläche. Darunter direkt die Spiele.

## 12.11.2026: Startseite nach Spielart, Favoriten oben
Spiele stehen in aufklappbaren Gruppen nach Spielart: Kartenspiele, Würfelspiele, Brett- und Legespiele, Eigene Spiele
(dort auch Freies Spiel, Anderes Spiel und Erstellen). Favoriten (Herz auf der Spielseite) stehen ganz oben.
Offene/geschlossene Gruppen und Favoriten merkt sich das Gerät (localStorage), noch nicht in der Sicherung.
Eigene Spiele bekommen beim Erstellen eine Spielart (`params.family`); Kopien fester Spiele übernehmen sie.

## 12.11.2026: Startseite aufgeräumt, ein Weg zum eigenen Spiel
„Freies Spiel“ heißt jetzt „Schnelles Spiel“ und steht immer ganz oben bei den Favoriten. „Anderes Spiel“ entfällt
(doppelte sich mit der eigenen Endwertung; alte Partien bleiben im Verlauf). Unten gibt es nur noch „Eigenes Spiel
erstellen“; ob jede Runde oder nur am Ende gezählt wird, wählt man im Erstellen („Gezählt wird“).

## 13.11.2026: Geber, Vibration, Bildschirm an, Rekorde, Skat, Titel
- **Geber** (`params.dealer`, Wizard immer): rotiert reihum, steht im Untertitel („Runde 3, Ben gibt“) und als kleines
  Schild über seiner Spalte. Bei Rommé, Schafkopf, Doppelkopf, Skat.
- **Vibration** beim Eintragen, bei Leben, Deckeln und Rollen, deutlicher bei Hälften und Siegen. Android über
  `navigator.vibrate`, iPhone über ein verstecktes Schalter-Element (Safari ab 17.4). Im Menü der Partie abschaltbar.
- **Bildschirm bleibt an** während einer Partie (Wake Lock), wo der Browser es kann.
- **Rekorde je Spiel** (`gameRecords`): höchste bzw. niedrigste Siegpunktzahl, größter Vorsprung, längste Partie;
  bei Tisch-Spielen längste und schnellste Partie. Jede Partie speichert dazu ihre Rundenzahl (`extra.rn`).
  Rekorde stehen auf der Spielseite, ein neuer Rekord erscheint auf der Siegerseite.
- **Skat:** Alleinspieler antippen („Wer spielt?“), Spielwert eintippen, „Verloren“ zählt doppelt negativ,
  „Eingepasst“ ergibt eine leere Runde. 36 oder 48 Spiele oder offen.
- **Titel im Profil** (`playerTitles`): dezent als kleine Schilder unter dem Namen (höchstens zwei), alle mit Grund
  in der Liste „Titel“. Abwechslung durch kleine Auswahl je Art („Kniffel-Ass“, „Skat-Profi“, „Schrecken am
  Uno-Tisch“, ab zehn Siegen „Legende“; „Uno-Pechvogel“, „Lehrgeld bei Rommé“), je Spieler und Spiel fest gewählt,
  damit ein Titel nicht springt. Dazu besondere Titel aus Spielwerten: Kniffel-Jäger, Dauerpräsident, Hellseher
  (Wizard-Ansagen), Dauerschwimmer, Schock-Magnet, Stammgast. Nur bei mindestens drei Partien eines Spiels.

## 13.11.2026: Ausführliche Eingabe immer zusätzlich zur einfachen
Wo ein Spiel eine eigene, ausführlichere Oberfläche bekommt (z. B. Schafkopf, Doppelkopf, Skat als Spiel-Eingabe,
Rommé als Wettlauf), bleibt die einfache Eingabe (Punkte je Spieler und Runde) wählbar: auf der Spielseite vor dem
Start und während der Partie im Menü, gemerkt je Spiel. Beide schreiben dieselben Punkte je Runde; die ausführliche
legt zusätzlich die Angaben zum Spiel ab (Spielart, Partner …). So lässt sich mitten in der Partie wechseln, und
Statistik, Rekorde und Verlauf bleiben gleich.

## 13.11.2026: Wizard eigens gestaltet (Spiel 1 der Einzelrunde)
- Der große Block bleibt das Herzstück. Ansagen werden direkt im Block eingetragen: unten eine Leiste „Ben sagt an“
  mit 0 bis Kartenzahl, die Zahl steht sofort in seiner Zelle, dann ist der Nächste dran (ab links vom Geber).
  „Zurück zu …“ nimmt die letzte Ansage zurück. Während der Ansagen rückt die laufende Runde ins Bild.
- Stiche auf eigenem Blatt: alle Spieler untereinander, Ansage als Rahmen, Punkte sofort; oben die Karten der Runde,
  jede in der Farbe dessen, der den Stich geholt hat. „Runde eintragen“ erst, wenn die Stiche aufgehen.
- Kartenzahl der Runde als kleines Symbol (Mini-Fächer mit Zahl) in der Ecke des Blocks, nimmt keinen Platz weg. Kein Trumpf
  (liegt im Spiel selbst).
- Zellen: Punkte groß, darunter Treffer-Punkt und „2 von 2“ bzw. „3 statt 0“.
- Spielfarbe Lila (`src/ui/accent.ts`), Mechanik für weitere Spiele vorbereitet.
- Einfache Eingabe pro Spieler bleibt im Menü wählbar (`src/lib/modes.ts`, gemerkt je Spiel).
