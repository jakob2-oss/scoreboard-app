# App Store

Stand 18.11.2026. Alles, wofür Jakob nicht gebraucht wird, ist erledigt. Offen sind nur die Schritte mit Apple-Account.

## Schon fertig (im Repo)
- iPhone-Projekt mit Capacitor unter `ios/` (nur iPhone, Hochformat, Deutsch), Bundle-ID `de.oinano.app`
- Bau der App: `npm run build:app` (relative Pfade, ohne Service Worker, Ordner `dist-app`)
- In der App: Teilen über das iPhone-Menü, Vibration, Statusleiste passend zum Design, Zurück-Wischen
- Schrift Jost in der App (kein Google Fonts), keine Verbindung zu Dritten
- App-Icon (1024 px, ohne Transparenz) und Startbild hell und dunkel, Vorlagen in `assets/`
- Datenschutz: https://jakob2-oss.github.io/scoreboard-app/datenschutz.html
- Hilfe (Support-URL): https://jakob2-oss.github.io/scoreboard-app/hilfe.html
- Workflow `.github/workflows/ios.yml`: baut, signiert und lädt zu TestFlight hoch (nur von Hand gestartet)
- Store-Bilder 6,9 Zoll (1320 × 2868) in `docs/store/`
- Umzug der Daten aus der Browser-Version: Reiter Spieler, Daten, „Sicherung speichern“, in der App „Sicherung einlesen“

## Schritte für Jakob (alles am iPhone möglich)
1. **Apple Developer Program** beitreten (App „Apple Developer“, als Einzelperson, 99 € im Jahr).
2. **Team-ID** notieren: developer.apple.com, Account, Mitgliedschaft.
3. **Bundle-ID anlegen**: developer.apple.com, Certificates, Identifiers, „+“, App IDs, `de.oinano.app`, Beschreibung „Oina no“.
4. **App anlegen** in App Store Connect: Meine Apps, „+“, Neue App, Plattform iOS, Name „Oina no?“, Sprache Deutsch,
   Bundle-ID `de.oinano.app`, SKU `oinano`.
5. **API-Schlüssel** erzeugen: App Store Connect, Benutzer und Zugriff, Integrationen, App Store Connect API,
   Team-Schlüssel „+“, Name „GitHub“, Zugriff **Admin** (nötig, damit GitHub selbst signieren darf).
   Key-ID und Issuer-ID notieren, die .p8-Datei laden (geht nur einmal).
6. **Secrets in GitHub** eintragen (Repo, Settings, Secrets and variables, Actions, New repository secret):
   - `APPLE_TEAM_ID`: Team-ID aus Schritt 2
   - `APPSTORE_KEY_ID`: Key-ID
   - `APPSTORE_ISSUER_ID`: Issuer-ID
   - `APPSTORE_KEY`: kompletter Inhalt der .p8-Datei (mit BEGIN- und END-Zeile)
7. **Bauen**: GitHub-App, Actions, „iPhone-App zu TestFlight“, Run workflow. Dauert etwa 15 Minuten.
8. **Testen**: App „TestFlight“ auf dem iPhone, Oina no? installieren.
9. **Store-Eintrag** ausfüllen (Texte unten), Bilder aus `docs/store/` hochladen, „Zur Prüfung einreichen“.

## Store-Eintrag

**Name:** Oina no?

**Untertitel** (30 Zeichen): Punkte zählen am Spieleabend

**Kategorie:** Unterhaltung, zweite Kategorie Brettspiele

**Werbetext** (170 Zeichen):
Schluss mit Zettel und Stift. Wizard, Kniffel, Schafkopf, Schocken und eure eigenen Spiele: eintragen, rechnen lassen, Sieger feiern.

**Beschreibung:**
Oina no? ist der Punktezettel für euren Spieleabend.

Ob Wizard, Rommé, Uno, Phase 10, Schafkopf, Doppelkopf, Skat, Binokel, Kniffel, Schocken, Chic, Schwimmen oder Scrabble: Die App kennt die Regeln, rechnet mit und zeigt jederzeit, wer vorne liegt.

Eigene Spiele legt ihr in einer Minute an, mit Punkten, Runden, Leben oder Deckeln. Spielende, Leben und Deckel stellt ihr für jede Partie neu ein.

Nach dem Abend wartet die Titelseite: eine Zeitung über eure Partien, mit Schlagzeile, Dauerduellen und Roter Laterne, fertig zum Teilen in der Gruppe.

Serien über mehrere Abende, Turniere, Profile mit Bilanz und Direktvergleich und Strichlisten für offene Runden gehören dazu.

Alles bleibt auf eurem Gerät. Kein Konto, keine Werbung, keine Datensammlung.

**Stichwörter** (100 Zeichen):
punkte,spieleabend,kartenspiel,würfel,wizard,kniffel,schafkopf,doppelkopf,skat,schocken,rommé,zähler

**Support-URL:** https://jakob2-oss.github.io/scoreboard-app/hilfe.html
**Datenschutz-URL:** https://jakob2-oss.github.io/scoreboard-app/datenschutz.html

**App-Datenschutz:** „Keine Daten erhoben“

**Altersfreigabe:** alle Fragen „Nein“ bzw. „Keine“ (kein Glücksspiel um Geld, keine Inhalte von Nutzern, kein Web-Zugang). Ergebnis 4+.

**Exportvorschriften:** in `Info.plist` gesetzt (keine eigene Verschlüsselung), Apple fragt nicht mehr nach.

**Preis:** kostenlos

## Bei der Prüfung beachten
- Apple lehnt Apps ab, die nur eine Webseite zeigen (Richtlinie 4.2). Dagegen sprechen: läuft komplett offline,
  natives Teilen und Vibration, keine Anmeldung. Bei einer Ablehnung gezielt nachbessern.
- Markennamen (Wizard, Kniffel, Uno …) stehen nur als Spielnamen in der App. Falls Apple das beanstandet,
  die Stichwörter ohne Marken neu fassen.
