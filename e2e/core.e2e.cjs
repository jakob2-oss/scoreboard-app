// Klicktest für Paket 1. Voraussetzung: `npm run build && npx vite preview --port 4173`
// Start: node e2e/core.e2e.cjs  (nutzt das vorinstallierte Playwright)
const { chromium, devices } = require('playwright');
const URL = process.env.APP_URL || 'http://localhost:4173/scoreboard-app/';
const SHOTS = process.env.SHOTS || null;
let failed = 0;
const check = (name, ok, detail = '') => { console.log((ok ? '✓ ' : '✗ ') + name + (ok ? '' : '  → ' + detail)); if (!ok) failed++; };

(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ ...devices['iPhone 13'] }); await c.grantPermissions(['clipboard-read', 'clipboard-write']);
  const p = await c.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push(m.text()); });
  // sichtbarer Text (Zellen mit Abständen) bzw. Rohtext (Knöpfe ohne Großschreibung durch CSS)
  const text = async sel => (await p.innerText(sel)).replace(/\s+/g, ' ').trim();
  const raw = async sel => (await p.textContent(sel)).replace(/\s+/g, ' ').trim();
  const page = () => p.evaluate(() => [...document.querySelectorAll('.pp-tab')].findIndex(t => t.getAttribute('aria-current') === 'true') - 1);
  const shot = async n => { if (SHOTS) await p.screenshot({ path: `${SHOTS}/${n}.png` }); };
  const typeNum = async n => { for (const d of String(n)) await p.click(`.pp-keys .key >> text="${d}"`); };

  await p.goto(URL); await p.waitForSelector('.wordmark');
  check('Startseite lädt', true);
  check('keine laufende Partie am Anfang', !(await p.isVisible('.resume')));
  check('17 Einträge (14 Spiele, Freies Spiel, zweimal Erstellen), noch keine eigenen Spiele', (await p.locator('.row.tpl').count()) === 17 && (await p.locator('#my-games .row[data-own]').count()) === 0);
  check('Gruppe heißt Endwertung', (await raw('#s-home')).includes('Endwertung'));
  await shot('01-home');

  // Eigene Vorlage erstellen
  await p.click('#new-own');
  check('Einstellungen offen', await p.isVisible('#s-setup'));
  await p.fill('#setup-name', 'Testspiel');
  await shot('01b-setup');
  await p.click('#setup-next');
  check('Spielerauswahl offen', await p.isVisible('#s-players'));
  check('Start ohne Spieler gesperrt', await p.isDisabled('#start-btn'));
  for (const n of ['Anna', 'Ben', 'Clara']) { await p.fill('#add-name', n); await p.press('#add-name', 'Enter'); }
  await p.fill('#add-name', 'anna'); await p.press('#add-name', 'Enter');
  check('Doppelter Name wird nicht neu angelegt', (await p.locator('.chip').count()) === 3);
  // Reihenfolge per Ziehen am Griff ändern und zurück
  const order = async () => (await p.locator('.order-row .nm').allTextContents()).join(',');
  const dragRow = async (i, rows) => {
    const g = await p.locator('.order-row .grip').nth(i).boundingBox();
    const h = (await p.locator('.order-row').nth(i).boundingBox()).height;
    await p.mouse.move(g.x + g.width / 2, g.y + g.height / 2); await p.mouse.down();
    for (let k = 1; k <= 8; k++) await p.mouse.move(g.x + g.width / 2, g.y + g.height / 2 + (rows * h * 1.05) * k / 8);
    await p.mouse.up(); await p.waitForTimeout(100);
  };
  await dragRow(0, 2);
  check('Ziehen: Anna ans Ende', (await order()) === 'Ben,Clara,Anna', await order());
  await dragRow(2, -2);
  check('Ziehen zurück: Anna vorn', (await order()) === 'Anna,Ben,Clara', await order());
  check('Startknopf zeigt 3 Spieler', (await raw('#start-btn')) === 'Los mit 3 Spielern');
  await shot('02-players');
  await p.click('#start-btn');
  check('Partie startet im Überblick', (await page()) === -1);
  check('Knopf „Runde 1 eintragen“', (await raw('.dock .primary')).startsWith('Runde 1 eintragen'));

  // Runde 1 über die Spielerseiten
  await p.click('.dock .primary'); await p.waitForTimeout(500);
  check('Eingabe beginnt bei Anna', (await page()) === 0);
  await typeNum(12);
  check('Anna Runde 1 = 12', (await text('section[aria-label="Anna"] .pp-entry .val')) === '12');
  check('Weiter zeigt Ben', (await raw('.pp-keys .go')).includes('Ben'));
  await p.click('.pp-keys .go'); await p.waitForTimeout(500);
  check('weiter zu Ben', (await page()) === 1);
  await typeNum(7);
  await p.click('.pp-keys .go'); await p.waitForTimeout(500);
  await p.click('.quick >> text="+10"'); await p.click('.quick >> text="+5"');
  check('Schnelltasten: Clara = 15', (await text('section[aria-label="Clara"] .pp-entry .val')) === '15');
  check('letzter Spieler: Fertig', (await raw('.pp-keys .go')).startsWith('Fertig'));
  await shot('03-playerpage');
  await p.click('.pp-keys .go'); await p.waitForTimeout(500);
  check('zurück im Überblick', (await page()) === -1);
  check('Meldung „Runde 1 komplett“', (await p.isVisible('.toast')) && (await text('.toast')) === 'Runde 1 komplett');
  check('Brett zeigt 12 · 7 · 15', (await text('tbody tr:nth-child(1)')) === '1 12 7 15');
  check('Summen und Führung', (await text('tfoot')).includes('15') && (await p.locator('tfoot td.lead').count()) === 1);
  check('nächster Knopf: Runde 2', (await raw('.dock .primary')).startsWith('Runde 2 eintragen'));
  check('leere Zeile für Runde 2 im Überblick', (await p.locator('tr.new-row td').count()) === 3);
  await shot('04-overview');

  // Zelle bearbeiten
  await p.click('tbody tr:nth-child(1) td:nth-child(3)');
  check('Ziffernblock im Überblick offen', await p.isVisible('#pad'));
  const cellVisible = await p.evaluate(() => { const c = document.querySelector('td.cell.active').getBoundingClientRect(), pad = document.querySelector('#pad').getBoundingClientRect(), foot = document.querySelector('.grid tfoot').getBoundingClientRect();
    return c.bottom <= pad.top && !(foot.top < c.bottom && foot.bottom > c.top); });
  check('bearbeitetes Feld bleibt sichtbar', cellVisible);
  await p.click('#pad .key >> text="9"');
  check('Wert ersetzt (fresh)', (await text('#pad .pad-display .val')) === '9');
  await shot('05-pad');
  await p.click('#pad [aria-label="Ziffernblock schließen"]');
  check('Ben R1 = 9', (await text('tbody tr:nth-child(1)')) === '1 12 9 15');
  await p.click('.dock .secondary'); await p.waitForTimeout(200);
  check('Rückgängig stellt 7 wieder her', (await text('tbody tr:nth-child(1)')) === '1 12 7 15');
  // Runde 2 direkt im Überblick beginnen und wieder zurücknehmen
  await p.click('tr.new-row td >> nth=0'); await p.click('#pad .key >> text="4"'); await p.click('#pad [aria-label="Ziffernblock schließen"]');
  check('Runde 2 im Überblick angelegt', (await text('tbody tr:nth-child(2)')).startsWith('2 4'));
  await p.click('.dock .secondary'); await p.waitForTimeout(200);
  check('Rückgängig entfernt Runde 2 wieder', (await p.locator('tbody tr:not(.new-row)').count()) === 1);

  // Wischen & Seitenpunkte
  await p.click('.pp-tab[aria-label="Ben"]'); await p.waitForTimeout(600);
  check('Punkt springt zu Ben', (await page()) === 1);
  check('Ben: neue Runde 2', (await text('section[aria-label="Ben"] .pp-entry .lbl')) === 'Runde 2');
  await p.click('section[aria-label="Ben"] .pp-hist button >> nth=0');
  check('Verlauf R1 antippen öffnet Runde 1', (await text('section[aria-label="Ben"] .pp-entry .lbl')) === 'Runde 1');
  await p.evaluate(() => { const s = document.querySelector('.pp-swipe'); s.scrollLeft = s.clientWidth * 3; });
  await p.waitForTimeout(500);
  check('Wischen zu Clara übernimmt Seite', (await page()) === 2);
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  check('kein seitliches Überlaufen der Seite', !overflow);

  // Speicherung: neu laden
  await p.reload(); await p.waitForSelector('.wordmark');
  check('nach Neuladen: laufende Partie angeboten', await p.isVisible('.resume'));
  await p.click('.resume'); await p.waitForTimeout(300);
  check('nach Neuladen: Werte erhalten', (await text('tbody tr:nth-child(1)')) === '1 12 7 15');

  // Menü: Gewinner umstellen, Design, Ende
  await p.click('[aria-label="Menü"]');
  await p.click('.seg >> text=Niedrigste Summe'); await p.waitForTimeout(100);
  await p.click('.scrim', { position: { x: 30, y: 40 } });
  check('„Wenig gewinnt“: Ben führt', (await p.getAttribute('tfoot td.lead', 'style') || '').includes('#86cbb8'));
  await p.click('[aria-label="Menü"]'); await p.click('.menu-list >> text=Design');
  check('Design wechselt', (await p.evaluate(() => document.documentElement.dataset.theme)) === 'dark');
  await shot('06-menu-dark');
  await p.click('.menu-list >> text=Beenden und speichern');
  check('Ergebnis zeigt Ben vorn', (await text('.bsheet h3')) === 'Ben gewinnt');
  await shot('07-result-dark');
  await p.click('.victory .pad-actions .secondary');
  check('Weiterspielen schließt die Siegerseite', !(await p.isVisible('.victory')));
  await p.click('#s-game .text-btn');
  check('„Beenden“ oben öffnet das Ergebnis', (await raw('.bsheet .primary')) === 'Speichern');
  check('Serie: anfangs keine gewählt', (await p.getAttribute('.ser-chips .fchip >> nth=0', 'aria-pressed')) === 'true');
  await p.click('#series-new'); await p.fill('#series-name', 'Südamerika 2026'); await p.click('.ser-add .primary'); await p.waitForTimeout(200);
  check('Serie angelegt und gewählt', (await text('.ser-chips .fchip[aria-pressed="true"]')) === 'Südamerika 2026');
  await shot('29-result-series');
  await p.click('.bsheet .pad-actions .primary'); await p.waitForTimeout(300);
  check('Meldung nach dem Speichern', (await text('.toast')) === 'Partie gespeichert');
  // Verlauf und Profil
  await p.click('#tab-history');
  check('Verlauf zeigt die Partie', (await p.locator('.hist-row').count()) === 1);
  await p.click('.hist-row'); await p.waitForTimeout(200);
  check('Detail: Ben vorn', (await text('.bsheet .prow >> nth=0')).includes('Ben'));
  await shot('30-history');
  await p.click('.bsheet .prow >> nth=0'); await p.waitForTimeout(200);
  check('Profil von Ben: Leistung 2,0× (ein Sieg zu dritt)', (await p.inputValue('#pf-name')) === 'Ben' && (await text('#perf-tile b')) === '2,0×', await text('#perf-tile b'));
  await p.click('.vs-p >> nth=0');
  check('Direktvergleich zeigt gemeinsame Partie', (await text('.duel-head small')) === '1 gemeinsame Partie');
  check('Direktvergleich: Leistung und Revanche', (await raw('.duel-row .eyebrow >> nth=0')) === 'Leistung' && await p.isVisible('.rematch'));
  await shot('31-profile'); await p.evaluate(() => { document.documentElement.dataset.theme = 'light'; }); await shot('31-profile-light'); await p.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await p.click('[aria-label="Zurück"]');
  check('Spielerliste mit drei Spielern', (await p.locator('.person-row').count()) === 3);
  await shot('32-people');
  await p.click('#tab-home');
  check('nach Beenden auf der Startseite', await p.isVisible('#s-home'));
  check('keine laufende Partie mehr', !(await p.isVisible('.resume')));
  await p.reload(); await p.waitForSelector('.wordmark');
  check('auch nach Neuladen beendet', !(await p.isVisible('.resume')));
  check('Design bleibt nach Neuladen dunkel', (await p.evaluate(() => document.documentElement.dataset.theme)) === 'dark');

  // Gespeicherte Vorlage erneut spielen
  check('„Testspiel“ unter Meine Spiele', (await text('#my-games')).includes('Testspiel'));
  await p.click('#my-games .row >> text=Testspiel');
  check('eigenes Spiel öffnet seine Seite mit Regeln', (await raw('#s-setup .tpl-title h1')).includes('Testspiel') && await p.isVisible('#s-setup .rule-points') && await p.isVisible('#tpl-edit'));
  await shot('42b-own-page');
  await p.click('#s-setup .dock .secondary');
  check('letzte Spieler vorausgewählt', (await raw('#start-btn')) === 'Los mit 3 Spielern');
  await p.click('[aria-label="Zurück"]');
  check('Zurück führt zur Seite des Spiels', await p.isVisible('#s-setup'));
  await p.click('#s-setup [aria-label="Zurück"]');
  check('dann zur Startseite', await p.isVisible('#s-home'));

  // Zweites freies Spiel: feste Rundenzahl, eigene Zählschritte, ohne Vorlage
  await p.click('#new-free');
  await p.click('.seg >> text=Runden'); await p.fill('#setup-end', '10');
  for (const n of ['1', '5']) await p.click(`.step-chips .chip >> text="${n}"`);   // abwählen
  for (const n of ['2', '20', '50']) await p.click(`.step-chips .chip >> text="${n}"`);
  check('höchstens drei Zählschritte', (await p.locator('.step-chips .chip[aria-pressed="true"]').count()) === 3);
  await p.click('.switch-row');   // diesmal als Vorlage speichern
  await p.click('#setup-next'); await p.click('#start-btn');
  check('10 Runden angelegt', (await p.locator('tbody tr').count()) === 10);
  check('Untertitel „Runde 1 von 10“', (await raw('.top .sub')) === 'Runde 1 von 10');
  await p.click('.dock .primary'); await p.waitForTimeout(500);
  check('eigene Schnelltasten', (await text('.pp-panel .quick')) === '−20 −10 −2 +2 +10 +20');
  await p.click('.pp-panel .quick >> text="+20"'); await p.click('.pp-panel .quick >> text="+2"');
  check('Schnelltasten rechnen', (await text('section[aria-label="Anna"] .pp-entry .val')) === '22');
  // Notizfeld während der Partie anlegen und füllen, zählt nicht zur Summe
  await p.click('#s-game [aria-label="Menü"]'); await p.click('#open-notes'); await p.fill('#game-note', 'Bonus'); await p.press('#game-note', 'Enter'); await p.waitForTimeout(200);
  await p.mouse.click(30, 40); await p.waitForTimeout(200);
  await p.click('section[aria-label="Anna"] .pp-note[data-note="Bonus"]'); await p.click('.pp-keys .key >> text="3"'); await p.waitForTimeout(200);
  check('Notizfeld gefüllt, Summe bleibt', (await text('section[aria-label="Anna"] .pp-note b')) === '3' && (await text('section[aria-label="Anna"] .score-pill b')) === '22');
  await shot('17b-notes');
  await p.click('.pp-keys .go'); await p.waitForTimeout(200);
  check('nach Notiz zurück zum Punktefeld', (await p.getAttribute('section[aria-label="Anna"] .pp-note', 'aria-pressed')) === 'false');
  await p.click('#s-game .text-btn'); await p.click('.bsheet .primary'); await p.waitForTimeout(300);
  check('Partie gespeichert', (await text('.toast')) === 'Partie gespeichert');
  check('zwei eigene Spiele', (await p.locator('#my-games .row[data-own]').count()) === 2);
  // Eigener Zählschritt
  await p.click('#new-free');
  await p.click('.step-chips .chip >> text="10"');
  await p.fill('#own-step', '15'); await p.press('#own-step', 'Enter');
  check('eigener Zählschritt 15 gewählt', (await p.getAttribute('.step-chips .chip >> text="15"', 'aria-pressed')) === 'true');
  check('Vorschau zeigt +15', (await text('.step-preview')).includes('+15'));
  await p.click('.tpl-back');

  // Rommé: Spielseite, Option, direkter Start, ×2
  await p.click('[data-game="romme"]');
  check('Rommé-Spielseite', await p.isVisible('#s-gamepage .rule-card'));
  await shot('08-romme');
  await p.click('.seg >> text=Bei 1000');
  check('Direktstart mit letzten Spielern', (await raw('#quick-start')) === 'Los mit 3 Spielern');
  await p.click('#quick-start');
  check('Untertitel mit Ziel 1000', (await raw('.top .sub')) === 'Runde 1, Ziel 1000');
  await p.click('.dock .primary'); await p.waitForTimeout(500);
  await p.click('.pp-panel .quick >> text="Raus"'); await p.click('.pp-keys .go'); await p.waitForTimeout(500);
  await p.click('.pp-panel .quick >> text="+20"'); await p.click('.pp-panel .quick >> text="+5"'); await p.click('.pp-panel .quick >> text="×2"');
  check('Rommé: (20 + 5) × 2 = 50', (await text('section[aria-label="Ben"] .pp-entry .val')) === '50');
  await shot('09-romme-play');
  await p.click('#s-game .text-btn'); await p.click('.bsheet .primary'); await p.waitForTimeout(300);
  check('festes Spiel erzeugt keine eigene Vorlage', (await p.locator('#my-games .row[data-own]').count()) === 2);
  await p.click('[data-game="skyjo"]'); await shot('10-skyjo'); await p.click('.tpl-back');

  // Wizard: Ansagen, zurück zum Überblick, Stiche
  await p.click('[data-game="wizard"]'); await shot('11-wizard'); await p.click('#quick-start');
  check('Wizard: 20 Runden bei 3 Spielern', (await p.locator('tbody tr').count()) === 20);
  check('Wizard: Knopf „Ansagen Runde 1“', (await raw('#round-go')).startsWith('Ansagen Runde 1'));
  await p.click('#round-go'); await p.waitForTimeout(500);
  check('Wizard: Ben sagt zuerst an', (await page()) === 1);
  for (const v of ['1', '0', '0']) { await p.click(`.pp-panel .quick >> text="${v}"`); await p.waitForTimeout(500); }
  check('Wizard: nach Ansagen im Überblick', (await page()) === -1 && (await raw('#round-go')).startsWith('Stiche Runde 1'));
  await shot('12-wizard-bids');
  await p.click('#round-go'); await p.waitForTimeout(500);
  await shot('13-wizard-page');
  for (const v of ['1', '0', '0']) { await p.click(`.pp-panel .quick >> text="${v}"`); await p.waitForTimeout(500); }
  check('Wizard: Punkte 20, 30, 20', (await text('tbody tr:nth-child(1)')).replace(/ /g, '') === '1+200/0+301/1+200/0', await text('tbody tr:nth-child(1)'));
  check('Wizard: weiter mit Ansagen Runde 2', (await raw('#round-go')).startsWith('Ansagen Runde 2'));
  await shot('14-wizard-ov');
  await p.click('#s-game .text-btn'); await p.click('.bsheet .primary'); await p.waitForTimeout(300);

  // Nur Ergebnis: Monopoly mit Platzierung
  for (const k of ['uno', 'scrabble', 'siedler', 'ergebnis']) { await p.click(`[data-game="${k}"]`); check(`Spielseite ${k}`, await p.isVisible('#s-gamepage .rule-card')); await shot('20-' + k); await p.click('.tpl-back'); }
  await p.click('[data-game="monopoly"]'); await shot('20-monopoly'); await p.click('#quick-start');
  check('Monopoly: Knopf „Ergebnis eintragen“', (await raw('#round-go')).startsWith('Ergebnis eintragen'));
  check('Monopoly: Untertitel „Endstand“', (await raw('.top .sub')) === 'Endstand');
  await p.click('#round-go'); await p.waitForTimeout(500);
  check('Monopoly: Feld heißt „Platz“, kein Verlauf', (await text('section[aria-label="Anna"] .pp-entry .lbl')) === 'Platz' && !(await p.isVisible('section[aria-label="Anna"] .pp-hist')));
  await shot('21-monopoly-page');
  for (const v of ['2.', '1.', '3.']) { await p.click(`.pp-panel .quick >> text="${v}"`); await p.click('.pp-keys .go'); await p.waitForTimeout(500); }
  check('Monopoly: Ben führt, Ergebnis-Knopf', (await p.getAttribute('tfoot td.lead', 'style') || '').includes('#86cbb8') && (await raw('.dock .primary')) === 'Ergebnis');
  await shot('22-monopoly-ov');
  await p.click('.dock .primary');
  check('Monopoly: Ben gewinnt', (await text('.bsheet h3')) === 'Ben gewinnt');
  check('Siegerseite: Treppchen und Kennzahlen', (await p.locator('.v-podium .v-step').count()) === 3 && (await raw('.v-hero')).includes('GEWONNEN'));
  await shot('22b-victory');
  await p.click('.bsheet .primary'); await p.waitForTimeout(300);

  // Kniffel: Kategorien, Bonuszeilen, Kategorien verwalten
  await p.click('[data-game="kniffel"]'); await shot('30-kniffel'); await p.click('#quick-start');
  check('Kniffel: 13 Kategorien + 2 Rechenzeilen', (await p.locator('tbody tr').count()) === 15, String(await p.locator('tbody tr').count()));
  check('Kniffel: Zug von Anna', (await raw('#round-go')).includes('Anna'));
  await p.click('#round-go'); await p.waitForTimeout(500);
  await shot('31-kniffel-page');
  check('Kniffel: Einser bietet 1 bis 5 statt Zahlenfeld', (await p.locator('.cp-grid button').count()) === 5 && !(await p.isVisible('.pp-keys')));
  await p.click('.cp-grid >> text="3"'); await p.waitForTimeout(500);
  check('Kniffel: nach Annas Zug ist Ben dran', (await page()) === 1);
  await p.click('.pp-cat >> text=Dreierpasch'); await p.waitForTimeout(200);
  check('Kniffel: Dreierpasch bietet 5 bis 30', (await p.locator('.cp-grid button').count()) === 26);
  await shot('31b-kniffel-pasch');
  await p.click('#cat-strike'); await p.waitForTimeout(500);
  await p.click('.pp-tab[aria-label="Überblick"]'); await p.waitForTimeout(400);
  check('Kniffel: gestrichenes Feld markiert', (await p.locator('td.struck').count()) === 1);
  await p.click('td[aria-label="Clara, Kniffel"]'); await p.waitForTimeout(400);
  check('Kniffel: Feld im Überblick öffnet Auswahl', (await p.locator('.cp-grid button').count()) === 1);
  await p.click('.cp-grid button'); await p.waitForTimeout(500);
  check('Kniffel: danach zurück im Überblick', (await page()) === -1 && (await text('td[aria-label="Clara, Kniffel"]')) === '50');
  await p.click('td[aria-label="Clara, Chance"]'); await p.waitForTimeout(400);
  check('Kniffel: Chance mit Zahlenfeld', await p.isVisible('.pp-keys'));
  await p.click('.pp-tab[aria-label="Überblick"]'); await p.waitForTimeout(300);
  await shot('31c-kniffel-ov');
  await p.goto(URL); await p.waitForTimeout(600);
  await p.click('.resume'); await p.waitForTimeout(300);
  await p.click('#s-game [aria-label="Menü"]'); await p.click('#open-cats');
  await p.fill('#cat-name', 'Doppel-Kniffel'); await p.fill('#cat-fixed', '100'); await p.click('.cat-add .primary'); await p.waitForTimeout(300);
  check('Kniffel: Kategorie hinzugefügt', (await p.locator('.cat-row').count()) === 14);
  await shot('32-kniffel-cats');
  await p.click('[aria-label="Chance entfernen"]'); await p.waitForTimeout(300);
  check('Kniffel: Kategorie entfernt', (await p.locator('.cat-row').count()) === 13);
  await p.mouse.click(30, 40); await p.waitForTimeout(300);
  check('Kniffel: Doppel-Kniffel im Zettel', (await text('tbody')).includes('Doppel-Kniffel') && !(await text('tbody')).includes('Chance'));
  await shot('33-kniffel-ov');
  await p.click('#s-game [aria-label="Menü"]'); await p.click('.menu-list .warn'); await p.click('.confirm-row .yes'); await p.waitForTimeout(300);

  // Phase 10: Haken auf der Spielerseite
  await p.click('[data-game="phase10"]'); await shot('34-phase10'); await p.click('#quick-start');
  await p.click('#round-go'); await p.waitForTimeout(500);
  await p.click('#phase-toggle'); await p.waitForTimeout(200);
  check('Phase 10: Haken gesetzt', (await p.getAttribute('section[aria-label="Anna"] #phase-toggle', 'aria-pressed')) === 'true');
  await shot('35-phase10-page');
  // Mehrere Partien gleichzeitig: Phase 10 parken, Skyjo starten, zurück zu Phase 10
  await p.click('#s-game [aria-label="Zum Start"]'); await p.click('[data-game="skyjo"]'); await p.click('#quick-start'); await p.waitForTimeout(300);
  check('zweite Partie startet ohne Nachfrage', (await raw('.top h2, .top b')).includes('Skyjo') || (await raw('#s-game')).includes('Skyjo'));
  await p.click('.dock .primary'); await p.click('.pp-panel .quick >> text="+5"'); await p.click('.pp-keys .go'); await p.waitForTimeout(200);
  await p.click('#s-game [aria-label="Zum Start"]'); await p.waitForTimeout(200);
  check('zwei laufende Partien auf der Startseite', (await p.locator('.resume').count()) === 2 && (await raw('#s-home')).includes('Laufende Partien'));
  await shot('35b-two-running');
  await p.reload(); await p.waitForSelector('.wordmark');
  check('nach Neuladen beide noch da', (await p.locator('.resume').count()) === 2);
  await p.click('.resume >> text=Phase 10'); await p.waitForTimeout(300);
  check('Phase 10 fortgesetzt mit Haken', (await raw('#s-game')).includes('Phase 10') && (await p.getAttribute('section[aria-label="Anna"] #phase-toggle', 'aria-pressed').catch(() => null)) !== null);
  await p.click('#s-game [aria-label="Menü"]'); await p.click('.menu-list .warn'); await p.click('.confirm-row .yes'); await p.waitForTimeout(300);
  check('verwerfen betrifft nur die geöffnete Partie', (await p.locator('.resume').count()) === 1 && (await text('.resume')).includes('Skyjo'));
  await p.click('.resume'); await p.click('#s-game [aria-label="Menü"]'); await p.click('.menu-list .warn'); await p.click('.confirm-row .yes'); await p.waitForTimeout(300);

  // Binokel: erst Meldungen, dann Stiche
  await p.click('[data-game="binokel"]'); await p.click('#quick-start');
  check('Binokel: Knopf „Meldungen Runde 1“', (await raw('#round-go')).startsWith('Meldungen Runde 1'));
  await p.click('#round-go'); await p.waitForTimeout(400);
  check('Binokel: Feld Meldung aktiv', (await p.getAttribute('section[aria-label="Anna"] .wz-f[data-field="meld"]', 'aria-pressed')) === 'true');
  await p.click('.pp-panel .quick >> text="+40"'); await shot('44-binokel-meld');
  await p.click('.pp-keys .go'); await p.waitForTimeout(300);
  await p.click('.pp-panel .quick >> text="+20"'); await p.click('.pp-keys .go'); await p.waitForTimeout(300);
  await p.click('.pp-keys .go'); await p.waitForTimeout(400);
  check('Binokel: weiter mit „Stiche Runde 1“', (await raw('#round-go')).startsWith('Stiche Runde 1'));
  await p.click('#round-go'); await p.waitForTimeout(400);
  for (const k of ['+50', '+20', '+10']) { await p.click(`.pp-panel .quick >> text="${k}"`); await p.click('.pp-keys .go'); await p.waitForTimeout(300); }
  check('Binokel: Runde 90, 40, 10', (await text('tbody tr:nth-child(1)')).replace(/\s/g, '') === '190\n40+5040\n20+2010\n0+10'.replace(/\s/g, ''), await text('tbody tr:nth-child(1)'));
  await shot('45-binokel-ov');
  await p.click('#s-game [aria-label="Menü"]'); await p.click('.menu-list .warn'); await p.click('.confirm-row .yes'); await p.waitForTimeout(300);

  // Teams aus einzelnen Spielern
  await p.click('[data-game="uno"]'); await p.click('#s-gamepage .dock .secondary');
  await p.fill('#add-name', 'Dora'); await p.press('#add-name', 'Enter');
  await p.click('#team-mode'); await p.waitForTimeout(100);
  check('Teams: zwei Teams vorgeschlagen', (await raw('#start-btn')) === 'Los mit 2 Teams' && (await p.locator('.team-chip').count()) === 4);
  await shot('36a-teams');
  await p.click('#start-btn'); await p.waitForTimeout(300);
  check('Teams: Zettel mit Teamspalten', (await raw('.grid thead')).includes('&'));
  await shot('36b-team-game');
  await p.click('#s-game [aria-label="Menü"]'); await p.click('.menu-list .warn'); await p.click('.confirm-row .yes'); await p.waitForTimeout(300);

  // Arschloch: Rollen pro Runde
  await p.click('[data-game="arschloch"]'); await shot('36c-arschloch'); await p.click('#quick-start'); await p.waitForTimeout(300);
  check('Arschloch: Knopf „Runde 1 verteilen“', (await raw('#round-go')).startsWith('Runde 1 verteilen'));
  await p.click('#round-go'); await p.waitForTimeout(200);
  const order = await p.locator('.rank-row .nm').allTextContents();
  await p.click(`.rank-row >> text=${order[1]}`); await p.click(`.rank-row >> text=${order[0]}`);
  await shot('36d-arschloch-sheet');
  for (const nm of order.slice(2, -1)) await p.click(`.rank-row >> text=${nm}`);
  await p.waitForTimeout(300);
  check('Arschloch: Runde verteilt, Letzter automatisch', !(await p.isVisible('.rank-list')) && (await p.locator('td.cell.rank.r-a').count()) === 1 && (await p.locator('td.cell.rank.r-p').count()) === 1);
  await p.click('#round-go'); for (const nm of order) { if (await p.isVisible('.rank-list')) await p.click(`.rank-row >> text=${nm}`); } await p.waitForTimeout(300);
  await shot('36e-arschloch-ov');
  await p.click('#s-game .text-btn'); await p.waitForTimeout(400);
  check('Arschloch: Siegerseite mit Rollen-Statistik', (await raw('.v-stats')).includes('Präsident'));
  await shot('36f-arschloch-victory');
  await p.click('.victory .pad-actions .secondary');
  await p.click('#s-game [aria-label="Menü"]'); await p.click('.menu-list .warn'); await p.click('.confirm-row .yes'); await p.waitForTimeout(300);

  for (const k of ['schafkopf', 'doppelkopf', 'binokel']) { await p.click(`[data-game="${k}"]`); check(`Spielseite ${k}`, await p.isVisible('#s-gamepage .rule-card')); await shot('36-' + k); await p.click('.tpl-back'); }

  // Serien: Statistikseite
  await p.click('#tab-history'); await p.click('#hist-series'); await p.waitForTimeout(200);
  check('Serie in der Liste', (await p.locator('.series-row').count()) === 1 && (await text('.series-row .t b')) === 'Südamerika 2026');
  await shot('40-series-list');
  await p.click('.series-row'); await p.waitForTimeout(200);
  const nSer = Number((await text('.ser-hero small')).split(' ')[0]);
  check('Serie: Partien von späteren Abschlüssen vorbelegt', nSer >= 2, await text('.ser-hero small'));
  check('Serie: Tabelle mit drei Spielern', (await p.locator('.ser-table .prow').count()) === 3);
  check('Serie: Leistung ist Standard', (await p.getAttribute('#sort-perf', 'aria-pressed')) === 'true' && (await text('.ser-table .prow .pts >> nth=0')).endsWith('×'));
  await shot('41-series');
  await p.evaluate(() => { document.documentElement.dataset.theme = 'light'; }); await shot('41-series-light'); await p.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await p.click('#sort-avg'); await p.waitForTimeout(100);
  check('Serie: Schnitt umschaltbar, keine Quote mehr', (await p.getAttribute('#sort-avg', 'aria-pressed')) === 'true' && !(await p.isVisible('#sort-rate')));
  await p.click('#sort-points');
  const before = await text('.ser-table .prow .pts >> nth=0');
  await p.click('[aria-label="Platz 1 mehr"]'); await p.click('[aria-label="Platz 1 mehr"]'); await p.waitForTimeout(100);
  check('Serie: Platzpunkte anpassbar', (await text('#pt-1')) === '5' && (await text('.ser-table .prow .pts >> nth=0')) !== before);
  check('Serie: Vorschlag wieder herstellbar', await p.isVisible('.pt-reset'));
  await p.evaluate(() => document.querySelector('#s-series .scroll').scrollTo(0, 9999)); await shot('42-series-points');
  await p.click('.pt-reset');
  await p.click('[aria-label="Zurück"]'); await p.waitForTimeout(100);
  check('zurück in der Serienliste', await p.isVisible('.series-row'));
  await p.click('#hist-games'); await p.click('.hist-row >> nth=0'); await p.waitForTimeout(200);
  check('Detail zeigt die Serie', (await text('.bsheet .ser-chips .fchip[aria-pressed="true"]')) === 'Südamerika 2026');
  await p.click('.bsheet .ser-chips .fchip >> nth=0'); await p.waitForTimeout(100);
  check('Partie aus der Serie gelöst', (await text('.bsheet .ser-chips .fchip[aria-pressed="true"]')) === 'Keine');
  await p.mouse.click(30, 40);
  // Direktvergleich mit mehreren Partien, Revanche
  await p.click('#tab-people'); await p.click('.person-row >> text=Anna'); await p.click('.vs-p >> text=Ben'); await p.waitForTimeout(200);
  await p.evaluate(() => document.querySelector('.duel').scrollIntoView()); await shot('46-duel');
  await p.evaluate(() => { document.documentElement.dataset.theme = 'light'; }); await shot('46-duel-light'); await p.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  check('Duell: Leistung als erste Zeile', (await raw('.duel-row .eyebrow >> nth=0')) === 'Leistung');
  check('Duell: mehrere Spiele als eigene Zeilen', (await p.locator('.duel-row').count()) >= 4, String(await p.locator('.duel-row').count()));
  await p.click('#duel-rate'); await p.waitForTimeout(100);
  check('Duell: Quote in Prozent', (await raw('.duel-row .eyebrow >> nth=1')) === 'Siegquote' && (await text('.duel-row >> nth=1')).includes('%'));
  await p.evaluate(() => document.querySelector('.duel').scrollIntoView()); await shot('47-duel-rate');
  await p.click('.rematch >> nth=0'); await p.waitForTimeout(200);
  check('Revanche öffnet die Spielerauswahl mit denselben Spielern', await p.isVisible('#start-btn') && (await raw('#start-btn')).includes('3'));
  await p.click('#tab-home').catch(() => undefined); await p.goto(URL); await p.waitForSelector('.wordmark');

  // Eigenes Spiel bearbeiten und löschen
  await p.click('#my-games .row[data-own] >> nth=1'); await p.click('#tpl-edit'); await shot('43-own-game');
  await p.fill('#setup-name', 'Umbenannt'); await p.click('.look-c >> nth=3'); await p.click('#s-setup .chip >> text=Wellen');
  await p.click('#setup-save'); await p.waitForTimeout(200);
  check('eigenes Spiel umbenannt, zurück auf seiner Seite', (await text('.toast')) === 'Gespeichert' && await p.isVisible('#tpl-edit'));
  await shot('43b-own-game-saved');
  await p.click('#tpl-delete'); await p.click('#tpl-delete-yes'); await p.waitForTimeout(200);
  check('eigenes Spiel gelöscht', (await p.locator('#my-games .row[data-own]').count()) === 1 && !(await text('#my-games')).includes('Umbenannt'));
  // Spielsuche
  await p.fill('#game-search', 'romm'); await p.waitForTimeout(100);
  check('Suche findet Rommé', (await p.locator('#search-results .row.tpl').count()) === 1 && (await text('#search-results')).includes('Rommé'));
  await p.fill('#game-search', 'xyz');
  check('Suche ohne Treffer', (await text('#search-results')).includes('Keine Treffer'));
  await p.fill('#game-search', 'freies spiel vom');
  check('Suche findet eigene Spiele', (await p.locator('#search-results .row[data-own]').count()) === 1);
  await shot('45b-search');
  await p.fill('#game-search', '');
  // Festes Spiel als eigenes Spiel anpassen
  await p.click('[data-game="skyjo"]'); await p.click('#customize'); await p.waitForTimeout(200);
  check('Anpassen öffnet die Bearbeitung der Kopie', (await p.inputValue('#setup-name')) === 'Skyjo eigen' && (await text('.toast')) === 'Als eigenes Spiel gespeichert');
  await p.fill('#setup-name', 'Skyjo Hausregel'); await p.click('#setup-save'); await p.waitForTimeout(200);
  check('Kopie behält Bild und Regeln des Originals', (await text('#s-setup .rule-points')).includes('Kartenwerte'));
  await shot('45c-copy');
  await p.click('#s-setup [aria-label="Zurück"]');
  check('Kopie unter Meine Spiele, Original unverändert', (await raw('#my-games')).includes('Skyjo Hausregel') && (await raw('[data-game="skyjo"]')).includes('Skyjo'));
  await p.click('.row[data-own] >> text=Skyjo Hausregel'); await p.click('#tpl-delete'); await p.click('#tpl-delete-yes'); await p.waitForTimeout(200);

  // Eigene Endwertung erstellen
  await p.click('#new-result'); await p.fill('#setup-name', 'Azul'); await p.click('#unit-place');
  check('Endwertung: ohne Spielende und Zählschritte, Gewinner nicht wählbar', !(await p.isVisible('#setup-end')) && !(await p.isVisible('.step-chips')) && !(await raw('#s-setup')).includes('Wer gewinnt'));
  await p.fill('#note-name', 'Reihen'); await p.press('#note-name', 'Enter'); await shot('44b-own-result-edit');
  await p.click('#setup-save'); await p.waitForTimeout(200);
  check('Endwertung gespeichert mit Regeln', (await text('#s-setup .rule-points')).includes('Platz je Spieler') && (await text('#s-setup .rule-points')).includes('Reihen'));
  await shot('44c-own-result');
  await p.click('#s-setup [aria-label="Zurück"]');
  check('Endwertung steht in der Gruppe Endwertung', (await p.locator('#my-games .row[data-own]').count()) === 1 && (await raw('#s-home')).includes('Azul'));
  await p.click('.row[data-own] >> text=Azul'); await p.click('#quick-start');
  check('Partie zeigt Endstand', (await raw('.top .sub')) === 'Endstand');
  await p.click('#s-game [aria-label="Menü"]'); await p.click('.menu-list .warn'); await p.click('.confirm-row .yes'); await p.waitForTimeout(300);

  // Partie im Verlauf löschen
  await p.goto(URL); await p.waitForSelector('.wordmark'); await p.click('#tab-history');
  const nHist = await p.locator('.hist-row').count();
  await p.click('.hist-row >> nth=0'); await p.click('#hist-delete'); await p.click('#hist-delete-yes'); await p.waitForTimeout(300);
  check('Partie aus dem Verlauf gelöscht', (await p.locator('.hist-row').count()) === nHist - 1);
  await p.reload(); await p.waitForSelector('.wordmark'); await p.click('#tab-history');
  check('bleibt nach Neuladen gelöscht', (await p.locator('.hist-row').count()) === nHist - 1);
  await p.click('#tab-home');

  // Sicherung speichern und wieder einlesen
  await p.click('#tab-people');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#backup-save')]);
  check('Sicherung als Datei', dl.suggestedFilename().startsWith('punktezettel-') && (await text('#backup-save small')).startsWith('Zuletzt am'));
  await p.setInputFiles('#backup-file', await dl.path()); await p.waitForTimeout(500);
  check('Sicherung einlesen ohne Doppelte', (await text('.toast')) === 'Nichts Neues in der Sicherung', await text('.toast'));
  await p.setInputFiles('#backup-file', { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"a":1}') }); await p.waitForTimeout(400);
  check('falsche Datei wird abgelehnt', (await text('.toast')) === 'Diese Datei ist keine Sicherung');
  await shot('48-people-backup');
  await p.click('.person-row >> text=Clara'); await p.fill('#pf-name', 'Clara M'); await p.press('#pf-name', 'Enter'); await p.waitForTimeout(200);
  await p.click('[aria-label="Zurück"]');
  check('Spieler umbenannt', (await text('#s-people')).includes('Clara M'));
  // Spieler löschen: weg aus der Liste, Name bleibt im Verlauf
  const nPeople = await p.locator('.person-row').count();
  await p.click('.person-row >> text=Clara M'); await p.click('#player-delete'); await p.click('#player-delete-yes'); await p.waitForTimeout(300);
  check('Spieler gelöscht', (await p.locator('.person-row').count()) === nPeople - 1 && !(await text('#s-people')).includes('Clara M'));
  await p.click('#tab-history'); await p.click('.hist-row >> nth=0'); await p.waitForTimeout(200);
  check('Name bleibt im Verlauf', (await text('.bsheet .podium')).includes('Clara M'));
  await p.mouse.click(30, 40); await p.click('#tab-people');
  await p.click('#tab-home');

  await p.click('#my-games .row[data-own] >> nth=0'); await p.click('#quick-start');

  // Feedback
  await p.click('#s-game [aria-label="Zurück"]').catch(() => undefined); await p.goto(URL); await p.waitForSelector('.wordmark');
  await p.click('#feedback'); await p.fill('#feedback-text', 'Testnachricht'); await shot('49-feedback'); await p.click('#feedback-send'); await p.waitForTimeout(300);
  check('Feedback: Text kopiert, wenn Teilen fehlt', (await text('.toast')) === 'Text kopiert');
  check('Feedback enthält Version', (await p.evaluate(() => navigator.clipboard.readText())).includes('Punktezettel '));

  // Offline
  await c.setOffline(true); await p.reload(); await p.waitForTimeout(800);
  check('lädt offline', await p.isVisible('.wordmark'));
  await c.setOffline(false);

  check('keine Fehler in der Konsole', errors.length === 0, errors.join(' | '));
  await b.close();
  console.log(failed ? `\n${failed} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
