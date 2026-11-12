import { memo } from 'react';

/**
 * App-Hintergrund: bleibt im Grundton (Mitternachtsblau bzw. Papier), darüber große, blasse Kreise und
 * kleine Formen passend zum Spiel. Alles bewegt sich sehr langsam (Klassen bd-* in app.css),
 * bei „Bewegung reduzieren“ steht es still.
 */
const COLORS = ['#f3a98f', '#86cbb8', '#f2cf86', '#eda7bf', '#97c4e3', '#bba8e6'];
const HOLE = 'style="fill:var(--bg)"';

const SHAPES: Record<string, (c: string) => string> = {
  dot: c => `<circle r="9" fill="${c}"/>`,
  ring: c => `<circle r="14" fill="${c}"/><circle r="6" ${HOLE}/>`,
  die: c => `<rect x="-18" y="-18" width="36" height="36" rx="9" fill="${c}"/>${[[-8, -8], [8, 8], [0, 0], [8, -8], [-8, 8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" ${HOLE}/>`).join('')}`,
  card: c => `<rect x="-15" y="-22" width="30" height="44" rx="6" fill="${c}"/><circle r="6" ${HOLE}/>`,
  heart: c => `<path d="M0 12C-14 2-14-12-6-12c3 0 5 2 6 5 1-3 3-5 6-5 8 0 8 14-6 24z" fill="${c}"/>`,
  spade: c => `<path d="M0-14C-12-2-14 4-8 8c3 2 6 0 7-2l-3 9h8l-3-9c1 2 4 4 7 2 6-4 4-10-8-22z" fill="${c}"/>`,
  star: c => `<path d="M0-16l4.7 9.5 10.5 1.5-7.6 7.4 1.8 10.4L0 7.9l-9.4 4.9 1.8-10.4-7.6-7.4 10.5-1.5z" fill="${c}"/>`,
  moon: c => `<path d="M6-14A14 14 0 1 0 6 14 11 11 0 1 1 6-14z" fill="${c}"/>`,
  hex: c => `<path d="M0-18l15.6 9v18L0 18l-15.6-9v-18z" fill="${c}"/>`,
  bars: c => `<rect x="-18" y="2" width="9" height="12" rx="3" fill="${c}"/><rect x="-5" y="-6" width="9" height="20" rx="3" fill="${c}"/><rect x="8" y="-14" width="9" height="28" rx="3" fill="${c}"/>`,
  tile: c => `<rect x="-16" y="-16" width="32" height="32" rx="7" fill="${c}"/><rect x="-6" y="-7" width="12" height="4" rx="2" ${HOLE}/><rect x="-2" y="-7" width="4" height="15" rx="2" ${HOLE}/>`,
  house: c => `<path d="M-15 0L0-14 15 0v14h-30z" fill="${c}"/><rect x="-4" y="5" width="8" height="9" rx="2" ${HOLE}/>`
};

/** Formen je Spiel; ohne Spiel (Startseite, Verlauf, Spieler) Punkte und Ringe */
const MOTIFS: Record<string, string[]> = {
  kniffel: ['die', 'dot'], wizard: ['star', 'moon', 'dot'], romme: ['card', 'heart', 'spade'], uno: ['card', 'ring'],
  skyjo: ['card', 'dot'], schafkopf: ['card', 'heart', 'dot'], doppelkopf: ['card', 'heart'], binokel: ['card', 'spade', 'ring'],
  siedler: ['hex', 'dot'], phase10: ['bars', 'dot'], scrabble: ['tile', 'dot'], monopoly: ['house', 'ring']
};

// Feste Plätze, damit sich nichts sprunghaft verschiebt: [x, y, Größe, Drehung]
const SLOTS: [number, number, number, number][] = [
  [52, 96, 1.1, -12], [330, 170, .9, 18], [210, 300, .7, 6], [40, 420, .9, 24], [350, 470, 1.2, -20],
  [150, 560, .8, 10], [290, 660, 1, -8], [70, 740, 1.1, 14], [360, 800, .8, -16], [200, 130, .6, 30]
];

function build(key: string | null): string {
  const list = (key && MOTIFS[key]) || ['dot', 'ring'];
  const motifs = SLOTS.map(([x, y, s, r], i) => {
    const shape = SHAPES[list[i % list.length]](COLORS[(i * 2 + 1) % COLORS.length]);
    return `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><g class="bd-a" style="--d:${26 + (i % 5) * 4}s;animation-delay:${-i * 3.1}s">${shape}</g></g>`;
  }).join('');
  return `<svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g class="bd-big"><circle cx="372" cy="40" r="160" fill="currentColor"/><circle cx="-30" cy="520" r="180" fill="currentColor"/><circle cx="330" cy="790" r="120" fill="currentColor"/></g>
    <g class="bd-m">${motifs}</g></svg>`;
}

/** dim: in der laufenden Partie noch blasser, damit nichts wie ein Eintrag wirkt */
export const Backdrop = memo(function Backdrop({ motif, dim }: { motif: string | null; dim?: boolean }) {
  return <div className={'backdrop' + (dim ? ' dim' : '')} aria-hidden="true" dangerouslySetInnerHTML={{ __html: build(motif) }} />;
});
