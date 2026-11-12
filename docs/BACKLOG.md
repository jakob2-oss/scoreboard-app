# Backlog (Feedback vom 12.11.2026)

Reihenfolge = Priorität. Erledigtes abhaken und nach STATUS.md übernehmen.

## A. Sofort (Bedienung und Optik)
- [x] **Eintragen im Überblick für jede Runde:** Nach einer vollen Runde muss die nächste Runde auch
      direkt im Überblick eintragbar sein (leere Zeile „neue Runde“ zum Antippen), nicht nur über die Spielerseiten.
- [x] **Kein farbiger Ring** um die aktuelle Runde auf der Spielerseite (wirkt KI-generiert). Stattdessen ruhig hervorheben.
- [x] **Spielerfarben pastellig**, passend zum Layout. Vorhandene Spieler automatisch umstellen.
- [x] **Regeln als Stichpunkte, aber elegant:** Schlüsselbegriff als kleine Marke, kurzer Zusatz daneben.
      Keine Mini-Sätze im Fließtext.
- [ ] **Hintergründe der Szenen** runder und verspielter, stärker an Two Dots orientiert (Muster, weiche Formen).

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
- [ ] **„Nur das Ergebnis“ umbenennen** (Vorschlag: „Endwertung“), Gruppe bleibt getrennt.
- [ ] **Endwertung mit eigenen Kategorien:** zusätzliche Felder anlegen, um weitere Dinge zu notieren.
- [ ] **Eigene Spiele bekommen Szene und Icon** (Muster im Stil der anderen Spiele) und eine klassische Spielseite.
- [ ] **Eigenes Label** für „Eigene Vorlage erstellen“, getrennt vom „Freien Spiel“.
- [ ] **Spezialregeln** im freien Spiel / eigenen Spiel: Notizfelder rechts neben dem Punktwert (ohne Verrechnung).

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
      Vorn, Durchschnittsplatz, bei einem Spiel auch Durchschnitt und Bestwert, Kniffel gewürfelt und Bonus, Wizard-Ansagen,
      Vorn je Spiel, gemeinsame Partien mit Revanche. Ab drei Spielern bleibt die Mehrfach-Ansicht.
