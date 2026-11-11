import type { Template } from '../model/types';

/** Freie Zettel (Paket 1). Spiele mit eigenen Regeln folgen in Paket 2. */
export const FREE_TEMPLATES: Template[] = [
  { key: 'free', version: 1, name: 'Freie Runden', scoring: 'rounds', win: 'high', end: { type: 'none' }, players: { min: 1, max: 8 } },
  { key: 't500', version: 1, name: 'Bis 500 Punkte', scoring: 'rounds', win: 'high', end: { type: 'target', value: 500 }, players: { min: 1, max: 8 } },
  { key: 'r10', version: 1, name: '10 Runden', scoring: 'rounds', win: 'high', end: { type: 'rounds', value: 10 }, players: { min: 1, max: 8 } },
  { key: 'low9', version: 1, name: 'Wenig gewinnt', scoring: 'rounds', win: 'low', end: { type: 'rounds', value: 9 }, players: { min: 1, max: 8 } }
];

export function describeTemplate(t: Template): string {
  const w = t.win === 'high' ? 'Höchste Summe gewinnt' : 'Niedrigste Summe gewinnt';
  const e = t.end.type === 'target' ? `Ziel ${t.end.value} Punkte` : t.end.type === 'rounds' ? `${t.end.value} Runden` : 'offen';
  return `${w} · ${e}`;
}
