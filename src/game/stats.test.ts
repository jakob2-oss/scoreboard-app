import { describe, expect, it } from 'vitest';
import { bidHits, byGame, filterGames, headToHead, eventIds, seriesGames, duel, performance, seriesTable, seriesPlaces, DEFAULT_POINTS, summary, seriesAwards, type HistGame } from './stats';

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
    const t = seriesTable(list, DEFAULT_POINTS, 'points');
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
    const t = seriesTable(list, [5, 3, 1, 0], 'points');
    expect(t.find(r => r.playerId === 'b')!.points).toBe(3 + 5 + 1);
    const rows = seriesTable([g('x', 'uno', 0, [['a', 1, 1], ['b', 1, 1]])], DEFAULT_POINTS);
    expect(seriesPlaces(rows, 'points')).toEqual([1, 1]);
  });
  it('fasst die Spiele einer Serie zusammen', () => {
    expect(seriesGames(list)[0]).toMatchObject({ key: 'uno', played: 2, top: 1 });
    expect(seriesGames(list)[0].leaders.sort()).toEqual(['a', 'b']);
  });
});

describe('Direktvergleich', () => {
  it('zählt Siege und wer besser platziert war, und rechnet Punkte nur bei gleichem Spiel', () => {
    const l = [
      g('1', 'kniffel', 2, [['a', 1, 250], ['b', 2, 200], ['c', 3, 100]]),
      g('2', 'kniffel', 1, [['b', 1, 300], ['a', 2, 220]]),
      g('3', 'kniffel', 0, [['a', 1, 280], ['c', 2, 90]])
    ];
    l[0].results[0].extra = { kniffel: 1, bonus: 1 }; l[0].results[1].extra = { kniffel: 0, bonus: 0 };
    const d = duel(l, 'a', 'b');
    expect(d.shared).toBe(2);
    expect([d.a.wins, d.b.wins, d.a.ahead, d.b.ahead]).toEqual([1, 1, 1, 1]);
    expect([d.a.avgPts, d.b.best]).toEqual([235, 300]);
    expect(d.extras.find(x => x.label === 'Kniffel gewürfelt')).toMatchObject({ a: 1, b: 0 });
    const mixed = duel([...l, g('4', 'uno', 0, [['a', 1, 1], ['b', 2, 2]])], 'a', 'b');
    expect(mixed.a.avgPts).toBeNull();
    expect(mixed.perGame.map(x => [x.key, x.a, x.b])).toEqual([['kniffel', 1, 1], ['uno', 1, 0]]);
  });
});

describe('Leistung', () => {
  it('bewertet jeden Platz am Durchschnitt, nicht nur Siege', () => {
    const l = [
      g('1', 'uno', 1, [['a', 1, 10], ['b', 2, 5], ['c', 3, 4], ['d', 4, 3]]),
      g('2', 'uno', 0, [['b', 1, 10], ['a', 2, 5], ['c', 3, 4], ['d', 4, 3]])
    ];
    // a: 3 + 2 geschlagen, erwartet 1,5 + 1,5
    expect(performance(l, 'a')).toMatchObject({ played: 2, beaten: 5, expected: 3, score: 1.67 });
    expect(performance(l, 'c').score).toBe(Math.round(2 / 3 * 100) / 100);
    expect(performance(l, 'd').score).toBe(0);
  });
  it('Zweiter von vier liegt über dem Schnitt, Sieg zu zweit zählt weniger als zu sechst', () => {
    expect(performance([g('1', 'uno', 0, [['a', 1, 1], ['b', 2, 1], ['c', 3, 1], ['d', 4, 1]])], 'b').score).toBe(1.33);
    const two = g('2', 'uno', 0, [['a', 1, 1], ['x', 2, 1]]);
    const six = g('6', 'uno', 0, [['a', 6, 1], ['b', 1, 1], ['c', 2, 1], ['d', 3, 1], ['e', 4, 1], ['f', 5, 1]]);
    expect(performance([two, six], 'a').score).toBe(Math.round(1 / 3 * 100) / 100);
  });
  it('wertet Gleichstand halb', () => {
    expect(performance([g('1', 'uno', 0, [['a', 1, 1], ['b', 1, 1]])], 'a')).toMatchObject({ beaten: 0.5, expected: 0.5, score: 1 });
  });
  it('ist Standard in der Serientabelle', () => {
    const l = [g('1', 'uno', 1, [['a', 1, 10], ['b', 2, 5], ['c', 3, 4], ['d', 4, 3]]), g('2', 'uno', 0, [['b', 1, 1], ['a', 2, 1]])];
    expect(seriesTable(l, DEFAULT_POINTS)[0]).toMatchObject({ playerId: 'a', perf: Math.round(3 / 2 * 100) / 100 });
  });
});

describe('Auszeichnungen einer Serie', () => {
  const g = (id: string, key: string, at: string, places: [string, number][]) => ({ id, key, name: key, finishedAt: at, results: places.map(([playerId, place]) => ({ playerId, place, total: 0 })) });
  it('meiste Siege, Serie in Folge, Allrounder und Pechvogel', () => {
    const list = [
      g('1', 'uno', '2026-11-01T20:00', [['a', 1], ['b', 2], ['c', 3]]),
      g('2', 'kniffel', '2026-11-01T21:00', [['a', 1], ['b', 3], ['c', 2]]),
      g('3', 'uno', '2026-11-01T22:00', [['b', 1], ['a', 2], ['c', 3]])
    ];
    expect(seriesAwards(list)).toEqual([
      { label: 'Meiste Siege', value: '2×', who: ['a'] },
      { label: 'Längste Siegesserie', value: '2 in Folge', who: ['a'] },
      { label: 'Allrounder', value: '2 Spiele', who: ['a'] },
      { label: 'Pechvogel', value: '2× Letzter', who: ['c'] }
    ]);
  });
  it('ohne Partien keine Auszeichnungen', () => { expect(seriesAwards([])).toEqual([]); });
});
