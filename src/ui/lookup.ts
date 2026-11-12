import type { Player } from '../model/types';
import { GAMES } from '../game/games';
import { FREE_ICON, GAME_ART } from './art';

/** Icon und Farbton eines Spiels; eigene Spiele bekommen das Icon des freien Spiels */
export function iconFor(key: string): { icon: string; tint: string } {
  const def = GAMES.find(g => g.template.key === key);
  return def && GAME_ART[key] ? { icon: GAME_ART[key].icon, tint: def.tint } : { icon: FREE_ICON, tint: '#e7e4f7' };
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
