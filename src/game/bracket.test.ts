import { describe, expect, it } from 'vitest';
import { champion, createBracket, recordGame, roundName, setWinners } from './bracket';

const uidGen = () => { let n = 0; return () => 'm' + (++n); };
const win = (a: string, b: string) => [{ playerId: a, place: 1 }, { playerId: b, place: 2 }];

describe('Turnier im K.-o.-System', () => {
  it('Duelle mit Freilos, nächste Runde entsteht automatisch, Best of 3, Sieger am Ende', () => {
    const uid = uidGen();
    let b = createBracket(['a', 'b', 'c', 'd', 'e'], { size: 2, advance: 1, bestOf: 3 }, uid);
    expect(b.rounds[0].matches.map(m => m.players)).toEqual([['a', 'b'], ['c', 'd'], ['e']]);
    expect(b.rounds[0].matches[2]).toMatchObject({ bye: true, winners: ['e'] });
    const [m1, m2] = b.rounds[0].matches;
    b = recordGame(b, m1.id, 'g1', win('a', 'b'), uid);
    expect(b.rounds[0].matches[0].winners).toBeNull();     // Best of 3: ein Sieg reicht nicht
    b = recordGame(b, m1.id, 'g2', win('a', 'b'), uid);
    b = setWinners(b, m2.id, ['d'], uid);                   // von Hand
    expect(b.rounds).toHaveLength(2);
    expect(b.rounds[1].matches.map(m => m.players)).toEqual([['a', 'd'], ['e']]);
    const semi = b.rounds[1].matches[0];
    b = recordGame(b, semi.id, 'g3', win('d', 'a'), uid); b = recordGame(b, semi.id, 'g4', win('d', 'a'), uid);
    expect(b.rounds[2].matches[0].players).toEqual(['d', 'e']);
    expect(roundName(b, 2, 5)).toBe('Finale');
    const fin = b.rounds[2].matches[0];
    b = recordGame(b, fin.id, 'g5', win('e', 'd'), uid); b = recordGame(b, fin.id, 'g6', win('e', 'd'), uid);
    expect(champion(b)).toBe('e');
  });
  it('Tische mit mehreren: die Besten kommen weiter, am Finaltisch nur einer', () => {
    const uid = uidGen();
    let b = createBracket(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], { size: 4, advance: 2, bestOf: 3 }, uid);
    expect(b.bestOf).toBe(1);
    expect(b.rounds[0].matches.map(m => m.players)).toEqual([['a', 'c', 'e', 'g'], ['b', 'd', 'f', 'h']]);
    const [t1, t2] = b.rounds[0].matches;
    b = recordGame(b, t1.id, 'g1', [{ playerId: 'e', place: 1 }, { playerId: 'a', place: 2 }, { playerId: 'c', place: 3 }, { playerId: 'g', place: 4 }], uid);
    b = recordGame(b, t2.id, 'g2', [{ playerId: 'b', place: 1 }, { playerId: 'h', place: 2 }, { playerId: 'd', place: 3 }, { playerId: 'f', place: 4 }], uid);
    expect(b.rounds[1].matches).toHaveLength(1);
    expect(b.rounds[1].matches[0].players).toEqual(['e', 'a', 'b', 'h']);
    expect(roundName(b, 1, 8)).toBe('Finaltisch');
    b = recordGame(b, b.rounds[1].matches[0].id, 'g3', [{ playerId: 'h', place: 1 }, { playerId: 'e', place: 2 }, { playerId: 'a', place: 3 }, { playerId: 'b', place: 4 }], uid);
    expect(champion(b)).toBe('h');
  });
});
