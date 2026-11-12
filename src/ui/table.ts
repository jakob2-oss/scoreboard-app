/**
 * Tisch-Modus: Bartisch von oben, wie in einer Kneipe oder Tapas-Bar. Das Handy liegt in der Mitte,
 * jeder sieht von seinem Platz aus Leben, Deckel und die laufende Phase.
 * Flach und geometrisch, Licht und Schatten nur über halbdurchsichtige Flächen (siehe docs/DESIGN.md).
 * Der Boden reicht über den viewBox hinaus, damit er jede Bildschirmgröße füllt.
 */
export const VIEW = { w: 390, h: 640 };
/** Ovaler Tisch; Sitzplätze am Rand, davor liegen Leben bzw. Deckel */
export const TABLE = { cx: 195, cy: 320, rx: 178, ry: 296 };
export const SEATS = { rx: 134, ry: 248 };
export const FRONT = { rx: 64, ry: 168 };
/** Zwischen den Plätzen stehen Getränke und Teller */
const PROPS = { rx: 64, ry: 146 };

export const C = {
  bg: '#1d1b36',
  wood1: '#7a4e33', wood2: '#71472e', grain: '#8a5d40', rim: '#4a2c1f', rim2: '#5a3624',
  cream: '#f3ead6', brass: '#c9a45c', ink: '#1c1611', light: '#ffd58a'
};

// Gleich lange Abstände auf dem Oval (nicht gleiche Winkel), sonst drängen sich oben und unten die Plätze
const ARC: [number, number][] = (() => {
  const out: [number, number][] = []; let len = 0, px = 0, py = 0;
  for (let k = 0; k <= 720; k++) {
    const t = Math.PI / 2 + (k / 720) * Math.PI * 2, x = SEATS.rx * Math.cos(t), y = SEATS.ry * Math.sin(t);
    if (k) len += Math.hypot(x - px, y - py);
    out.push([t, len]); px = x; py = y;
  }
  return out;
})();
/** Parameter-Winkel für Platz i von n (auch halbe Plätze für Dinge dazwischen), unten beginnend im Uhrzeigersinn */
export function seatAngle(i: number, n: number): number {
  const total = ARC[ARC.length - 1][1], want = (((i / n) % 1) + 1) % 1 * total;
  const k = ARC.findIndex(([, l]) => l >= want);
  return ARC[Math.max(0, k)][0];
}
/** Drehung in Grad, damit etwas am Platz mit Winkel t zum Spieler zeigt (Normale des Ovals) */
export const facing = (t: number) => (Math.atan2(Math.sin(t) / SEATS.ry, Math.cos(t) / SEATS.rx) * 180) / Math.PI - 90;
const shadow = (r: number, ry = r) => `<ellipse cx="3" cy="5" rx="${r}" ry="${ry}" fill="#000" opacity=".3"/>`;

// ---------------------------------------------------------------- Boden und Tisch
/** Weiche, unregelmäßige Form: Punkte auf einem Kreis mit wechselndem Radius, geglättet (Catmull-Rom) */
function blob(r: number, seed: number, k = 7): string {
  const pts = Array.from({ length: k }, (_, i) => {
    const a = (i / k) * Math.PI * 2, j = 1 + .22 * Math.sin(seed * 12.9898 + i * 78.233) ;
    return [Math.cos(a) * r * j, Math.sin(a) * r * j];
  });
  const p = (i: number) => pts[(i + k) % k];
  let d = `M${p(0)[0].toFixed(1)} ${p(0)[1].toFixed(1)}`;
  for (let i = 0; i < k; i++) {
    const [x0, y0] = p(i - 1), [x1, y1] = p(i), [x2, y2] = p(i + 1), [x3, y3] = p(i + 2);
    d += `C${(x1 + (x2 - x0) / 6).toFixed(1)} ${(y1 + (y2 - y0) / 6).toFixed(1)} ${(x2 - (x3 - x1) / 6).toFixed(1)} ${(y2 - (y3 - y1) / 6).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }
  return d + 'Z';
}

/** Hintergrund: tiefes Blau mit großen, weichen Formen, die langsam treiben und sich drehen (Klassen tb-b* in app.css) */
function floor(): string {
  const shapes: [number, number, number, string, number][] = [
    // x, y, Radius, Farbe, Deckkraft
    [-40, 40, 190, '#2b2a55', 1], [430, 140, 170, '#21424a', .9], [-30, 560, 200, '#3a2a4f', .9], [420, 640, 180, '#2b2a55', 1],
    [200, -60, 150, '#21424a', .7], [210, 700, 160, '#4a2f3c', .55], [60, 300, 90, '#33305e', .8], [340, 400, 100, '#2a3c5a', .8]
  ];
  return `<rect x="-240" y="-240" width="870" height="1120" fill="${C.bg}"/>
  ${shapes.map(([x, y, r, c, o], i) => `<g transform="translate(${x} ${y})"><path class="tb-blob" style="--d:${46 + i * 7}s;--dl:${-i * 6}s" d="${blob(r, i + 1)}" fill="${c}" opacity="${o}"/></g>`).join('')}
  <g transform="translate(${TABLE.cx} ${TABLE.cy})"><path class="tb-blob tb-warm" style="--d:60s" d="${blob(250, 9, 9)}" fill="${C.light}" opacity=".07"/></g>`;
}

function tableTop(): string {
  const { cx, cy, rx, ry } = TABLE;
  const planks = Array.from({ length: 10 }, (_, k) => `<rect x="${cx - rx + k * 36}" y="${cy - ry}" width="35" height="${2 * ry}" fill="${k % 2 ? C.wood1 : C.wood2}"/>`).join('');
  const grain = Array.from({ length: 22 }, (_, k) => {
    const x = cx - rx + 8 + (k % 10) * 36 + (k * 7) % 18, y = cy - ry + 30 + (k * 97) % (2 * ry - 120), h = 60 + (k * 31) % 90;
    return `<rect x="${x}" y="${y}" width="2.4" height="${h}" rx="1.2" fill="${C.grain}" opacity=".55"/>`;
  }).join('');
  return `<ellipse cx="${cx + 8}" cy="${cy + 14}" rx="${rx + 6}" ry="${ry + 6}" fill="#000" opacity=".45"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${C.rim}"/>
  <ellipse cx="${cx}" cy="${cy - 2}" rx="${rx - 4}" ry="${ry - 4}" fill="${C.rim2}"/>
  <clipPath id="tb-clip"><ellipse cx="${cx}" cy="${cy}" rx="${rx - 10}" ry="${ry - 10}"/></clipPath>
  <g clip-path="url(#tb-clip)">${planks}${grain}
    <ellipse cx="${cx}" cy="${cy}" rx="${rx - 10}" ry="${ry - 10}" fill="${C.light}" opacity=".05"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx - 60}" ry="${ry - 90}" fill="${C.light}" opacity=".05"/></g>`;
}

// ---------------------------------------------------------------- Getränke und Teller (von oben)
const coaster = (r: number, c: string, inner = C.cream) => `<circle r="${r}" fill="${C.cream}"/><circle r="${r * .8}" fill="${c}"/><circle r="${r * .56}" fill="${inner}"/>`;
const foam = (r: number) => `<circle r="${r}" fill="#f6eedb"/><circle cx="${-r * .3}" cy="${-r * .25}" r="${r * .22}" fill="#fff"/><circle cx="${r * .3}" cy="${r * .2}" r="${r * .15}" fill="#fff"/><circle cx="${r * .1}" cy="${-r * .45}" r="${r * .1}" fill="#fff"/>`;
const ITEMS: Record<string, () => string> = {
  /** Weizen auf weiß-blauem Deckel */
  weizen: () => `${shadow(20)}<circle r="20" fill="${C.cream}"/>${[0, 1, 2, 3].map(k => `<path d="M0 0L${20 * Math.cos(k * 1.57)} ${20 * Math.sin(k * 1.57)}A20 20 0 0 1 ${20 * Math.cos(k * 1.57 + .79)} ${20 * Math.sin(k * 1.57 + .79)}z" fill="#7aa7cf"/>`).join('')}
    <circle r="16" fill="#e9dcc0" opacity=".45"/><circle r="14.5" fill="#e09a33"/>${foam(11.5)}`,
  /** Pils auf rotem Deckel */
  pils: () => `${shadow(17)}${coaster(17, '#b5452f')}<circle r="11" fill="#e9dcc0" opacity=".5"/><circle r="9.5" fill="#efc04f"/>${foam(7.5)}`,
  /** Maßkrug mit Henkel */
  krug: () => `${shadow(21)}<rect x="14" y="-6" width="16" height="12" rx="6" fill="#d8ccab" opacity=".9"/><rect x="18" y="-2.5" width="8" height="5" rx="2.5" fill="${C.wood2}"/>
    <circle r="20" fill="#d8ccab"/><circle r="17" fill="#d58f2c"/>${foam(14)}`,
  /** Rotwein, Glas mit Fuß */
  tinto: () => `<circle cx="6" cy="8" r="11" fill="#000" opacity=".22"/><circle r="13" fill="#f2e6e6" opacity=".3"/><circle r="10" fill="#6a1f2b"/><circle cx="-3" cy="-3" r="2.6" fill="#fff" opacity=".35"/>`,
  /** Caña: kleines Bier */
  cana: () => `${shadow(10)}<circle r="10" fill="#e9dcc0" opacity=".5"/><circle r="8.5" fill="#eab64a"/>${foam(6.2)}`,
  /** Oliven mit Zahnstochern */
  olives: () => `${shadow(22, 16)}<ellipse rx="22" ry="16" fill="${C.cream}"/><ellipse rx="17" ry="11.5" fill="#e6dcc5"/>
    ${[[-9, -3, '#6f7d3a'], [-1, -5, '#3b3a2c'], [7, -2, '#6f7d3a'], [-4, 4, '#6f7d3a'], [5, 5, '#3b3a2c'], [12, 3, '#6f7d3a']].map(([a, b, c]) => `<ellipse cx="${a}" cy="${b}" rx="4" ry="3.2" fill="${c}"/><circle cx="${+a + 1.2}" cy="${b}" r="1.1" fill="${c === '#3b3a2c' ? '#55533f' : '#b5452f'}"/>`).join('')}
    <rect x="-12" y="-1" width="15" height="1.4" rx=".7" fill="#d9b98a" transform="rotate(-30 -9 -3)"/>`,
  /** Tapas: Käse und Schinken */
  tapas: () => `${shadow(24)}<circle r="24" fill="${C.cream}"/><circle r="19" fill="#ece3cf"/>
    ${[0, 1, 2].map(k => `<g transform="rotate(${k * 38 - 60}) translate(8 0)"><path d="M0-5l12 5-12 5z" fill="#f0d58c"/><path d="M10.5-.6l1.5.6-1.5.6z" fill="#c99a3e"/></g>`).join('')}
    ${[0, 1].map(k => `<path d="M${-14 + k * 6} ${4 + k * 3}q4-6 8 0t8 0" stroke="#b8505a" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('')}`,
  /** Brotkorb */
  bread: () => `${shadow(24, 17)}<ellipse rx="24" ry="17" fill="#a8733f"/><ellipse rx="20" ry="13.5" fill="#8a5a2f"/>
    ${[-8, 0, 8].map((x, k) => `<ellipse cx="${x}" cy="${k % 2 ? 1 : -1}" rx="7" ry="10" fill="#b9813f" transform="rotate(${k * 12 - 12} ${x} 0)"/><ellipse cx="${x}" cy="${k % 2 ? 1 : -1}" rx="5" ry="8" fill="#ebcb92" transform="rotate(${k * 12 - 12} ${x} 0)"/>`).join('')}`,
  /** Serviettenspender */
  napkins: () => `${shadow(15, 10)}<rect x="-15" y="-9" width="30" height="18" rx="3" fill="#9aa3a6"/><rect x="-12" y="-6" width="24" height="12" rx="1.5" fill="#fff"/>
    <rect x="-12" y="-1" width="24" height="1" fill="#dcd6cc"/><rect x="-15" y="-9" width="30" height="3" rx="1.5" fill="#b9c0c2"/>`,
  /** Salz und Pfeffer */
  salt: () => `<circle cx="-6" cy="0" r="6" fill="#000" opacity=".25" transform="translate(2 3)"/><circle cx="-6" r="6" fill="#f4f1ea"/><circle cx="-6" r="2.2" fill="#c9c3b6"/>
    <circle cx="8" cy="3" r="6" fill="#000" opacity=".25"/><circle cx="7" r="6" fill="#3b332d"/><circle cx="7" r="2.2" fill="#6b6058"/>`,
  /** Erdnüsse im Holzschälchen */
  nuts: () => `${shadow(16)}<circle r="16" fill="#8a5a2f"/><circle r="12.5" fill="#6e4425"/>
    ${[[-5, -4], [4, -5], [0, 3], [6, 3], [-6, 4], [1, -1]].map(([a, b], k) => `<ellipse cx="${a}" cy="${b}" rx="3.4" ry="2.4" fill="#d9a35a" transform="rotate(${k * 47} ${a} ${b})"/>`).join('')}`,
  /** Loser Bierdeckel */
  deckel: () => `${shadow(14)}${coaster(14, '#2f5d8a')}`
};
const ORDER = ['weizen', 'olives', 'tinto', 'pils', 'tapas', 'krug', 'bread', 'cana', 'nuts', 'napkins'];

/** Dinge zwischen den Plätzen, je nach Zahl der Spieler verteilt */
function props(n: number): string {
  const { cx, cy } = TABLE;
  const at = (x: number, y: number, key: string, r = 0) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r})">${ITEMS[key]()}</g>`;
  let out = '';
  for (let i = 0; i < n; i++) {
    const a = seatAngle(i + .5, n);
    // Neben der Mitte (links und rechts) weiter nach außen, damit nichts auf den Karten steht
    const side = Math.abs(Math.sin(a)) < .45 ? 1.55 : 1;
    out += at(cx + PROPS.rx * side * Math.cos(a), cy + PROPS.ry * Math.sin(a), ORDER[i % ORDER.length], (i * 47) % 360);
    // Bis sechs Spieler ist zwischen den Plätzen am Rand noch Platz für mehr
    if (n <= 6) out += at(cx + 118 * Math.cos(a), cy + 222 * Math.sin(a), ORDER[(i + 5) % ORDER.length], (i * 71) % 360);
  }
  // Dazu ein paar Dinge näher an der Mitte, oberhalb und unterhalb der Mitte
  // Bei wenigen Spielern ist mehr Platz: noch ein paar Dinge oben und unten
  if (n <= 4) out += at(cx - 40, cy - 96, 'salt', 20) + at(cx + 40, cy + 100, 'deckel') + at(cx + 44, cy - 100, 'nuts') + at(cx - 40, cy + 104, 'tinto', 30);
  return out;
}

// ---------------------------------------------------------------- Mitte
function faceCard(x: number, y: number, r: number, t: string, suit: 'herz' | 'karo' | 'pik' | 'kreuz'): string {
  const red = suit === 'herz' || suit === 'karo', c = red ? '#a8343d' : '#1c1a26';
  const sym: Record<string, string> = {
    herz: '<path d="M0 6C-11-1-10-10-4-10c2 0 3 1 4 3 1-2 2-3 4-3 6 0 7 9-4 16z"/>',
    karo: '<path d="M0-10l7 10-7 10-7-10z"/>',
    pik: '<path d="M0-10C-9-2-10 3-6 5c2 1 4 0 5-1l-2 6h6l-2-6c1 1 3 2 5 1 4-2 3-7-6-15z"/>',
    kreuz: '<circle cx="0" cy="-5" r="4.2"/><circle cx="-5" cy="2" r="4.2"/><circle cx="5" cy="2" r="4.2"/><path d="M-1.5 2h3l1.5 8h-6z"/>'
  };
  return `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-18" y="-25" width="40" height="56" rx="4" fill="#000" opacity=".3"/>
  <rect x="-20" y="-28" width="40" height="56" rx="4" fill="${C.cream}"/>
  <text x="-14" y="-12" font-family="Jost, sans-serif" font-weight="600" font-size="12" fill="${c}">${t}</text>
  <g transform="translate(2 6)" fill="${c}">${sym[suit]}</g></g>`;
}
const deck = (x: number, y: number, r: number) => `<g transform="translate(${x} ${y}) rotate(${r})">${[3, 1.5, 0].map(o => `<rect x="${-14 + o}" y="${-20 - o}" width="28" height="40" rx="3" fill="${o ? '#e3d6bd' : '#6f2632'}"/>`).join('')}
  <rect x="-10" y="-16" width="20" height="32" rx="2" fill="${C.brass}" opacity=".25"/><path d="M0-8l6 8-6 8-6-8z" fill="${C.brass}" opacity=".8"/></g>`;
function cupAndDice(x: number, y: number): string {
  const die = (dx: number, dy: number, r: number) => `<g transform="translate(${dx} ${dy}) rotate(${r})"><rect x="-7" y="-5.5" width="15" height="15" rx="3" fill="#000" opacity=".3"/>
    <rect x="-7.5" y="-7.5" width="15" height="15" rx="3" fill="${C.cream}"/><circle r="2.2" fill="#a8343d"/></g>`;
  return `<g transform="translate(${x} ${y})">${shadow(20)}<circle r="20" fill="#2a1a12"/><circle r="15" fill="#160d09"/>
    ${die(30, -12, 18)}${die(34, 10, -22)}${die(14, 28, 40)}</g>`;
}

const SUITS = ['herz', 'karo', 'pik', 'kreuz'] as const;
const VALUES = ['7', '8', '9', '10', 'B', 'D', 'K', 'A'];
/** Schwimmen: drei offene Karten in der Mitte (wechseln mit jeder Runde), daneben der Stapel */
export function middleCards(round: number): string {
  const { cx, cy } = TABLE;
  const pick = (k: number) => { const n = (round * 7 + k * 11 + 3) % 32; return { t: VALUES[n % 8], s: SUITS[Math.floor(n / 8)] }; };
  return deck(cx + 44, cy + 6, 74) + [-1, 0, 1].map(k => { const c = pick(k + 1); return faceCard(cx - 22 + k * 24, cy + Math.abs(k) * 4, k * 12, c.t, c.s); }).join('');
}
/** Schocken: Deckelstapel in der Mitte, daneben Becher und Würfel */
export function stack(n: number): string {
  const { cx, cy } = TABLE, shown = Math.min(n, 13), x0 = cx - 20;
  const layers = Array.from({ length: shown }, (_, k) => `<circle cx="${x0 + (k % 3) * 1.2}" cy="${cy - k * 2.6}" r="25" fill="${k % 2 ? '#d9cbb0' : '#e6d9bf'}"/>`).join('');
  const top = cy - Math.max(0, shown - 1) * 2.6;
  return cupAndDice(cx + 32, cy + 8) + `<ellipse cx="${x0 + 3}" cy="${cy + 6}" rx="28" ry="26" fill="#000" opacity=".3"/>${n > 0
    ? layers + `<g transform="translate(${x0} ${top})"><circle r="25" fill="${C.cream}"/><circle r="20" fill="#b5452f"/><circle r="13.5" fill="${C.cream}"/></g>`
    : `<circle cx="${x0}" cy="${cy}" r="25" fill="${C.cream}" opacity=".1"/>`}`;
}

/** Ganzer Tisch mit Boden und Dingen, ohne Mitte und ohne Spielersachen */
export function room(n: number): string {
  return `${floor()}${tableTop()}${props(n)}`;
}
