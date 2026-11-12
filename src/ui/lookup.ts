import type { Player } from '../model/types';
import { GAMES } from '../game/games';
import { GAME_ART, customArt } from './art';

/** Gewähltes Aussehen eigener Spiele (aus den Vorlagen, von der App gesetzt) */
let looks: Record<string, { color: string; pattern: string } | undefined> = {};
export function registerLooks(tpls: { key: string; params?: { look?: { color: string; pattern: string } } }[]) {
  looks = Object.fromEntries(tpls.map(t => [t.key, t.params?.look]));
}
/** Icon und Farbton eines Spiels; eigene Spiele bekommen ihr eigenes Icon */
export function iconFor(key: string, name = ''): { icon: string; tint: string } {
  const def = GAMES.find(g => g.template.key === key);
  if (def && GAME_ART[key]) return { icon: GAME_ART[key].icon, tint: def.tint };
  const c = customArt(key, name, looks[key]);
  return { icon: c.icon, tint: c.tint };
}

export const playerOf = (players: Player[], id: string): Pick<Player, 'name' | 'color'> =>
  players.find(p => p.id === id) ?? { name: 'Unbekannt', color: '#c9c6dc' };

export const dateLong = (iso: string) => new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
export const dateShort = (iso: string) => new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
export const monthOf = (iso: string) => new Date(iso).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

/** Serien, zuletzt bespielte oder angelegte zuerst */
export function recentEvents<E extends { id: string; createdAt: string }>(events: E[], history: { eventId?: string | null; finishedAt: string }[]): E[] {
  const last = (e: E) => history.filter(h => h.eventId === e.id).reduce((m, h) => (h.finishedAt > m ? h.finishedAt : m), e.createdAt);
  return [...events].sort((a, b) => last(b).localeCompare(last(a)));
}

/** Zeitraum einer Serie, z. B. „Mai bis Juni 2026“ oder „12. März 2026“ */
export function spanOf(dates: string[]): string {
  if (!dates.length) return '';
  const s = [...dates].sort(), a = new Date(s[0]), b = new Date(s[s.length - 1]);
  if (a.toDateString() === b.toDateString()) return dateLong(s[0]);
  const m = (d: Date, y: boolean) => d.toLocaleDateString('de-DE', y ? { month: 'long', year: 'numeric' } : { month: 'long' });
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) return m(a, true);
  return `${m(a, a.getFullYear() !== b.getFullYear())} bis ${m(b, true)}`;
}

/** Leistung als Faktor der Erwartung, z. B. „1,6×“ */
export const fmtPerf = (x: number) => x.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '×';
