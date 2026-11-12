/** Die wichtigsten Kennzahlen einer Partie für die Siegerseite. Reine Funktionen, keine Oberfläche. */
import {
  fieldOf, fieldsOf, hasPhases, isBids, isCats, isResultOnly, isSplit, liveRounds, noteKey, notesOf, phasesDone,
  ranking, roundFull, scoreOf, seated, upperSum, type GameState
} from './engine';

export interface Highlight {
  /** Kurzer Titel, z. B. „Beste Runde“ */
  label: string;
  /** Wert als Text, z. B. „48“ oder „8 von 10“ */
  value: string;
  /** Wer, falls es eine Person betrifft */
  who?: string;
}

const fmt = (n: number) => (n < 0 ? '−' + Math.abs(n) : String(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const names = (l: string[]) => (l.length < 2 ? l.join('') : l.slice(0, -1).join(', ') + ' und ' + l[l.length - 1]);

/** Bis zu drei Kennzahlen, passend zum Spiel */
export function highlights(s: GameState): Highlight[] {
  const players = seated(s), rounds = liveRounds(s).filter(r => roundFull(s, r.id) || players.some(p => scoreOf(s, r.id, p.id) !== null));
  const rk = ranking(s), out: Highlight[] = [];
  if (!rk.length || !rounds.length) return out;
  const high = s.game.rules.win === 'high';
  const top = <T,>(vals: { name: string; v: T }[], better: (a: T, b: T) => boolean) => {
    const best = vals.reduce<T | undefined>((m, x) => (m === undefined || better(x.v, m) ? x.v : m), undefined);
    return { v: best as T, who: names(vals.filter(x => x.v === best).map(x => x.name)) };
  };

  // Spielspezifisch
  if (isBids(s)) {
    const hits = players.map(p => {
      const done = rounds.filter(r => fieldOf(s, r.id, p.id, 'tricks') !== null);
      return { name: p.name, v: done.filter(r => fieldOf(s, r.id, p.id, 'bid') === fieldOf(s, r.id, p.id, 'tricks')).length, n: done.length };
    });
    const b = top(hits.map(h => ({ name: h.name, v: h.v })), (a, c) => a > c);
    out.push({ label: 'Ansagen getroffen', value: `${b.v} von ${hits[0].n}`, who: b.who });
  }
  if (isCats(s)) {
    const k = players.map(p => ({ name: p.name, v: rounds.filter(r => r.cat?.fixed === 50 && scoreOf(s, r.id, p.id) === 50).length }));
    const kn = top(k, (a, c) => a > c);
    if (kn.v > 0) out.push({ label: 'Kniffel', value: `${kn.v}×`, who: kn.who });
    const bonus = players.filter(p => upperSum(s, p.id).bonus > 0).map(p => p.name);
    out.push({ label: 'Bonus oben', value: bonus.length ? '+' + (s.game.rules.params?.bonus?.value ?? 35) : 'keiner', who: bonus.length ? names(bonus) : undefined });
  }
  if (hasPhases(s)) {
    const ph = top(players.map(p => ({ name: p.name, v: phasesDone(s, p.id) })), (a, c) => a > c);
    out.push({ label: 'Phasen geschafft', value: `${ph.v} von 10`, who: ph.who });
  }
  if (isSplit(s)) {
    const f = fieldsOf(s)![0];
    const m = top(players.flatMap(p => rounds.map(r => ({ name: p.name, v: fieldOf(s, r.id, p.id, f.key) ?? 0 }))), (a, c) => a > c);
    if (m.v > 0) out.push({ label: `Höchste ${f.label}`, value: fmt(m.v), who: m.who });
  }

  // Allgemein für Rundenspiele
  if (!isResultOnly(s) && !isCats(s)) {
    const cells = players.flatMap(p => rounds.map(r => ({ name: p.name, v: scoreOf(s, r.id, p.id) })).filter((x): x is { name: string; v: number } => x.v !== null));
    if (cells.length && !isBids(s)) {
      const zero = !!s.game.rules.params?.zeroSum;
      const best = top(cells, high || zero ? (a, c) => a > c : (a, c) => a < c);
      out.push({ label: zero ? 'Größter Rundengewinn' : 'Beste Runde', value: fmt(best.v), who: best.who });
    }
  }
  if (rk.length > 1 && rk[0].place !== rk[1].place && !s.game.rules.params?.unit?.startsWith('Platz')) {
    out.push({ label: 'Vorsprung', value: fmt(Math.abs(rk[0].total - rk[1].total)), who: rk[0].player.name });
  }
  if (!isResultOnly(s) && !isCats(s)) out.push({ label: 'Runden', value: String(rounds.length) });

  // Notizfelder: höchste Summe je Feld
  for (const n of notesOf(s)) {
    const sums = players.map(p => ({ name: p.name, v: liveRounds(s).reduce((a, r) => a + (fieldOf(s, r.id, p.id, noteKey(n)) ?? 0), 0) }));
    const b = top(sums, (a, c) => a > c);
    if (b.v > 0) out.push({ label: n, value: fmt(b.v), who: b.who });
  }
  return out.slice(0, 3);
}
