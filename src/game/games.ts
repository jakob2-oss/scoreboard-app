import type { End, Template } from '../model/types';

/** Feste Spiele mit eigenen Regeln. Illustrationen dazu in src/ui/art.ts (gleicher Schlüssel). */
export interface GameDef {
  template: Template;
  /** Akzentfarbe für Hervorhebungen */
  acc: string;
  tint: string;
  /** Kurzer Fließtext, <b> markiert Kernpunkte */
  text: string;
  /** Rechenbeispiel als Kacheln: [Wert, Beschriftung] */
  example: [string, string][];
  endOptions?: { label: string; end: End }[];
}

export const GAMES: GameDef[] = [
  {
    template: {
      key: 'romme', version: 1, name: 'Rommé', scoring: 'rounds', win: 'low', end: { type: 'target', value: 500 }, players: { min: 2, max: 6 },
      params: { quick: [{ label: 'Raus', op: 'set', v: 0 }, { label: '+5', op: 'add', v: 5 }, { label: '+10', op: 'add', v: 10 }, { label: '+20', op: 'add', v: 20 }, { label: '×2', op: 'mul', v: 2 }] }
    },
    acc: '#e8684f', tint: '#fde6df',
    text: 'Wer zuerst alle Karten ablegt, schreibt eine <b>Null</b>. Alle anderen zählen ihre Handkarten als <b>Strafpunkte</b>: Bilder 10, Ass 11, Joker 20. Bei <b>Hand-Rommé</b> zählt alles doppelt. Erreicht jemand die Grenze, ist Schluss und die <b>wenigsten Punkte gewinnen</b>.',
    example: [['25', 'auf der Hand'], ['×2', 'Hand-Rommé'], ['50', 'Strafpunkte']],
    endOptions: [{ label: 'Bei 500', end: { type: 'target', value: 500 } }, { label: 'Bei 1000', end: { type: 'target', value: 1000 } }, { label: 'Offen', end: { type: 'none' } }]
  },
  {
    template: {
      key: 'skyjo', version: 1, name: 'Skyjo', scoring: 'rounds', win: 'low', end: { type: 'target', value: 100 }, players: { min: 2, max: 8 },
      params: { quick: [{ label: '\u22121', op: 'add', v: -1 }, { label: '+1', op: 'add', v: 1 }, { label: '+5', op: 'add', v: 5 }, { label: '+10', op: 'add', v: 10 }, { label: '×2', op: 'mul', v: 2 }] }
    },
    acc: '#4aa3d8', tint: '#e1f0fa',
    text: 'Am Ende jeder Runde zählt jeder seine Karten zusammen, von <b>−2 bis 12</b>. Wer die Runde beendet, aber nicht am wenigsten hat, zählt <b>doppelt</b>. Bei <b>100 Punkten</b> ist Schluss und die <b>wenigsten Punkte gewinnen</b>.',
    example: [['18', 'beendet'], ['×2', 'nicht niedrigster'], ['36', 'Punkte']],
    endOptions: [{ label: 'Bei 100', end: { type: 'target', value: 100 } }, { label: 'Offen', end: { type: 'none' } }]
  }
];

export const gameDef = (key: string): GameDef | undefined => GAMES.find(g => g.template.key === key);
