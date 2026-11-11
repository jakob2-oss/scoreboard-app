// Klicktest für Paket 1. Voraussetzung: `npm run build && npx vite preview --port 4173`
// Start: node e2e/core.e2e.cjs  (nutzt das vorinstallierte Playwright)
const { chromium, devices } = require('playwright');
const URL = process.env.APP_URL || 'http://localhost:4173/scoreboard-app/';
const SHOTS = process.env.SHOTS || null;
let failed = 0;
const check = (name, ok, detail = '') => { console.log((ok ? '✓ ' : '✗ ') + name + (ok ? '' : '  → ' + detail)); if (!ok) failed++; };

(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ ...devices['iPhone 13'] });
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
  check('neun Einträge (acht Spiele und Freies Spiel), noch keine eigenen Spiele', (await p.locator('.row.tpl').count()) === 9 && !(await p.isVisible('#my-games')));
  await shot('01-home');

  // Freies Spiel einrichten
  await p.click('#new-free');
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

  // Wischen & Seitenpunkte
  await p.click('.pp-tab[aria-label="Ben"]'); await p.waitForTimeout(600);
  check('Punkt springt zu Ben', (await page()) === 1);
  check('Ben: neue Runde 2', (await text('section[aria-label="Ben"] .pp-entry .lbl')) === 'Runde 2');
  await p.click('section[aria-label="Ben"] .pp-hist button >> nth=0');
  check('Verlauf R1 antippen → Runde 1', (await text('section[aria-label="Ben"] .pp-entry .lbl')) === 'Runde 1');
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
  check('„Wenig gewinnt“: Ben führt', (await p.getAttribute('tfoot td.lead', 'style') || '').includes('#3fb39b'));
  await p.click('[aria-label="Menü"]'); await p.click('.menu-list >> text=Design');
  check('Design wechselt', (await p.evaluate(() => document.documentElement.dataset.theme)) === 'dark');
  await shot('06-menu-dark');
  await p.click('.menu-list >> text=Beenden und speichern');
  check('Ergebnis zeigt Ben vorn', (await text('.bsheet h3')) === 'Ben gewinnt');
  await shot('07-result-dark');
  await p.click('.scrim', { position: { x: 30, y: 40 } });
  await p.click('#s-game .text-btn');
  check('„Beenden“ oben öffnet das Ergebnis', (await raw('.bsheet .primary')) === 'Speichern');
  await p.click('.bsheet .primary'); await p.waitForTimeout(300);
  check('Meldung nach dem Speichern', (await text('.toast')) === 'Partie gespeichert');
  check('nach Beenden auf der Startseite', await p.isVisible('#s-home'));
  check('keine laufende Partie mehr', !(await p.isVisible('.resume')));
  await p.reload(); await p.waitForSelector('.wordmark');
  check('auch nach Neuladen beendet', !(await p.isVisible('.resume')));
  check('Design bleibt nach Neuladen dunkel', (await p.evaluate(() => document.documentElement.dataset.theme)) === 'dark');

  // Gespeicherte Vorlage erneut spielen
  check('„Testspiel“ unter Meine Spiele', (await text('#my-games')).includes('Testspiel'));
  await p.click('#my-games .row >> text=Testspiel');
  check('letzte Spieler vorausgewählt', (await raw('#start-btn')) === 'Los mit 3 Spielern');
  await p.click('[aria-label="Zurück"]');
  check('Zurück führt zur Startseite (Vorlage schon gespeichert)', await p.isVisible('#s-home'));

  // Zweites freies Spiel: feste Rundenzahl, eigene Zählschritte, ohne Vorlage
  await p.click('#new-free');
  await p.click('.seg >> text=Runden'); await p.fill('#setup-end', '10');
  for (const n of ['1', '5']) await p.click(`.step-chips .chip >> text="${n}"`);   // abwählen
  for (const n of ['2', '20', '50']) await p.click(`.step-chips .chip >> text="${n}"`);
  check('höchstens drei Zählschritte', (await p.locator('.step-chips .chip[aria-pressed="true"]').count()) === 3);
  await p.click('.switch-row');
  await p.click('#setup-next'); await p.click('#start-btn');
  check('10 Runden angelegt', (await p.locator('tbody tr').count()) === 10);
  check('Untertitel „Runde 1 von 10“', (await raw('.top .sub')) === 'Runde 1 von 10');
  await p.click('.dock .primary'); await p.waitForTimeout(500);
  check('eigene Schnelltasten', (await text('.pp-panel .quick')) === '−20 −10 −2 +2 +10 +20');
  await p.click('.pp-panel .quick >> text="+20"'); await p.click('.pp-panel .quick >> text="+2"');
  check('Schnelltasten rechnen', (await text('section[aria-label="Anna"] .pp-entry .val')) === '22');
  await p.click('#s-game .text-btn'); await p.click('.bsheet .primary'); await p.waitForTimeout(300);
  check('Vorlage beim Beenden automatisch gespeichert', (await text('.toast')) === 'Partie und Vorlage gespeichert');
  check('zwei eigene Spiele', (await p.locator('#my-games .row').count()) === 2);
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
  check('festes Spiel erzeugt keine eigene Vorlage', (await p.locator('#my-games .row').count()) === 2);
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
  check('Monopoly: Ben führt, Ergebnis-Knopf', (await p.getAttribute('tfoot td.lead', 'style') || '').includes('#3fb39b') && (await raw('.dock .primary')) === 'Ergebnis');
  await shot('22-monopoly-ov');
  await p.click('.dock .primary');
  check('Monopoly: Ben gewinnt', (await text('.bsheet h3')) === 'Ben gewinnt');
  await p.click('.bsheet .primary'); await p.waitForTimeout(300);

  await p.click('#my-games .row >> nth=0'); await p.click('#start-btn');

  // Offline
  await c.setOffline(true); await p.reload(); await p.waitForTimeout(800);
  check('lädt offline', await p.isVisible('.wordmark'));
  await c.setOffline(false);

  check('keine Fehler in der Konsole', errors.length === 0, errors.join(' | '));
  await b.close();
  console.log(failed ? `\n${failed} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
