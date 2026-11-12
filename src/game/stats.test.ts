import { describe, expect, it } from 'vitest';
import { bidHits, byGame, filterGames, headToHead, eventIds, seriesGames, seriesTable, seriesPlaces, DEFAULT_POINTS, summary, type HistGame } from './stats';

const now = Date.UTC(2026, 10, 12);
const day = 864e5;
const g = (id: string, key: string, daysAgo: number, places: [string, number, number][], occasion: string | null = null, extra?: Record<string, Record<string, number>>): HistGame => ({
  id, key, name: key, finishedAt: new Date(now - daysAgo * day).toISOString(), occasion, eventId: occasion,
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
    expect(filterGames(list, 'a', { event: 'Urlaub' }, null, now)).toHaveLength(2);
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
    expect(eventIds(list)).toEqual(['Urlaub']);
  });
});

describe('Serien', () => {
  // Ann ist immer dabei, Ben fehlt einmal, Cem spielt nur die große Runde mit
  const list = [
    g('1', 'uno', 3, [['a', 1, 10], ['b', 2, 5]]),
    g('2', 'uno', 2, [['b', 1, 10], ['a', 2, 5]]),
    g('3', 'kniffel', 1, [['c', 1, 300], ['a', 2, 250], ['b', 3, 200], ['d', 4, 100]]),
    g('4', 'skyjo', 0, [['a', 1, 10], ['d', 2, 30]])
  ];
  it('vergibt Platzpunkte und zählt Siege', () => {
    const t = seriesTable(list, DEFAULT_POINTS);
    expect(t[0]).toMatchObject({ playerId: 'a', played: 4, wins: 2, points: 3 + 2 + 2 + 3 });
    expect(t.find(r => r.playerId === 'd')!.points).toBe(0 + 2);
  });
  it('Schnitt gleicht fehlende Abende aus, Quote unterschiedlich große Runden', () => {
    const avg = seriesTable(list, DEFAULT_POINTS, 'avg');
    expect(avg[0]).toMatchObject({ playerId: 'c', avg: 3 });
    const rate = seriesTable(list, DEFAULT_POINTS, 'rate');
    expect(rate[0]).toMatchObject({ playerId: 'c', rate: 100 });
    expect(rate.find(r => r.playerId === 'a')!.rate).toBe(Math.round((1 + 0 + 2 + 1) / (1 + 1 + 3 + 1) * 100));
  });
  it('nimmt eigene Platzpunkte und teilt Plätze bei Gleichstand', () => {
    const t = seriesTable(list, [5, 3, 1, 0]);
    expect(t.find(r => r.playerId === 'b')!.points).toBe(3 + 5 + 1);
    const rows = seriesTable([g('x', 'uno', 0, [['a', 1, 1], ['b', 1, 1]])], DEFAULT_POINTS);
    expect(seriesPlaces(rows, 'points')).toEqual([1, 1]);
  });
  it('fasst die Spiele einer Serie zusammen', () => {
    expect(seriesGames(list)[0]).toMatchObject({ key: 'uno', played: 2, top: 1 });
    expect(seriesGames(list)[0].leaders.sort()).toEqual(['a', 'b']);
  });
});
