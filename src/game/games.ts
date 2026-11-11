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
  example?: [string, string][];
  /** Gruppe auf der Startseite: Rundenspiele oder Spiele, bei denen nur das Ergebnis zählt */
  group?: 'result';
  endOptions?: { label: string; end: End }[];
}

export const GAMES: GameDef[] = [
  {
    template: { key: 'wizard', version: 1, name: 'Wizard', scoring: 'bids', win: 'high', end: { type: 'rounds', value: 0 }, players: { min: 3, max: 6 } },
    acc: '#9a7ad6', tint: '#ece6fb',
    text: 'Jede Runde gibt es <b>eine Karte mehr</b>. Bevor gespielt wird, sagt jeder an, wie viele Stiche er holt. Wer <b>genau richtig liegt</b>, bekommt <b>20 Punkte plus 10 pro Stich</b>. Wer danebenliegt, verliert <b>10 Punkte pro Stich Abweichung</b>.',
    example: [['2', 'angesagt'], ['2', 'geholt'], ['+40', 'Punkte']]
  },
  {
    template: {
      key: 'romme', version: 1, name: 'Rommé', scoring: 'rounds', win: 'low', end: { type: 'target', value: 500 }, players: { min: 2, max: 6 },
      params: { quick: [{ label: 'Raus', op: 'set', v: 0 }, { label: '+5', op: 'add', v: 5 }, { label: '+10', op: 'add', v: 10 }, { label: '+20', op: 'add', v: 20 }, { label: '×2', op: 'mul', v: 2 }] }
    },
    acc: '#ef7a5c', tint: '#fde6df',
    text: 'Wer zuerst alle Karten ablegt, schreibt eine <b>Null</b>. Alle anderen zählen ihre Handkarten als <b>Strafpunkte</b>: Bilder 10, Ass 11, Joker 20. Bei <b>Hand-Rommé</b> zählt alles doppelt. Erreicht jemand die Grenze, ist Schluss und die <b>wenigsten Punkte gewinnen</b>.',
    example: [['25', 'auf der Hand'], ['×2', 'Hand-Rommé'], ['50', 'Strafpunkte']],
    endOptions: [{ label: 'Bei 500', end: { type: 'target', value: 500 } }, { label: 'Bei 1000', end: { type: 'target', value: 1000 } }, { label: 'Offen', end: { type: 'none' } }]
  },
  {
    template: {
      key: 'skyjo', version: 1, name: 'Skyjo', scoring: 'rounds', win: 'low', end: { type: 'target', value: 100 }, players: { min: 2, max: 8 },
      params: { quick: [{ label: '\u22121', op: 'add', v: -1 }, { label: '+1', op: 'add', v: 1 }, { label: '+5', op: 'add', v: 5 }, { label: '+10', op: 'add', v: 10 }, { label: '×2', op: 'mul', v: 2 }] }
    },
    acc: '#5fa8d3', tint: '#e1f0fa',
    text: 'Am Ende jeder Runde zählt jeder seine Karten zusammen, von <b>−2 bis 12</b>. Wer die Runde beendet, aber nicht am wenigsten hat, zählt <b>doppelt</b>. Bei <b>100 Punkten</b> ist Schluss und die <b>wenigsten Punkte gewinnen</b>.',
    example: [['18', 'beendet'], ['×2', 'nicht niedrigster'], ['36', 'Punkte']],
    endOptions: [{ label: 'Bei 100', end: { type: 'target', value: 100 } }, { label: 'Offen', end: { type: 'none' } }]
  }
];

const add = (label: string, v: number) => ({ label, op: 'add' as const, v });
const place = (n: number) => Array.from({ length: n }, (_, k) => ({ label: `${k + 1}.`, op: 'set' as const, v: k + 1 }));

GAMES.push(
  {
    template: { key: 'uno', version: 1, name: 'Uno', scoring: 'rounds', win: 'high', end: { type: 'target', value: 500 }, players: { min: 2, max: 8 },
      params: { quick: [add('+5', 5), add('+10', 10), add('+20', 20), add('+50', 50)] } },
    acc: '#ef7a5c', tint: '#fde2dc',
    text: 'Wer seine letzte Karte ablegt, <b>gewinnt die Runde</b> und bekommt die Kartenwerte aller anderen gutgeschrieben: Zahlen zählen ihren Wert, Aktionskarten <b>20</b>, schwarze Karten <b>50</b>. Wer zuerst <b>500 Punkte</b> hat, gewinnt.',
    example: [['7 + 20', 'Karten der anderen'], ['+50', 'schwarze Karte'], ['77', 'für den Sieger']],
    endOptions: [{ label: 'Bei 500', end: { type: 'target', value: 500 } }, { label: 'Offen', end: { type: 'none' } }]
  },
  {
    template: { key: 'scrabble', version: 1, name: 'Scrabble', scoring: 'rounds', win: 'high', end: { type: 'none' }, players: { min: 2, max: 4 },
      params: { quick: [add('\u22121', -1), add('+1', 1), add('+10', 10), add('+50', 50), { label: '×2', op: 'mul', v: 2 }, { label: '×3', op: 'mul', v: 3 }] } },
    acc: '#3fb39b', tint: '#dcf1e7',
    text: 'Nach jedem Zug werden die <b>Buchstabenwerte des Worts</b> notiert, samt Prämienfeldern für doppelten oder dreifachen Wert. Wer alle sieben Steine auf einmal legt, bekommt <b>50 Punkte extra</b>. Am Ende zählen übrige Steine als Abzug.',
    example: [['12', 'Wortwert'], ['×3', 'Prämienfeld'], ['36', 'Punkte']]
  },
  {
    template: { key: 'siedler', version: 1, name: 'Siedler', scoring: 'rounds', win: 'high', end: { type: 'rounds', value: 1 }, players: { min: 2, max: 6 },
      params: { resultOnly: true, unit: 'Siegpunkte', quick: [add('\u22121', -1), add('+1', 1), add('+2', 2), { label: '10', op: 'set', v: 10 }] } },
    acc: '#f0b13e', tint: '#fbecc9', group: 'result',
    text: 'Gezählt wird im Spiel. Hier haltet ihr nur fest, <b>wie viele Siegpunkte</b> jeder am Ende hatte, damit die Partie in eure Bilanz einfließt.'
  },
  {
    template: { key: 'monopoly', version: 1, name: 'Monopoly', scoring: 'rounds', win: 'low', end: { type: 'rounds', value: 1 }, players: { min: 2, max: 8 },
      params: { resultOnly: true, unit: 'Platz', quick: place(6) } },
    acc: '#3fb39b', tint: '#daf1e6', group: 'result',
    text: 'Hier zählt nur die <b>Platzierung</b>: Wer zuletzt übrig bleibt, ist Erster. Tragt für jeden den Platz ein, dann landet die Partie in eurer Bilanz.'
  },
  {
    template: { key: 'ergebnis', version: 1, name: 'Anderes Spiel', scoring: 'rounds', win: 'low', end: { type: 'rounds', value: 1 }, players: { min: 2, max: 8 },
      params: { resultOnly: true, unit: 'Platz', quick: place(6) } },
    acc: '#9a7ad6', tint: '#e7e4f7', group: 'result',
    text: 'Für jedes Spiel, bei dem ihr nichts mitschreiben müsst: Tragt am Ende nur die <b>Platzierung</b> ein.'
  }
);

export const gameDef = (key: string): GameDef | undefined => GAMES.find(g => g.template.key === key);
