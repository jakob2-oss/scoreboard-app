# Backlog (Feedback vom 12.11.2026)

Reihenfolge = Priorität. Erledigtes abhaken und nach STATUS.md übernehmen.

## A. Sofort (Bedienung und Optik)
- [x] **Eintragen im Überblick für jede Runde:** Nach einer vollen Runde muss die nächste Runde auch
      direkt im Überblick eintragbar sein (leere Zeile „neue Runde“ zum Antippen), nicht nur über die Spielerseiten.
- [x] **Kein farbiger Ring** um die aktuelle Runde auf der Spielerseite (wirkt KI-generiert). Stattdessen ruhig hervorheben.
- [x] **Spielerfarben pastellig**, passend zum Layout. Vorhandene Spieler automatisch umstellen.
- [x] **Regeln als Stichpunkte, aber elegant:** Schlüsselbegriff als kleine Marke, kurzer Zusatz daneben.
      Keine Mini-Sätze im Fließtext.
- [x] **Hintergründe der Szenen** runder und verspielter, stärker an Two Dots orientiert (Muster, weiche Formen).

## B. Nächster Entwicklungsschritt: lokal vollständig nutzbar
- [x] **Partien speichern** beim Beenden (Platzierung und Endpunktzahl je Spieler, Spiel, Datum, optional Anlass).
      Keine Rundendetails nötig.
- [x] **Verlauf/Log:** Liste aller gespielten Partien (Spiel, Datum, Sieger, Platzierungen, Punkte).
- [x] **Spielerprofile mit Statistik** wie im Prototyp: Siege, Siegquote, Sieg/Niederlage, Filter Zeitraum und Spiel,
      „Worin X gut ist“, Direktvergleich mit einem oder mehreren, spielspezifische Werte, letzte Partien.
- [x] **Navigation:** Untere Leiste mit drei Bereichen: Spielen, Verlauf, Spieler. Daumenfreundlich, ruhig.

## C. Spiele
- [x] **Phase 10:** Haken „Phase geschafft“ je Runde, Phasenanzeige, Rang erst nach Phase dann Punkten.
- [x] **Kniffel:** Kategorien-Zettel mit Bonus 35 ab 63. **Kategorien hinzufügen/entfernen** über einen Knopf
      in der Partie (z. B. für Doppel-Kniffel oder zusätzliche große Kategorien), frei konfigurierbar.
- [x] **Schafkopf:** Spielart (Sauspiel, Wenz, Solo), Tarif, Schneider/Schwarz, Laufende; Abrechnung als Nullsumme.
- [x] **Doppelkopf:** Partner wechseln je Runde (Re/Kontra), Spielwert inkl. Ansagen, Soli, Nullsumme.
- [x] **Binokel:** Reizen (Gebot), Melden, Stiche; nicht erfülltes Gebot zählt doppelt negativ; Ziel z. B. 1000.

Umgesetzt (12.11.): Schafkopf und Doppelkopf als Nullsumme mit Plus-/Minus-Tasten und Hinweis, wenn eine Runde nicht 0 ergibt;
Doppelkopf ×3 für Soli; Binokel mit Taste ×−2 für ein verfehltes Gebot. Partner und Spielarten werden nicht eigens erfasst.

## D. Eigene Spiele und Benennung
- [x] **„Nur das Ergebnis“ umbenennen** (Vorschlag: „Endwertung“), Gruppe bleibt getrennt.
- [x] **Endwertung mit eigenen Kategorien:** zusätzliche Felder anlegen, um weitere Dinge zu notieren.
- [x] **Eigene Spiele bekommen Szene und Icon** (Muster im Stil der anderen Spiele) und eine klassische Spielseite.
- [x] **Eigenes Label** für „Eigene Vorlage erstellen“, getrennt vom „Freien Spiel“.
- [x] **Spezialregeln** im freien Spiel / eigenen Spiel: Notizfelder rechts neben dem Punktwert (ohne Verrechnung).

## E. Spieleabende und Serien (Wunsch vom 12.11.)
- [x] **Serie anlegen und benennen**, z. B. „Kniffel-Liga“, „Spieleabend bei Ben“, „Südamerika 2026“.
      Nicht an einen Tag gebunden: Partien lassen sich jederzeit einer Serie zuordnen, auch nachträglich.
- [x] **Partien zuordnen:** beim Start oder Beenden die Serie wählen (ersetzt das Freitextfeld „Anlass oder Ort“),
      im Verlauf nachträglich ändern. Eine Serie kann verschiedene Spiele enthalten.
- [x] **Übersicht je Serie:** Gesamtwertung über alle Partien (Siege, Platzpunkte), Partien der Serie,
      Bilanz je Spiel. Eigener Bereich in der Navigation oder unter „Verlauf“.
- [ ] **Gemeinschaftlich:** Eine Freundesgruppe nutzt dieselbe Serie. Lokal zunächst auf einem Gerät;
      teilen zwischen Handys erst mit Sync (Phase 4). Datenmodell: Tabelle `events` mit `groupId`.

Umgesetzt (12.11.): Platzpunkte mit Vorschlag 3, 2, 1, je Serie anpassbar. Wertung umschaltbar: Punkte (Summe),
Schnitt (Punkte pro Partie, gleicht fehlende Abende aus), Quote (Anteil geschlagener Gegner, gleicht große und kleine Runden aus).
Frühere Freitext-Anlässe werden beim Start einmalig zu Serien.

## F. Feedback vom 12.11. (abends)
- [x] **Eigene Spiele bearbeiten und löschen.** Antippen öffnet die Seite des Spiels mit Speichern, Spieler wählen, Löschen.
      Robust: Partien frieren ihre Regeln ein, Änderungen gelten nur für neue Partien; Schlüssel bleibt, Version steigt;
      Löschen markiert nur, Verlauf und Statistik bleiben; gelöschte Spiele entstehen beim Beenden nicht neu.
- [x] **Binokel zweiteilig:** erst alle Meldungen, dann alle Stiche; Rundenwert ist die Summe. Leere Meldung zählt 0.
- [x] **Spiele durchgesehen:** Schafkopf und Doppelkopf mit Taste „Ausgleich“ (ergänzt die Runde zu 0).
      Wizard, Kniffel, Phase 10 waren schon spielspezifisch; Rommé, Skyjo, Scrabble haben passende Faktoren (×2, ×3).
- [ ] Ideen für später: Uno „Sieger bekommt die Karten der anderen“ automatisch, Skyjo „Beender verdoppelt“ automatisch,
      Doppelkopf Re/Kontra als Partei je Runde.
- [x] **Direktvergleich als Duell** (Vorbild Screenshot 12.11.): zwei Spieler gegenüber, gespiegelte Balken in Spielerfarben:
      Siege, besser platziert, Durchschnittsplatz, bei einem Spiel auch Durchschnitt und Bestwert, Kniffel gewürfelt und Bonus, Wizard-Ansagen,
      Siege je Spiel, gemeinsame Partien mit Revanche. Umschalter Anzahl und Quote (Prozent der gemeinsamen Partien). Ab drei Spielern bleibt die Mehrfach-Ansicht.
- [x] **Kniffel ohne Zahlenfeld:** je Feld nur die passenden Werte (Einser 1 bis 5, Pasch 5 bis 30, feste Werte),
      dazu Streichen; gestrichene Felder grau mit Strich. Chance und eigene Kategorien ohne Vorgabe behalten das Zahlenfeld.
      Feld im Überblick antippen öffnet die Auswahl und führt danach zurück.
- [x] **Leistung als Hauptkennzahl:** Platzierung im Verhältnis zum Durchschnitt (geschlagene Gegner ÷ (Spieler − 1) ÷ 2, Gleichstand halb).
      1,0× = wie erwartet. Erste Kachel im Profil, Stärken je Spiel, Spielerliste, Standard-Wertung der Serien, erste Zeile im Duell.

## G. Prüfung 12.11. (Fehler, Statistik, lokaler Gebrauch)
- [x] **Fehler:** Neue Partie während einer laufenden ließ die alte unsichtbar zurück. Jetzt Nachfrage: speichern, verwerfen oder abbrechen.
- [x] **Spieler umbenennen** im Profil (Name antippen).
- [x] **Statistik entschlackt:** Profil-Kacheln Leistung, Siege, Ø Platz (Siegquote und Sieg-Niederlagen-Balken entfallen);
      Duell ohne „Besser platziert“, drei letzte Partien; Serie ohne „Quote“ (Leistung deckt das ab); keine Punktvergleiche bei Platz-Spielen.
- [x] **Hintergründe:** runde Hügel, weiche Kreise, Punkteraster, Konfetti; alle Illustrationen in Pastell.
- [x] **Lokaler Gebrauch:** Sicherung speichern und einlesen (Spieler, Bereich Daten), dauerhafter Speicher angefragt.
- [x] **Partie im Verlauf löschen** (mit Rückfrage), Statistik rechnet ohne sie.
- [x] Texte: „Ben und Clara gewinnen“ statt „Ben & Clara gewinnt“, „haben Phase 10 geschafft“, „mit 1 Spieler“.
- [x] **Spieler löschen** im Profil (nicht während er mitspielt); Name bleibt im Verlauf.
- [x] **Feedback-Knopf** auf der Startseite: Text, dann Teilen-Menü des Geräts, Version und Gerät hängen an.
- [x] **Mehrere Partien gleichzeitig:** Neue Partie parkt die laufende, Startseite listet alle laufenden Partien; Beenden und Verwerfen betreffen nur die geöffnete.
- [x] **Szenen lebendiger (12.11.):** eigenes Muster je Spiel (Rauten, Strahlen, Waben, Raster, Wellen, Streifen, Stufen, Blöcke),
      dezente Bewegung (Konfetti schwebt, Sonne pulsiert, Figuren wippen; aus bei „Bewegung reduzieren“).
      Icons als Einzelsymbol, Szene erzählt die Situation (Kniffel: Würfel und Becher, Schafkopf: Eichel und Bierdeckel,
      Binokel: Schelle und Ober-Unter-Paar, Uno: Farbrad und Karten, Siedler: Schaf und Waben).

Teil D umgesetzt (12.11.): Gruppe „Endwertung“; Notizfelder (zählen nicht zur Summe) in eigenen Spielen, im freien Spiel und
über das Menü jeder Rundenpartie, Siedler mit „Längste Straße“ und „Rittermacht“; eigene Spiele mit Icon (Anfangsbuchstabe),
Szene, Farbe und Muster wählbar, Spielseite mit Regeln, Bearbeiten und Löschen; „Eigene Vorlage erstellen“ getrennt vom
„Freien Spiel“, das jetzt eine Einmal-Partie ist (Vorlage nur per Schalter).

## H. Für das Ende vorgemerkt
- [ ] **Spielerprofile gestaltbar:** Profilbild und Farbe je Spieler frei wählbar.
  - Offline-Version: bei allen Spielern.
  - Später mit Accounts: nur das eigene Profil und Offline-Spieler (ohne Account).
- Feste Spielseiten bleiben unverändert. Anpassungen daran werden als eigenes Spiel gespeichert (umgesetzt 12.11.).
- [x] **Spielsuche** auf der Startseite (feste, Endwertungen, eigene Spiele; ohne Groß-/Kleinschreibung und Akzente).
- [x] **Festes Spiel als eigenes Spiel anpassen:** Kopie mit Regeln, Schnelltasten und Bild des Originals, sofort in Bearbeitung.
- [x] **Siegerseite (12.11.):** ganze Seite mit Szene des Spiels, Sieger mit Krone, Treppchen, bis zu drei Kennzahlen je Spiel (`src/game/highlights.ts`), Serie zuordnen und speichern.
- [x] **App-Hintergrund mit Formen (12.11.):** blau bleibt, Formen passend zum Spiel, alles langsam in Bewegung; Szenen-Konfetti verlangsamt.
- [x] **Otter auf der Siegerseite (12.11.):** Trophäenzimmer mit Otter (Krone, Pokal), gerahmtes Bild des Spiels, Punktezettel an der Wand, Band „Gewonnen“; langsam fallendes Konfetti. Stil erwachsen, angelehnt an das Vorbild, eigene Zeichnung (`src/ui/trophy.ts`).
- [x] **Teams (12.11.):** in der Spielerauswahl „In Teams spielen“, Teams aus einzelnen Spielern; Partie zählt je Team, beim Beenden bekommt jedes Mitglied Platz und Punkte des Teams. Nicht bei Wizard, Kniffel, Phase 10.
- [ ] Später: wechselnde Partner je Runde (Doppelkopf Re/Kontra, Schafkopf Sauspiel).

## I. Prüfung aller Spiele (12.11.)
Gut abgestimmt: Wizard (Ansage/Stiche, Geber rotiert, Kartenzahl begrenzt), Kniffel (nur passende Werte, Bonus, Zug-Reihenfolge),
Binokel (Meldung, dann Stiche), Arschloch (Rollen per Reihenfolge), Rommé, Skyjo, Scrabble, Siedler, Monopoly.

Verbesserungswürdig:
- [x] **Uno:** nur der Rundensieger bekommt Punkte, alle anderen müssen heute eine 0 eintippen. Besser: „Wer hat gewonnen?“ antippen, dann nur dessen Punkte.
- [ ] **Schafkopf, Doppelkopf:** Punkte je Spieler einzeln, nur „Ausgleich“ hilft. Besser: Spiel-Eingabe mit Parteien (wer mit wem, Spielart, Tarif, Schneider/Laufende bzw. Re/Kontra, Ansagen), Werte werden berechnet.
- [x] **Phase 10:** Phasenstand ist im Überblick nicht sichtbar (nur auf der Spielerseite). Besser: Phase je Spieler im Kopf oder in der Summenzeile.
- [x] **Rommé, Skyjo (wenig gewinnt, mit Grenze):** Summenzeile zeigt bei hohem Ziel „noch X“, bei Grenze nichts. Besser: „noch X bis 500“ als Warnung.
- [x] **Binokel:** „Abgehen“ (Spieler gibt vor dem Spiel auf: Gebot einfach negativ) fehlt als eigene Taste.
- [x] **Anderes Spiel:** entfernt, „Eigenes Spiel erstellen“ mit „Nur am Ende“ deckt es ab.

Erstellungsmodus, fehlende Bausteine:
- [x] Wertungsart wählbar: Punkte je Runde, zwei Werte je Runde (wie Binokel), Rang je Runde (wie Arschloch), nur Endergebnis.
- [x] Eigene Schnelltasten mit Namen und Wirkung (z. B. „Raus = 0“, „×2“), nicht nur Zählschritte.
- [x] Schalter „Nullsumme“ (mit Ausgleich-Taste).
- [ ] „Haken je Runde“ (wie Phase 10) für eigene Spiele.
- [x] **Testspiele (12.11.):** `src/simulation.test.ts` spielt jedes Spiel sechsmal und Varianten (Teams, eigene Wertungen) vollständig durch und prüft Rechenregeln, Ranglisten, Speicherung und Statistik.

## J. Tisch-Modus (12.11.)
- [x] Schwimmen (3 Leben plus Schwimmen, Feuer) und Schocken (13 Deckel, zwei Hälften, Finale, Schock aus) am Tisch:
  Spieler sitzen um einen runden Tisch in einem Raum mit Holzwand, Antippen verteilt Leben bzw. Deckel, Ziehen tauscht Plätze.
- [x] Erstellungsmodus: Wertung „Leben verlieren“ oder „Deckel verteilen“ mit eigener Zahl.
- [ ] Annahmen prüfen lassen: Schwimmen mit 3 Leben plus Schwimmen; Schocken mit Finale nur, wenn zwei verschiedene Spieler je eine Hälfte verloren haben.
- [ ] Idee: Schocken-Wurf antippen (Schock 2 bis 6, General, Straße) statt Zahl, falls gewünscht.
- [ ] Statistik im Profil für Tisch-Spiele (wie oft geschwommen, Hälften verloren).
- [x] Tisch von oben ohne Wand, Bartisch mit Bier, Wein, Oliven und Tapas; Namen zum jeweiligen Platz gedreht (Handy in der Mitte).
- [x] Deckel liegen einzeln vor dem Spieler, Leben als Münzen.
- [x] Chic im Erstellungsmodus: zweite Phase „Zurück in die Mitte“ (ohne Deckel raus, Letzter mit Deckeln verliert).
- [x] Phasen im Erstellungsmodus: Schwimmen an oder aus, verloren nach einer, zwei oder drei Hälften; auch nachträglich bearbeitbar.

## K. Serien und Spieleabende (12.11.)
- [x] Eigener Reiter „Serien“, Serie starten und beenden, laufende Serie auf der Startseite und beim Speichern vorgewählt.
- [x] Abschlussseite mit Otter, Gesamtsieger und Auszeichnungen.
- [ ] Ideen: Serien-Statistik im Profil (Seriensiege), Teilen der Abschlussseite als Bild, Serie mit festen Spielern.

## L. Großes Feedback vom 13.11. (gegliedert, Reihenfolge = Umsetzung)

### L1 Allgemein
- [ ] Startseite: Hell/Dunkel-Schalter nach rechts oben.
- [ ] Teams: mehr als zwei Teams einstellbar; Teams bei jedem Spiel möglich (auch Kniffel).
- [ ] Block: Summen und Platzierungen unten auf dieselbe Skala wie die Kacheln.
- [ ] Spielende: bei allen Spielen „Offen“ als Standard, dazu immer ein freies Limit (Runden oder Punkte) eingebbar.
- [ ] Untertitel (Runde …) bei allen Spielen entfernen; steht in den Ansichten selbst.
- [ ] Standard ist überall die eigens gestaltete Eingabe im Block; Einzelerfassung ist die Alternative.

### L2 Wizard
- [x] Sehr gut wie es ist. Standard: im Block eintragen, Einzelerfassung als Alternative.

### L3 Rommé
- [ ] Die Ansage-Logik aus Wizard gehört hier nicht hin.
- [ ] Standard: großer Block mit direkter Eingabe; Einzelseiten zeigen eine Kurve mit dem Punkteverlauf.
- [ ] Runden mit 0 im Block mit kleiner Krone (Rundensieg).
- [ ] Siegerseite: statt „Beste Runde“ „Dickste Packung“ (meiste Punkte in einer Runde) und „Meiste Siege“.
- [ ] Rekorde: niedrigster Schnitt statt Gesamtpunkte (ab 7 Runden), Größter Vorsprung, Längste Partie, Höchste Siegquote (ab 7 Runden).
- [ ] Wird eher auf Runden gespielt: wenigste Punkte nach den Runden gewinnt (über freies Limit Runden).

### L4 Uno
- [ ] Klären: Bekommt wirklich nur, wer fertig ist, Punkte? (Ja, Standardregel: der Sieger bekommt die Kartenwerte der anderen.)
- [ ] Eintragen direkt im Block, ohne Einzelseiten.
- [ ] Geber rotiert.

### L5 Phase 10
- [ ] Phase im Block abhaken.
- [ ] Geschaffte Phasen grün, gescheiterte rot; Hintergrund je Phase leicht im Regenbogenverlauf.
- [ ] Geber rotiert.

### L6 Binokel
- [ ] Geber rotiert.
- [ ] Eingabe: Meldung, dann Stiche; einfache Korrektur bei Abgehen.
- [ ] Optional das Gebot erfassen; daraus Vorschlag für Abgehen (einfach negativ) und Verfehlt (doppelt negativ). Punkte tragen die Spieler selbst ein.
- [ ] Markierungen im Block: abgegangen (einfach), verfehlt (doppelt); geht niemand ab, Spieler mit den meisten Punkten grün.
- [ ] Kleines Logo oben links: die beiden Karten, die zusammen „Binokel“ ergeben (wenig Platz).

### L7 Arschloch
- [ ] Im Block Präsident (Krone) und Arschloch (passendes Icon) kennzeichnen.
- [ ] Das Arschloch der letzten Runde gibt in der aktuellen Runde.
- [ ] Einzelseiten zeigen die Rangentwicklung über die Runden; Eintragen im Block.

### L8 Schwimmen
- [ ] Zusätzliche Einstellung: Anzahl Personen, die schwimmen (klären).

### L9 Kniffel
- [ ] Einzelseiten nur noch als Alternative: im Block beim Tippen Auswahl aufklappen.
- [ ] Gestrichenes ausgrauen.
- [ ] Summe unten gesondert.
- [ ] Feld mit dem Summenzeichen bündig zu den Kategorien.
- [ ] Bonus: anzeigen, wie viele bis 63 fehlen, abgegrenzt, ohne Text.

### L10 Ergebnisspiele (Siedler, Monopoly, eigene „nur am Ende“)
- [ ] Kein Zettel: eine Eingabe, daraus direkt Podest und Rangliste, darunter Statistik und Rekorde.
- [ ] Siedler: Notizfelder Längste Straße und Rittermacht entfallen; Seite und Siegerseite kreativer.
- [ ] Monopoly: dasselbe, eigenes Artwork.
- [ ] Eigene Ergebnisspiele: freies Artwork, für alle Spiele möglichst einfach.
- [ ] Fehler: Siedler-Seite hing nach der Partie.

### L11 Freie Erstellung, Chic
- [ ] Zwei Knöpfe: Person chict sich raus (scheidet aus, keine Gewinnerin) und Person verliert direkt (raus, Runde läuft weiter).
- [ ] Chic als feste Vorlage; im eigenen Spiel weiter möglich.

### L12 Serien
- [ ] Banner oben: zuerst 5 Platzhalter (Optik der App, frecher und verrückter, mit atzigem Otter); später eigene Bilder.
- [ ] Teilnehmer oben auflisten.
- [ ] Partien der Serie öffnen (Detailansicht).
- [ ] Siegerbild der Serie anders als bei einer Partie, weiter unten unter dem Banner.
- [ ] Serienliste: einige Teilnehmer und das Banner als Icon.

### L13 Getrennt besprechen
- [ ] Skyjo, Schafkopf, Doppelkopf, Scrabble (Eintragen auf der Hauptseite; was unterscheidet sie vom bloßen Aufschreiben?).

### L14 Idee: Strichliste zwischen Personen
- [ ] Gemeinsame Strichliste (z. B. Wettpunkte) in beide Richtungen, Strichlisten-Look, Notiz je Strich. Konzept: wo integrieren, wie weiterdenken.
