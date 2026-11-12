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
- [ ] Offen: mehrere laufende Partien gleichzeitig, Spieler löschen.
- [x] **Szenen lebendiger (12.11.):** eigenes Muster je Spiel (Rauten, Strahlen, Waben, Raster, Wellen, Streifen, Stufen, Blöcke),
      dezente Bewegung (Konfetti schwebt, Sonne pulsiert, Figuren wippen; aus bei „Bewegung reduzieren“).
      Icons als Einzelsymbol, Szene erzählt die Situation (Kniffel: Würfel und Becher, Schafkopf: Eichel und Bierdeckel,
      Binokel: Schelle und Ober-Unter-Paar, Uno: Farbrad und Karten, Siedler: Schaf und Waben).

Teil D umgesetzt (12.11.): Gruppe „Endwertung“; Notizfelder (zählen nicht zur Summe) in eigenen Spielen, im freien Spiel und
über das Menü jeder Rundenpartie, Siedler mit „Längste Straße“ und „Rittermacht“; eigene Spiele mit Icon (Anfangsbuchstabe),
Szene, Farbe und Muster wählbar, Spielseite mit Regeln, Bearbeiten und Löschen; „Eigene Vorlage erstellen“ getrennt vom
„Freien Spiel“, das jetzt eine Einmal-Partie ist (Vorlage nur per Schalter).
