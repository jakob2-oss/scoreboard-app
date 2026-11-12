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
  // Ursprung: Mitte zwischen den Füßen
  return `<g class="vo-breathe">
    <path d="M30-6c30 4 54-4 62-22-12 6-30 8-50 4z" fill="${C.bodyDark}"/>
    <ellipse cx="-16" cy="-4" rx="13" ry="7" fill="${C.bodyDark}"/><ellipse cx="16" cy="-4" rx="13" ry="7" fill="${C.bodyDark}"/>
    <path d="M-36-4C-44-62-32-112 0-120 32-112 44-62 36-4z" fill="${C.body}"/>
    <ellipse cy="-52" rx="23" ry="44" fill="${C.belly}"/>
    <ellipse cx="-24" cy="-152" rx="6.5" ry="6" fill="${C.bodyDark}"/><ellipse cx="24" cy="-152" rx="6.5" ry="6" fill="${C.bodyDark}"/>
    <ellipse cy="-134" rx="31" ry="27" fill="${C.body}"/>
    <circle cx="-9" cy="-121" r="11.5" fill="${C.muzzle}"/><circle cx="9" cy="-121" r="11.5" fill="${C.muzzle}"/>
    <path d="M-7-131h14c0 5-4 8-7 8s-7-3-7-8z" fill="${C.nose}"/>
    <path d="M-5-118a5 4 0 0 0 10 0z" fill="${C.nose}" opacity=".8"/>
    <ellipse cx="-13" cy="-142" rx="3.2" ry="3.8" fill="${C.eye}"/><ellipse cx="13" cy="-142" rx="3.2" ry="3.8" fill="${C.eye}"/>
    <circle cx="-12" cy="-143.5" r="1.1" fill="#fff"/><circle cx="14" cy="-143.5" r="1.1" fill="#fff"/>
    ${[-1, 1].map(d => [-3, 3].map(o => `<rect x="${d > 0 ? 18 : -34}" y="${-121 + o}" width="16" height="1.2" rx=".6" fill="${C.paper}" opacity=".55" transform="rotate(${d * o * 2} ${d * 20} ${-121 + o})"/>`).join('')).join('')}
    <g transform="translate(0 -160)">
      <path d="M-24 8l-4-22 13 10 15-18 15 18 13-10-4 22z" fill="${C.gold}"/><rect x="-24" y="4" width="48" height="8" rx="3" fill="${C.goldDark}"/>
      <circle cx="-28" cy="-14" r="3" fill="${C.gold}"/><circle cx="0" cy="-22" r="3.4" fill="${C.gold}"/><circle cx="28" cy="-14" r="3" fill="${C.gold}"/>
      <circle cx="-11" cy="8" r="2.6" fill="#86cbb8"/><circle cx="0" cy="8" r="2.6" fill="#f3a98f"/><circle cx="11" cy="8" r="2.6" fill="#97c4e3"/>
    </g>
    <g transform="translate(0 -74)">
      <path d="M-30-30a12 12 0 0 0 4 22l2-5a7 7 0 0 1-2-12zM30-30a12 12 0 0 1-4 22l-2-5a7 7 0 0 0 2-12z" fill="${C.goldDark}"/>
      <path d="M-24-34h48c0 24-10 36-24 36s-24-12-24-36z" fill="${C.gold}"/>
      <rect x="-14" y="-30" width="6" height="22" rx="3" fill="#fff" opacity=".35"/>
      <rect x="-5" y="2" width="10" height="14" fill="${C.goldDark}"/><rect x="-16" y="14" width="32" height="8" rx="3" fill="${C.gold}"/>
      <ellipse cx="-24" cy="-14" rx="9" ry="8" fill="${C.bodyDark}"/><ellipse cx="24" cy="-14" rx="9" ry="8" fill="${C.bodyDark}"/>
    </g>
  </g>`;
}

/** Trophäenzimmer für die Siegerseite. icon: Icon des Spiels (wird gerahmt an die Wand gehängt) */
export function trophyRoom(icon: string): string {
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
      <text y="9" text-anchor="middle" font-family="Jost, sans-serif" font-weight="700" font-size="15" letter-spacing="3" fill="${C.ink}">GEWONNEN</text>
    </g>
    <g>${confetti}</g>
  </svg>`;
}
