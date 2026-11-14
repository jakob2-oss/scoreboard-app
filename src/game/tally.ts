/** Strichliste zwischen zwei Personen. Reine Funktionen, keine Oberfläche. */
import type { Tally } from '../model/types';
import type { Clock } from '../lib/id';

/** Striche seit dem letzten Ausgleichen (ohne gelöschte) */
export function liveMarks(t: Tally) {
  const since = t.settled?.length ? t.settled[t.settled.length - 1] : '';
  return t.marks.filter(m => !m.deletedAt && m.at > since);
}
/** Stand: Striche je Seite seit dem letzten Ausgleichen */
export function tallyCount(t: Tally): [number, number] {
  const m = liveMarks(t);
  return [m.filter(x => x.side === 0).length, m.filter(x => x.side === 1).length];
}
export function createTally(a: string, b: string, name: string | null, clock: Clock): Tally {
  const at = clock.now();
  return { id: clock.uid(), createdAt: at, updatedAt: at, a, b, name: name?.trim() || null, marks: [], settled: [] };
}
export function addMark(t: Tally, side: 0 | 1, clock: Clock): Tally {
  const at = clock.now();
  return { ...t, updatedAt: at, marks: [...t.marks, { id: clock.uid(), at, side, note: null }] };
}
/** Notiz an den letzten Strich hängen (leer entfernt sie) */
export function noteLast(t: Tally, note: string, clock: Clock): Tally {
  const last = liveMarks(t).slice(-1)[0]; if (!last) return t;
  return { ...t, updatedAt: clock.now(), marks: t.marks.map(m => (m.id === last.id ? { ...m, note: note.trim() || null } : m)) };
}
/** Letzten Strich zurücknehmen (als gelöscht markiert) */
export function undoMark(t: Tally, clock: Clock): Tally {
  const last = liveMarks(t).slice(-1)[0]; if (!last) return t;
  const at = clock.now();
  return { ...t, updatedAt: at, marks: t.marks.map(m => (m.id === last.id ? { ...m, deletedAt: at } : m)) };
}
export function settle(t: Tally, clock: Clock): Tally {
  const at = clock.now();
  return { ...t, updatedAt: at, settled: [...(t.settled ?? []), at] };
}
/** Bilanz aus Sicht einer Person: positiv heißt vorn */
export function leadFor(t: Tally, pid: string): number {
  const [a, b] = tallyCount(t);
  return pid === t.a ? a - b : pid === t.b ? b - a : 0;
}
