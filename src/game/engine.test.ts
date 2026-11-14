import { describe, expect, it } from 'vitest';
import type { Player, Template } from '../model/types';
import type { Clock } from '../lib/id';
import { TPL } from '../test/fixtures';
import {
  anyScore, canAddRound, createGame, currentRoundIndex, defaultRef, endState, finish, liveRounds, nextStep,
  ranking, restore, roundFull, scoreOf, seated, setScore, setWin, totals, type GameState,
  addCategory, removeCategory, setPhase, phasesDone, upperSum, catTurn,
  loseLife, fire, lifeState, giveTokens, schockOut, tokenState, returnTokens, dealerOf, sendOut, chicLoss
} from './engine';
import { gameDef } from './games';

// Deterministische Uhr und IDs für die Tests
function testClock(): Clock {
  let n = 0; let t = Date.UTC(2026, 0, 1);
  return { uid: () => 'id' + (++n), now: () => new Date(t += 1000).toISOString() };
}
const tpl = (key: string): Template => TPL[key];
function players(...names: string[]): Player[] {
  return names.map((name, i) => ({ id: 'p' + i, name, color: '#000', createdAt: '', updatedAt: '' }));
}
/** Hilfsfunktion: Werte einer Runde eintragen */
function play(s: GameState, ref: string, values: number[], c: Clock): { s: GameState; id: string } {
  let id = ref;
  seated(s).forEach((p, i) => { const r = setScore(s, id, p.id, values[i], c); s = r.state; id = r.roundId!; });
  return { s, id };
}

describe('Partie anlegen', () => {
  it('legt bei offenem Ende eine Runde und Sitzplätze in Reihenfolge an', () => {
    const c = testClock();
    const s = createGame(tpl('free'), players('Anna', 'Ben', 'Clara'), c);
    expect(liveRounds(s)).toHaveLength(1);
    expect(seated(s).map(p => p.name)).toEqual(['Anna', 'Ben', 'Clara']);
    expect(s.game.status).toBe('running');
  });
  it('legt bei fester Rundenzahl alle Runden an', () => {
    const s = createGame(tpl('r10'), players('A', 'B'), testClock());
    expect(liveRounds(s)).toHaveLength(10);
  });
  it('friert die Regeln ein (Kopie statt Verweis)', () => {
    const t = tpl('free');
    const s = createGame(t, players('A'), testClock());
    expect(s.game.rules).toEqual(t);
    expect(s.game.rules).not.toBe(t);
  });
});

describe('Punkte eintragen', () => {
  it('summiert Runden und erkennt volle Runden', () => {
    const c = testClock();
    let s = createGame(tpl('free'), players('Anna', 'Ben'), c);
    const r0 = liveRounds(s)[0].id;
    s = setScore(s, r0, 'p0', 12, c).state;
    expect(roundFull(s, r0)).toBe(false);
    s = setScore(s, r0, 'p1', -3, c).state;
    expect(roundFull(s, r0)).toBe(true);
    expect(totals(s)).toEqual({ p0: 12, p1: -3 });
  });
  it('legt eine neue Runde erst mit dem ersten Wert an', () => {
    const c = testClock();
    let s = createGame(tpl('free'), players('A', 'B'), c);
    s = play(s, liveRounds(s)[0].id, [1, 2], c).s;
    expect(setScore(s, 'new', 'p0', null, c).state).toBe(s);
    const r = setScore(s, 'new', 'p0', 5, c);
    expect(liveRounds(r.state)).toHaveLength(2);
    expect(scoreOf(r.state, r.roundId!, 'p0')).toBe(5);
  });
  it('überschreibt einen Wert und markiert gelöschte Werte statt sie zu entfernen', () => {
    const c = testClock();
    let s = createGame(tpl('free'), players('A'), c);
    const r0 = liveRounds(s)[0].id;
    s = setScore(s, r0, 'p0', 7, c).state;
    s = setScore(s, r0, 'p0', 9, c).state;
    expect(s.entries).toHaveLength(1);
    expect(scoreOf(s, r0, 'p0')).toBe(9);
    s = setScore(s, r0, 'p0', null, c).state;
    expect(scoreOf(s, r0, 'p0')).toBeNull();
    expect(s.entries).toHaveLength(1);
    expect(s.entries[0].deletedAt).toBeTruthy();
  });
  it('setzt Zeitstempel bei jeder Änderung neu', () => {
    const c = testClock();
    let s = createGame(tpl('free'), players('A'), c);
    const before = s.game.updatedAt;
    s = setScore(s, liveRounds(s)[0].id, 'p0', 1, c).state;
    expect(s.game.updatedAt > before).toBe(true);
  });
});

describe('Rangliste', () => {
  it('teilt Plätze bei Gleichstand', () => {
    const c = testClock();
    let s = createGame(tpl('free'), players('A', 'B', 'C'), c);
    s = play(s, liveRounds(s)[0].id, [10, 10, 4], c).s;
    expect(ranking(s).map(r => [r.player.name, r.place])).toEqual([['A', 1], ['B', 1], ['C', 3]]);
  });
  it('dreht sich bei „Wenig gewinnt“ um und reagiert auf Umschalten', () => {
    const c = testClock();
    let s = createGame(tpl('low9'), players('A', 'B'), c);
    s = play(s, liveRounds(s)[0].id, [3, 8], c).s;
    expect(ranking(s)[0].player.name).toBe('A');
    s = setWin(s, 'high', c);
    expect(ranking(s)[0].player.name).toBe('B');
  });
});

describe('Spielende und nächster Schritt', () => {
  it('endet bei Zielpunkten erst, wenn die Runde fertig ist', () => {
    const c = testClock();
    let s = createGame(tpl('t500'), players('A', 'B'), c);
    let r = setScore(s, liveRounds(s)[0].id, 'p0', 510, c); s = r.state;
    expect(endState(s)).toMatchObject({ done: false });
    expect(nextStep(s)).toMatchObject({ kind: 'round', playerIndex: 1, roundNo: 1 });
    r = setScore(s, r.roundId!, 'p1', 20, c); s = r.state;
    expect(endState(s)).toMatchObject({ done: true });
    expect(nextStep(s)).toEqual({ kind: 'result' });
    expect(canAddRound(s)).toBe(false);
  });
  it('endet nach fester Rundenzahl', () => {
    const c = testClock();
    let s = createGame(tpl('r10'), players('A'), c);
    liveRounds(s).forEach(r => { s = setScore(s, r.id, 'p0', 1, c).state; });
    expect(endState(s)).toMatchObject({ done: true, text: '10 Runden gespielt' });
    expect(totals(s).p0).toBe(10);
  });
  it('schlägt nach voller Runde eine neue vor', () => {
    const c = testClock();
    let s = createGame(tpl('free'), players('A', 'B'), c);
    expect(nextStep(s)).toMatchObject({ kind: 'round', roundNo: 1, playerIndex: 0 });
    s = play(s, liveRounds(s)[0].id, [1, 2], c).s;
    expect(nextStep(s)).toEqual({ kind: 'round', ref: 'new', roundNo: 2, playerIndex: 0 });
    expect(currentRoundIndex(s)).toBe(0);
  });
  it('wählt als Ziel einer Spielerseite die erste offene Runde', () => {
    const c = testClock();
    let s = createGame(tpl('free'), players('A', 'B'), c);
    const r0 = liveRounds(s)[0].id;
    s = setScore(s, r0, 'p0', 4, c).state;
    expect(defaultRef(s, 'p1')).toBe(r0);
    expect(defaultRef(s, 'p0')).toBe('new');
  });
});

describe('Rückgängig', () => {
  it('stellt den früheren Stand her und markiert neu Entstandenes als gelöscht', () => {
    const c = testClock();
    let s = createGame(tpl('free'), players('A', 'B'), c);
    s = play(s, liveRounds(s)[0].id, [1, 2], c).s;
    const snapshot = s;
    const r = setScore(s, 'new', 'p0', 9, c);
    const restored = restore(r.state, snapshot, c);
    expect(liveRounds(restored)).toHaveLength(1);
    expect(anyScore(restored)).toBe(true);
    expect(totals(restored)).toEqual({ p0: 1, p1: 2 });
    // Die neue Runde und ihr Eintrag existieren noch, aber als gelöscht (für späteren Sync)
    expect(restored.rounds.find(x => x.id === r.roundId)?.deletedAt).toBeTruthy();
    expect(restored.entries.filter(e => e.deletedAt)).toHaveLength(1);
  });
  it('gibt zurückgesetzten Einträgen einen neuen Zeitstempel', () => {
    const c = testClock();
    let s = createGame(tpl('free'), players('A'), c);
    const r0 = liveRounds(s)[0].id;
    s = setScore(s, r0, 'p0', 1, c).state;
    const snapshot = s;
    s = setScore(s, r0, 'p0', 5, c).state;
    const restored = restore(s, snapshot, c);
    expect(scoreOf(restored, r0, 'p0')).toBe(1);
    expect(restored.entries[0].updatedAt > s.entries[0].updatedAt).toBe(true);
  });
});

describe('Beenden', () => {
  it('setzt Status und Zeitpunkt', () => {
    const c = testClock();
    const s = finish(createGame(tpl('free'), players('A'), c), c);
    expect(s.game.status).toBe('finished');
    expect(s.game.finishedAt).toBeTruthy();
  });
});

describe('Kniffel, Phase 10 und Nullsumme', () => {
  const kn = () => gameDef('kniffel')!.template;
  it('legt je Kategorie eine Zeile an, zählt den Bonus und endet, wenn alles gefüllt ist', () => {
    const c = testClock();
    let s = createGame(kn(), players('Ann', 'Ben'), c);
    expect(liveRounds(s)).toHaveLength(13);
    const up = liveRounds(s).filter(r => r.cat?.section === 'up');
    [3, 6, 9, 12, 15, 18].forEach((v, i) => { s = setScore(s, up[i].id, 'p0', v, c).state; });
    expect(upperSum(s, 'p0')).toEqual({ sum: 63, bonus: 35 });
    expect(totals(s).p0).toBe(98);
    expect(catTurn(s)).toBe(1);
    expect(canAddRound(s)).toBe(false);
    liveRounds(s).forEach(r => { for (const pid of ['p0', 'p1']) if (scoreOf(s, r.id, pid) === null) s = setScore(s, r.id, pid, 0, c).state; });
    expect(endState(s)).not.toBeNull();
  });
  it('fügt Kategorien hinzu und entfernt sie samt Werten', () => {
    const c = testClock();
    let s = createGame(kn(), players('Ann'), c);
    s = addCategory(s, { label: 'Doppel-Kniffel', section: 'low', fixed: 100 }, c);
    expect(liveRounds(s).slice(-1)[0].cat!.label).toBe('Doppel-Kniffel');
    const id = liveRounds(s).slice(-1)[0].id;
    s = setScore(s, id, 'p0', 100, c).state;
    expect(totals(s).p0).toBe(100);
    s = removeCategory(s, id, c);
    expect(liveRounds(s)).toHaveLength(13);
    expect(totals(s).p0).toBe(0);
  });
  it('Phase 10: Haken zählt vor Punkten und behält den Wert', () => {
    const c = testClock();
    let s = createGame(gameDef('phase10')!.template, players('Ann', 'Ben'), c);
    let r = setScore(s, 'new', 'p0', 50, c); s = r.state;
    s = setScore(s, r.roundId!, 'p1', 5, c).state;
    s = setPhase(s, r.roundId!, 'p0', true, c).state;
    expect(scoreOf(s, r.roundId!, 'p0')).toBe(50);
    expect(phasesDone(s, 'p0')).toBe(1);
    expect(ranking(s)[0].player.name).toBe('Ann');
    s = setPhase(s, r.roundId!, 'p0', false, c).state;
    expect(phasesDone(s, 'p0')).toBe(0);
    expect(scoreOf(s, r.roundId!, 'p0')).toBe(50);
  });
  it('alle neuen Spiele sind definiert', () => {
    for (const k of ['kniffel', 'phase10', 'schafkopf', 'doppelkopf', 'binokel']) expect(gameDef(k)?.points?.length).toBeGreaterThan(0);
    expect(gameDef('schafkopf')!.template.params?.zeroSum).toBe(true);
    expect(gameDef('binokel')!.template.end).toEqual({ type: 'none' });
  });
});

describe('Tisch-Modus', () => {
  it('Schwimmen: nur der Erste darf schwimmen, wer danach sein letztes Leben verliert, ist sofort raus', () => {
    const c = testClock();
    const t = gameDef('schwimmen')!.template;
    let s = createGame({ ...t, params: { ...t.params, swimFirst: true } }, players('A', 'B', 'C'), c);
    for (let k = 0; k < 3; k++) s = loseLife(s, 'p0', c);
    expect(lifeState(s).swimming.p0).toBe(true);
    for (let k = 0; k < 3; k++) s = loseLife(s, 'p1', c);
    expect(lifeState(s).swimming.p1).toBe(false);
    expect(lifeState(s).out.p1).toBe(5);
    expect(lifeState(s).alive).toEqual(['p0', 'p2']);
    s = loseLife(s, 'p0', c);
    expect(endState(s)?.text).toBe('C bleibt übrig');
  });
  it('Chic: rausschicken (Deckel zurück, kann nicht mehr verlieren) und Chic aus dem Rohr (verliert sofort, Spiel läuft weiter)', () => {
    const c = testClock();
    let s = createGame(gameDef('chic')!.template, players('A', 'B', 'C'), c);
    s = giveTokens(s, 'p0', 5, null, c); s = giveTokens(s, 'p1', 3, null, c);
    s = sendOut(s, 'p0', c);
    let ts = tokenState(s);
    expect(ts.gone.p0).toBe(true); expect(ts.hold.p0).toBe(0); expect(ts.middle).toBe(10); expect(ts.out.p0).toBe(true);
    expect(giveTokens(s, 'p0', 2, null, c)).toBe(s);   // Rausgeschickte bekommen keine Deckel mehr
    s = chicLoss(s, 'p1', c);
    ts = tokenState(s);
    expect(ts.chic.p1).toBe(1); expect(ts.loser).toBeNull();
    // B steht wie ein Verlierer hinten, A (rausgeschickt) nicht
    expect(totals(s)).toEqual({ p0: 0, p1: 2, p2: 0 });
    s = sendOut(s, 'p2', c);
    expect(tokenState(s).loser).toBe('p1');
    expect(endState(s)?.done).toBe(true);
  });
  it('Schwimmen: drei Leben, dann schwimmen, dann raus; der Letzte gewinnt', () => {
    const c = testClock();
    let s = createGame(gameDef('schwimmen')!.template, players('A', 'B', 'C'), c);
    expect(liveRounds(s)).toHaveLength(0);
    expect(anyScore(s)).toBe(false);
    for (let k = 0; k < 3; k++) s = loseLife(s, 'p0', c);
    expect(lifeState(s).swimming.p0).toBe(true);
    expect(lifeState(s).left.p0).toBe(0);
    s = loseLife(s, 'p0', c);
    expect(lifeState(s).out.p0).toBe(3);
    // Wer raus ist, verliert nichts mehr
    expect(loseLife(s, 'p0', c)).toBe(s);
    s = fire(s, 'p2', c);
    expect(lifeState(s).left).toEqual({ p0: -1, p1: 2, p2: 3 });
    for (let k = 0; k < 3; k++) s = loseLife(s, 'p1', c);
    expect(endState(s)).toEqual({ done: true, text: 'C bleibt übrig' });
    expect(loseLife(s, 'p2', c)).toBe(s);
    const rk = ranking(s);
    expect(rk.map(x => [x.player.name, x.place])).toEqual([['C', 1], ['B', 2], ['A', 3]]);
    expect(totals(s)).toEqual({ p0: 0, p1: 0, p2: 3 });
  });

  it('Schocken: aus der Mitte, dann vom Sieger, Hälften und Finale', () => {
    const c = testClock();
    let s = createGame(gameDef('schocken')!.template, players('A', 'B', 'C'), c);
    s = giveTokens(s, 'p0', 4, null, c);
    s = giveTokens(s, 'p1', 9, null, c);
    let t = tokenState(s);
    expect(t.middle).toBe(0);
    expect(t.hold).toEqual({ p0: 4, p1: 9, p2: 0 });
    // Mitte leer: ohne Geber passiert nichts, der Sieger gibt ab (höchstens, was er hat)
    expect(giveTokens(s, 'p0', 2, null, c)).toBe(s);
    s = giveTokens(s, 'p0', 20, 'p1', c);
    t = tokenState(s);
    expect(t.hold).toEqual({ p0: 0, p1: 0, p2: 0 });
    expect(t.half).toBe(2);
    expect(t.halves.p0).toBe(1);
    // Neue Hälfte: alles wieder in der Mitte
    s = giveTokens(s, 'p2', 3, null, c);
    expect(tokenState(s).middle).toBe(10);
    s = schockOut(s, 'p1', c);
    t = tokenState(s);
    expect(t.halves).toEqual({ p0: 1, p1: 1, p2: 0 });
    expect(t.half).toBe(3);
    expect(t.schock.p1).toBe(1);
    expect(endState(s)).toBeNull();
    // Finale
    s = schockOut(s, 'p0', c);
    expect(tokenState(s).loser).toBe('p0');
    expect(endState(s)).toEqual({ done: true, text: 'A verliert die Partie' });
    expect(ranking(s)[2].player.name).toBe('A');
    expect(tokenState(s).maxTake).toEqual({ n: 13, who: ['p1', 'p0'] });
  });

  it('Schocken: Gleichstand bei den Hälften entscheidet die Zahl der Deckel', () => {
    const c = testClock();
    let s = createGame(gameDef('schocken')!.template, players('A', 'B', 'C'), c);
    s = giveTokens(s, 'p0', 2, null, c);
    s = giveTokens(s, 'p1', 5, null, c);
    expect(ranking(s).map(x => x.player.name)).toEqual(['C', 'A', 'B']);
  });

  it('Phasen: ohne Schwimmen raus mit dem letzten Leben, Schocken nach einer Hälfte vorbei', () => {
    const c = testClock();
    const base = gameDef('schwimmen')!.template;
    let s = createGame({ ...base, params: { lives: 2, swim: false } }, players('A', 'B'), c);
    s = loseLife(s, 'p0', c); s = loseLife(s, 'p0', c);
    expect(lifeState(s).out.p0).toBe(1);
    expect(lifeState(s).swimming.p0).toBe(false);
    expect(endState(s)?.done).toBe(true);
    let t = createGame({ ...gameDef('schocken')!.template, params: { tokens: 5, halves: 1 } }, players('A', 'B'), c);
    t = giveTokens(t, 'p1', 5, null, c);
    expect(tokenState(t).loser).toBe('p1');
  });

  it('Chic: erst aus der Mitte, dann ist raus, wer keine Deckel hat, danach zurück in die Mitte', () => {
    const c = testClock();
    let s = createGame({ ...gameDef('schocken')!.template, params: { tokens: 9, halves: 1, phase2: 'return' } }, players('A', 'B', 'C', 'D'), c);
    s = giveTokens(s, 'p0', 4, null, c);
    s = giveTokens(s, 'p1', 3, null, c);
    expect(tokenState(s).phase).toBe(1);
    s = schockOut(s, 'p2', c);
    let t = tokenState(s);
    expect([t.phase, t.middle, t.hold.p2]).toEqual([2, 0, 2]);
    expect(t.out).toEqual({ p0: false, p1: false, p2: false, p3: true });
    // In Phase 2 gibt es nichts mehr aus der Mitte
    expect(giveTokens(s, 'p3', 1, null, c)).toBe(s);
    expect(returnTokens(s, 'p3', 1, c)).toBe(s);
    s = returnTokens(s, 'p2', 5, c);
    t = tokenState(s);
    expect([t.out.p2, t.middle, t.hold.p2]).toEqual([true, 2, 0]);
    s = returnTokens(s, 'p0', 4, c);
    t = tokenState(s);
    expect(t.loser).toBe('p1');
    expect(endState(s)?.done).toBe(true);
    expect(ranking(s)[3].player.name).toBe('B');
  });
  it('Geber rotiert reihum, Wizard immer, Rommé mit params.dealer', () => {
    const c = testClock();
    let s = createGame(gameDef('romme')!.template, players('A', 'B', 'C'), c);
    expect(dealerOf(s)?.name).toBe('A');
    s = play(s, liveRounds(s)[0]?.id ?? 'new', [5, 0, 10], c).s;
    expect(dealerOf(s)?.name).toBe('B');
    expect(dealerOf(createGame(gameDef('uno')!.template, players('A', 'B'), c))?.name).toBe('A');
    expect(dealerOf(createGame(gameDef('skyjo')!.template, players('A', 'B'), c))).toBeNull();
    expect(dealerOf(createGame(gameDef('wizard')!.template, players('A', 'B', 'C'), c))?.name).toBe('A');
  });
});
