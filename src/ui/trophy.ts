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

function otter() {
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
      ${mirror(eye)}
      ${mirror(`<ellipse cx="-27" cy="1" rx="5" ry="3" fill="#e9a58b" opacity=".35"/>`)}
      <path d="M-9-4C-9-10 9-10 9-4 9 1 4 4 0 4S-9 1-9-4z" fill="${C.nose}"/>
      <ellipse cx="-3" cy="-6" rx="3" ry="1.5" fill="#fff" opacity=".45"/>
      <rect x="-.8" y="3" width="1.6" height="6" rx=".8" fill="${C.nose}"/>
      <path d="M-13 9C-9 23 9 23 13 9 7 12.5-7 12.5-13 9z" fill="#4a2f25"/>
      <ellipse cx="0" cy="16.5" rx="5.5" ry="3" fill="#e98a86"/>
      ${mirror(whisker.replace(/x="22"/g, 'x="-42"').replace(/rotate\((-?\d+) 22/g, (_m, a) => `rotate(${-Number(a)} -22`))}
      <g transform="translate(0 -34) rotate(-6)">
        <path d="M-27 10l-5-26 15 12 17-22 17 22 15-12-5 26z" fill="${C.gold}"/>
        <path d="M0-26l17 22 15-12-3 14c-8 2-20-2-29-24z" fill="${C.goldDark}" opacity=".35"/>
        <rect x="-28" y="5" width="56" height="11" rx="4" fill="${C.goldDark}"/>
        <circle cx="-32" cy="-17" r="3.6" fill="${C.gold}"/><circle cx="0" cy="-27" r="4" fill="${C.gold}"/><circle cx="32" cy="-17" r="3.6" fill="${C.gold}"/>
        <circle cx="-14" cy="10.5" r="3" fill="#86cbb8"/><ellipse cx="0" cy="10.5" rx="4" ry="3.4" fill="#f3a98f"/><circle cx="14" cy="10.5" r="3" fill="#97c4e3"/>
        <rect x="-22" y="7" width="8" height="1.8" rx=".9" fill="#fff" opacity=".4"/>
      </g>
    </g>
    ${mirror(`<path d="M-26-116C-42-112-48-100-40-90L-26-92C-30-98-28-106-20-110z" fill="${C.bodyDark}"/><path d="M-26-114C-38-110-43-101-37-94L-28-95C-31-100-29-106-22-109z" fill="${C.body}"/>`)}
    <g transform="translate(0 -80)">
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
    </g>
  </g>`;
}

/** Trophäenzimmer für die Siegerseite. icon: Icon des Spiels (wird gerahmt an die Wand gehängt) */
export function trophyRoom(icon: string, ribbon = 'GEWONNEN'): string {
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
    <g transform="translate(195 260)">${otter()}</g>
    <g transform="translate(195 252)">
      <path d="M-112-4h22v26h-22l8-13z" fill="#d9cdb8"/><path d="M112-4h-22v26h22l-8-13z" fill="#d9cdb8"/>
      <rect x="-96" y="-10" width="192" height="28" rx="4" fill="${C.paper}"/>
      <text y="9" text-anchor="middle" font-family="Jost, sans-serif" font-weight="700" font-size="15" letter-spacing="3" fill="${C.ink}">${ribbon}</text>
    </g>
    <g>${confetti}</g>
  </svg>`;
}
