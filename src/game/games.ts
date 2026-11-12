import type { End, Template } from '../model/types';

/** Feste Spiele mit eigenen Regeln. Illustrationen dazu in src/ui/art.ts (gleicher Schlüssel). */
export interface GameDef {
  template: Template;
  /** Akzentfarbe für Hervorhebungen */
  acc: string;
  tint: string;
  /** Kurzer Fließtext, <b> markiert Kernpunkte */
  text: string;
  /** Regeln als Stichpunkte: [Schlüsselbegriff, kurzer Zusatz] */
  points?: [string, string][];
  /** Rechenbeispiel als Kacheln: [Wert, Beschriftung] */
  example?: [string, string][];
  /** Gruppe auf der Startseite: Rundenspiele oder Spiele, bei denen nur das Ergebnis zählt */
  group?: 'result';
  endOptions?: { label: string; end: End }[];
}

export const GAMES: GameDef[] = [
  {
    template: { key: 'wizard', version: 1, name: 'Wizard', scoring: 'bids', win: 'high', end: { type: 'rounds', value: 0 }, players: { min: 3, max: 6 } },
    points: [['Jede Runde', 'eine Karte mehr'], ['Vor dem Spiel', 'jeder sagt seine Stiche an'], ['Genau getroffen', '20 Punkte plus 10 je Stich'], ['Daneben', 'minus 10 je Stich Abweichung']],
    acc: '#9a7ad6', tint: '#ece6fb',
    text: 'Jede Runde gibt es <b>eine Karte mehr</b>. Bevor gespielt wird, sagt jeder an, wie viele Stiche er holt. Wer <b>genau richtig liegt</b>, bekommt <b>20 Punkte plus 10 pro Stich</b>. Wer danebenliegt, verliert <b>10 Punkte pro Stich Abweichung</b>.',
    example: [['2', 'angesagt'], ['2', 'geholt'], ['+40', 'Punkte']]
  },
  {
    template: {
      key: 'romme', version: 1, name: 'Rommé', scoring: 'rounds', win: 'low', end: { type: 'target', value: 500 }, players: { min: 2, max: 6 },
      params: { quick: [{ label: 'Raus', op: 'set', v: 0 }, { label: '+5', op: 'add', v: 5 }, { label: '+10', op: 'add', v: 10 }, { label: '+20', op: 'add', v: 20 }, { label: '×2', op: 'mul', v: 2 }] }
    },
    points: [['Raus', 'wer zuerst ablegt, schreibt 0'], ['Handkarten', 'Strafpunkte: Bild 10, Ass 11, Joker 20'], ['Hand-Rommé', 'alles zählt doppelt'], ['Ende', 'an der Grenze, wenigste Punkte gewinnen']],
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
    points: [['Kartenwerte', 'von −2 bis 12'], ['Beendet', 'und nicht niedrigster: doppelt'], ['Ende', 'bei 100, wenigste Punkte gewinnen']],
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
    points: [['Rundensieger', 'bekommt die Karten der anderen'], ['Zahlen', 'zählen ihren Wert'], ['Aktionskarten', '20, schwarze Karten 50'], ['Ziel', '500 Punkte']],
    acc: '#ef7a5c', tint: '#fde2dc',
    text: 'Wer seine letzte Karte ablegt, <b>gewinnt die Runde</b> und bekommt die Kartenwerte aller anderen gutgeschrieben: Zahlen zählen ihren Wert, Aktionskarten <b>20</b>, schwarze Karten <b>50</b>. Wer zuerst <b>500 Punkte</b> hat, gewinnt.',
    example: [['7 + 20', 'Karten der anderen'], ['+50', 'schwarze Karte'], ['77', 'für den Sieger']],
    endOptions: [{ label: 'Bei 500', end: { type: 'target', value: 500 } }, { label: 'Offen', end: { type: 'none' } }]
  },
  {
    template: { key: 'scrabble', version: 1, name: 'Scrabble', scoring: 'rounds', win: 'high', end: { type: 'none' }, players: { min: 2, max: 4 },
      params: { quick: [add('\u22121', -1), add('+1', 1), add('+10', 10), add('+50', 50), { label: '×2', op: 'mul', v: 2 }, { label: '×3', op: 'mul', v: 3 }] } },
    points: [['Je Zug', 'Buchstabenwerte des Worts'], ['Prämienfelder', 'doppelt oder dreifach'], ['Alle sieben Steine', '50 Punkte extra'], ['Ende', 'Reststeine werden abgezogen']],
    acc: '#3fb39b', tint: '#dcf1e7',
    text: 'Nach jedem Zug werden die <b>Buchstabenwerte des Worts</b> notiert, samt Prämienfeldern für doppelten oder dreifachen Wert. Wer alle sieben Steine auf einmal legt, bekommt <b>50 Punkte extra</b>. Am Ende zählen übrige Steine als Abzug.',
    example: [['12', 'Wortwert'], ['×3', 'Prämienfeld'], ['36', 'Punkte']]
  },
  {
    template: { key: 'siedler', version: 1, name: 'Siedler', scoring: 'rounds', win: 'high', end: { type: 'rounds', value: 1 }, players: { min: 2, max: 6 },
      params: { resultOnly: true, unit: 'Siegpunkte', quick: [add('\u22121', -1), add('+1', 1), add('+2', 2), { label: '10', op: 'set', v: 10 }] } },
    points: [['Am Ende', 'Siegpunkte je Spieler'], ['Gewinner', 'die meisten Siegpunkte']],
    acc: '#f0b13e', tint: '#fbecc9', group: 'result',
    text: 'Am Ende trägt jeder seine <b>Siegpunkte</b> ein.'
  },
  {
    template: { key: 'monopoly', version: 1, name: 'Monopoly', scoring: 'rounds', win: 'low', end: { type: 'rounds', value: 1 }, players: { min: 2, max: 8 },
      params: { resultOnly: true, unit: 'Platz', quick: place(6) } },
    points: [['Am Ende', 'Platz je Spieler'], ['Erster', 'wer zuletzt übrig bleibt']],
    acc: '#3fb39b', tint: '#daf1e6', group: 'result',
    text: 'Am Ende trägt jeder seinen <b>Platz</b> ein. Wer zuletzt übrig bleibt, ist Erster.'
  },
  {
    template: { key: 'ergebnis', version: 1, name: 'Anderes Spiel', scoring: 'rounds', win: 'low', end: { type: 'rounds', value: 1 }, players: { min: 2, max: 8 },
      params: { resultOnly: true, unit: 'Platz', quick: place(6) } },
    points: [['Am Ende', 'Platz je Spieler']],
    acc: '#9a7ad6', tint: '#e7e4f7', group: 'result',
    text: 'Am Ende trägt jeder seinen <b>Platz</b> ein.'
  }
);

const setTo = (label: string, v: number) => ({ label, op: 'set' as const, v });
const times = (label: string, v: number) => ({ label, op: 'mul' as const, v });
const mult = (n: number) => [1, 2, 3, 4, 5].map(k => k * n);
const rest = { label: 'Ausgleich', op: 'rest' as const, v: 0 };

GAMES.push(
  {
    template: { key: 'kniffel', version: 1, name: 'Kniffel', scoring: 'categories', win: 'high', end: { type: 'categories' }, players: { min: 1, max: 8 },
      params: { bonus: { at: 63, value: 35 }, categories: [
        { label: 'Einser', section: 'up', quick: mult(1) }, { label: 'Zweier', section: 'up', quick: mult(2) }, { label: 'Dreier', section: 'up', quick: mult(3) },
        { label: 'Vierer', section: 'up', quick: mult(4) }, { label: 'Fünfer', section: 'up', quick: mult(5) }, { label: 'Sechser', section: 'up', quick: mult(6) },
        { label: 'Dreierpasch', section: 'low' }, { label: 'Viererpasch', section: 'low' }, { label: 'Full House', section: 'low', fixed: 25 },
        { label: 'Kleine Straße', section: 'low', fixed: 30 }, { label: 'Große Straße', section: 'low', fixed: 40 }, { label: 'Kniffel', section: 'low', fixed: 50 },
        { label: 'Chance', section: 'low' }] } },
    points: [['Pro Zug', 'bis zu drei Würfe, dann ein freies Feld'], ['Oben', 'nur die passenden Augen zählen'], ['Bonus', '35 Punkte ab 63 oben'], ['Kategorien', 'im Menü der Partie anpassbar']],
    acc: '#3fb39b', tint: '#dff1ee', text: '', example: [['3×', 'Vierer'], ['12', 'Punkte'], ['+35', 'ab 63 oben']]
  },
  {
    template: { key: 'phase10', version: 1, name: 'Phase 10', scoring: 'rounds', win: 'low', end: { type: 'none' }, players: { min: 2, max: 6 },
      params: { phases: true, quick: [setTo('Raus', 0), add('+5', 5), add('+10', 10), add('+15', 15), add('+25', 25)] } },
    points: [['Je Runde', 'eigene Phase auslegen, dann Haken setzen'], ['Handkarten', '1 bis 9 sind 5, 10 bis 12 sind 10, Aussetzen 15, Joker 25'], ['Sieger', 'wer zuerst Phase 10 schafft']],
    acc: '#f0b13e', tint: '#fdeccc', text: ''
  },
  {
    template: { key: 'schafkopf', version: 1, name: 'Schafkopf', scoring: 'rounds', win: 'high', end: { type: 'none' }, players: { min: 4, max: 4 },
      params: { zeroSum: true, quick: [add('\u221220', -20), add('\u221210', -10), add('+10', 10), add('+20', 20), rest] } },
    points: [['Sauspiel', 'Spielerpaar gewinnt den Tarif, die anderen zahlen'], ['Wenz und Solo', 'der Spieler kassiert von allen drei'], ['Schneider, Laufende', 'erhöhen den Tarif'], ['Jede Runde', 'ergibt zusammen 0']],
    acc: '#7cb85a', tint: '#e6f0dc', text: '', example: [['+20', 'Sauspiel'], ['+10', 'Schneider'], ['+30', 'je Gewinner']]
  },
  {
    template: { key: 'doppelkopf', version: 1, name: 'Doppelkopf', scoring: 'rounds', win: 'high', end: { type: 'none' }, players: { min: 4, max: 5 },
      params: { zeroSum: true, quick: [add('\u22121', -1), add('+1', 1), add('+3', 3), times('×3', 3), rest] } },
    points: [['Gewinnerpartei', 'bekommt den Spielwert'], ['Verlierer', 'bekommen ihn abgezogen'], ['Ansagen', 'Re, Kontra und Absagen erhöhen den Wert'], ['Solo', 'der Solist zählt dreifach'], ['Jede Runde', 'ergibt zusammen 0']],
    acc: '#9a7ad6', tint: '#e7e4f7', text: '', example: [['2', 'Spielwert'], ['×3', 'Solo'], ['+6', 'Solist']]
  },
  {
    template: { key: 'binokel', version: 1, name: 'Binokel', scoring: 'rounds', win: 'high', end: { type: 'target', value: 1000 }, players: { min: 3, max: 4 },
      params: { split: [
        { key: 'meld', label: 'Meldung', phase: 'Meldungen', quick: [add('+20', 20), add('+40', 40), add('+60', 60), add('+100', 100), add('+150', 150)] },
        { key: 'play', label: 'Stiche', phase: 'Stiche', quick: [add('+10', 10), add('+20', 20), add('+50', 50), times('×\u22122', -2)] }] } },
    points: [['Reizen', 'das höchste Gebot macht den Spieler'], ['Meldung', 'zuerst, vor dem Ausspielen'], ['Stiche', 'kommen nach dem Spiel dazu'], ['Gebot verfehlt', 'Meldung zählt nicht, das Gebot doppelt negativ'], ['Ziel', '1000 Punkte']],
    acc: '#f09a4a', tint: '#fbe9d6', text: '', example: [['80', 'Meldung'], ['+170', 'Stiche'], ['250', 'Punkte']],
    endOptions: [{ label: 'Bei 1000', end: { type: 'target', value: 1000 } }, { label: 'Bei 1500', end: { type: 'target', value: 1500 } }, { label: 'Offen', end: { type: 'none' } }]
  }
);

export const gameDef = (key: string): GameDef | undefined => GAMES.find(g => g.template.key === key);
