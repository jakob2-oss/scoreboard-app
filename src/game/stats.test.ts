import { describe, expect, it } from 'vitest';
import { bidHits, byGame, filterGames, headToHead, occasions, summary, type HistGame } from './stats';

const now = Date.UTC(2026, 10, 12);
const day = 864e5;
const g = (id: string, key: string, daysAgo: number, places: [string, number, number][], occasion: string | null = null, extra?: Record<string, Record<string, number>>): HistGame => ({
  id, key, name: key, finishedAt: new Date(now - daysAgo * day).toISOString(), occasion,
  results: places.map(([playerId, place, total]) => ({ playerId, place, total, extra: extra?.[playerId] }))
});
const list: HistGame[] = [
  g('1', 'wizard', 1, [['a', 1, 200], ['b', 2, 150], ['c', 3, 90]], null, { a: { hits: 15, rounds: 20 }, b: { hits: 10, rounds: 20 } }),
  g('2', 'romme', 10, [['b', 1, 30], ['a', 2, 80]], 'Urlaub'),
  g('3', 'romme', 40, [['a', 1, 20], ['b', 1, 20]], 'Urlaub'),
  g('4', 'wizard', 400, [['c', 1, 210], ['a', 2, 100]])
];

describe('Statistik', () => {
  it('filtert nach Spieler, Zeitraum, Anlass und Spiel', () => {
    expect(filterGames(list, 'a', 'all', null, now)).toHaveLength(4);
    expect(filterGames(list, 'a', '30', null, now).map(x => x.id)).toEqual(['1', '2']);
    expect(filterGames(list, 'a', 'year', null, now)).toHaveLength(3);
    expect(filterGames(list, 'a', { occasion: 'Urlaub' }, null, now)).toHaveLength(2);
    expect(filterGames(list, 'a', 'all', 'wizard', now)).toHaveLength(2);
    expect(filterGames(list, 'c', 'all', 'romme', now)).toHaveLength(0);
  });
  it('zählt Siege mit geteiltem ersten Platz', () => {
    expect(summary(filterGames(list, 'a', 'all', null, now), 'a')).toEqual({ played: 4, wins: 2, losses: 2, rate: 50 });
    expect(summary(filterGames(list, 'b', 'all', null, now), 'b')).toEqual({ played: 3, wins: 2, losses: 1, rate: 67 });
    expect(summary([], 'a').rate).toBe(0);
  });
  it('sortiert Spiele nach Siegquote', () => {
    expect(byGame(list, 'a').map(x => [x.key, x.wins, x.played])).toEqual([['wizard', 1, 2], ['romme', 1, 2]]);
  });
  it('vergleicht zwei und mehr Spieler direkt', () => {
    expect(headToHead(list, ['a', 'b'])).toEqual({ shared: 3, ahead: { a: 2, b: 2 } });
    expect(headToHead(list, ['a', 'b', 'c'])).toEqual({ shared: 1, ahead: { a: 1, b: 0, c: 0 } });
  });
  it('berechnet die Wizard-Trefferquote und Anlässe', () => {
    expect(bidHits(list, 'a')).toEqual({ hits: 15, rounds: 20, rate: 75 });
    expect(occasions(list)).toEqual(['Urlaub']);
  });
});
