import { describe, expect, it } from 'vitest';
import type { Player } from '../model/types';
import type { Clock } from '../lib/id';
import { TPL } from '../test/fixtures';
import { createGame, liveRounds, setField, setScore, seated, type GameState } from './engine';
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
});
