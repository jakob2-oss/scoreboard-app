import type { Template } from '../model/types';

/** Feste Testvorlagen für die Spiel-Logik */
const base = { version: 1, scoring: 'rounds', players: { min: 1, max: 8 }, custom: true } as const;
export const TPL: Record<string, Template> = {
  free: { ...base, key: 'free', name: 'Frei', win: 'high', end: { type: 'none' } },
  t500: { ...base, key: 't500', name: 'Bis 500', win: 'high', end: { type: 'target', value: 500 } },
  r10: { ...base, key: 'r10', name: '10 Runden', win: 'high', end: { type: 'rounds', value: 10 } },
  low9: { ...base, key: 'low9', name: 'Wenig gewinnt', win: 'low', end: { type: 'rounds', value: 9 } }
};
