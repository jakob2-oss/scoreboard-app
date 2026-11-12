import { GAMES } from '../game/games';
import { pastel } from '../lib/color';
// Illustrationen für Spielseiten (flach, geometrisch, eigene Zeichnungen). Siehe docs/DESIGN.md.
const st = (x: number, y: number, r: number) =>
  `M${x} ${y - r}l${r * .3} ${r * .7} ${r * .7} ${r * .3}-${r * .7} ${r * .3}-${r * .3} ${r * .7}-${r * .3}-${r * .7}-${r * .7}-${r * .3} ${r * .7}-${r * .3}z`;

/** Icon „Freies Spiel“: leerer Zettel mit Bleistift */
const FREE_ICON_RAW = `<svg viewBox="0 0 64 64" aria-hidden="true">
  <g transform="rotate(-8 30 34)">
    <rect x="14" y="12" width="32" height="42" rx="6" fill="#ffffff"/>
    <path d="M14 18a6 6 0 0 1 6-6h20a6 6 0 0 1 6 6v3H14z" fill="#ef7a5c"/>
    <circle cx="22" cy="28" r="2.6" fill="none" stroke="#ef7a5c" stroke-width="1.6"/><circle cx="30" cy="28" r="2.6" fill="none" stroke="#3fb39b" stroke-width="1.6"/><circle cx="38" cy="28" r="2.6" fill="none" stroke="#f0b13e" stroke-width="1.6"/>
    <path d="M19 36h22M19 42h22M19 48h22" stroke="#dcd6e8" stroke-width="2" stroke-linecap="round"/>
  </g>
  <g transform="translate(46 40) rotate(130)"><rect x="-17" y="-4.5" width="6" height="9" rx="2.5" fill="#f19aa9"/><rect x="-12" y="-4.5" width="22" height="9" fill="#f0b13e"/><path d="M10-4.5l8 4.5-8 4.5z" fill="#f6dcb0"/><path d="M15.5-1.4l2.5 1.4-2.5 1.4z" fill="#2e2b4f"/></g>
  <circle cx="51" cy="13" r="3" fill="#f0b13e"/><circle cx="10" cy="14" r="2" fill="#9a7ad6"/>
</svg>`;

/** Szene „Freies Spiel“: leere Zettel auf Indigo mit Farbpunkten */
const FREE_SCENE_RAW = `<svg class="scene" viewBox="0 0 390 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <rect width="390" height="250" fill="#e4def2"/>
  <path d="M-20 60L110-20h70L-20 120z" fill="#ece7f7"/><path d="M250 270L410 100v70L320 270z" fill="#ece7f7"/>
  <circle cx="195" cy="270" r="175" fill="#d9d1ef"/><circle cx="195" cy="270" r="125" fill="#cfc5ea"/>
  <g fill="#ffffff" opacity=".85"><circle cx="48" cy="46" r="3.5"/><circle cx="338" cy="58" r="3"/><circle cx="300" cy="22" r="2.5"/></g>
  <g><circle cx="86" cy="104" r="7" fill="#ef7a5c"/><circle cx="62" cy="150" r="5" fill="#f0b13e"/><circle cx="110" cy="62" r="4" fill="#3fb39b"/>
    <circle cx="318" cy="118" r="7" fill="#3fb39b"/><circle cx="344" cy="160" r="5" fill="#e2709a"/><circle cx="276" cy="70" r="4" fill="#f0b13e"/>
    <circle cx="150" cy="30" r="3.5" fill="#5fa8d3"/><circle cx="236" cy="28" r="3.5" fill="#e2709a"/></g>
  <ellipse cx="200" cy="232" rx="96" ry="8" fill="#000" opacity=".16"/>
  <g transform="rotate(9 214 150)"><rect x="160" y="74" width="112" height="150" rx="14" fill="#f7f4fc"/></g>
  <g transform="rotate(-6 190 150)">
    <rect x="134" y="70" width="114" height="156" rx="14" fill="#ffffff"/>
    <path d="M134 84a14 14 0 0 1 14-14h86a14 14 0 0 1 14 14v12H134z" fill="#ef7a5c"/>
    <g fill="#fff" opacity=".9"><circle cx="146" cy="83" r="3"/><circle cx="155" cy="83" r="3"/><circle cx="164" cy="83" r="3"/></g>
    <circle cx="160" cy="118" r="7" fill="none" stroke="#ef7a5c" stroke-width="3"/><circle cx="191" cy="118" r="7" fill="none" stroke="#3fb39b" stroke-width="3"/><circle cx="222" cy="118" r="7" fill="none" stroke="#f0b13e" stroke-width="3"/>
    <path d="M148 142h86M148 164h86M148 186h86M148 208h86" stroke="#dcd6e8" stroke-width="3" stroke-linecap="round"/>
    <path d="M175 132v86M207 132v86" stroke="#dcd6e8" stroke-width="3" stroke-linecap="round"/>
  </g>
  <g transform="translate(276 158) rotate(128)">
    <rect x="-84" y="-12" width="20" height="24" rx="8" fill="#f19aa9"/><rect x="-66" y="-12" width="12" height="24" fill="#c9c6dc"/>
    <rect x="-54" y="-12" width="88" height="24" fill="#f0b13e"/><rect x="-54" y="-12" width="88" height="8" fill="#fff" opacity=".25"/><rect x="-54" y="4" width="88" height="8" fill="#d9952a"/>
    <path d="M34-12l24 12-24 12z" fill="#f6dcb0"/><path d="M49-4l9 4-9 4z" fill="#2e2b4f"/>
  </g>
</svg>`;

// ---------------------------------------------------------------- Spiele (aus dem Prototyp übernommen)
const SUIT: Record<string, string> = {
  heart: 'M0-5C0-13-12-13-12-4c0 8 12 13 12 18 0-5 12-10 12-18 0-9-12-9-12-1z',
  spade: 'M0-14C-2-6-12-2-12 5c0 6 7 8 11 3l-3 8h8l-3-8c4 5 11 3 11-3 0-7-10-11-12-19z',
  diamond: 'M0-14L10 0 0 14-10 0z',
  club: 'M0-13a6 6 0 0 1 5.5 8.4A6 6 0 1 1 2.5 6L5 14h-10l2.5-8A6 6 0 1 1-5.5-4.6 6 6 0 0 1 0-13z'
};
const suit = (k: string, x: number, y: number, s: number, rot: number, fill: string, op = 1) =>
  `<path d="${SUIT[k]}" transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" fill="${fill}" opacity="${op}"/>`;
const numCard = (x: number, y: number, rot: number, v: number, c: string, w = 44) => `<g transform="translate(${x} ${y}) rotate(${rot})">
  <rect x="${-w / 2}" y="${-w * .7}" width="${w}" height="${w * 1.4}" rx="${w * .16}" fill="${c}"/>
  <circle r="${w * .3}" fill="#fff" opacity=".92"/>
  <text y="${w * .11}" text-anchor="middle" font-family="Jost, sans-serif" font-weight="600" font-size="${w * .32}" fill="${c}">${String(v).replace('-', '\u2212')}</text></g>`;
const cloud = (x: number, y: number, s: number, c: string) =>
  `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><circle cx="-22" cy="4" r="16"/><circle cx="0" cy="-6" r="22"/><circle cx="24" cy="4" r="15"/><rect x="-38" y="4" width="76" height="16" rx="8"/></g>`;
const SCENE_OPEN = '<svg class="scene" viewBox="0 0 390 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true">';

export const GAME_ART: Record<string, { icon: string; scene: string }> = {
  wizard: {
    icon: `<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="51" rx="25" ry="6.5" fill="#b3a6e4"/>
      <path d="M13 51c9-4 13-21 18-42 6 13 12 31 20 42z" fill="#9a7ad6"/><path d="M17 47c9-3 21-3 30 0l2 4c-11-3-22-3-34 0z" fill="#f6d27a"/>
      <path d="${st(33, 31, 6)}" fill="#f6d27a"/><path d="${st(51, 15, 4.5)}" fill="#f6d27a"/><circle cx="13" cy="22" r="2.2" fill="#a99be8"/></svg>`,
    scene: `${SCENE_OPEN}<rect width="390" height="250" fill="#d9d2f3"/><circle cx="80" cy="30" r="120" fill="#e3ddf7"/>
      <g fill="#ffffff"><circle cx="30" cy="40" r="1.8" opacity=".7"/><circle cx="140" cy="28" r="1.5" opacity=".6"/><circle cx="210" cy="50" r="2" opacity=".7"/><circle cx="360" cy="120" r="1.6" opacity=".6"/>
        <path d="${st(180, 26, 6)}"/><path d="${st(42, 96, 4.5)}" opacity=".8"/><path d="${st(352, 34, 4)}" opacity=".8"/></g>
      <circle cx="305" cy="70" r="34" fill="#f6d27a"/><circle cx="322" cy="58" r="30" fill="#d9d2f3"/>
      <path d="M0 190l55-48 50 32 62-56 72 60 58-44 93 50v66H0z" fill="#c5baec"/><path d="M0 214c70-26 130-28 190-10s120 10 200-6v52H0z" fill="#b3a6e4"/>
      <rect x="52" y="118" width="34" height="98" fill="#9b8cd6"/><path d="M45 121l24-46 24 46z" fill="#9a7ad6"/><path d="M69 75v-14l12 5-12 5" fill="#f6d27a"/>
      <rect x="64" y="138" width="10" height="14" rx="5" fill="#f6d27a"/><rect x="64" y="168" width="10" height="14" rx="5" fill="#f6d27a" opacity=".6"/>
      <path d="M0 234c110-22 220-18 300-4s70 0 90-4v24H0z" fill="#9b8cd6"/>
      <path d="M92 98c40-60 100-60 112-20" fill="none" stroke="#f6d27a" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="0 12"/>
      <g transform="translate(206 128) rotate(-14)"><rect x="-24" y="-34" width="48" height="68" rx="8" fill="#ffffff"/><rect x="-17" y="-27" width="34" height="54" rx="5" fill="#9a7ad6"/><path d="${st(0, 0, 13)}" fill="#f6d27a"/></g>
      <g transform="translate(258 116) rotate(12)"><rect x="-24" y="-34" width="48" height="68" rx="8" fill="#ffffff"/><rect x="-17" y="-27" width="34" height="54" rx="5" fill="#3fb5a3"/>
        <circle cx="0" cy="-4" r="9" fill="#ffffff"/><path d="M-11 14q11-10 22 0" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/></g></svg>`
  },
  romme: {
    icon: `<svg viewBox="0 0 64 64" aria-hidden="true"><g transform="translate(32 57)">
      <rect x="-13" y="-46" width="26" height="36" rx="4" fill="#ef7a5c" transform="rotate(-24)"/>
      <rect x="-13" y="-48" width="26" height="36" rx="4" fill="#3fb39b"/>
      <g transform="rotate(24)"><rect x="-13" y="-46" width="26" height="36" rx="4" fill="#fbf3e6"/>${suit('heart', 0, -29, .62, 0, '#ef7a5c')}</g></g></svg>`,
    scene: `${SCENE_OPEN}<rect width="390" height="250" fill="#f6d5cb"/>
      <path d="M-20 70L130-20h90L-20 140z" fill="#f9e0d8"/><path d="M170 250L390 110v80l-100 60z" fill="#f9e0d8"/>
      <circle cx="322" cy="54" r="30" fill="#f5d58c"/>
      ${suit('heart', 58, 72, 2.4, -14, '#fbf3e6', .95)}${suit('spade', 340, 150, 1.7, 14, '#5b5a8f')}${suit('diamond', 128, 140, 1.25, 8, '#f5d58c')}${suit('club', 236, 40, 1.35, -10, '#3fb39b')}
      <path d="M0 192q195-40 390 0v58H0z" fill="#bfe0d2"/><path d="M0 192q195-40 390 0" fill="none" stroke="#d3ebe1" stroke-width="7"/>
      <ellipse cx="195" cy="203" rx="80" ry="8" fill="#000" opacity=".15"/>
      ${([['A', 'heart', '#ef7a5c', -30], ['K', 'spade', '#5b5a8f', -10], ['D', 'diamond', '#ef7a5c', 10], ['B', 'club', '#3fb39b', 30]] as [string, string, string, number][]).map(([l, k, c, a]) => `
      <g transform="translate(195 206) rotate(${a})"><rect x="-25" y="-96" width="50" height="72" rx="8" fill="#fbf3e6"/>
        <text x="-19" y="-80" font-family="Jost, sans-serif" font-weight="600" font-size="13" fill="${c}">${l}</text>${suit(k, -14, -64, .42, 0, c)}</g>`).join('')}</svg>`
  },
  skyjo: {
    icon: `<svg viewBox="0 0 64 64" aria-hidden="true">${numCard(22, 22, -6, -2, '#9a7ad6', 20)}${numCard(43, 22, 5, 12, '#ef7a5c', 20)}${numCard(22, 44, 4, 5, '#3fb39b', 20)}${numCard(43, 44, -5, 0, '#5fa8d3', 20)}</svg>`,
    scene: `${SCENE_OPEN}<rect width="390" height="250" fill="#d3e6f4"/><circle cx="322" cy="50" r="28" fill="#f8d77a"/>
      ${cloud(70, 52, 1, '#fbf6ec')}${cloud(250, 34, .7, '#fbf6ec')}
      <path d="M150 52q5-5 10 0q5-5 10 0M184 70q4-4 8 0q4-4 8 0" fill="none" stroke="#5b5a8f" stroke-width="2.4" stroke-linecap="round"/>
      ${cloud(40, 222, 2.2, '#f4f9fd')}${cloud(330, 230, 2.4, '#f4f9fd')}${cloud(200, 246, 2.6, '#f6fafd')}
      ${numCard(84, 138, -16, -2, '#9a7ad6')}${numCard(142, 112, -6, 0, '#5fa8d3')}${numCard(200, 132, 4, 5, '#3fb39b')}${numCard(258, 108, 12, 9, '#f0b13e')}${numCard(312, 140, 20, 12, '#ef7a5c')}</svg>`
  }
};

// ---------------------------------------------------------------- Weitere Spiele (kompakte Szenen)
const ICON = (body: string) => `<svg viewBox="0 0 64 64" aria-hidden="true">${body}</svg>`;
/** Hintergrund der Spielszenen: Muster je Spiel, runde Hügel, Sonne mit Hof, schwebendes Konfetti. Flach, ohne Konturen.
 *  Klassen an-* werden in app.css animiert (bei „Bewegung reduzieren“ ruhig). */
const DOTS = ['#f3a98f', '#86cbb8', '#f2cf86', '#eda7bf', '#97c4e3', '#bba8e6'];
export type Pattern = 'dots' | 'rays' | 'lozenge' | 'checker' | 'hex' | 'waves' | 'stripes' | 'steps' | 'blocks';
const PATTERNS: Record<Pattern, (c: string) => string> = {
  dots: () => Array.from({ length: 4 }, (_, r) => Array.from({ length: 5 }, (_, k) =>
    `<circle class="an-tw" style="animation-delay:${-(r + k) * .4}s" cx="${22 + k * 16}" cy="${86 + r * 16}" r="${3.4 - r * .5}" fill="${DOTS[(r + k) % DOTS.length]}"/>`).join('')).join(''),
  rays: c => `<g class="an-spin" style="transform-origin:195px 270px">${Array.from({ length: 16 }, (_, k) => {
    const a = k * Math.PI / 8, b = a + Math.PI / 16, R = 480, f = (t: number) => `${195 + Math.cos(t) * R} ${270 + Math.sin(t) * R}`;
    return `<path d="M195 270L${f(a)}L${f(b)}z" fill="${c}"/>`; }).join('')}</g>`,
  lozenge: c => Array.from({ length: 7 }, (_, r) => Array.from({ length: 12 }, (_, k) => (r + k) % 2 ? '' :
    `<path d="M${k * 36 - 6} ${r * 30 + 15}l18-15 18 15-18 15z" fill="${c}"/>`).join('')).join(''),
  checker: c => Array.from({ length: 6 }, (_, r) => Array.from({ length: 11 }, (_, k) => (r + k) % 2 ? '' :
    `<rect x="${k * 36 + 4}" y="${r * 36 + 4}" width="28" height="28" rx="8" fill="${c}"/>`).join('')).join(''),
  hex: c => Array.from({ length: 5 }, (_, r) => Array.from({ length: 10 }, (_, k) => (r * 3 + k) % 3 === 0 ? '' : (() => {
    const x = k * 42 + (r % 2) * 21, y = r * 37 + 10, R = 20;
    return `<path d="M${x} ${y - R}l${R * .87} ${R * .5}v${R}l${-R * .87} ${R * .5}l${-R * .87} ${-R * .5}v${-R}z" fill="${c}"/>`; })()).join('')).join(''),
  waves: c => Array.from({ length: 5 }, (_, k) => `<path class="an-drift" style="animation-delay:${-k * 1.6}s" d="M-40 ${30 + k * 36}q30-14 60 0t60 0 60 0 60 0 60 0 60 0 60 0 60 0v14q-30-14-60 0t-60 0-60 0-60 0-60 0-60 0-60 0-60 0z" fill="${c}"/>`).join(''),
  stripes: c => Array.from({ length: 9 }, (_, k) => `<path d="M${k * 56 - 120} 0h26l-150 250h-26z" fill="${c}"/>`).join(''),
  steps: c => Array.from({ length: 10 }, (_, k) => Array.from({ length: k + 1 }, (_, r) => `<circle cx="${20 + k * 38}" cy="${190 - r * 17}" r="5" fill="${c}"/>`).join('')).join(''),
  blocks: c => Array.from({ length: 4 }, (_, r) => Array.from({ length: 7 }, (_, k) => `<rect x="${k * 58 + 8}" y="${r * 52 + 8}" width="42" height="36" rx="10" fill="${c}"/>`).join('')).join('')
};
const sky = (bg: string, band: string, ground: string, sun: string, pattern: Pattern = 'dots') => {
  const conf: [number, number, string][] = [
    [132, 34, `<circle r="5" fill="${DOTS[0]}"/>`], [262, 96, `<circle r="4" fill="${DOTS[4]}"/>`], [118, 128, `<circle r="6" fill="${DOTS[3]}"/>`],
    [366, 150, `<circle r="5" fill="${DOTS[1]}"/>`], [221, 22, `<path d="M-9 0a9 9 0 0 1 18 0z" fill="${DOTS[2]}"/>`], [112, 70, `<path d="M-8 0a8 8 0 0 0 16 0z" fill="${DOTS[5]}"/>`],
    [311, 116, `<rect x="-11" y="-4.5" width="22" height="9" rx="4.5" transform="rotate(-24)" fill="${DOTS[3]}"/>`], [179, 66, `<rect x="-9" y="-4" width="18" height="8" rx="4" transform="rotate(18)" fill="${DOTS[1]}"/>`],
    [40, 52, `<circle r="3.5" fill="#fff"/>`], [350, 200, `<circle r="3" fill="#fff"/>`]
  ];
  return `${SCENE_OPEN}<rect width="390" height="250" fill="${bg}"/>
  <g opacity=".85">${PATTERNS[pattern](band)}</g>
  <circle class="an-drift" cx="-10" cy="250" r="150" fill="${band}"/><circle class="an-drift" style="animation-delay:-4s" cx="410" cy="-10" r="120" fill="${band}"/>
  <circle class="an-pulse" cx="318" cy="56" r="40" fill="#fff" opacity=".35"/><circle cx="318" cy="56" r="26" fill="${sun}"/>
  ${conf.map(([x, y, el], k) => `<g transform="translate(${x} ${y})"><g class="an-float" style="animation-delay:${-k * .7}s;animation-duration:${11 + (k % 4) * 2}s">${el}</g></g>`).join('')}
  <path d="M-10 196c60-34 120-34 170-8s120 20 240-22v84H-10z" fill="${band}"/>
  <path d="M-10 214c80-26 150-22 210-4s120 16 200-10v50H-10z" fill="${ground}"/>
  <ellipse cx="195" cy="214" rx="110" ry="8" fill="#000" opacity=".12"/><g class="an-bob">`;
};
const unoCard = (x: number, y: number, rot: number, c: string, t: string, w = 46) => `<g transform="translate(${x} ${y}) rotate(${rot})">
  <rect x="${-w / 2}" y="${-w * .75}" width="${w}" height="${w * 1.5}" rx="${w * .16}" fill="#fbf6ec"/><rect x="${-w / 2 + 4}" y="${-w * .75 + 4}" width="${w - 8}" height="${w * 1.5 - 8}" rx="${w * .12}" fill="${c}"/>
  <ellipse rx="${w * .34}" ry="${w * .5}" transform="rotate(30)" fill="#fbf6ec"/><text y="${w * .14}" text-anchor="middle" font-family="Jost, sans-serif" font-weight="700" font-size="${w * .42}" fill="${c}">${t}</text></g>`;
const tile = (x: number, y: number, rot: number, l: string, s = 40) => `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s * 1.08}" rx="${s * .16}" fill="#d9b98a"/>
  <rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${s * .16}" fill="#f6e3bf"/><text y="${s * .2}" text-anchor="middle" font-family="Jost, sans-serif" font-weight="600" font-size="${s * .56}" fill="#3a2f22">${l}</text></g>`;
const hex = (x: number, y: number, r: number, c: string) => `<path d="M${x} ${y - r}l${r * .87} ${r * .5}v${r}l${-r * .87} ${r * .5}l${-r * .87} ${-r * .5}v${-r}z" fill="${c}"/>`;
const house = (x: number, y: number, s: number, c: string, roof: string) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-12" y="-8" width="24" height="18" fill="${c}"/><path d="M-16-8L0-22 16-8z" fill="${roof}"/></g>`;
const podium = (x: number, y: number, k: number) => `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-30" y="-34" width="60" height="64" rx="6" fill="#f0b13e"/><rect x="-92" y="-14" width="60" height="44" rx="6" fill="#3fb39b"/><rect x="32" y="0" width="60" height="30" rx="6" fill="#ef7a5c"/>
  <g font-family="Jost, sans-serif" font-weight="700" font-size="26" fill="#fff" text-anchor="middle"><text x="0" y="6">1</text><text x="-62" y="18">2</text><text x="62" y="24">3</text></g></g>`;

Object.assign(GAME_ART, {
  uno: {
    icon: ICON(unoCard(22, 34, -14, '#5fa8d3', '7', 24) + unoCard(40, 32, 12, '#ef7a5c', '2', 24)),
    scene: sky('#f6d5cb', '#f9e0d8', '#efc0b3', '#f5d58c', 'rays') + unoCard(120, 150, -22, '#5fa8d3', '7') + unoCard(170, 134, -8, '#3fb39b', '3') + unoCard(222, 134, 8, '#f0b13e', '9') + unoCard(272, 152, 22, '#ef7a5c', '0') + '</svg>'
  },
  scrabble: {
    icon: ICON(tile(22, 32, -10, 'A', 24) + tile(42, 34, 8, 'Z', 24)),
    scene: sky('#d3eadd', '#dff0e6', '#b7dcc8', '#f5d58c', 'checker') + ['W', 'O', 'R', 'T'].map((l, i) => tile(126 + i * 46, 168 - (i % 2) * 8, (i - 1.5) * 6, l)).join('') + tile(196, 108, -8, '★', 34) + '</svg>'
  },
  siedler: {
    icon: ICON(hex(32, 22, 14, '#f0b13e') + hex(20, 43, 14, '#3fb39b') + hex(44, 43, 14, '#f09a4a')),
    scene: sky('#d3e6f4', '#e0eef8', '#b5d4ea', '#f5d58c', 'hex') + hex(150, 118, 34, '#f0b13e') + hex(210, 118, 34, '#3fb39b') + hex(180, 170, 34, '#f09a4a') + hex(240, 170, 34, '#c9c6dc') + hex(120, 170, 34, '#7cb85a')
      + house(150, 126, 1, '#ef7a5c', '#d9634a') + house(214, 178, .9, '#fbf6ec', '#5fa8d3') + '</svg>'
  },
  monopoly: {
    icon: ICON(house(22, 38, 1, '#3fb39b', '#2f9a84') + house(42, 38, 1.15, '#ef7a5c', '#d9634a')),
    scene: sky('#d9eed6', '#e4f3e2', '#bcdfb8', '#f5d58c', 'blocks') + house(120, 186, 1.6, '#3fb39b', '#2f9a84') + house(168, 180, 2, '#3fb39b', '#2f9a84') + house(232, 172, 2.6, '#ef7a5c', '#d9634a')
      + '<circle cx="290" cy="170" r="20" fill="#f5d58c"/><text x="290" y="179" text-anchor="middle" font-family="Jost, sans-serif" font-weight="700" font-size="24" fill="#8a5a10">€</text></svg>'
  },
  ergebnis: {
    icon: ICON(podium(32, 38, .3)),
    scene: sky('#e4def2', '#ece7f7', '#cdc4ea', '#f5d58c', 'dots') + podium(195, 172, 1) + '</svg>'
  }
});

// ---------------------------------------------------------------- Kniffel, Phase 10, Schafkopf, Doppelkopf, Binokel
function die(x: number, y: number, s: number, rot: number, face: number, fill: string, pip: string, side: string) {
  const o = s * .27;
  const P: Record<number, number[][]> = { 1: [[0, 0]], 2: [[-o, -o], [o, o]], 3: [[-o, -o], [0, 0], [o, o]], 4: [[-o, -o], [o, -o], [-o, o], [o, o]],
    5: [[-o, -o], [o, -o], [0, 0], [-o, o], [o, o]], 6: [[-o, -o], [o, -o], [-o, 0], [o, 0], [-o, o], [o, o]] };
  return `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s * 1.1}" rx="${s * .2}" fill="${side}"/>
    <rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${s * .2}" fill="${fill}"/>${P[face].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="${s * .085}" fill="${pip}"/>`).join('')}</g>`;
}
const BAV: Record<string, (c: string) => string> = {
  herz: c => `<path d="M0-5C0-13-12-13-12-4c0 8 12 13 12 18 0-5 12-10 12-18 0-9-12-9-12-1z" fill="${c}"/>`,
  eichel: c => `<ellipse cy="3" rx="8" ry="10" fill="${c}"/><path d="M-9-3a9 7 0 0 1 18 0z" fill="#b8865a"/><path d="M0-10v-5" stroke="#b8865a" stroke-width="2.5" stroke-linecap="round"/>`,
  gras: c => `<path d="M0 14C-14 4-12-10 0-15 12-10 14 4 0 14z" fill="${c}"/><path d="M0 12V-10" stroke="#fff" stroke-width="1.6" opacity=".7"/>`,
  schellen: c => `<circle r="11" fill="${c}"/><circle r="4" fill="#fff" opacity=".7"/>`
};
const card = (x: number, y: number, rot: number, letter: string, sym: string, c: string, w = 50) => `<g transform="translate(${x} ${y}) rotate(${rot})">
  <rect x="${-w / 2}" y="${-w * .72}" width="${w}" height="${w * 1.44}" rx="${w * .14}" fill="#fffaf2"/>
  <text x="${-w / 2 + 7}" y="${-w * .72 + 17}" font-family="Jost, sans-serif" font-weight="600" font-size="${w * .26}" fill="${c}">${letter}</text>
  <g transform="translate(0 ${w * .12}) scale(${w / 50})">${sym}</g></g>`;

Object.assign(GAME_ART, {
  kniffel: {
    icon: ICON(die(24, 34, 26, -12, 5, '#fffaf2', '#f3a98f', '#ead9c4') + die(42, 30, 22, 14, 3, '#86cbb8', '#ffffff', '#6db3a0')),
    scene: sky('#d6eee9', '#e2f3ef', '#bfe1d9', '#f5d58c', 'checker') + die(108, 168, 46, 18, 2, '#bba8e6', '#ffffff', '#a493d6') + die(170, 158, 64, -12, 5, '#fffaf2', '#f3a98f', '#ead9c4')
      + die(246, 160, 58, 10, 3, '#f3a98f', '#ffffff', '#e0927a') + die(310, 128, 46, 14, 6, '#f2cf86', '#5b5a8f', '#e0b96a') + '</svg>'
  },
  phase10: {
    icon: ICON('<rect x="9" y="40" width="14" height="14" rx="4" fill="#f3a98f"/><rect x="25" y="30" width="14" height="24" rx="4" fill="#97c4e3"/><rect x="41" y="20" width="14" height="34" rx="4" fill="#86cbb8"/><path d="M48 20V8" stroke="#5b5a8f" stroke-width="2.4" stroke-linecap="round"/><path d="M48 8l9 3.5-9 3.5z" fill="#f2cf86"/>'),
    scene: sky('#fbe9d2', '#fdf0e0', '#f3d9b8', '#f5d58c', 'steps') + Array.from({ length: 10 }, (_, k) => { const h = 18 + k * 13, x = 38 + k * 32;
      const c = ['#f3a98f', '#97c4e3', '#86cbb8', '#f2cf86'][k % 4];
      return `<rect x="${x}" y="${216 - h}" width="28" height="${h + 30}" rx="8" fill="${c}"/><text x="${x + 14}" y="${216 - h + 18}" text-anchor="middle" font-family="Jost, sans-serif" font-weight="600" font-size="12" fill="#fffaf2">${k + 1}</text>`; }).join('')
      + '<path d="M348 86V50" stroke="#5b5a8f" stroke-width="3" stroke-linecap="round"/><path d="M348 50l20 7-20 7z" fill="#f3a98f"/></svg>'
  },
  schafkopf: {
    icon: ICON(card(24, 34, -12, 'O', BAV.eichel('#c9a06e'), '#7c9a5a', 26) + card(40, 34, 10, 'U', BAV.herz('#f3a98f'), '#d9634a', 26)),
    scene: sky('#e3efd8', '#ecf4e4', '#cfe3bf', '#f5d58c', 'lozenge') + card(120, 150, -22, 'O', BAV.eichel('#c9a06e'), '#7c9a5a') + card(172, 136, -8, 'U', BAV.gras('#9cc77e'), '#5f8a44')
      + card(224, 136, 8, 'A', BAV.herz('#f3a98f'), '#d9634a') + card(276, 150, 22, 'K', BAV.schellen('#f2cf86'), '#b8862a') + '</svg>'
  },
  doppelkopf: {
    icon: ICON(card(24, 34, -12, 'D', BAV.herz('#bba8e6'), '#7b66b8', 26) + card(40, 34, 10, 'D', BAV.herz('#f3a98f'), '#d9634a', 26)),
    scene: sky('#e4def2', '#ece7f7', '#cdc4ea', '#f5d58c', 'stripes') + card(150, 144, -14, 'D', BAV.herz('#bba8e6'), '#7b66b8', 58) + card(214, 140, 12, 'D', BAV.herz('#f3a98f'), '#d9634a', 58)
      + '<circle cx="96" cy="120" r="10" fill="#f2cf86"/><circle cx="300" cy="104" r="8" fill="#86cbb8"/></svg>'
  },
  binokel: {
    icon: ICON(card(22, 34, -14, 'A', BAV.eichel('#c9a06e'), '#b8865a', 24) + card(32, 32, 0, '10', BAV.herz('#f3a98f'), '#d9634a', 24) + card(42, 34, 14, 'K', BAV.schellen('#f2cf86'), '#b8862a', 24)),
    scene: sky('#f8e3cf', '#fbecdd', '#efd0b2', '#f5d58c', 'waves') + card(126, 150, -24, 'A', BAV.eichel('#c9a06e'), '#b8865a') + card(176, 136, -8, '10', BAV.herz('#f3a98f'), '#d9634a')
      + card(226, 136, 8, 'K', BAV.gras('#9cc77e'), '#5f8a44') + card(276, 150, 24, 'O', BAV.schellen('#f2cf86'), '#b8862a') + '</svg>'
  }
});

// ---------------------------------------------------------------- Icons als Einzelsymbol, Szene erzählt die Situation dazu
const cup = (x: number, y: number, rot: number) => `<g transform="translate(${x} ${y}) rotate(${rot})">
  <path d="M-34-44h68l-10 88h-48z" fill="#bba8e6"/><path d="M-34-44h68l-2 14h-64z" fill="#a493d6"/>
  <ellipse cx="0" cy="-44" rx="34" ry="9" fill="#8f7ec7"/><circle cx="-12" cy="0" r="4" fill="#fff" opacity=".5"/><circle cx="6" cy="14" r="3" fill="#fff" opacity=".5"/></g>`;
Object.assign(GAME_ART, {
  kniffel: {
    icon: ICON(die(32, 31, 34, -10, 5, '#fffaf2', '#f3a98f', '#ead9c4')),
    scene: sky('#d6eee9', '#e2f3ef', '#bfe1d9', '#f5d58c', 'checker') + cup(118, 150, -58)
      + '<g fill="#fff" opacity=".7"><circle cx="164" cy="120" r="3"/><circle cx="182" cy="108" r="2.5"/><circle cx="198" cy="102" r="2"/></g>'
      + die(196, 168, 40, 16, 6, '#f2cf86', '#5b5a8f', '#e0b96a') + die(248, 150, 46, -14, 5, '#fffaf2', '#f3a98f', '#ead9c4')
      + die(304, 174, 38, 22, 3, '#86cbb8', '#ffffff', '#6db3a0') + '</svg>'
  }
});
const coaster = (x: number, y: number) => `<g transform="translate(${x} ${y})"><circle r="38" fill="#fffaf2"/><circle r="31" fill="#f2cf86" opacity=".45"/>
  ${[0, 1, 2, 3].map(k => `<rect x="${-16 + k * 8}" y="-14" width="4" height="26" rx="2" fill="#5b5a8f"/>`).join('')}<rect x="-22" y="-3" width="40" height="4" rx="2" transform="rotate(-24)" fill="#5b5a8f"/></g>`;
Object.assign(GAME_ART, {
  schafkopf: { ...GAME_ART.schafkopf, scene: sky('#e3efd8', '#ecf4e4', '#cfe3bf', '#f5d58c', 'lozenge') + coaster(92, 160)
    + card(196, 150, -14, 'O', BAV.eichel('#c9a06e'), '#7c9a5a', 54) + card(250, 146, 6, 'U', BAV.gras('#9cc77e'), '#5f8a44', 54) + card(304, 156, 22, 'A', BAV.herz('#f3a98f'), '#d9634a', 54) + '</svg>' },
  binokel: { ...GAME_ART.binokel, scene: sky('#f8e3cf', '#fbecdd', '#efd0b2', '#f5d58c', 'waves')
    + card(150, 150, -8, 'O', BAV.gras('#9cc77e'), '#5f8a44', 62) + card(214, 154, 8, 'U', BAV.schellen('#f2cf86'), '#b8862a', 62)
    + '<g transform="translate(292 96)"><rect x="-32" y="-18" width="64" height="36" rx="18" fill="#fffaf2"/><text y="8" text-anchor="middle" font-family="Jost, sans-serif" font-weight="700" font-size="22" fill="#d9634a">+40</text></g></svg>' }
});
// Arschloch: Thron gegen Hocker, Karten fliegen
const throne = (x: number, y: number) => `<g transform="translate(${x} ${y})">
  <rect x="-30" y="-92" width="60" height="70" rx="14" fill="#bba8e6"/><rect x="-22" y="-84" width="44" height="54" rx="10" fill="#a493d6"/>
  <rect x="-38" y="-30" width="76" height="20" rx="8" fill="#bba8e6"/><rect x="-34" y="-12" width="10" height="34" rx="4" fill="#8f7ec7"/><rect x="24" y="-12" width="10" height="34" rx="4" fill="#8f7ec7"/>
  <path d="M-18-104l-4-16 11 8 11-14 11 14 11-8-4 16z" fill="#f2cf86"/></g>`;
const stool = (x: number, y: number) => `<g transform="translate(${x} ${y})"><ellipse cy="-26" rx="26" ry="8" fill="#d9b98a"/>
  <rect x="-20" y="-24" width="7" height="44" rx="3" fill="#b8956a" transform="rotate(8 -16 -2)"/><rect x="13" y="-24" width="7" height="44" rx="3" fill="#b8956a" transform="rotate(-8 16 -2)"/></g>`;
Object.assign(GAME_ART, {
  arschloch: {
    icon: ICON(`<path d="M14 44l-4-24 12 9 10-15 10 15 12-9-4 24z" fill="#f2cf86"/><rect x="14" y="42" width="36" height="8" rx="3" fill="#e0b96a"/>
      <circle cx="10" cy="19" r="3.5" fill="#f2cf86"/><circle cx="32" cy="12" r="3.5" fill="#f2cf86"/><circle cx="54" cy="19" r="3.5" fill="#f2cf86"/>`),
    scene: sky('#e4def2', '#ece7f7', '#cdc4ea', '#f5d58c', 'rays') + throne(130, 214) + stool(268, 214)
      + card(200, 120, -18, 'A', BAV.herz('#f3a98f'), '#d9634a', 34) + card(236, 104, 14, 'K', BAV.eichel('#c9a06e'), '#7c9a5a', 30) + '</svg>'
  }
});

// Schwimmen: Rettungsring auf Wellen, offene Karten; Schocken: Würfelbecher und Bierdeckel
const buoy = (x: number, y: number, r: number) => `<g transform="translate(${x} ${y})"><circle r="${r}" fill="#fffaf2"/>
  ${[0, 1, 2, 3].map(k => `<path d="M0 0L${r * Math.cos(k * Math.PI / 2 + .45)} ${r * Math.sin(k * Math.PI / 2 + .45)}A${r} ${r} 0 0 1 ${r * Math.cos(k * Math.PI / 2 + 1.12)} ${r * Math.sin(k * Math.PI / 2 + 1.12)}z" fill="#ef7a5c"/>`).join('')}
  <circle r="${r * .52}" fill="#97c4e3"/></g>`;
const dcup = (x: number, y: number, s: number, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M-22-30h44l-6 56h-32z" fill="#8a5a3c"/>
  <rect x="-24" y="-34" width="48" height="10" rx="4" fill="#a8714c"/><rect x="-18" y="-14" width="36" height="6" rx="3" fill="#6f4630"/><rect x="-17" y="8" width="34" height="6" rx="3" fill="#6f4630"/></g>`;
const deckel = (x: number, y: number, r: number, c = '#f3a98f') => `<g transform="translate(${x} ${y})"><circle r="${r}" fill="#fffaf2"/><circle r="${r * .78}" fill="${c}"/><circle r="${r * .46}" fill="#fffaf2"/></g>`;
Object.assign(GAME_ART, {
  schwimmen: {
    icon: ICON(buoy(32, 32, 22)),
    scene: sky('#dcecf6', '#e8f2f9', '#bcdcef', '#f5d58c', 'waves') + buoy(118, 168, 40)
      + card(214, 150, -12, '7', BAV.herz('#f3a98f'), '#d9634a', 48) + card(258, 146, 2, 'K', BAV.herz('#f3a98f'), '#d9634a', 48) + card(302, 154, 16, 'A', BAV.herz('#f3a98f'), '#d9634a', 48) + '</svg>'
  },
  schocken: {
    icon: ICON(`${deckel(20, 44, 14)}${dcup(36, 30, .62, 10)}${die(50, 50, 14, -12, 1, '#fffaf2', '#d9634a', '#e8dccb')}`),
    scene: sky('#fbe6dc', '#fdeee7', '#f2cdbd', '#f5d58c', 'checker')
      + [0, 1, 2, 3, 4].map(k => deckel(96, 196 - k * 9, 38, k % 2 ? '#f2cf86' : '#f3a98f')).join('') + dcup(206, 150, 1.4, -8)
      + die(266, 196, 30, -12, 1, '#fffaf2', '#d9634a', '#e8dccb') + die(304, 192, 30, 10, 1, '#fffaf2', '#d9634a', '#e8dccb') + die(286, 160, 30, 24, 1, '#fffaf2', '#d9634a', '#e8dccb') + '</svg>'
  }
});

const icon: Record<string, string> = {
  uno: ICON(`<g transform="rotate(-20 32 32)">${[0, 1, 2, 3].map(k => `<path d="M32 32L${32 + 22 * Math.cos(k * Math.PI / 2)} ${32 + 22 * Math.sin(k * Math.PI / 2)}A22 22 0 0 1 ${32 + 22 * Math.cos((k + 1) * Math.PI / 2)} ${32 + 22 * Math.sin((k + 1) * Math.PI / 2)}z" fill="${['#f3a98f', '#86cbb8', '#f2cf86', '#97c4e3'][k]}"/>`).join('')}
    <ellipse cx="32" cy="32" rx="9" ry="14" transform="rotate(40 32 32)" fill="#fffaf2"/></g>`),
  scrabble: ICON(tile(32, 31, -8, 'S', 34) + '<text x="44" y="46" font-family="Jost, sans-serif" font-weight="600" font-size="8" fill="#3a2f22" transform="rotate(-8 32 31)">1</text>'),
  siedler: ICON(`<g transform="translate(32 34)"><circle cx="-10" cy="-2" r="9" fill="#fffaf2"/><circle cx="0" cy="-7" r="10" fill="#fffaf2"/><circle cx="10" cy="-2" r="9" fill="#fffaf2"/>
    <circle cx="0" cy="4" r="11" fill="#fffaf2"/><ellipse cx="17" cy="-6" rx="6" ry="7" fill="#5b5a8f"/><circle cx="19" cy="-8" r="1.4" fill="#fff"/>
    <rect x="-9" y="12" width="4" height="9" rx="2" fill="#5b5a8f"/><rect x="5" y="12" width="4" height="9" rx="2" fill="#5b5a8f"/></g>`),
  monopoly: ICON(`${[0, 1, 2].map(k => `<ellipse cx="32" cy="${46 - k * 8}" rx="16" ry="6" fill="#d9b25f"/><ellipse cx="32" cy="${43 - k * 8}" rx="16" ry="6" fill="#f2cf86"/>`).join('')}
    <circle cx="32" cy="27" r="3.5" fill="#fffaf2"/>`),
  ergebnis: ICON(`<path d="M22 8h8l6 16h-8zM42 8h-8l-6 16h8z" fill="#97c4e3"/><circle cx="32" cy="38" r="15" fill="#f2cf86"/><circle cx="32" cy="38" r="9" fill="#fffaf2"/>
    <text x="32" y="42" text-anchor="middle" font-family="Jost, sans-serif" font-weight="700" font-size="12" fill="#c99a3a">1</text>`),
  phase10: ICON(`<circle cx="32" cy="32" r="22" fill="#f3a98f"/><circle cx="32" cy="32" r="16" fill="#fffaf2"/>
    <text x="32" y="38.5" text-anchor="middle" font-family="Jost, sans-serif" font-weight="700" font-size="17" fill="#d9634a">10</text>`),
  schafkopf: ICON(`<g transform="translate(32 34) scale(2.1)">${BAV.eichel('#c9a06e')}</g>`),
  doppelkopf: ICON(`<g transform="translate(32 32) scale(1.9)">${BAV.herz('#eda7bf')}</g><text x="32" y="36" text-anchor="middle" font-family="Jost, sans-serif" font-weight="700" font-size="13" fill="#fffaf2">10</text>`),
  binokel: ICON(`<g transform="translate(32 33)"><circle r="19" fill="#f2cf86"/><circle r="12" fill="#fffaf2" opacity=".55"/><rect x="-11" y="-2" width="22" height="4" rx="2" fill="#c99a3a"/>
    <circle cy="7" r="3" fill="#c99a3a"/><rect x="-3" y="-25" width="6" height="8" rx="3" fill="#c99a3a"/></g>`)
};
for (const k of Object.keys(icon)) GAME_ART[k] = { ...GAME_ART[k], icon: icon[k] };

// Alle Illustrationen in Pastell: frühere kräftige Farben werden ersetzt (siehe docs/DESIGN.md)
for (const k of Object.keys(GAME_ART)) {
  const a = GAME_ART[k], soft = (x: string) => x.replace(/#[0-9a-f]{6}/gi, m => pastel(m));
  const scene = a.scene.includes('class="an-bob"') ? a.scene.replace(/<\/svg>\s*$/, '</g></svg>') : a.scene;
  GAME_ART[k] = { icon: soft(a.icon), scene: soft(scene) };
}
export const FREE_ICON = FREE_ICON_RAW.replace(/#[0-9a-f]{6}/gi, m => pastel(m));
export const FREE_SCENE = FREE_SCENE_RAW.replace(/#[0-9a-f]{6}/gi, m => pastel(m));

// ---------------------------------------------------------------- Eigene Spiele: Icon mit Anfangsbuchstabe, Szene mit eigenem Muster
export const LOOK_COLORS = DOTS;
export const LOOK_PATTERNS: Pattern[] = ['dots', 'checker', 'waves', 'stripes', 'lozenge', 'hex', 'rays', 'blocks'];
const mix = (hex: string, w: number) => {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v + (255 - v) * w));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
};
const darker = (hex: string, f: number) => {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * f));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
};
const hash = (s: string) => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
/** Aussehen eines eigenen Spiels: gewählt oder aus dem Schlüssel abgeleitet */
export function lookOf(key: string, look?: { color: string; pattern: string }) {
  const h = hash(key);
  return { color: look?.color ?? DOTS[h % DOTS.length], pattern: (look?.pattern ?? LOOK_PATTERNS[(h >> 3) % LOOK_PATTERNS.length]) as Pattern };
}
const initial = (name: string) => (name.trim()[0] || '?').toUpperCase().replace(/[<>&"]/g, '?');
export function customArt(key: string, name: string, look?: { color: string; pattern: string }) {
  const { color, pattern } = lookOf(key, look), ink = darker(color, .62), L = initial(name);
  const icon = ICON(`<g transform="rotate(-8 32 32)"><rect x="13" y="12" width="38" height="42" rx="10" fill="${darker(color, .88)}"/><rect x="13" y="10" width="38" height="40" rx="10" fill="#fffaf2"/>
    <text x="32" y="40" text-anchor="middle" font-family="Jost, sans-serif" font-weight="700" font-size="24" fill="${ink}">${L}</text></g><circle cx="52" cy="14" r="4" fill="${color}"/>`);
  const sheet = `<g transform="translate(195 136) rotate(-6)"><rect x="-62" y="-72" width="124" height="150" rx="16" fill="${darker(color, .9)}"/>
    <rect x="-62" y="-76" width="124" height="150" rx="16" fill="#fffaf2"/><path d="M-62-60a16 16 0 0 1 16-16h92a16 16 0 0 1 16 16v14h-124z" fill="${color}"/>
    <text x="0" y="-52" text-anchor="middle" font-family="Jost, sans-serif" font-weight="700" font-size="18" fill="#fffaf2">${L}</text>
    ${[0, 1, 2, 3].map(r => `<rect x="-42" y="${-28 + r * 22}" width="${[60, 72, 48, 66][r]}" height="7" rx="3.5" fill="${mix(color, .55)}"/><circle cx="${36}" cy="${-24 + r * 22}" r="5" fill="${DOTS[(hash(key) + r) % DOTS.length]}"/>`).join('')}</g>`;
  const scene = sky(mix(color, .72), mix(color, .82), mix(color, .5), '#f5d58c', pattern) + sheet + '</g></svg>';
  return { icon: icon.replace(/#[0-9a-f]{6}/gi, m => pastel(m)), scene, tint: mix(color, .7) };
}

/** Bild eines eigenen Spiels: Kopien fester Spiele behalten das Originalbild, bis Farbe oder Muster gewählt werden */
export function ownArt(key: string, name: string, params?: { look?: { color: string; pattern: string }; base?: string }) {
  const base = params?.base, def = base ? GAMES.find(g => g.template.key === base) : undefined;
  if (base && !params?.look && GAME_ART[base] && def) return { icon: GAME_ART[base].icon, scene: GAME_ART[base].scene, tint: def.tint };
  return customArt(key, name, params?.look);
}
