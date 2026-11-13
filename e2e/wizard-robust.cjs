const { chromium, devices } = require('playwright');
const URL = process.env.APP_URL || 'http://localhost:4173/scoreboard-app/';
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const score = (b, t) => (b === t ? 20 + 10 * t : -10 * Math.abs(b - t));
async function run(names, seed, log) {
  const r = rng(seed), b = await chromium.launch(); const c = await b.newContext({ ...devices['iPhone 13'] }); const p = await c.newPage(); p.setDefaultTimeout(6000);
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(URL); await p.waitForSelector('.wordmark');
  await p.click('[data-game="wizard"]'); await p.click('#to-players');
  for (const nm of names) { await p.fill('#add-name', nm); await p.press('#add-name', 'Enter'); }
  await p.click('#start-btn'); await p.waitForTimeout(300);
  const n = names.length, rounds = Math.floor(60 / n), totals = Object.fromEntries(names.map(x => [x, 0]));
  const problems = [];
  const order = rd => Array.from({ length: n }, (_, k) => ((rd - 1) % n + 1 + k) % n); // links vom Geber
  for (let rd = 1; rd <= rounds; rd++) {
    const cards = rd, bids = {};
    // Ansagen im Block, mit Störungen
    await p.click('#round-go'); await p.waitForTimeout(80);
    if (!(await p.isVisible('.wz-bar'))) { problems.push(`R${rd}: keine Ansage-Leiste`); break; }
    if (process.env.SHOT && rd === rounds) await p.screenshot({ path: process.env.SHOT + '-ansage20.png' });
    for (const k of order(rd)) {
      const who = (await p.textContent('.wz-who b')).replace(' sagt an', '');
      if (who !== names[k]) problems.push(`R${rd}: erwartet ${names[k]} sagt an, war ${who}`);
      const v = Math.floor(r() * (cards + 1)); bids[names[k]] = v;
      await p.click(`#bid-${v}`); await p.waitForTimeout(40);
      // Störung: zurück und neu
      if (r() < .15 && await p.isVisible('.wz-bar') && await p.isVisible('.wz-nav .wide')) {
        const label = await p.textContent('.wz-nav .wide');
        if (label.startsWith('Zurück')) { await p.click('.wz-nav .wide'); await p.waitForTimeout(40); await p.click(`#bid-${v}`); await p.waitForTimeout(40); }
      }
    }
    if (await p.isVisible('.wz-bar')) problems.push(`R${rd}: Leiste nach allen Ansagen noch offen`);
    // Störung: neu laden mitten in der Runde
    if (r() < .2) { await p.reload(); await p.waitForSelector('.wordmark'); await p.click('.resume'); await p.waitForTimeout(250); }
    const go = await p.textContent('#round-go');
    if (!go.startsWith(`Stiche Runde ${rd}`)) problems.push(`R${rd}: Knopf „${go}“ statt Stiche`);
    // Stiche verteilen
    let left = cards; const tricks = {};
    const ord = order(rd);
    ord.forEach((k, i) => { const v = i === ord.length - 1 ? left : Math.floor(r() * (left + 1)); tricks[names[k]] = v; left -= v; });
    // Störung: Manuell und zurück
    if (r() < .15) {
      await p.click('#mode-switch'); await p.waitForTimeout(250);
      if (!(await p.isVisible('.pp-keys'))) problems.push(`R${rd}: Manuell öffnet keine Spielerseite`);
      await p.click('.pp-tab >> nth=0'); await p.waitForTimeout(200); await p.click('#mode-switch'); await p.waitForTimeout(250);
    } else { await p.click('#round-go'); await p.waitForTimeout(120); }
    if (!(await p.isVisible('.wz-tricks'))) { problems.push(`R${rd}: kein Stiche-Blatt`); break; }
    // Störung: Blatt schließen und wieder öffnen
    if (r() < .15) { await p.click('.scrim', { position: { x: 20, y: 20 } }); await p.waitForTimeout(150); await p.click('#round-go'); await p.waitForTimeout(150); }
    const rows = await p.locator('.wz-row .wz-nm b').allTextContents();
    for (let i = 0; i < rows.length; i++) await p.click(`.wz-row >> nth=${i} >> button >> text="${tricks[rows[i]]}"`);
    if (process.env.SHOT && rd === rounds) await p.screenshot({ path: process.env.SHOT + '-stiche20.png' });
    if (await p.isDisabled('#tricks-go')) { problems.push(`R${rd}: Eintragen gesperrt`); break; }
    await p.click('#tricks-go'); await p.waitForTimeout(120);
    for (const nm of names) totals[nm] += score(bids[nm], tricks[nm]);
    // Summen in der App prüfen
    const shown = (await p.locator('tfoot .tot').allTextContents()).map(x => Number(x.replace('−', '-').replace(/\./g, '')));
    const want = names.map(nm => totals[nm]);
    if (JSON.stringify(shown) !== JSON.stringify(want)) problems.push(`R${rd}: Summen ${shown} statt ${want}`);
  }
  // Ende: Ergebnis-Knopf und Siegerseite
  const end = await p.textContent('.dock .primary');
  if (end !== 'Ergebnis') problems.push(`Ende: Knopf „${end}“`);
  await p.click('.dock .primary'); await p.waitForTimeout(400);
  const title = await p.textContent('.v-title');
  await p.click('.victory .pad-actions .primary'); await p.waitForTimeout(300);
  await b.close();
  log(`${names.length} Spieler, ${rounds} Runden, Seed ${seed}: ${problems.length ? 'PROBLEME ' + problems.join(' | ') : 'alles stimmt'}; Summen ${JSON.stringify(totals)}; „${title}“; Konsolenfehler ${errs.length}${errs.length ? ' ' + errs.slice(0, 3).join(' | ') : ''}`);
  return problems.length + errs.length;
}
(async () => {
  let bad = 0;
  for (const [names, seed] of (process.env.SHOT ? [[['Anna', 'Ben', 'Clara'], 5]] : [[['Anna', 'Ben', 'Clara'], 1], [['Anna', 'Ben', 'Clara', 'Dora'], 2], [['A1', 'B2', 'C3', 'D4', 'E5', 'F6'], 3], [['Anna', 'Ben', 'Clara'], 4]])) bad += await run(names, seed, console.log);
  console.log(bad ? `\n${bad} Auffälligkeiten` : '\nAlle Durchläufe robust');
})();
