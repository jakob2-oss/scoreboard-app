/**
 * Testspiele: jedes Spiel wird mehrfach vollständig durchgespielt – über dieselben Aktionen wie in der App,
 * mit zufälligen, aber gültigen Eingaben. Danach werden Rechenregeln, Spielende, Ranglisten,
 * Speicherung und Statistik geprüft.
 */
import { describe, expect, it } from 'vitest';
import { createStore, type Prefs } from './store';
import type { Repo } from './db';
import type { Clock } from './lib/id';
import type { Player, Result, Template } from './model/types';
import {
  catChoices, endState, fieldOf, fieldsOf, hasPhases, inputOrder, isBids, isCats, isRanks, isResultOnly, isSplit, liveRounds,
  ranking, rankIn, roundFull, roundNumber, scoreOf, seated, totals, type GameState,
  isTable, isLives, lifeState, tokenState
} from './game/engine';
import { GAMES } from './game/games';
import { highlights } from './game/highlights';
import { duel, performance, seriesTable, DEFAULT_POINTS, type HistGame } from './game/stats';

function rng(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function clock(): Clock { let n = 0, t = Date.UTC(2026, 10, 1); return { uid: () => 'id' + (++n), now: () => new Date(t += 1000).toISOString() }; }
function memRepo() {
  const players: Player[] = [], templates: Template[] = [], results: Result[] = []; let saved: GameState | null = null;
  const repo: Repo = {
    saveResults: async r => { results.push(...r); }, loadHistory: async () => [], loadEvents: async () => [], loadDeletedTemplateKeys: async () => [],
    exportAll: async () => ({ app: 'punktezettel', version: 1, exportedAt: '', tables: {} }), importAll: async () => 0,
    saveEvent: async () => undefined, setGameEvent: async () => undefined, deleteGame: async () => undefined,
    loadTemplates: async () => templates, saveTemplate: async t => { const i = templates.findIndex(x => x.key === t.key); if (i >= 0) templates[i] = t; else templates.push(t); },
    loadPlayers: async () => players.filter(p => !p.deletedAt), loadDeletedPlayers: async () => [],
    savePlayer: async p => { const i = players.findIndex(x => x.id === p.id); if (i >= 0) players[i] = p; else players.push(p); },
    loadRunningGame: async () => saved, loadRunningGames: async () => (saved ? [saved] : []), saveGame: async s => { saved = s; }
  };
  return { repo, results };
}
const prefs: Prefs = { getLast: () => [], setLast: () => undefined };
const NAMES = ['Anna', 'Ben', 'Clara', 'Dora', 'Emil', 'Fritz'];

type Store = ReturnType<typeof createStore>;

/** Eine Partie mit zufälligen, spielgerechten Eingaben durchspielen; liefert den Stand kurz vor dem Beenden */
function playOut(st: Store, r: () => number, maxRounds: number): GameState {
  const a = st.actions, pickOf = <T,>(l: T[]) => l[Math.floor(r() * l.length)];
  for (let step = 0; step < 2000; step++) {
    const s = st.get(), g = s.game!;
    if (s.sheet === 'result') break;
    // Tisch-Modus: bis zum Spielende, wie am Tisch per Antippen
    if (isTable(g)) {
      if (endState(g)?.done) break;
      const players = seated(g);
      if (isLives(g)) {
        const alive = players.filter(p => lifeState(g).out[p.id] === null);
        if (r() < .06) { a.setFireMode(true); a.tableTap(pickOf(alive).id); } else a.tableTap(pickOf(alive).id);
        if (r() < .05) { a.moveSeat(0, players.length - 1); }
        if (r() < .04 && s.undo.length) a.undo();
        continue;
      }
      const ts = tokenState(g), to = pickOf(players);
      a.tableTap(to.id);
      const givers = players.filter(p => p.id !== to.id && ts.hold[p.id] > 0);
      if (r() < .04) a.tableGive('schock');
      else if (ts.middle > 0) a.tableGive(1 + Math.floor(r() * 4));
      else if (givers.length) a.tableGive(1 + Math.floor(r() * 4), pickOf(givers).id);
      else a.closeSheet();
      continue;
    }
    // Wizard im Block: Ansagen in der Leiste, Stiche auf einem Blatt
    if (s.bidBar) { const cards = liveRounds(g).findIndex(r => r.id === s.bidBar) + 1; a.bidPick(Math.floor(r() * (cards + 1))); continue; }
    if (s.sheet === 'tricks' && s.rankRef && s.rankRef !== 'new') {
      const ref = s.rankRef, cards = liveRounds(g).findIndex(x => x.id === ref) + 1, ps = seated(g), t: Record<string, number> = {};
      let left = cards; ps.forEach((p, i) => { const v = i === ps.length - 1 ? left : Math.floor(r() * (left + 1)); t[p.id] = v; left -= v; });
      a.tricksCommit(ref, t); continue;
    }
    if (s.sheet === 'winner') { a.pickWinner(pickOf(seated(g)).id); continue; }
    if (s.sheet === 'ender') { a.setEnder(r() < .2 ? null : pickOf(seated(g)).id); continue; }
    if (s.sheet === 'bidder') { a.setBidder(r() < .2 ? null : pickOf(seated(g)).id, 150 + 10 * Math.floor(r() * 10)); continue; }
    if (s.sheet === 'ranks') {
      const ref = s.rankRef!, open = seated(g).filter(p => ref === 'new' || rankIn(g, ref, p.id) === null);
      a.rankTap(pickOf(open).id); continue;
    }
    if (!s.edit) {
      const rounds = liveRounds(g), last = rounds[rounds.length - 1];
      if (!isCats(g) && rounds.length >= maxRounds && last && roundFull(g, last.id)) break;
      a.roundGo(); continue;
    }
    const e = s.edit, players = seated(g), n = players.length;
    if (isBids(g)) {
      const ref = e.ref as string, cards = roundNumber(g, ref);
      if (e.field === 'bid') { a.pick(Math.floor(r() * (cards + 1))); continue; }
      const order = inputOrder(g, ref), done = order.filter(k => fieldOf(g, ref, players[k].id, 'tricks') !== null);
      const left = cards - done.reduce((x, k) => x + (fieldOf(g, ref, players[k].id, 'tricks') ?? 0), 0);
      a.pick(done.length === n - 1 ? left : Math.floor(r() * (left + 1))); continue;
    }
    if (isCats(g)) {
      const open = liveRounds(g).filter(x => scoreOf(g, x.id, e.playerId) === null);
      const cat = pickOf(open); a.selectRef(cat.id);
      const ch = catChoices(cat.cat);
      if (ch) a.pick(r() < .15 ? 0 : pickOf(ch)); else { a.setValue(5 + Math.floor(r() * 26)); a.next(); }
      continue;
    }
    if (isSplit(g)) {
      const f = fieldsOf(g)!;
      if (e.field === f[0].key) a.setValue(pickOf([0, 20, 40, 60, 100, 150]));
      else { a.setValue(10 * Math.floor(r() * 16)); if (r() < .1) a.mul(-2); }
      a.next(); continue;
    }
    if (hasPhases(g)) { if (r() < .45) a.togglePhase(); a.setValue(r() < .3 ? 0 : 5 * Math.floor(r() * 20)); a.next(); continue; }
    if (g.game.rules.params?.zeroSum) {
      const i = players.findIndex(p => p.id === e.playerId);
      if (i === n - 1) a.rest(); else a.setValue(pickOf([-30, -20, -10, 10, 20, 30]));
      a.next(); continue;
    }
    if (isResultOnly(g)) { a.setValue(g.game.rules.params?.unit === 'Platz' ? 1 + Math.floor(r() * n) : Math.floor(r() * 12)); a.next(); continue; }
    if (g.game.rules.params?.winnerOnly) { a.setValue(5 + Math.floor(r() * 150)); a.next(); continue; }
    a.setValue(g.game.rules.win === 'low' ? Math.floor(r() * 60) : Math.floor(r() * 80)); a.next();
  }
  return st.get().game!;
}

/** Prüfungen am Stand vor dem Beenden und an den gespeicherten Ergebnissen */
function check(g: GameState, results: Result[]) {
  const t = totals(g), rk = ranking(g), players = seated(g);
  // Tisch-Modus: Deckel bleiben vollständig, genau einer bleibt übrig bzw. verliert
  if (isTable(g)) {
    expect(endState(g)?.done).toBe(true);
    if (isLives(g)) expect(lifeState(g).alive).toHaveLength(1);
    else { const ts = tokenState(g); expect(ts.middle + players.reduce((x, p) => x + ts.hold[p.id], 0)).toBe(ts.total); expect(Object.values(ts.hold).every(v => v >= 0)).toBe(true); expect(rk[rk.length - 1].player.id).toBe(ts.loser); }
  }
  // Summen = Summe der Rundenwerte (plus Kniffel-Bonus)
  if (!isCats(g) && !isTable(g)) for (const p of players) expect(t[p.id]).toBe(liveRounds(g).reduce((x, r) => x + (scoreOf(g, r.id, p.id) ?? 0), 0));
  // Rangliste passt zur Gewinnregel (bei Phase 10 zählen erst die Phasen)
  if (!hasPhases(g)) for (let i = 1; i < rk.length; i++) {
    if (g.game.rules.win === 'high') expect(rk[i - 1].total).toBeGreaterThanOrEqual(rk[i].total);
    else expect(rk[i - 1].total).toBeLessThanOrEqual(rk[i].total);
  }
  // Gespeicherte Ergebnisse: je Mitglied, Punkte und Platz wie im Spiel
  const members = g.game.teams?.length ? g.game.teams.reduce((x, tm) => x + tm.members.length, 0) : players.length;
  expect(results).toHaveLength(members);
  for (const x of rk) for (const res of results.filter(rr => (g.game.teams?.find(tm => tm.id === x.player.id)?.members ?? [x.player.id]).includes(rr.playerId))) {
    expect(res.total).toBe(x.total); expect(res.place).toBe(x.place);
  }
  // Nullsumme: jede volle Runde ergibt 0
  if (g.game.rules.params?.zeroSum) for (const r of liveRounds(g).filter(r => roundFull(g, r.id))) expect(players.reduce((x, p) => x + (scoreOf(g, r.id, p.id) ?? 0), 0)).toBe(0);
  // Wizard: Stiche ergeben die Kartenzahl
  if (isBids(g)) liveRounds(g).forEach((r, i) => { if (roundFull(g, r.id)) expect(players.reduce((x, p) => x + (fieldOf(g, r.id, p.id, 'tricks') ?? 0), 0)).toBe(i + 1); });
  // Kniffel: nur erlaubte Werte
  if (isCats(g)) for (const r of liveRounds(g)) { const ch = catChoices(r.cat); for (const p of players) { const v = scoreOf(g, r.id, p.id); if (ch && v !== null) expect([0, ...ch]).toContain(v); } }
  // Arschloch: je Runde jeder Platz genau einmal
  if (isRanks(g)) for (const r of liveRounds(g).filter(r => roundFull(g, r.id))) expect(players.map(p => rankIn(g, r.id, p.id)).sort()).toEqual(players.map((_, i) => i + 1));
  // Kennzahlen der Siegerseite ohne Fehlwerte
  for (const h of highlights(g)) { expect(h.value).not.toMatch(/NaN|undefined|Infinity/); expect(h.label.length).toBeGreaterThan(0); }
}

async function series(tpl: Template, games: number, seed: number, opts: { teams?: boolean; maxRounds?: number; prefs?: Prefs } = {}) {
  const r = rng(seed), mem = memRepo(), st = createStore(mem.repo, clock(), opts.prefs ?? prefs), a = st.actions;
  await a.init();
  const hist: HistGame[] = [];
  for (let k = 0; k < games; k++) {
    a.goHome();
    if (tpl.custom) a.pickTemplate(tpl); else { a.openGame(tpl); a.toPlayers(); }
    const n = Math.max(tpl.players.min, Math.min(tpl.players.max, opts.teams ? 4 : 2 + Math.floor(r() * 4)));
    for (const name of NAMES.slice(0, n)) await a.addPlayer(name);
    for (const id of [...st.get().selected]) if (!st.get().players.slice(0, n).some(p => p.id === id)) a.toggleSelect(id);
    if (opts.teams) a.setTeamMode(true);
    a.start();
    const before = mem.results.length;
    const g = playOut(st, r, opts.maxRounds ?? 8);
    a.finishGame();
    check(g, mem.results.slice(before));
    hist.push(st.get().history[0]);
    expect(st.get().game).toBeNull();
  }
  // Statistik über alle Partien: keine Fehlwerte
  const ids = [...new Set(hist.flatMap(h => h.results.map(x => x.playerId)))];
  for (const id of ids) expect(Number.isFinite(performance(hist, id).score)).toBe(true);
  if (ids.length > 1) { const d = duel(hist, ids[0], ids[1]); expect(Number.isFinite(d.a.avgPlace)).toBe(true); expect(Number.isFinite(d.a.perf)).toBe(true); }
  for (const row of seriesTable(hist, DEFAULT_POINTS)) expect(Number.isFinite(row.perf) && Number.isFinite(row.avg)).toBe(true);
  return hist;
}

describe('Testspiele: jedes feste Spiel mehrfach durchgespielt', () => {
  for (const [i, d] of GAMES.entries()) {
    it(`${d.template.name}: 6 Partien`, async () => {
      const hist = await series(d.template, 6, 100 + i);
      expect(hist).toHaveLength(6);
      // Spiele mit festem Ende enden von selbst
      if (d.template.end.type !== 'none' && d.template.scoring !== 'bids') expect(hist.every(h => h.results.length > 0)).toBe(true);
    });
  }
});

describe('Testspiele: Varianten', () => {
  it('Wizard im Block: Ansagen in der Leiste, Stiche auf einem Blatt, 4 Partien', async () => {
    await series(GAMES.find(g => g.template.key === 'wizard')!.template, 4, 31, { prefs: { ...prefs, getMode: () => 'block' }, maxRounds: 30 });
  });
  it('Rommé in Teams: 4 Partien', async () => { await series(GAMES.find(g => g.template.key === 'romme')!.template, 4, 7, { teams: true }); });
  it('Rommé bis 500: endet von selbst', async () => {
    const r = rng(3), mem = memRepo(), st = createStore(mem.repo, clock(), prefs), a = st.actions;
    await a.init(); a.openGame(GAMES.find(g => g.template.key === 'romme')!.template); a.setTemplateEnd({ type: 'target', value: 500 }); a.toPlayers();
    for (const n of ['A', 'B', 'C']) await a.addPlayer(n);
    a.start();
    const g = playOut(st, r, 200);
    expect(endState(g)?.done).toBe(true);
    expect(Math.max(...Object.values(totals(g)))).toBeGreaterThanOrEqual(500);
  });
  it('Eigene Spiele: Punkte, zwei Werte, Rang, Nullsumme mit eigener Taste', async () => {
    const base = { version: 1, win: 'high', end: { type: 'rounds', value: 5 }, players: { min: 1, max: 8 }, custom: true } as const;
    await series({ ...base, key: 'eigen-punkte', name: 'Punkte', scoring: 'rounds', params: { steps: [1, 5, 10], keys: [{ label: 'Bonus', op: 'add', v: 25 }] } }, 4, 11);
    await series({ ...base, key: 'eigen-zwei', name: 'Zwei', scoring: 'rounds', params: { split: [{ key: 'a', label: 'A', phase: 'A' }, { key: 'b', label: 'B', phase: 'B' }] } }, 4, 12);
    await series({ ...base, key: 'eigen-rang', name: 'Rang', scoring: 'rank', players: { min: 3, max: 8 } }, 4, 13);
    await series({ ...base, key: 'eigen-null', name: 'Null', scoring: 'rounds', params: { zeroSum: true } }, 4, 14);
  });
  it('Eigene Tisch-Spiele: 5 Leben, 7 Deckel', async () => {
    const base = { version: 1, end: { type: 'none' }, players: { min: 2, max: 10 }, custom: true } as const;
    const h1 = await series({ ...base, key: 'eigen-leben', name: 'Leben', scoring: 'lives', win: 'high', params: { lives: 5 } }, 4, 21);
    expect(h1.every(h => h.results.some(r => r.extra?.left !== undefined))).toBe(true);
    const h2 = await series({ ...base, key: 'eigen-deckel', name: 'Deckel', scoring: 'tokens', win: 'low', params: { tokens: 7 } }, 4, 22);
    // Chic: zweite Phase zurück in die Mitte, eine Hälfte entscheidet
    await series({ ...base, key: 'eigen-chic', name: 'Chic', scoring: 'tokens', win: 'low', params: { tokens: 13, halves: 1, phase2: 'return' } }, 5, 23);
    await series({ ...base, key: 'eigen-chic2', name: 'Chic 2', scoring: 'tokens', win: 'low', params: { tokens: 9, halves: 2, phase2: 'return' } }, 4, 24);
    expect(h2.every(h => h.results.filter(r => r.place === Math.max(...h.results.map(x => x.place))).some(r => r.extra?.halves === 2))).toBe(true);
  });
});
