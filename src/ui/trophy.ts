// Siegerseite: Trophäenzimmer mit Otter. Flach, warm, ohne Konturen; eigene Zeichnung im Stil der App.
// Bewegung über Klassen in app.css (langsam fallendes Konfetti, Lampe, Otter atmet), still bei „Bewegung reduzieren“.

const C = {
  wallA: '#d3a072', wallB: '#dbab7d', seam: '#b98656', floor: '#9c6b47', floorTop: '#b07c55', wood: '#7e5136',
  body: '#8f6447', bodyDark: '#74503a', belly: '#d8b48e', muzzle: '#e9cfae', nose: '#3a2a22', eye: '#271d18',
  gold: '#f0c35a', goldDark: '#d29d3a', paper: '#f6efe2', ink: '#5b4636'
};
const CONF = ['#f3a98f', '#86cbb8', '#f2cf86', '#eda7bf', '#97c4e3', '#bba8e6'];

/** Inneres eines Icons (64×64) als verschachteltes SVG an Position x, y mit Größe s */
const nest = (icon: string, x: number, y: number, s: number) =>
  icon.replace('<svg ', `<svg x="${x}" y="${y}" width="${s}" height="${s}" `);

// Traurige Augen: halb geschlossen, Lid hängt nach außen, Braue steigt zur Mitte
const SAD_EYE = `<ellipse cx="-17.5" cy="-6" rx="6" ry="5" fill="#271d18"/><path d="M-25-7.5C-23-14-12-14-10-9.5L-11-6C-15-10-21-10-25-7.5z" fill="#8f6447"/><circle cx="-15.5" cy="-6" r="1.4" fill="#fff" opacity=".7"/><rect x="-27" y="-18" width="15" height="3.2" rx="1.6" fill="#5e3f2d" transform="rotate(-16 -19 -16)"/>`;

/** Otter: fröhlich mit Krone und Pokal, oder traurig mit eigenem Gegenstand in den Pfoten (prop, Ursprung bei den Pfoten) */
function otter(o: { sad?: boolean; prop?: string; tear?: boolean } = {}) {
  // Ursprung: Mitte zwischen den Füßen; Kopf bei y = -142. Licht kommt von links oben (Lampe).
  const mirror = (part: string) => `${part}<g transform="scale(-1 1)">${part}</g>`;
  const eye = `<path d="M-25-7C-22-15-13-15-10-7C-12.5-10.5-22.5-10.5-25-7z" fill="${C.eye}"/>`;
  const whisker = `<rect x="22" y="5" width="20" height="1.3" rx=".65" fill="${C.paper}" opacity=".75" transform="rotate(-6 22 5)"/><rect x="22" y="11" width="18" height="1.3" rx=".65" fill="${C.paper}" opacity=".6" transform="rotate(6 22 11)"/>`;
  const dots = `<circle cx="-21" cy="6" r="1.3" fill="#b48e6c"/><circle cx="-15" cy="10" r="1.3" fill="#b48e6c"/><circle cx="-22" cy="12" r="1.3" fill="#b48e6c"/>`;
  const toes = (x: number, y: number) => `<circle cx="${x - 5}" cy="${y - 5}" r="2.2" fill="${C.body}"/><circle cx="${x}" cy="${y - 7}" r="2.2" fill="${C.body}"/><circle cx="${x + 5}" cy="${y - 5}" r="2.2" fill="${C.body}"/>`;
  return `<g class="vo-breathe">
    <path d="M26-10C60-2 88-14 102-40 92-24 68-18 40-26z" fill="${C.bodyDark}"/>
    <path d="M40-18C64-14 82-20 94-32 80-24 62-22 44-24z" fill="${C.body}" opacity=".7"/>
    <ellipse cx="-18" cy="-3" rx="15" ry="7" fill="${C.bodyDark}"/><ellipse cx="18" cy="-3" rx="15" ry="7" fill="${C.bodyDark}"/>
    <path d="M-40-4C-48-64-36-116 0-124 36-116 48-64 40-4z" fill="${C.bodyDark}"/>
    <path d="M-40-4C-47-64-35-114-3-122 28-114 37-64 30-4z" fill="${C.body}"/>
    <ellipse cx="-3" cy="-54" rx="25" ry="46" fill="${C.belly}"/>
    <ellipse cx="-9" cy="-66" rx="12" ry="24" fill="#e6c7a3" opacity=".6"/>
    <g transform="translate(0 -142)">
      ${mirror(`<circle cx="-29" cy="-17" r="8.5" fill="${C.bodyDark}"/><circle cx="-29" cy="-17" r="4.2" fill="#5e3f2d"/>`)}
      <ellipse rx="38" ry="31" fill="${C.bodyDark}"/>
      <ellipse cx="-2" cy="-1" rx="36" ry="30" fill="${C.body}"/>
      <ellipse cx="-12" cy="-19" rx="16" ry="6.5" fill="#a87a5a" opacity=".55"/>
      <path d="M-31 4C-31-7-18-11 0-11S31-7 31 4C31 22 16 31 0 31S-31 22-31 4z" fill="${C.muzzle}"/>
      ${mirror(`<circle cx="-16" cy="8" r="12.5" fill="${C.muzzle}"/>`)}
      ${mirror(dots)}
      ${o.sad ? mirror(SAD_EYE) : mirror(eye)}
      ${mirror(`<ellipse cx="-27" cy="1" rx="5" ry="3" fill="#e9a58b" opacity=".35"/>`)}
      <path d="M-9-4C-9-10 9-10 9-4 9 1 4 4 0 4S-9 1-9-4z" fill="${C.nose}"/>
      <ellipse cx="-3" cy="-6" rx="3" ry="1.5" fill="#fff" opacity=".45"/>
      <rect x="-.8" y="3" width="1.6" height="6" rx=".8" fill="${C.nose}"/>
      ${o.sad ? `<path d="M-9 19C-6 13 6 13 9 19 5 16.5-5 16.5-9 19z" fill="#4a2f25"/>${o.tear ? `<path d="M-19 4c2 4 4 7 4 9a4 4 0 0 1-8 0c0-2 2-5 4-9z" fill="#97c4e3" class="vo-tear"/>` : ''}`
        : `<path d="M-13 9C-9 23 9 23 13 9 7 12.5-7 12.5-13 9z" fill="#4a2f25"/><ellipse cx="0" cy="16.5" rx="5.5" ry="3" fill="#e98a86"/>`}
      ${mirror(whisker.replace(/x="22"/g, 'x="-42"').replace(/rotate\((-?\d+) 22/g, (_m, a) => `rotate(${-Number(a)} -22`))}
      ${o.sad ? '' : `<g transform="translate(0 -34) rotate(-6)">
        <path d="M-27 10l-5-26 15 12 17-22 17 22 15-12-5 26z" fill="${C.gold}"/>
        <path d="M0-26l17 22 15-12-3 14c-8 2-20-2-29-24z" fill="${C.goldDark}" opacity=".35"/>
        <rect x="-28" y="5" width="56" height="11" rx="4" fill="${C.goldDark}"/>
        <circle cx="-32" cy="-17" r="3.6" fill="${C.gold}"/><circle cx="0" cy="-27" r="4" fill="${C.gold}"/><circle cx="32" cy="-17" r="3.6" fill="${C.gold}"/>
        <circle cx="-14" cy="10.5" r="3" fill="#86cbb8"/><ellipse cx="0" cy="10.5" rx="4" ry="3.4" fill="#f3a98f"/><circle cx="14" cy="10.5" r="3" fill="#97c4e3"/>
        <rect x="-22" y="7" width="8" height="1.8" rx=".9" fill="#fff" opacity=".4"/>
      </g>`}
    </g>
    ${mirror(`<path d="M-26-116C-42-112-48-100-40-90L-26-92C-30-98-28-106-20-110z" fill="${C.bodyDark}"/><path d="M-26-114C-38-110-43-101-37-94L-28-95C-31-100-29-106-22-109z" fill="${C.body}"/>`)}
    ${o.prop !== undefined ? `<g transform="translate(0 -80)">${o.prop}${mirror(`<ellipse cx="-22" cy="-16" rx="10" ry="9" fill="${C.bodyDark}"/>`)}${toes(-22, -16)}${toes(22, -16)}</g>` : `<g transform="translate(0 -80)">
      ${mirror(`<circle cx="-27" cy="-12" r="10" fill="${C.goldDark}"/><circle cx="-27" cy="-12" r="5.5" fill="${C.belly}"/>`)}
      <path d="M-23-30h46c0 28-10 40-23 40s-23-12-23-40z" fill="${C.gold}"/>
      <ellipse cy="-30" rx="23" ry="4.5" fill="#f7d98a"/>
      <path d="M8-27h12c-1 20-7 30-16 34 6-8 4-20 4-34z" fill="${C.goldDark}" opacity=".35"/>
      <rect x="-15" y="-24" width="5" height="22" rx="2.5" fill="#fff" opacity=".35"/>
      <circle cx="0" cy="-10" r="7.5" fill="${C.goldDark}"/><text y="-6.5" text-anchor="middle" font-family="Jost, sans-serif" font-weight="700" font-size="10" fill="${C.gold}">1</text>
      <rect x="-5" y="9" width="10" height="9" fill="${C.goldDark}"/><ellipse cy="18" rx="9" ry="3" fill="${C.gold}"/>
      <rect x="-17" y="20" width="34" height="6" rx="2.5" fill="${C.gold}"/><rect x="-20" y="25" width="40" height="7" rx="3" fill="${C.goldDark}"/>
      ${mirror(`<ellipse cx="-22" cy="-16" rx="10" ry="9" fill="${C.bodyDark}"/>`)}
      ${toes(-22, -16)}${toes(22, -16)}
    </g>`}
  </g>`;
}

/** Trophäenzimmer für die Siegerseite. icon: Icon des Spiels (wird gerahmt an die Wand gehängt) */
export function trophyRoom(icon: string, ribbon = 'GEWONNEN'): string { return room(icon, ribbon, otter(), true, ''); }

/** Verlierer-Varianten: der Otter ist traurig, das Zimmer gedämpft, kein Konfetti */
export type LoserLook = 'regen' | 'rechnung' | 'deckel' | 'loeffel';
export const LOSER_RIBBON: Record<LoserLook, string> = { regen: 'VERLOREN', rechnung: 'ZAHLT DIE RUNDE', deckel: 'ALLE DECKEL', loeffel: 'OINA NO?' };
export function loserRoom(icon: string, look: LoserLook = 'deckel', ribbon = LOSER_RIBBON[look]): string {
  const P = C;
  let prop = '', extra = '';
  if (look === 'regen') {
    // Kleine Wolke über dem Kopf, Tropfen fallen langsam
    extra = `<g transform="translate(195 64)" class="vr-cloud"><circle cx="-22" cy="4" r="16" fill="#b7bfd6"/><circle cx="0" cy="-6" r="21" fill="#c6cde1"/><circle cx="24" cy="3" r="15" fill="#b7bfd6"/><rect x="-36" y="2" width="74" height="17" rx="8.5" fill="#c6cde1"/>
      ${[-24, -10, 6, 20].map((x, k) => `<g transform="translate(${x} 24)"><path class="vr-drop" style="animation-delay:${-k * .45}s" d="M0 0c2 4 3.5 6.5 3.5 8.5a3.5 3.5 0 0 1-7 0c0-2 1.5-4.5 3.5-8.5z" fill="#97c4e3"/></g>`).join('')}</g>`;
    prop = '';
  } else if (look === 'rechnung') {
    // Lange Rechnung bis auf den Boden
    prop = `<path d="M-15-22h30v96l-5-4-5 4-5-4-5 4-5-4-5 4z" fill="${P.paper}"/>
      ${[-12, -4, 4, 12, 20, 28, 36, 44].map((y, k) => `<rect x="-10" y="${y}" width="${k % 3 ? 14 : 20}" height="2.4" rx="1.2" fill="#d9cdb8"/><rect x="${k % 2 ? 5 : 6}" y="${y}" width="5" height="2.4" rx="1.2" fill="#d9cdb8"/>`).join('')}
      <rect x="-10" y="54" width="20" height="2" fill="${P.ink}" opacity=".5"/><rect x="-10" y="59" width="9" height="3" rx="1.5" fill="${P.ink}"/><rect x="2" y="59" width="8" height="3" rx="1.5" fill="#d9634a"/>`;
  } else if (look === 'deckel') {
    // Ganzer Stapel Bierdeckel, der oberste rutscht weg
    const cols = ['#f3ead6', '#e6d9bf'];
    prop = Array.from({ length: 10 }, (_, k) => `<rect x="${-23 + ((k * 5) % 7) - 3}" y="${34 - k * 5.4}" width="46" height="6" rx="3" fill="${cols[k % 2]}"/><rect x="${-23 + ((k * 5) % 7) - 3}" y="${34 - k * 5.4}" width="46" height="2" rx="1" fill="#b5452f" opacity=".7"/>`).join('')
      + `<g transform="translate(30 -24) rotate(32)"><rect x="-23" y="-3" width="46" height="6" rx="3" fill="${cols[0]}"/><rect x="-23" y="-3" width="46" height="2" rx="1" fill="#b5452f" opacity=".7"/></g>`;
    extra = `<g transform="translate(250 252) rotate(-8)"><ellipse rx="16" ry="4.5" fill="${P.paper}"/><ellipse rx="12" ry="3" fill="#b5452f" opacity=".75"/></g>`;
  } else {
    // Holzlöffel als Trostpreis, die Krone liegt am Boden
    prop = `<g transform="translate(22 -12) rotate(38)"><rect x="-3" y="-34" width="6" height="44" rx="3" fill="#c99a62"/><ellipse cx="0" cy="-48" rx="11" ry="16" fill="#c99a62"/><ellipse cx="-2" cy="-50" rx="7" ry="11" fill="#b5844f"/></g>`;
    extra = `<g transform="translate(340 250) rotate(24)"><path d="M-18 8l-4-18 11 8 11-14 11 14 11-8-4 18z" fill="${P.gold}"/><rect x="-18" y="6" width="36" height="7" rx="3" fill="${P.goldDark}"/></g>`;
  }
  return room(icon, ribbon, otter({ sad: true, tear: look !== 'loeffel', prop }), false, extra);
}

function room(icon: string, ribbon: string, figure: string, party: boolean, extra: string): string {
  const planks = Array.from({ length: 9 }, (_, k) => `<rect x="${k * 46 - 10}" y="0" width="46" height="262" fill="${k % 2 ? C.wallA : C.wallB}"/><rect x="${k * 46 - 10}" y="0" width="2" height="262" fill="${C.seam}" opacity=".45"/>`).join('');
  const confetti = Array.from({ length: 16 }, (_, k) => {
    const x = 18 + ((k * 53) % 360), c = CONF[k % CONF.length];
    const shape = k % 3 === 0 ? `<circle r="3.5" fill="${c}"/>` : `<rect x="-2" y="-5" width="4" height="10" rx="1.5" fill="${c}"/>`;
    return `<g transform="translate(${x} 0)"><g class="vc-fall" style="animation-duration:${9 + (k % 5) * 1.6}s;animation-delay:${-k * 1.3}s">${shape}</g></g>`;
  }).join('');
  return `<svg class="scene" viewBox="0 0 390 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    ${planks}
    <rect y="262" width="390" height="38" fill="${C.floor}"/><rect y="258" width="390" height="6" fill="${C.floorTop}"/>
    <g class="vl-glow"><circle cx="318" cy="70" r="62" fill="#fff4cc" opacity=".28"/></g>
    <rect x="317" y="0" width="2" height="44" fill="${C.wood}"/>
    <path d="M300 62c0-12 8-20 18-20s18 8 18 20z" fill="#5b5a8f"/><ellipse cx="318" cy="63" rx="9" ry="4" fill="#fff4cc"/>
    <g transform="translate(36 34)">
      <rect width="92" height="78" rx="6" fill="${C.wood}"/><rect x="7" y="7" width="78" height="64" rx="3" fill="${C.paper}"/>
      ${nest(icon, 22, 9, 48)}
    </g>
    <circle cx="58" cy="146" r="3" fill="${C.wood}"/>
    <g transform="translate(58 148) rotate(-6)">
      <rect x="-22" y="0" width="44" height="58" rx="4" fill="${C.paper}"/><rect x="-22" y="0" width="44" height="10" rx="4" fill="#f3a98f"/>
      ${[18, 28, 38, 48].map(y => `<rect x="-15" y="${y}" width="${y % 20 ? 22 : 30}" height="3" rx="1.5" fill="#d9cdb8"/>`).join('')}
      <rect x="16" y="14" width="5" height="34" rx="2" fill="${C.gold}" transform="rotate(18 18 30)"/>
    </g>
    <rect x="262" y="186" width="118" height="9" rx="3" fill="${C.wood}"/>
    <rect x="272" y="160" width="12" height="26" rx="2" fill="#97c4e3"/><rect x="286" y="164" width="10" height="22" rx="2" fill="#eda7bf"/><rect x="298" y="156" width="13" height="30" rx="2" fill="#86cbb8"/>
    <g transform="translate(346 172) rotate(-12)"><rect x="-12" y="-12" width="24" height="24" rx="5" fill="${C.paper}"/>
      <circle cx="-5" cy="-5" r="2.4" fill="${C.ink}"/><circle cx="5" cy="5" r="2.4" fill="${C.ink}"/><circle cx="5" cy="-5" r="2.4" fill="${C.ink}"/><circle cx="-5" cy="5" r="2.4" fill="${C.ink}"/></g>
    <ellipse cx="195" cy="262" rx="70" ry="7" fill="#000" opacity=".16"/>
    <g transform="translate(195 260)">${figure}</g>${extra}
    <g transform="translate(195 252)">
      <path d="M-112-4h22v26h-22l8-13z" fill="#d9cdb8"/><path d="M112-4h-22v26h22l-8-13z" fill="#d9cdb8"/>
      <rect x="-96" y="-10" width="192" height="28" rx="4" fill="${C.paper}"/>
      <text y="9" text-anchor="middle" font-family="Jost, sans-serif" font-weight="700" font-size="15" letter-spacing="3" fill="${C.ink}">${ribbon}</text>
    </g>
    ${party ? `<g>${confetti}</g>` : '<rect x="-10" y="-10" width="410" height="320" fill="#2a2350" opacity=".18"/>'}
  </svg>`;
}

// ---------------------------------------------------------------- Ergebnisspiele: eigene Siegerszenen

export type WinTheme = 'insel' | 'geld' | 'buehne';

/** Siegerszene im Freien bzw. auf der Bühne: Siedler (Insel aus Feldern), Monopoly (Geldregen), eigene Spiele (Treppchen) */
export function themeRoom(theme: WinTheme, ribbon = 'GEWONNEN'): string {
  const ribbonSvg = `<g transform="translate(195 252)">
      <path d="M-112-4h22v26h-22l8-13z" fill="#d9cdb8"/><path d="M112-4h-22v26h22l-8-13z" fill="#d9cdb8"/>
      <rect x="-96" y="-10" width="192" height="28" rx="4" fill="${C.paper}"/>
      <text y="9" text-anchor="middle" font-family="Jost, sans-serif" font-weight="700" font-size="15" letter-spacing="3" fill="${C.ink}">${ribbon}</text>
    </g>`;
  const fall = (shape: (c: string, k: number) => string, cols: string[], n = 14) => Array.from({ length: n }, (_, k) => {
    const x = 16 + ((k * 61) % 360);
    return `<g transform="translate(${x} 0)"><g class="vc-fall" style="animation-duration:${10 + (k % 5) * 1.7}s;animation-delay:${-k * 1.4}s">${shape(cols[k % cols.length], k)}</g></g>`;
  }).join('');
  let bg = '', fg = '', drop = '';
  if (theme === 'insel') {
    // Meer, eine Insel aus Sechseck-Feldern, Siedlungen, Straße und ein Schaf
    const hex = (x: number, y: number, c: string) => `<path transform="translate(${x} ${y})" d="M0-26 22.5-13v26L0 26-22.5 13v-26z" fill="${c}"/>`;
    const house = (x: number, y: number, c: string) => `<g transform="translate(${x} ${y})"><path d="M-8 0v-10l8-7 8 7V0z" fill="${c}"/><rect x="-2.5" y="-6" width="5" height="6" fill="#00000030"/></g>`;
    bg = `<rect width="390" height="300" fill="#bfe3ec"/><rect y="150" width="390" height="150" fill="#7fc3d6"/>
      ${[[40, 176], [300, 206], [120, 236], [350, 168]].map(([x, y]) => `<path d="M${x} ${y}q10-6 20 0q10 6 20 0" stroke="#e8f6fa" stroke-width="3" fill="none" opacity=".7"/>`).join('')}
      <circle cx="320" cy="58" r="26" fill="#f6d27a"/><circle cx="62" cy="64" r="14" fill="#fff" opacity=".8"/><circle cx="80" cy="58" r="18" fill="#fff" opacity=".8"/><circle cx="98" cy="66" r="12" fill="#fff" opacity=".8"/>
      <g transform="translate(0 4)">
        ${hex(150, 196, '#e9c46a')}${hex(195, 196, '#86b86a')}${hex(240, 196, '#c98b5a')}
        ${hex(127, 235, '#9ccf7a')}${hex(172, 235, '#d9d3c4')}${hex(217, 235, '#6f9e58')}${hex(262, 235, '#e9c46a')}
        ${hex(105, 196, '#c98b5a')}${hex(285, 196, '#9ccf7a')}
        <rect x="140" y="176" width="34" height="5" rx="2.5" fill="#d9634a" transform="rotate(-30 157 178)"/>
        ${house(112, 186, '#d9634a')}${house(290, 188, '#97c4e3')}${house(244, 226, '#f2cf86')}
        <g transform="translate(140 228)"><ellipse rx="10" ry="7" fill="#fff"/><circle cx="9" cy="-2" r="4" fill="#3a2a22"/><rect x="-6" y="5" width="2" height="5" fill="#3a2a22"/><rect x="3" y="5" width="2" height="5" fill="#3a2a22"/></g>
      </g>`;
    drop = fall((c, k) => k % 3 ? `<rect x="-2" y="-5" width="4" height="10" rx="1.5" fill="${c}"/>` : `<circle r="3.5" fill="${c}"/>`, CONF);
  } else if (theme === 'geld') {
    // Grünes Spielbrett, Felderrand, Häuschen und Hotel, Geldscheine regnen
    bg = `<rect width="390" height="300" fill="#cfe8d6"/>
      ${Array.from({ length: 10 }, (_, k) => `<rect x="${k * 40 - 5}" y="262" width="38" height="40" fill="${k % 2 ? '#f6efe2' : '#efe6d4'}"/><rect x="${k * 40 - 5}" y="262" width="38" height="8" fill="${['#d9634a', '#f2cf86', '#97c4e3', '#86cbb8', '#bba8e6'][k % 5]}"/>`).join('')}
      <circle cx="70" cy="70" r="46" fill="#b9dcc3"/><circle cx="330" cy="110" r="64" fill="#b9dcc3"/>
      <g transform="translate(70 230)"><path d="M-14 0v-16l14-12 14 12V0z" fill="#86cbb8"/></g>
      <g transform="translate(320 232)"><rect x="-22" y="-30" width="44" height="30" rx="3" fill="#d9634a"/><rect x="-26" y="-36" width="52" height="8" rx="3" fill="#b5452f"/></g>
      <g transform="translate(345 70) rotate(14)"><rect x="-26" y="-14" width="52" height="28" rx="4" fill="#fff8e6"/><text y="6" text-anchor="middle" font-family="Jost, sans-serif" font-weight="700" font-size="14" fill="#5b4636">FREI</text></g>`;
    drop = fall((_, k) => k % 4 === 0 ? `<circle r="6" fill="#f0c35a"/><circle r="3.5" fill="#d29d3a"/>` : `<g transform="rotate(${(k * 37) % 60 - 30})"><rect x="-11" y="-6" width="22" height="12" rx="2" fill="#9fd3a8"/><circle r="3.6" fill="#6fae7c"/></g>`, ['#9fd3a8'], 16);
  } else {
    // Bühne mit Vorhang, Spot und Treppchen hinter dem Otter
    bg = `<rect width="390" height="300" fill="#3b3570"/>
      <path d="M0 0h70c-6 90 2 180 14 262H0z" fill="#c2453f"/><path d="M390 0h-70c6 90-2 180-14 262h84z" fill="#c2453f"/>
      <path d="M0 0h390v26c-60 12-130 12-195 0S60 38 0 26z" fill="#a8362f"/>
      <path d="M150 0h90l70 262H80z" fill="#fff4cc" opacity=".14"/>
      <rect y="258" width="390" height="42" fill="#5a3f6f"/>
      <g transform="translate(195 258)"><rect x="-110" y="-46" width="62" height="46" rx="5" fill="#97c4e3"/><rect x="-46" y="-70" width="92" height="70" rx="5" fill="#f2cf86"/><rect x="48" y="-34" width="62" height="34" rx="5" fill="#f3a98f"/>
        <text x="-79" y="-16" text-anchor="middle" font-family="Jost, sans-serif" font-weight="700" font-size="20" fill="#2e2b4f">2</text><text x="79" y="-10" text-anchor="middle" font-family="Jost, sans-serif" font-weight="700" font-size="20" fill="#2e2b4f">3</text></g>`;
    drop = fall((c, k) => k % 3 ? `<rect x="-2" y="-5" width="4" height="10" rx="1.5" fill="${c}"/>` : `<circle r="3.5" fill="${c}"/>`, CONF);
  }
  const lift = theme === 'buehne' ? 190 : 260;
  fg = `<ellipse cx="195" cy="${lift + 2}" rx="56" ry="6" fill="#000" opacity=".14"/><g transform="translate(195 ${lift})${theme === 'buehne' ? ' scale(.8)' : ''}">${otter()}</g>`;
  return `<svg class="scene" viewBox="0 0 390 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${bg}${fg}${ribbonSvg}<g>${drop}</g></svg>`;
}
