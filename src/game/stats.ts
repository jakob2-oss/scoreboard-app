/** Statistik über abgeschlossene Partien. Reine Funktionen, keine Oberfläche. */

export interface HistResult { playerId: string; total: number; place: number; extra?: Record<string, number | boolean> }
/** occasion: Name der Serie (zur Anzeige), eventId: Verweis auf die Serie */
export interface HistGame { id: string; key: string; name: string; finishedAt: string; occasion?: string | null; eventId?: string | null; results: HistResult[] }

/** Zeitraum: alles, 30 Tage, laufendes Jahr oder eine Serie */
export type TimeFilter = 'all' | '30' | 'year' | { event: string };

export const resultOf = (g: HistGame, pid: string) => g.results.find(r => r.playerId === pid);
export const isWin = (g: HistGame, pid: string) => resultOf(g, pid)?.place === 1;

export function filterGames(list: HistGame[], pid: string, time: TimeFilter, key: string | null, now = Date.now()): HistGame[] {
  const year = new Date(now).getFullYear();
  return list.filter(g => !!resultOf(g, pid))
    .filter(g => time === 'all'
      || (time === '30' ? now - Date.parse(g.finishedAt) <= 30 * 864e5
        : time === 'year' ? new Date(g.finishedAt).getFullYear() === year
          : g.eventId === time.event))
    .filter(g => !key || g.key === key);
}

export function summary(list: HistGame[], pid: string) {
  const played = list.length, wins = list.filter(g => isWin(g, pid)).length;
  return { played, wins, losses: played - wins, rate: played ? Math.round(wins / played * 100) : 0 };
}

/** Siegquote je Spiel, beste zuerst */
export function byGame(list: HistGame[], pid: string) {
  const map = new Map<string, { key: string; name: string; played: number; wins: number }>();
  for (const g of list) {
    const x = map.get(g.key) ?? { key: g.key, name: g.name, played: 0, wins: 0 };
    x.played++; if (isWin(g, pid)) x.wins++;
    map.set(g.key, x);
  }
  return [...map.values()].sort((a, b) => b.wins / b.played - a.wins / a.played || b.played - a.played);
}

/** Direktvergleich: gemeinsame Partien und wie oft jeder unter den Gewählten vorn lag (Gleichstand zählt für alle) */
export function headToHead(list: HistGame[], ids: string[]) {
  const shared = list.filter(g => ids.every(id => resultOf(g, id)));
  const ahead: Record<string, number> = Object.fromEntries(ids.map(id => [id, 0]));
  for (const g of shared) {
    const best = Math.min(...ids.map(id => resultOf(g, id)!.place));
    ids.forEach(id => { if (resultOf(g, id)!.place === best) ahead[id]++; });
  }
  return { shared: shared.length, ahead };
}

/** Wizard: Anteil richtig angesagter Runden */
export function bidHits(list: HistGame[], pid: string) {
  let hits = 0, rounds = 0;
  for (const g of list) { const e = resultOf(g, pid)?.extra; if (e) { hits += Number(e.hits || 0); rounds += Number(e.rounds || 0); } }
  return { hits, rounds, rate: rounds ? Math.round(hits / rounds * 100) : 0 };
}

/** Serien, in denen die Partien liegen (ohne Doppelte, Reihenfolge wie die Liste) */
export function eventIds(list: HistGame[]): string[] {
  return [...new Set(list.map(g => g.eventId).filter((o): o is string => !!o))];
}

// ---------------------------------------------------------------- Serien

/** Vorschlag für Platzpunkte: 3 für den ersten, 2 für den zweiten, 1 für den dritten Platz */
export const DEFAULT_POINTS = [3, 2, 1];
export const placePoints = (place: number, pts: number[]) => pts[place - 1] ?? 0;

export interface SeriesRow {
  playerId: string; played: number; wins: number; points: number;
  /** Platzpunkte pro Partie */
  avg: number;
  /** Anteil der geschlagenen Gegner in Prozent; gleicht unterschiedlich große Runden aus */
  rate: number;
}
export type SeriesSort = 'points' | 'avg' | 'rate';

/** Tabelle einer Serie. Wer nicht dabei war, bekommt für die Partie nichts; Schnitt und Quote gleichen das aus. */
export function seriesTable(list: HistGame[], pts: number[], sort: SeriesSort = 'points'): SeriesRow[] {
  const map = new Map<string, SeriesRow & { beaten: number; faced: number }>();
  for (const g of list) for (const r of g.results) {
    const x = map.get(r.playerId) ?? { playerId: r.playerId, played: 0, wins: 0, points: 0, avg: 0, rate: 0, beaten: 0, faced: 0 };
    x.played++; if (r.place === 1) x.wins++;
    x.points += placePoints(r.place, pts);
    x.beaten += g.results.filter(o => o.place > r.place).length;
    x.faced += g.results.length - 1;
    map.set(r.playerId, x);
  }
  const rows = [...map.values()].map(({ beaten, faced, ...x }) => ({
    ...x, avg: Math.round(x.points / x.played * 10) / 10, rate: faced ? Math.round(beaten / faced * 100) : 0
  }));
  const val = (r: SeriesRow) => r[sort];
  return rows.sort((a, b) => val(b) - val(a) || b.points - a.points || b.played - a.played);
}

/** Plätze in der Serientabelle (Gleichstand teilt den Platz) */
export function seriesPlaces(rows: SeriesRow[], sort: SeriesSort): number[] {
  return rows.map((r, i) => rows.findIndex(o => o[sort] === r[sort]) + 1 || i + 1);
}

/** Spiele einer Serie: Anzahl Partien und wer am häufigsten gewonnen hat */
export function seriesGames(list: HistGame[]) {
  const map = new Map<string, { key: string; name: string; played: number; wins: Record<string, number> }>();
  for (const g of list) {
    const x = map.get(g.key) ?? { key: g.key, name: g.name, played: 0, wins: {} };
    x.played++;
    g.results.filter(r => r.place === 1).forEach(r => { x.wins[r.playerId] = (x.wins[r.playerId] ?? 0) + 1; });
    map.set(g.key, x);
  }
  return [...map.values()].map(x => {
    const top = Math.max(0, ...Object.values(x.wins));
    return { key: x.key, name: x.name, played: x.played, top, leaders: Object.keys(x.wins).filter(id => x.wins[id] === top) };
  }).sort((a, b) => b.played - a.played);
}
