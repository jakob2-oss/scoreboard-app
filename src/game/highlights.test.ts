import { describe, expect, it } from 'vitest';
import type { Player } from '../model/types';
import type { Clock } from '../lib/id';
import { TPL } from '../test/fixtures';
import { createGame, liveRounds, roleOf, setField, setOrder, setScore, seated, totals, type GameState } from './engine';
import { gameDef } from './games';
import { highlights } from './highlights';

function clock(): Clock { let n = 0, t = Date.UTC(2026, 0, 1); return { uid: () => 'id' + (++n), now: () => new Date(t += 1000).toISOString() }; }
const players = (...n: string[]): Player[] => n.map((name, i) => ({ id: 'p' + i, name, color: '#000', createdAt: '', updatedAt: '' }));
function round(s: GameState, vals: number[], c: Clock) {
  let id = 'new';
  seated(s).forEach((p, i) => { const r = setScore(s, id, p.id, vals[i], c); s = r.state; id = r.roundId!; });
  return s;
}

describe('Kennzahlen der Siegerseite', () => {
  it('Rundenspiel: beste Runde, Vorsprung, Runden', () => {
    const c = clock();
    let s = createGame(TPL.free, players('Anna', 'Ben'), c);
    s = round(s, [10, 30], c); s = round(s, [25, 5], c);
    const h = highlights(s);
    expect(h[0]).toEqual({ label: 'Beste Runde', value: '30', who: 'Ben' });
    expect(h.some(x => x.label === 'Vorsprung')).toBe(false);   // Gleichstand 35 : 35
    expect(h.find(x => x.label === 'Runden')?.value).toBe('2');
  });
  it('bei niedrig gewinnt ist die beste Runde die kleinste; Vorsprung zum Zweiten', () => {
    const c = clock();
    let s = createGame(TPL.low9, players('Anna', 'Ben'), c);
    s = round(s, [0, 20], c); s = round(s, [5, 10], c);
    const h = highlights(s);
    expect(h[0]).toEqual({ label: 'Beste Runde', value: '0', who: 'Anna' });
    expect(h[1]).toEqual({ label: 'Vorsprung', value: '25', who: 'Anna' });
  });
  it('Wizard: Ansagen getroffen', () => {
    const c = clock();
    let s = createGame(gameDef('wizard')!.template, players('A', 'B', 'C'), c);
    const r = liveRounds(s)[0];
    for (const [pid, bid, tr] of [['p0', 1, 1], ['p1', 0, 0], ['p2', 0, 0]] as const) {
      s = setField(s, r.id, pid, 'bid', bid, c); s = setField(s, r.id, pid, 'tricks', tr, c);
    }
    expect(highlights(s)[0]).toEqual({ label: 'Ansagen getroffen', value: '1 von 1', who: 'A, B und C' });
  });
  it('Kniffel: Kniffel und Bonus', () => {
    const c = clock();
    let s = createGame(gameDef('kniffel')!.template, players('A', 'B'), c);
    const k = liveRounds(s).find(r => r.cat?.label === 'Kniffel')!;
    s = setScore(s, k.id, 'p1', 50, c).state;
    const h = highlights(s);
    expect(h[0]).toEqual({ label: 'Kniffel', value: '1×', who: 'B' });
    expect(h[1]).toEqual({ label: 'Bonus oben', value: 'keiner', who: undefined });
  });
  it('Endwertung nach Platz: kein Vorsprung in Platzzahlen', () => {
    const c = clock();
    let s = createGame(gameDef('monopoly')!.template, players('A', 'B'), c);
    s = round(s, [2, 1], c);
    expect(highlights(s).some(h => h.label === 'Vorsprung')).toBe(false);
  });

  it('Arschloch: Rollen, Punkte und Rollen-Geschichten', () => {
    const c = clock();
    let s = createGame(gameDef('arschloch')!.template, players('Anna', 'Ben', 'Clara', 'Dora'), c);
    expect([1, 2, 3, 4].map(r => roleOf(r, 4).short)).toEqual(['P', 'VP', 'VA', 'A']);
    expect([1, 2, 3].map(r => roleOf(r, 3).name)).toEqual(['Präsident', 'Bürger', 'Arschloch']);
    let id = liveRounds(s)[0].id;
    s = setOrder(s, id, ['p0', 'p1', 'p2', 'p3'], c).state;
    s = setOrder(s, 'new', ['p0', 'p2', 'p1', 'p3'], c).state;
    s = setOrder(s, 'new', ['p3', 'p1', 'p2', 'p0'], c).state;
    // P +2, VP +1, VA −1, A −2 über drei Runden
    expect(totals(s)).toEqual({ p0: 2, p1: 1, p2: -1, p3: -2 });
    const h = highlights(s);
    expect(h[0]).toEqual({ label: 'Am häufigsten Präsident', value: '2×', who: 'Anna' });
    expect(h[1]).toEqual({ label: 'Längste Amtszeit', value: '2 Runden', who: 'Anna' });
    expect(h[2]).toEqual({ label: 'Tiefster Fall', value: '1×', who: 'Anna' });
    id = liveRounds(s)[0].id;
    s = setOrder(s, id, ['p1'], c).state;
    // Runde 1 neu: nur Ben eingetragen, die anderen ohne Rolle
    expect(seated(s).map(p => totals(s)[p.id])).toEqual([0, 2, 0, 0]);
  });
});
