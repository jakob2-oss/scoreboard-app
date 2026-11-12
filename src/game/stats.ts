/** Statistik über abgeschlossene Partien. Reine Funktionen, keine Oberfläche. */

export interface HistResult { playerId: string; total: number; place: number; extra?: Record<string, number | boolean> }
export interface HistGame { id: string; key: string; name: string; finishedAt: string; occasion?: string | null; results: HistResult[] }

/** Zeitraum: alles, 30 Tage, laufendes Jahr oder ein Anlass (freier Text) */
export type TimeFilter = 'all' | '30' | 'year' | { occasion: string };

export const resultOf = (g: HistGame, pid: string) => g.results.find(r => r.playerId === pid);
export const isWin = (g: HistGame, pid: string) => resultOf(g, pid)?.place === 1;

export function filterGames(list: HistGame[], pid: string, time: TimeFilter, key: string | null, now = Date.now()): HistGame[] {
  const year = new Date(now).getFullYear();
  return list.filter(g => !!resultOf(g, pid))
    .filter(g => time === 'all'
      || (time === '30' ? now - Date.parse(g.finishedAt) <= 30 * 864e5
        : time === 'year' ? new Date(g.finishedAt).getFullYear() === year
          : g.occasion === time.occasion))
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

export function occasions(list: HistGame[]): string[] {
  return [...new Set(list.map(g => g.occasion).filter((o): o is string => !!o))];
}
