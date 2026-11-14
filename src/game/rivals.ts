/**
 * Rivalitäten: Paare, die oft gegeneinander spielen. In jeder gemeinsamen Partie gewinnt das Duell,
 * wer besser platziert ist (Gleichstand zählt für niemanden). Reine Funktionen, keine Oberfläche.
 */
import { resultOf, type HistGame } from './stats';

/** Ab so vielen gemeinsamen Partien gilt ein Paar als Rivalität */
export const RIVAL_MIN = 5;

export interface Rivalry {
  a: string; b: string;
  /** gemeinsame Partien */
  shared: number;
  /** gewonnene Duelle */
  winsA: number; winsB: number;
  /** laufende Serie: wer die letzten Duelle in Folge gewonnen hat (Gleichstände unterbrechen nicht) */
  streak: { who: string; n: number } | null;
}

const byTime = (list: HistGame[]) => [...list].sort((x, y) => x.finishedAt.localeCompare(y.finishedAt));
const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

/** Duell zweier Spieler über eine Liste von Partien */
export function rivalry(list: HistGame[], a: string, b: string): Rivalry {
  let shared = 0, winsA = 0, winsB = 0;
  let streak = null as Rivalry['streak'];
  for (const g of byTime(list)) {
    const ra = resultOf(g, a), rb = resultOf(g, b); if (!ra || !rb) continue;
    shared++;
    if (ra.place === rb.place) continue;
    const who = ra.place < rb.place ? a : b;
    if (who === a) winsA++; else winsB++;
    streak = streak?.who === who ? { who, n: streak.n + 1 } : { who, n: 1 };
  }
  return { a, b, shared, winsA, winsB, streak };
}

/** Alle Rivalitäten (ab RIVAL_MIN gemeinsamen Partien), die häufigsten zuerst; optional nur mit einem Spieler */
export function rivalries(list: HistGame[], min = RIVAL_MIN, of?: string): Rivalry[] {
  const count = new Map<string, number>();
  for (const g of list) {
    const ids = g.results.map(r => r.playerId);
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      if (ids[i] === ids[j]) continue;
      const k = pairKey(ids[i], ids[j]); count.set(k, (count.get(k) ?? 0) + 1);
    }
  }
  return [...count.entries()].filter(([k, n]) => n >= min && (!of || k.split('|').includes(of)))
    .map(([k]) => { const [x, y] = k.split('|'); const a = of && y === of ? y : x, b = a === x ? y : x; return rivalry(list, a, b); })
    .sort((p, q) => q.shared - p.shared || Math.abs(p.winsA - p.winsB) - Math.abs(q.winsA - q.winsB));
}

/** Siege für einen Spieler aus der Sicht des Duells */
export const winsOf = (r: Rivalry, id: string) => (id === r.a ? r.winsA : r.winsB);

/** Was eine neue Partie im Duell verändert hat */
export interface RivalNews {
  a: string; b: string; before: Rivalry; after: Rivalry;
  kind: 'streak' | 'revenge' | 'lead' | 'level' | 'milestone' | 'win';
  /** Wer die Nachricht macht (Sieger der letzten Duelle) */
  who: string; other: string;
  /** Zahl zur Nachricht: Länge der Serie, gebrochene Serie oder Meilenstein */
  n: number;
}

/**
 * Nachrichten aus den Rivalitäten, wenn `fresh` (eine Partie oder ein Abend) zu `before` hinzukommt.
 * Nur Paare, die danach als Rivalität gelten und in `fresh` gegeneinander gespielt haben.
 */
export function rivalNews(before: HistGame[], fresh: HistGame[], min = RIVAL_MIN): RivalNews[] {
  const all = [...before, ...fresh], out: RivalNews[] = [];
  for (const r of rivalries(all, min)) {
    const met = fresh.filter(g => resultOf(g, r.a) && resultOf(g, r.b)); if (!met.length) continue;
    const prev = rivalry(before, r.a, r.b), now = r;
    const dA = now.winsA - prev.winsA, dB = now.winsB - prev.winsB; if (!dA && !dB) continue;
    const who = dA === dB ? (now.streak?.who ?? r.a) : dA > dB ? r.a : r.b, other = who === r.a ? r.b : r.a;
    const lead = (x: Rivalry) => Math.sign(winsOf(x, who) - winsOf(x, other));
    const base = { a: r.a, b: r.b, before: prev, after: now, who, other };
    const broke = prev.streak && prev.streak.who === other && prev.streak.n >= 3 && now.streak?.who === who;
    const crossed = [25, 50, 100, 150, 200, 250].find(m => prev.shared < m && now.shared >= m);
    if (broke) out.push({ ...base, kind: 'revenge', n: prev.streak!.n });
    else if (now.streak && now.streak.who === who && now.streak.n >= 3) out.push({ ...base, kind: 'streak', n: now.streak.n });
    else if (lead(prev) <= 0 && lead(now) > 0 && now.shared >= min) out.push({ ...base, kind: 'lead', n: winsOf(now, who) });
    else if (lead(prev) < 0 && lead(now) === 0) out.push({ ...base, kind: 'level', n: winsOf(now, who) });
    else if (crossed) out.push({ ...base, kind: 'milestone', n: crossed });
    else out.push({ ...base, kind: 'win', n: winsOf(now, who) });
  }
  return out;
}

/** Wie spannend eine Nachricht ist (für die Auswahl der Schlagzeile) */
export function newsWeight(n: RivalNews): number {
  const w = { revenge: 7, streak: 4, lead: 6, level: 4, milestone: 5, win: 1 }[n.kind];
  return w + (n.kind === 'revenge' || n.kind === 'streak' ? n.n : 0) + Math.min(3, n.after.shared / 20);
}
