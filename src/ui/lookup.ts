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
