/**
 * Tisch-Modus als Bar: dunkle Rückwand mit Spiegel und Flaschenregal, Neon, Messinglampen,
 * Schachbrettboden und ein runder Spieltisch mit grünem Filz. Flach und geometrisch, Licht nur über
 * halbdurchsichtige Flächen (siehe docs/DESIGN.md). Die Zeichnung reicht über den viewBox hinaus,
 * damit sie jede Bildschirmhöhe füllt.
 */
export const VIEW = { w: 390, h: 640 };
/** Mittelpunkt und Radien des Tisches; Sitzplätze liegen auf einer größeren Ellipse */
export const TABLE = { cx: 195, cy: 390, rx: 132, ry: 120 };
export const SEATS = { rx: 156, ry: 172 };
/** Ellipse, auf der Leben bzw. Deckel vor jedem Spieler liegen */
export const FRONT = { rx: 84, ry: 84 };
const WALL = 214;

export const C = {
  wall: '#17282a', wall2: '#1d3134', panel: '#2a1d19', panel2: '#33241e', brass: '#c9a45c', brass2: '#9c7a3c',
  mirror: '#22393b', shelf: '#3a2820', ink: '#121018', cream: '#efe4cf', light: '#ffd58a',
  felt: '#1f4d42', felt2: '#245a4d', rim: '#3a2219', rim2: '#4a2c20',
  tile1: '#1a1820', tile2: '#2a2631', neonA: '#ff8fb1', neonB: '#ffc874'
};

// ---------------------------------------------------------------- Rückwand mit Bar
function bottle(x: number, y: number, h: number, w: number, c: string, k: number): string {
  const neck = w * .34, sh = h * .42;
  return `<g transform="translate(${x} ${y})">
    <path d="M${-w / 2} 0v${-h + sh}q0-${sh * .35} ${w / 2 - neck / 2}-${sh * .5}v-${sh * .5}h${neck}v${sh * .5}q${w / 2 - neck / 2} ${sh * .15} ${w / 2 - neck / 2} ${sh * .5}v${h - sh}z" fill="${c}"/>
    <rect x="${-neck / 2}" y="${-h - 3}" width="${neck}" height="5" rx="1" fill="${k % 2 ? C.brass2 : C.ink}"/>
    <rect x="${-w / 2 + 2}" y="${-h * .48}" width="${w - 4}" height="${h * .22}" fill="${C.cream}" opacity=".82"/>
    <rect x="${-w / 2 + 2.5}" y="${-h + sh + 2}" width="2.2" height="${h - sh - 4}" rx="1.1" fill="#fff" opacity=".22"/></g>`;
}
const BOTTLES = ['#b5732e', '#3f6b48', '#6f2632', '#8fa8a2', '#c98a3c', '#2f4f6e', '#7a5a2e', '#a23e48'];

function backBar(kind: 'lives' | 'tokens'): string {
  const shelfRow = (y: number, seed: number) => {
    let x = 34, out = '', k = seed;
    while (x < 356) {
      const w = 11 + (k * 7) % 8, h = 34 + (k * 13) % 22;
      out += bottle(x + w / 2, y, h, w, BOTTLES[k % BOTTLES.length], k);
      x += w + 6 + (k % 3) * 2; k++;
      if (k % 5 === 0) x += 18;
    }
    return out;
  };
  const neon = kind === 'lives'
    // Wellen
    ? [0, 1, 2].map(k => `<path d="M-38 ${k * 11 - 11}q9.5-9 19 0t19 0 19 0 19 0" fill="none" stroke="${C.neonA}" stroke-width="3.4" stroke-linecap="round"/>`).join('')
    // Würfel mit drei Augen
    : `<rect x="-17" y="-17" width="34" height="34" rx="8" fill="none" stroke="${C.neonB}" stroke-width="3.4"/>${[[-8, -8], [0, 0], [8, 8]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="3" fill="${C.neonB}"/>`).join('')}`;
  return `<rect x="-220" y="-520" width="830" height="${WALL + 520}" fill="${C.wall}"/>
  ${Array.from({ length: 14 }, (_, k) => `<rect x="${-220 + k * 62}" y="-520" width="31" height="${WALL + 520}" fill="${C.wall2}" opacity=".55"/>`).join('')}
  <rect x="14" y="20" width="362" height="170" rx="4" fill="${C.panel}"/>
  <rect x="22" y="26" width="346" height="158" fill="${C.mirror}"/>
  <path d="M60 26h70l-76 158h-32v-40zM180 26h26l-76 158h-26zM300 26h50l-76 158h-50z" fill="#fff" opacity=".035"/>
  <g class="tb-neon" transform="translate(195 54)"><g filter="url(#tb-blur)" opacity=".9">${neon}</g>${neon}</g>
  ${shelfRow(110, 1)}<rect x="22" y="110" width="346" height="7" fill="${C.shelf}"/><rect x="22" y="117" width="346" height="3" fill="#000" opacity=".25"/>
  ${shelfRow(178, 4)}<rect x="22" y="178" width="346" height="7" fill="${C.shelf}"/>
  <rect x="-220" y="${WALL - 30}" width="830" height="30" fill="${C.panel2}"/>
  <rect x="-220" y="${WALL - 32}" width="830" height="4" fill="${C.brass}"/>
  ${Array.from({ length: 16 }, (_, k) => `<rect x="${-200 + k * 52}" y="${WALL - 24}" width="40" height="18" rx="2" fill="${C.panel}"/>`).join('')}`;
}

/** Zwei Messinglampen mit Lichtkegel */
function lamps(): string {
  const lamp = (x: number, y: number) => `<rect x="${x - 1}" y="-520" width="2" height="${520 + y - 20}" fill="${C.ink}"/>
    <path d="M${x - 60} ${TABLE.cy + 30}L${x - 18} ${y}h36L${x + 60} ${TABLE.cy + 30}z" fill="${C.light}" opacity=".04"/>
    <path d="M${x - 8} ${y - 22}h16l14 22h-44z" fill="${C.brass}"/><path d="M${x - 22} ${y}h44l-4 4h-36z" fill="${C.brass2}"/>
    <ellipse cx="${x}" cy="${y + 4}" rx="16" ry="4" fill="#fff4cf"/><circle cx="${x}" cy="${y + 6}" r="22" fill="${C.light}" opacity=".12"/>`;
  return lamp(96, 134) + lamp(294, 134);
}

// ---------------------------------------------------------------- Boden
function floor(): string {
  const s = 30;
  let tiles = `<rect x="-220" y="${WALL}" width="830" height="900" fill="${C.tile1}"/>`;
  for (let r = 0; r < 30; r++) for (let c = 0; c < 28; c++) if ((r + c) % 2) tiles += `<rect x="${-220 + c * s}" y="${WALL + r * s}" width="${s}" height="${s}" fill="${C.tile2}"/>`;
  return tiles + `<rect x="-220" y="${WALL}" width="830" height="14" fill="#000" opacity=".35"/>`;
}

// ---------------------------------------------------------------- Tisch und Dinge darauf
const coaster = (x: number, y: number, r: number, c: string) => `<g transform="translate(${x} ${y})"><circle r="${r}" fill="${C.cream}"/><circle r="${r * .78}" fill="${c}"/><circle r="${r * .52}" fill="${C.cream}"/></g>`;
const tumbler = (x: number, y: number) => `<g transform="translate(${x} ${y})"><circle cx="3" cy="4" r="14" fill="#000" opacity=".3"/>
  <circle r="14" fill="#d6e6e2" opacity=".28"/><circle r="11" fill="#c98a3c" opacity=".85"/>
  <rect x="-6" y="-7" width="8" height="8" rx="1.5" fill="#fff" opacity=".55" transform="rotate(14)"/><rect x="1" y="-1" width="7" height="7" rx="1.5" fill="#fff" opacity=".45" transform="rotate(-10)"/></g>`;
const beer = (x: number, y: number) => `<g transform="translate(${x} ${y})"><circle cx="3" cy="4" r="18" fill="#000" opacity=".3"/>
  ${coaster(0, 0, 19, '#b5452f')}<circle r="13" fill="#d99a3a"/><circle r="10.5" fill="#f3ead6"/>
  <circle cx="-3" cy="-2" r="2.6" fill="#fff"/><circle cx="3" cy="2" r="1.8" fill="#fff"/></g>`;
const candle = (x: number, y: number) => `<g transform="translate(${x} ${y})"><circle r="20" fill="${C.light}" opacity=".1" class="tb-flicker"/>
  <circle cx="2" cy="3" r="11" fill="#000" opacity=".3"/><circle r="11" fill="#7a2632"/><circle r="8" fill="#a33a46"/><circle r="4" fill="#ffd58a" class="tb-flicker"/><circle r="1.6" fill="#fff4cf"/></g>`;
const olives = (x: number, y: number) => `<g transform="translate(${x} ${y})"><circle cx="2" cy="3" r="15" fill="#000" opacity=".3"/><circle r="15" fill="${C.cream}"/><circle r="11" fill="#e3d6bd"/>
  ${[[-4, -3], [4, -4], [0, 4], [6, 3], [-5, 5]].map(([a, b]) => `<ellipse cx="${a}" cy="${b}" rx="3.6" ry="2.8" fill="#6f7d3a"/><circle cx="${a + 1}" cy="${b}" r="1" fill="#b5452f"/>`).join('')}</g>`;
const deck = (x: number, y: number, r: number) => `<g transform="translate(${x} ${y}) rotate(${r})">${[3, 1.5, 0].map(o => `<rect x="${-14 + o}" y="${-20 - o}" width="28" height="40" rx="3" fill="${o ? '#e3d6bd' : '#6f2632'}"/>`).join('')}
  <rect x="-10" y="-16" width="20" height="32" rx="2" fill="${C.brass}" opacity=".25"/><path d="M0-8l6 8-6 8-6-8z" fill="${C.brass}" opacity=".8"/></g>`;

/** Offene Karte (Schwimmen) */
function faceCard(x: number, y: number, r: number, t: string, suit: 'herz' | 'karo' | 'pik' | 'kreuz'): string {
  const red = suit === 'herz' || suit === 'karo', c = red ? '#a8343d' : '#1c1a26';
  const sym: Record<string, string> = {
    herz: '<path d="M0 6C-11-1-10-10-4-10c2 0 3 1 4 3 1-2 2-3 4-3 6 0 7 9-4 16z"/>',
    karo: '<path d="M0-10l7 10-7 10-7-10z"/>',
    pik: '<path d="M0-10C-9-2-10 3-6 5c2 1 4 0 5-1l-2 6h6l-2-6c1 1 3 2 5 1 4-2 3-7-6-15z"/>',
    kreuz: '<circle cx="0" cy="-5" r="4.2"/><circle cx="-5" cy="2" r="4.2"/><circle cx="5" cy="2" r="4.2"/><path d="M-1.5 2h3l1.5 8h-6z"/>'
  };
  return `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-18" y="-25" width="40" height="56" rx="4" fill="#000" opacity=".35"/>
  <rect x="-20" y="-28" width="40" height="56" rx="4" fill="${C.cream}"/>
  <text x="-14" y="-12" font-family="Jost, sans-serif" font-weight="600" font-size="12" fill="${c}">${t}</text>
  <g transform="translate(2 6)" fill="${c}">${sym[suit]}</g></g>`;
}

/** Lederbecher mit Würfeln (Schocken) */
function cupAndDice(x: number, y: number): string {
  const die = (dx: number, dy: number, r: number) => `<g transform="translate(${dx} ${dy}) rotate(${r})"><rect x="-7" y="-5.5" width="15" height="15" rx="3" fill="#000" opacity=".35"/>
    <rect x="-7.5" y="-7.5" width="15" height="15" rx="3" fill="${C.cream}"/><circle r="2.2" fill="#a8343d"/></g>`;
  return `<g transform="translate(${x} ${y})"><circle cx="3" cy="4" r="20" fill="#000" opacity=".3"/><circle r="20" fill="${C.brass2}"/><circle r="18" fill="#3a2219"/><circle r="13" fill="#20130e"/>
    ${die(30, -10, 18)}${die(36, 10, -22)}${die(18, 24, 40)}</g>`;
}

/** Bierdeckelstapel in der Mitte (Schocken) */
export function stack(n: number): string {
  const { cx, cy } = TABLE, shown = Math.min(n, 13), x0 = cx - 18;
  const layers = Array.from({ length: shown }, (_, k) => `<circle cx="${x0 + (k % 3) * 1.2}" cy="${cy - k * 2.6}" r="25" fill="${k % 2 ? '#d9cbb0' : '#e6d9bf'}"/>`).join('');
  const top = cy - Math.max(0, shown - 1) * 2.6;
  return `<ellipse cx="${x0 + 3}" cy="${cy + 6}" rx="28" ry="26" fill="#000" opacity=".35"/>${n > 0
    ? layers + `<g transform="translate(${x0} ${top})"><circle r="25" fill="${C.cream}"/><circle r="20" fill="#b5452f"/><circle r="13.5" fill="${C.cream}"/></g>`
    : `<circle cx="${x0}" cy="${cy}" r="25" fill="${C.cream}" opacity=".08"/>`}`;
}

function tableTop(): string {
  const { cx, cy, rx, ry } = TABLE;
  return `<ellipse cx="${cx + 6}" cy="${cy + 20}" rx="${rx + 10}" ry="${ry + 10}" fill="#000" opacity=".45"/>
  <ellipse cx="${cx}" cy="${cy + 8}" rx="${rx}" ry="${ry}" fill="${C.rim}"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${C.rim2}"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${rx - 9}" ry="${ry - 9}" fill="${C.brass2}"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${rx - 11}" ry="${ry - 11}" fill="${C.felt}"/>
  <ellipse cx="${cx - 6}" cy="${cy - 8}" rx="${rx - 40}" ry="${ry - 38}" fill="${C.felt2}"/>
  <ellipse cx="${cx - 12}" cy="${cy - 14}" rx="${rx - 76}" ry="${ry - 72}" fill="#2a6555" opacity=".7"/>`;
}

/** Ganze Szene ohne Mitte und ohne Spielersachen (die zeichnet der Aufrufer dazu) */
export function room(kind: 'lives' | 'tokens'): string {
  const { cx, cy } = TABLE;
  const props = kind === 'lives' ? deck(cx + 42, cy - 30, 18) : cupAndDice(cx + 30, cy + 2);
  return `<defs><filter id="tb-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter></defs>
  ${backBar(kind)}${floor()}${tableTop()}
  ${candle(cx - 44, cy - 34)}${tumbler(cx + 44, cy + 32)}${beer(cx - 40, cy + 34)}${olives(cx + 4, cy + 46)}${props}
  ${lamps()}`;
}

/** Schwimmen: drei offene Karten in der Mitte, sie wechseln mit jeder Runde */
const SUITS = ['herz', 'karo', 'pik', 'kreuz'] as const;
const VALUES = ['7', '8', '9', '10', 'B', 'D', 'K', 'A'];
export function middleCards(round: number): string {
  const { cx, cy } = TABLE;
  const pick = (k: number) => { const n = (round * 7 + k * 11 + 3) % 32; return { t: VALUES[n % 8], s: SUITS[Math.floor(n / 8)] }; };
  return [-1, 0, 1].map(k => { const c = pick(k + 1); return faceCard(cx - 14 + k * 26, cy - 8 + Math.abs(k) * 4, k * 12, c.t, c.s); }).join('');
}
