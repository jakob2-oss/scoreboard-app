import { describe, expect, it } from 'vitest';
import type { Player, Template } from '../model/types';
import type { Clock } from '../lib/id';
import { TPL } from '../test/fixtures';
import {
  anyScore, canAddRound, createGame, currentRoundIndex, defaultRef, endState, finish, liveRounds, nextStep,
  ranking, restore, roundFull, scoreOf, seated, setScore, setWin, totals, type GameState
} from './engine';

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
