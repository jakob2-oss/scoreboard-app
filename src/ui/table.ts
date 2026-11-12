/**
 * Tisch-Modus: Raum mit Holzwand und runder Tisch von oben, flach und geometrisch (siehe docs/DESIGN.md).
 * Farben kommen aus CSS-Variablen (--tb-*), damit Hell und Dunkel zum Rest der App passen.
 * Die Zeichnung reicht über den viewBox hinaus, damit sie jede Bildschirmhöhe füllt.
 */
export const VIEW = { w: 390, h: 640 };
/** Mittelpunkt und Radien des Tisches; Sitzplätze liegen auf einer größeren Ellipse */
export const TABLE = { cx: 195, cy: 390, rx: 132, ry: 120 };
export const SEATS = { rx: 152, ry: 172 };
const WALL = 214;

const v = (n: string) => `var(--tb-${n})`;
const dots = (cx: number, cy: number, r: number, n: number, dr: number, fill: string, off = 0) =>
  Array.from({ length: n }, (_, k) => { const a = off + (k / n) * Math.PI * 2; return `<circle cx="${(cx + r * Math.cos(a)).toFixed(1)}" cy="${(cy + r * Math.sin(a) * .92).toFixed(1)}" r="${dr}" fill="${fill}"/>`; }).join('');

// ---------------------------------------------------------------- Wand
function wall(): string {
  const planks = Array.from({ length: 16 }, (_, k) => {
    const x = -210 + k * 50, c = k % 3 === 0 ? v('w2') : k % 3 === 1 ? v('w1') : v('w3');
    // Astlöcher als Punkte, Maserung als schmale Streifen
    const knot = k % 4 === 1 ? `<ellipse cx="${x + 22}" cy="${40 + (k * 37) % 120}" rx="5" ry="7" fill="${v('wk')}"/><ellipse cx="${x + 22}" cy="${40 + (k * 37) % 120}" rx="2" ry="3" fill="${v('w2')}"/>` : '';
    return `<rect x="${x}" y="-500" width="48" height="${WALL + 500}" fill="${c}"/><rect x="${x + 48}" y="-500" width="2" height="${WALL + 500}" fill="${v('wg')}"/>
      <rect x="${x + 12}" y="${-40 + (k * 53) % 90}" width="3" height="${60 + (k * 17) % 50}" rx="1.5" fill="${v('wk')}" opacity=".35"/>${knot}`;
  }).join('');
  return `${planks}
  <rect x="-210" y="${WALL - 20}" width="810" height="14" fill="${v('trim')}"/><rect x="-210" y="${WALL - 6}" width="810" height="6" fill="${v('wg')}"/>`;
}

/** Lichterkette mit Punkten quer über die Wand */
function lights(): string {
  const cols = ['#f3a98f', '#f2cf86', '#86cbb8', '#97c4e3', '#eda7bf', '#bba8e6'];
  const pts = Array.from({ length: 13 }, (_, k) => { const x = -6 + k * 33.5, y = 22 + Math.sin(k / 12 * Math.PI) * 26 + (k % 2) * 3; return [x, y] as const; });
  return `<path d="M-20 18Q195 92 410 18" stroke="${v('cord')}" stroke-width="2" fill="none"/>
  ${pts.map(([x, y], k) => `<g class="tb-blink" style="animation-delay:${-k * .7}s"><circle cx="${x}" cy="${y + 7}" r="9" fill="${cols[k % 6]}" opacity=".28"/><circle cx="${x}" cy="${y + 7}" r="4.6" fill="${cols[k % 6]}"/></g><rect x="${x - 1.6}" y="${y}" width="3.2" height="4" rx="1" fill="${v('cord')}"/>`).join('')}`;
}

/** Bilderrahmen mit kleiner Landschaft: See, Berge, Sonne */
function picture(x: number, y: number): string {
  return `<g transform="translate(${x} ${y})">
  <rect x="2" y="4" width="86" height="70" rx="6" fill="#000" opacity=".12"/>
  <rect width="86" height="68" rx="6" fill="${v('frame')}"/><rect x="7" y="7" width="72" height="54" rx="3" fill="#fffaf2"/>
  <rect x="11" y="11" width="64" height="46" rx="2" fill="#cfe6f3"/>
  <circle cx="58" cy="24" r="7" fill="#f5d58c"/>
  <path d="M11 44l15-18 11 12 9-9 15 15 14-10v23H11z" fill="#9cc7b6"/><path d="M26 26l5 6h-10z" fill="#fffaf2"/>
  <rect x="11" y="45" width="64" height="12" fill="#97c4e3"/><rect x="18" y="49" width="16" height="2.4" rx="1.2" fill="#fffaf2" opacity=".8"/><rect x="44" y="52" width="20" height="2.4" rx="1.2" fill="#fffaf2" opacity=".8"/>
  <path d="M40 46h12l-2 4h-8z" fill="#ef7a5c"/><path d="M45 34v12h-6z" fill="#fffaf2"/>
  <circle cx="43" cy="-14" r="2.6" fill="${v('cord')}"/><path d="M43-14L12 1M43-14L74 1" stroke="${v('cord')}" stroke-width="1.6"/></g>`;
}

/** Wanduhr mit Punkten als Ziffern */
function clock(x: number, y: number): string {
  return `<g transform="translate(${x} ${y})"><circle cx="2" cy="3" r="27" fill="#000" opacity=".12"/><circle r="27" fill="${v('frame')}"/><circle r="21" fill="#fffaf2"/>
  ${dots(0, 0, 16, 12, 1.7, '#5b5a8f')}<circle r="2.6" fill="#ef7a5c"/>
  <rect x="-1.4" y="-13" width="2.8" height="14" rx="1.4" fill="#5b5a8f" class="tb-hand"/><rect x="-1.2" y="-1" width="2.4" height="10" rx="1.2" fill="#5b5a8f" transform="rotate(118)"/></g>`;
}

/** Geweih auf Holzschild */
function antlers(x: number, y: number): string {
  const c = v('bone');
  const side = (s: number) => `<path d="M${s * 8} 2C${s * 22}-6 ${s * 30}-22 ${s * 30}-42" stroke="${c}" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M${s * 25}-14C${s * 34}-16 ${s * 42}-22 ${s * 46}-32" stroke="${c}" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M${s * 29}-30C${s * 22}-38 ${s * 18}-46 ${s * 18}-54" stroke="${c}" stroke-width="4.5" stroke-linecap="round" fill="none"/>
    <path d="M${s * 30}-40C${s * 38}-46 ${s * 40}-54 ${s * 40}-62" stroke="${c}" stroke-width="4" stroke-linecap="round" fill="none"/>`;
  return `<g transform="translate(${x} ${y})"><ellipse cx="2" cy="16" rx="20" ry="25" fill="#000" opacity=".12"/>${side(1)}${side(-1)}
  <ellipse cy="13" rx="19" ry="24" fill="${v('frame')}"/><ellipse cy="13" rx="13" ry="17" fill="${v('w3')}"/><circle cy="13" r="4" fill="${v('frame')}"/></g>`;
}

/** Regal mit Gläsern, Flasche, Pflanze und Büchern */
function shelf(x: number, y: number, extra: string): string {
  return `<g transform="translate(${x} ${y})">
  <rect x="-4" y="2" width="120" height="10" rx="3" fill="#000" opacity=".12"/>
  <rect x="8" y="10" width="7" height="18" rx="2" fill="${v('trim')}"/><rect x="94" y="10" width="7" height="18" rx="2" fill="${v('trim')}"/>
  <rect x="-6" y="0" width="122" height="10" rx="3" fill="${v('frame')}"/>
  <g transform="translate(14 0)"><rect x="-9" y="-30" width="18" height="30" rx="5" fill="#d8ecf3" opacity=".9"/><rect x="-9" y="-30" width="18" height="6" rx="3" fill="#c99a62"/>
    ${[0, 1, 2, 3, 4].map(k => `<rect x="${-6 + k * 2.6}" y="-20" width="1.8" height="18" rx=".9" fill="#d9a35a" transform="rotate(${k * 6 - 12} 0 -2)"/>`).join('')}</g>
  <g transform="translate(36 0)"><rect x="-5" y="-44" width="10" height="12" rx="3" fill="#7fae8f"/><path d="M-9-34h18l2 34h-22z" fill="#86cbb8"/><rect x="-7" y="-22" width="14" height="10" rx="2" fill="#fffaf2"/><circle cy="-17" r="2.6" fill="#ef7a5c"/></g>
  <g transform="translate(60 0)"><path d="M-10-14h20l-3 14h-14z" fill="#ef7a5c"/><rect x="-11" y="-17" width="22" height="5" rx="2" fill="#f3a98f"/>
    <path d="M0-17C-2-30-12-34-16-30c4 6 10 10 16 13z" fill="#7fae8f"/><path d="M0-17C2-32 12-38 17-33c-4 7-10 12-17 16z" fill="#9cc77e"/><path d="M0-17c0-12 0-18 2-24 3 6 2 14-2 24z" fill="#86cbb8"/></g>
  ${extra}
  <g transform="translate(96 0)"><rect x="-12" y="-26" width="8" height="26" rx="2" fill="#97c4e3"/><rect x="-3" y="-30" width="9" height="30" rx="2" fill="#bba8e6"/><rect x="7" y="-22" width="7" height="22" rx="2" fill="#f2cf86" transform="rotate(10 10 0)"/></g></g>`;
}

/** Schlüsselbrett mit drei Haken */
function keys(x: number, y: number): string {
  const key = (kx: number, c: string, r: number) => `<g transform="translate(${kx} 9) rotate(${r})"><rect x="-1.4" y="0" width="2.8" height="18" rx="1.4" fill="${c}"/><circle cy="0" r="5" fill="${c}"/><circle cy="0" r="2" fill="${v('frame')}"/><rect x="0" y="12" width="5" height="2.4" fill="${c}"/><rect x="0" y="16" width="4" height="2" fill="${c}"/></g>`;
  return `<g transform="translate(${x} ${y})"><rect x="0" y="2" width="56" height="9" rx="3" fill="#000" opacity=".12"/><rect width="56" height="8" rx="3" fill="${v('frame')}"/>
  ${[12, 28, 44].map(k => `<circle cx="${k}" cy="6" r="2" fill="${v('cord')}"/>`).join('')}${key(12, '#f2cf86', 6)}${key(28, '#c9c6dc', -4)}<path d="M44 8l-6 16h12z" fill="#ef7a5c"/><circle cx="44" cy="26" r="3" fill="#f3a98f"/></g>`;
}

/** Hängelampe über dem Tisch: Schirm, Glühbirne, Lichtkegel als flache Kreise */
function lamp(): string {
  const { cx, cy } = TABLE;
  return `<g class="tb-glow">${[1, .78, .56].map((s, k) => `<ellipse cx="${cx}" cy="${cy - 6}" rx="${210 * s}" ry="${180 * s}" fill="${v('glow')}" opacity="${.08 + k * .05}"/>`).join('')}</g>
  <rect x="${cx - 1.5}" y="-500" width="3" height="${562}" fill="${v('cord')}"/>
  <g class="tb-sway" style="transform-origin:${cx}px 0px">
    <rect x="${cx - 7}" y="56" width="14" height="10" rx="3" fill="${v('cord')}"/>
    <path d="M${cx - 34} 96a34 32 0 0 1 68 0z" fill="${v('shade')}"/><rect x="${cx - 36}" y="92" width="72" height="7" rx="3.5" fill="${v('shade2')}"/>
    <circle cx="${cx}" cy="101" r="8" fill="#fff4cf"/>
  </g>`;
}

// ---------------------------------------------------------------- Boden und Teppich
function floor(): string {
  const boards = Array.from({ length: 22 }, (_, k) => `<rect x="-210" y="${WALL + k * 30}" width="810" height="28" fill="${k % 2 ? v('f1') : v('f2')}"/>
    <rect x="${-200 + (k * 137) % 300}" y="${WALL + k * 30}" width="3" height="28" fill="${v('fg')}"/><rect x="${80 + (k * 211) % 360}" y="${WALL + k * 30}" width="3" height="28" fill="${v('fg')}"/>`).join('');
  const { cx, cy } = TABLE;
  return `${boards}
  <ellipse cx="${cx}" cy="${cy + 18}" rx="208" ry="196" fill="${v('rug1')}"/>
  <ellipse cx="${cx}" cy="${cy + 18}" rx="196" ry="184" fill="${v('rug2')}"/>
  ${dots(cx, cy + 18, 186, 44, 3.4, v('rug3'))}
  <ellipse cx="${cx}" cy="${cy + 18}" rx="176" ry="164" fill="${v('rug1')}"/>`;
}

// ---------------------------------------------------------------- Tisch und Dinge darauf
const glass = (x: number, y: number, beer = true) => `<g transform="translate(${x} ${y})">${coaster(0, 0, 17, '#f3a98f')}
  <circle cx="2" cy="3" r="12" fill="#000" opacity=".12"/><circle r="12" fill="${beer ? '#f2cf86' : '#d8ecf3'}"/><circle r="9" fill="${beer ? '#fff8e6' : '#eaf5f9'}"/>
  ${beer ? '<circle cx="-3" cy="-2" r="3" fill="#fff"/><circle cx="3" cy="2" r="2" fill="#fff"/><circle cx="2" cy="-4" r="1.5" fill="#fff"/>' : '<rect x="-5" y="-1" width="10" height="2" rx="1" fill="#97c4e3"/>'}</g>`;
const coaster = (x: number, y: number, r: number, c: string) => `<g transform="translate(${x} ${y})"><circle r="${r}" fill="#fffaf2"/><circle r="${r * .8}" fill="${c}"/><circle r="${r * .5}" fill="#fffaf2"/></g>`;
const pretzels = (x: number, y: number) => {
  const p = (px: number, py: number, r: number) => `<g transform="translate(${px} ${py}) rotate(${r})"><path d="M0 6C-10 6-12-6-5-6c4 0 5 5 5 8 0-3 1-8 5-8 7 0 5 12-5 12" stroke="#c4834b" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <circle cx="-4" cy="-2" r=".9" fill="#fff"/><circle cx="4" cy="0" r=".9" fill="#fff"/></g>`;
  return `<g transform="translate(${x} ${y})"><circle cx="2" cy="4" r="25" fill="#000" opacity=".12"/><circle r="25" fill="#97c4e3"/><circle r="19" fill="#bcdcef"/>
  ${p(-6, -5, 10)}${p(7, 3, -30)}${p(-4, 9, 60)}${p(8, -9, 120)}</g>`;
};
const nuts = (x: number, y: number) => `<g transform="translate(${x} ${y})"><circle cx="2" cy="3" r="16" fill="#000" opacity=".12"/><circle r="16" fill="#eda7bf"/><circle r="12" fill="#f6cfdc"/>
  ${[[-5, -3], [4, -5], [0, 3], [6, 4], [-5, 5]].map(([a, b], k) => `<ellipse cx="${a}" cy="${b}" rx="3.6" ry="2.6" fill="#d9a35a" transform="rotate(${k * 40} ${a} ${b})"/>`).join('')}</g>`;
const candle = (x: number, y: number) => `<g transform="translate(${x} ${y})"><circle r="26" fill="#fff4cf" opacity=".22" class="tb-flicker"/><circle cx="2" cy="3" r="13" fill="#000" opacity=".12"/>
  <circle r="13" fill="#bba8e6"/><circle r="9" fill="#fffaf2"/><circle r="4" fill="#f2cf86" class="tb-flicker"/><circle r="1.8" fill="#ef7a5c"/></g>`;
const pad = (x: number, y: number, r: number) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-17" y="-22" width="38" height="48" rx="4" fill="#000" opacity=".12"/>
  <rect x="-19" y="-24" width="38" height="48" rx="4" fill="#fffaf2"/><rect x="-19" y="-24" width="38" height="9" rx="4" fill="#ef7a5c"/>
  ${[0, 1, 2, 3].map(k => `<rect x="-13" y="${-9 + k * 7}" width="${k % 2 ? 18 : 26}" height="2.4" rx="1.2" fill="#dcd6e8"/>`).join('')}
  <circle cx="-9" cy="-19.5" r="1.4" fill="#fff"/><circle cx="-4" cy="-19.5" r="1.4" fill="#fff"/><circle cx="1" cy="-19.5" r="1.4" fill="#fff"/>
  <g transform="translate(14 8) rotate(-56)"><rect x="-20" y="-3" width="32" height="6" fill="#f2cf86"/><rect x="-24" y="-3" width="5" height="6" rx="2" fill="#eda7bf"/><path d="M12-3l7 3-7 3z" fill="#f6dcb0"/><path d="M17-1l2 1-2 1z" fill="#5b5a8f"/></g></g>`;
const cardBack = (x: number, y: number, r: number) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-15" y="-21" width="30" height="42" rx="4" fill="#fffaf2"/>
  <rect x="-12" y="-18" width="24" height="36" rx="3" fill="#5fa8d3"/>${[-9, 0, 9].map(b => [-6, 0, 6].map(a => `<circle cx="${a}" cy="${b}" r="1.6" fill="#bcdcef"/>`).join('')).join('')}</g>`;

/** Offene Karte (Schwimmen): Wert und Farbe */
function faceCard(x: number, y: number, r: number, t: string, suit: 'herz' | 'karo' | 'pik' | 'kreuz'): string {
  const red = suit === 'herz' || suit === 'karo', c = red ? '#e0705a' : '#4d4a7a';
  const sym: Record<string, string> = {
    herz: '<path d="M0 6C-11-1-10-10-4-10c2 0 3 1 4 3 1-2 2-3 4-3 6 0 7 9-4 16z"/>',
    karo: '<path d="M0-10l7 10-7 10-7-10z"/>',
    pik: '<path d="M0-10C-9-2-10 3-6 5c2 1 4 0 5-1l-2 6h6l-2-6c1 1 3 2 5 1 4-2 3-7-6-15z"/>',
    kreuz: '<circle cx="0" cy="-5" r="4.2"/><circle cx="-5" cy="2" r="4.2"/><circle cx="5" cy="2" r="4.2"/><path d="M-1.5 2h3l1.5 8h-6z"/>'
  };
  return `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-19" y="-26" width="40" height="56" rx="5" fill="#000" opacity=".14"/>
  <rect x="-20" y="-28" width="40" height="56" rx="5" fill="#fffaf2"/>
  <text x="-14" y="-12" font-family="Jost, sans-serif" font-weight="600" font-size="12" fill="${c}">${t}</text>
  <g transform="translate(2 6)" fill="${c}">${sym[suit]}</g></g>`;
}

/** Würfelbecher mit herausgefallenen Würfeln (Schocken) */
function cupAndDice(x: number, y: number): string {
  const die = (dx: number, dy: number, r: number, face: number) => {
    const o = 4.2, P: Record<number, number[][]> = { 1: [[0, 0]], 2: [[-o, -o], [o, o]], 3: [[-o, -o], [0, 0], [o, o]], 6: [[-o, -o], [o, -o], [-o, 0], [o, 0], [-o, o], [o, o]] };
    return `<g transform="translate(${dx} ${dy}) rotate(${r})"><rect x="-8" y="-6.5" width="17" height="17" rx="4" fill="#000" opacity=".14"/><rect x="-8.5" y="-8.5" width="17" height="17" rx="4" fill="#fffaf2"/>
      ${P[face].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="1.7" fill="${face === 1 ? '#e0705a' : '#4d4a7a'}"/>`).join('')}</g>`;
  };
  // Becher liegt auf der Seite, Öffnung zu den Würfeln
  return `<g transform="translate(${x} ${y})"><g transform="rotate(-24)"><rect x="-26" y="-14" width="52" height="30" rx="8" fill="#000" opacity=".14"/>
    <path d="M-26-16h40l12 4v24l-12 4h-40z" fill="#8a5a3c"/><rect x="-30" y="-17" width="8" height="34" rx="3" fill="#a8714c"/>
    <rect x="-14" y="-16" width="5" height="32" fill="#6f4630"/><rect x="2" y="-16" width="5" height="32" fill="#6f4630"/><ellipse cx="26" cy="0" rx="5" ry="12" fill="#5a3826"/></g>
    ${die(42, 4, 18, 1)}${die(58, -12, -14, 1)}${die(54, 18, 40, 6)}</g>`;
}

/** Bierdeckelstapel in der Mitte (Schocken) */
export function stack(n: number): string {
  const { cx, cy } = TABLE, shown = Math.min(n, 13);
  const layers = Array.from({ length: shown }, (_, k) => `<g transform="translate(${cx - 18 + (k % 3) * 1.2} ${cy - k * 2.6})"><circle r="26" fill="${k % 2 ? '#e9d9bf' : '#f1e4cc'}"/></g>`).join('');
  const top = cy - Math.max(0, shown - 1) * 2.6;
  return `<ellipse cx="${cx - 16}" cy="${cy + 6}" rx="30" ry="26" fill="#000" opacity=".14"/>${n > 0 ? layers + `<g transform="translate(${cx - 18} ${top})"><circle r="26" fill="#fffaf2"/><circle r="21" fill="#f3a98f"/><circle r="14" fill="#fffaf2"/>
    ${dots(0, 0, 17.5, 16, 1.2, '#fffaf2')}</g>` : `<circle cx="${cx - 18}" cy="${cy}" r="26" fill="#fffaf2" opacity=".22"/>`}`;
}

function tableTop(): string {
  const { cx, cy, rx, ry } = TABLE;
  const planks = Array.from({ length: 7 }, (_, k) => `<rect x="${cx - rx + k * (2 * rx / 7)}" y="${cy - ry}" width="${2 * rx / 7 - 2}" height="${2 * ry}" fill="${k % 2 ? v('t1') : v('t2')}"/>`).join('');
  const grain = Array.from({ length: 9 }, (_, k) => `<rect x="${cx - rx + 14 + k * 30}" y="${cy - ry + 20 + (k * 41) % 120}" width="3" height="${40 + (k * 23) % 60}" rx="1.5" fill="${v('tg')}" opacity=".5"/>`).join('');
  return `<ellipse cx="${cx + 4}" cy="${cy + 16}" rx="${rx + 6}" ry="${ry + 6}" fill="#000" opacity=".2"/>
  <ellipse cx="${cx}" cy="${cy + 8}" rx="${rx}" ry="${ry}" fill="${v('te')}"/>
  <clipPath id="tb-clip"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath>
  <g clip-path="url(#tb-clip)">${planks}${grain}</g>
  <ellipse cx="${cx}" cy="${cy}" rx="${rx - 14}" ry="${ry - 13}" fill="${v('tg')}" opacity=".18"/>`;
}

/** Ganze Szene. Die Mitte (Karten bzw. Deckelstapel) zeichnet der Aufrufer dazu. */
export function room(kind: 'lives' | 'tokens'): string {
  const { cx, cy } = TABLE;
  const shelfExtra = kind === 'tokens'
    ? `<g transform="translate(78 -2)"><path d="M-8-22h16l-2 22h-12z" fill="#8a5a3c"/><rect x="-9" y="-25" width="18" height="5" rx="2" fill="#a8714c"/></g>`
    : `<g transform="translate(78 0)"><circle cy="-10" r="10" fill="#fffaf2"/>${[0, 1, 2, 3].map(k => `<path d="M0-10L${10 * Math.cos(k * 1.57 + .4)} ${-10 + 10 * Math.sin(k * 1.57 + .4)}A10 10 0 0 1 ${10 * Math.cos(k * 1.57 + 1.1)} ${-10 + 10 * Math.sin(k * 1.57 + 1.1)}z" fill="#ef7a5c"/>`).join('')}<circle cy="-10" r="5" fill="${v('w1')}"/></g>`;
  const props = kind === 'lives'
    ? cardBack(cx + 62, cy - 4, 14) + cardBack(cx + 64, cy - 7, 20) + cardBack(cx + 66, cy - 10, 26)
    : cupAndDice(cx + 22, cy + 6);
  return `${wall()}${lights()}${picture(14, 66)}${keys(30, 162)}<g transform="translate(136 128) scale(.86)">${antlers(0, 0)}</g>${clock(258, 92)}<g transform="translate(286 164) scale(.86)">${shelf(0, 0, shelfExtra)}</g>
  ${floor()}${lamp()}${tableTop()}
  ${glass(cx - 82, cy - 52)}${glass(cx + 88, cy + 50, kind === 'lives')}${glass(cx - 30, cy + 88, false)}
  ${pretzels(cx + 70, cy - 66)}${nuts(cx - 92, cy + 30)}${candle(cx - 8, cy - 86)}${pad(cx + 30, cy + 80, 16)}
  ${coaster(cx - 60, cy + 70, 13, '#f2cf86')}${coaster(cx + 104, cy - 16, 12, '#86cbb8')}
  ${props}`;
}

/** Schwimmen: drei offene Karten in der Mitte, sie wechseln mit jeder Runde */
const SUITS = ['herz', 'karo', 'pik', 'kreuz'] as const;
const VALUES = ['7', '8', '9', '10', 'B', 'D', 'K', 'A'];
export function middleCards(round: number): string {
  const { cx, cy } = TABLE;
  const pick = (k: number) => { const n = (round * 7 + k * 11 + 3) % 32; return { t: VALUES[n % 8], s: SUITS[Math.floor(n / 8)] }; };
  return [-1, 0, 1].map(k => { const c = pick(k + 1); return faceCard(cx - 26 + k * 30, cy + Math.abs(k) * 4, k * 12, c.t, c.s); }).join('');
}
