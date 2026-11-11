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
  check('vier freie Vorlagen', (await p.locator('.row.tpl').count()) === 4);
  await shot('01-home');

  await p.click('.row.tpl >> text=Freie Runden');
  check('Spielerauswahl offen', await p.isVisible('#s-players'));
  check('Start ohne Spieler gesperrt', await p.isDisabled('#start-btn'));
  for (const n of ['Anna', 'Ben', 'Clara']) { await p.fill('#add-name', n); await p.press('#add-name', 'Enter'); }
  await p.fill('#add-name', 'anna'); await p.press('#add-name', 'Enter');
  check('Doppelter Name wird nicht neu angelegt', (await p.locator('.chip').count()) === 3);
  check('Startknopf zeigt 3 Spieler', (await raw('#start-btn')) === 'Los · 3 Spieler');
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
  await p.click('.scrim');
  check('„Wenig gewinnt“: Ben führt', (await p.getAttribute('tfoot td.lead', 'style') || '').includes('#3fb39b'));
  await p.click('[aria-label="Menü"]'); await p.click('.menu-list >> text=Design');
  check('Design wechselt', (await p.evaluate(() => document.documentElement.dataset.theme)) === 'dark');
  await shot('06-menu-dark');
  await p.click('.menu-list >> text=Spiel beenden');
  check('Ergebnis zeigt Ben vorn', (await text('.bsheet h3')) === 'Ben gewinnt');
  await shot('07-result-dark');
  await p.click('.bsheet >> text=Partie beenden'); await p.waitForTimeout(300);
  check('nach Beenden auf der Startseite', await p.isVisible('#s-home'));
  check('keine laufende Partie mehr', !(await p.isVisible('.resume')));
  await p.reload(); await p.waitForSelector('.wordmark');
  check('auch nach Neuladen beendet', !(await p.isVisible('.resume')));
  check('Design bleibt nach Neuladen dunkel', (await p.evaluate(() => document.documentElement.dataset.theme)) === 'dark');

  // Feste Rundenzahl & letzte Auswahl
  await p.click('.row.tpl >> text=10 Runden');
  check('letzte Spieler vorausgewählt', (await raw('#start-btn')) === 'Los · 3 Spieler');
  await p.click('#start-btn');
  check('10 Runden angelegt', (await p.locator('tbody tr').count()) === 10);

  // Offline
  await c.setOffline(true); await p.reload(); await p.waitForTimeout(800);
  check('lädt offline', await p.isVisible('.wordmark'));
  await c.setOffline(false);

  check('keine Fehler in der Konsole', errors.length === 0, errors.join(' | '));
  await b.close();
  console.log(failed ? `\n${failed} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
