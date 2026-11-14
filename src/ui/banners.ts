// Serien-Banner: fünf freche Motive mit dem Otter (Sonnenbrille, Cap, Getränk). Flach, ohne Konturen.
// Später können eigene Bilder dazukommen; bis dahin wählt jede Serie eines dieser Motive.
import { otter } from './trophy';

const W = 390, H = 150;
/** Gegenstand zwischen den Pfoten (Ursprung wie beim Otter: Pfoten bei ±22, −16) */
const PROP = {
  mug: `<g transform="translate(0 -2)"><rect x="-13" y="-6" width="26" height="34" rx="4" fill="#f2b84b"/><rect x="-13" y="-10" width="26" height="9" rx="4.5" fill="#fffaf2"/>
    <circle cx="-7" cy="-12" r="5" fill="#fffaf2"/><circle cx="4" cy="-13" r="6" fill="#fffaf2"/><path d="M13 2h6a6 6 0 0 1 0 14h-6v-4h6a2 2 0 0 0 0-6h-6z" fill="#f2b84b"/>
    <rect x="-8" y="2" width="3" height="20" rx="1.5" fill="#fff" opacity=".35"/></g>`,
  cocktail: `<g transform="translate(0 -8)"><path d="M-14-6h28L0 12z" fill="#f3a98f"/><rect x="-1.5" y="10" width="3" height="16" fill="#e8dccb"/><ellipse cy="26" rx="9" ry="2.5" fill="#e8dccb"/>
    <path d="M6-26a14 14 0 0 1 14 12H-8a14 14 0 0 1 14-12z" fill="#86cbb8" transform="rotate(20 6 -14)"/><rect x="5" y="-14" width="1.6" height="12" fill="#7e5136" transform="rotate(20 6 -14)"/>
    <circle cx="-7" cy="-7" r="3" fill="#d9634a"/></g>`,
  cards: `<g transform="translate(0 -6)">${[-18, 0, 18].map((r, k) => `<g transform="rotate(${r} 0 18)"><rect x="-10" y="-14" width="20" height="28" rx="3" fill="#fffaf2"/>
    <circle cx="0" cy="0" r="4" fill="${['#d9634a', '#2e2b4f', '#d9634a'][k]}"/></g>`).join('')}</g>`,
  dice: `<g transform="translate(0 -2)"><path d="M-14-16h28l-4 34h-20z" fill="#7e5136"/><rect x="-16" y="-20" width="32" height="7" rx="3" fill="#94613f"/>
    <g transform="translate(18 -26) rotate(18)"><rect x="-7" y="-7" width="14" height="14" rx="3" fill="#fffaf2"/><circle cx="-3" cy="-3" r="1.6" fill="#d9634a"/><circle cx="3" cy="3" r="1.6" fill="#d9634a"/></g></g>`,
  mic: `<g transform="translate(0 -14)"><rect x="-3" y="-4" width="6" height="30" rx="3" fill="#2e2b4f"/><circle cy="-10" r="9" fill="#9aa0b8"/>
    ${[-14, -10, -6].map(y => `<rect x="-8" y="${y}" width="16" height="1.4" fill="#7c829a"/>`).join('')}</g>`
};
const fig = (x: number, y: number, s: number, o: Parameters<typeof otter>[0]) => `<g transform="translate(${x} ${y}) scale(${s})">${otter(o)}</g>`;
const stars = (n: number, c: string) => Array.from({ length: n }, (_, k) => `<circle cx="${(k * 83) % W}" cy="${8 + ((k * 37) % 60)}" r="${k % 3 ? 1.4 : 2.2}" fill="${c}"/>`).join('');

export const BANNERS: { name: string; svg: string }[] = [
  {
    name: 'Kneipe',
    svg: `<rect width="${W}" height="${H}" fill="#2a2350"/>${stars(14, '#5b5490')}
      <g transform="translate(104 54) rotate(-4)"><rect x="-90" y="-26" width="180" height="52" rx="12" fill="#3a3170"/>
        <text y="9" text-anchor="middle" font-family="Jost, sans-serif" font-weight="700" font-size="24" letter-spacing="2" fill="#ff8f7a">OINA NO?</text></g>
      <circle cx="40" cy="120" r="14" fill="#f2cf86"/><circle cx="40" cy="120" r="9" fill="#d9634a"/><circle cx="64" cy="128" r="12" fill="#f3a98f"/>
      <rect y="132" width="${W}" height="18" fill="#7e5136"/><rect y="128" width="${W}" height="6" fill="#94613f"/>
      ${fig(282, 178, .62, { shades: true, hat: 'none', prop: PROP.mug })}`
  },
  {
    name: 'Strand',
    svg: `<rect width="${W}" height="${H}" fill="#bfe3ec"/><circle cx="60" cy="40" r="22" fill="#f6d27a"/><rect y="96" width="${W}" height="30" fill="#7fc3d6"/>
      <path d="M0 118q30-8 60 0t60 0 60 0 60 0 60 0 60 0 60 0v32H0z" fill="#f2dfb4"/>
      <g transform="translate(130 128)"><rect x="-3" y="-70" width="6" height="70" rx="3" fill="#a87a5a" transform="rotate(6)"/>
        ${[-60, -20, 20, 60, 100].map(r => `<ellipse cx="0" cy="-74" rx="34" ry="9" fill="#6fae7c" transform="rotate(${r} 0 -70)"/>`).join('')}</g>
      <g transform="translate(70 132) rotate(-14)"><rect x="-10" y="-14" width="20" height="28" rx="3" fill="#fffaf2"/><circle r="4" fill="#d9634a"/></g>
      ${fig(282, 182, .62, { shades: true, hat: 'none', prop: PROP.cocktail })}`
  },
  {
    name: 'Disco',
    svg: `<rect width="${W}" height="${H}" fill="#1f1b3a"/>
      ${['#f3a98f', '#86cbb8', '#bba8e6', '#f2cf86'].map((c, k) => `<path d="M120 22L${-20 + k * 70} ${H}h40z" fill="${c}" opacity=".18"/>`).join('')}
      <g transform="translate(120 26)"><circle r="20" fill="#b7bfd6"/>${Array.from({ length: 16 }, (_, k) => `<rect x="${-16 + (k % 4) * 8}" y="${-16 + Math.floor(k / 4) * 8}" width="6" height="6" rx="1" fill="${k % 3 ? '#d9deec' : '#fffaf2'}"/>`).join('')}
        <rect x="-1" y="-46" width="2" height="26" fill="#5b5490"/></g>
      ${[[40, 110, '#f3a98f'], [180, 120, '#86cbb8'], [60, 60, '#f2cf86']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="4" fill="${c}"/>`).join('')}
      ${fig(286, 180, .62, { hat: 'cap', prop: PROP.mic })}`
  },
  {
    name: 'Lagerfeuer',
    svg: `<rect width="${W}" height="${H}" fill="#24304f"/>${stars(18, '#d9deec')}<circle cx="330" cy="30" r="14" fill="#f6efe2"/><circle cx="336" cy="26" r="12" fill="#24304f"/>
      <path d="M0 120l60-40 50 30 70-50 80 54 60-30 70 36v30H0z" fill="#2f3d5f"/>
      <rect y="128" width="${W}" height="22" fill="#3b4a35"/>
      <g transform="translate(70 104)"><path d="M-36 24L0-24 36 24z" fill="#d9634a"/><path d="M0-24L36 24H8z" fill="#b5452f"/><path d="M-8 24L0 4l8 20z" fill="#2a2350"/></g>
      <g transform="translate(170 132)"><rect x="-20" y="-4" width="40" height="7" rx="3" fill="#7e5136" transform="rotate(14)"/><rect x="-20" y="-4" width="40" height="7" rx="3" fill="#94613f" transform="rotate(-14)"/>
        <path d="M0-30c10 12 14 20 10 28H-10C-14-6-8-16 0-30z" fill="#f2b84b"/><path d="M0-16c5 6 6 10 4 14h-8c-2-4 0-8 4-14z" fill="#fff4cc"/></g>
      ${fig(290, 182, .62, { hat: 'cap', shades: false, prop: PROP.dice })}`
  },
  {
    name: 'Pokerabend',
    svg: `<rect width="${W}" height="${H}" fill="#2f6b52"/><ellipse cx="195" cy="170" rx="260" ry="80" fill="#3a7d61"/>
      <g transform="translate(150 22)"><path d="M-30 0h60l-14 20h-32z" fill="#f2cf86"/><rect x="-1" y="-22" width="2" height="22" fill="#1f3d30"/></g>
      ${[[50, 120, '#d9634a'], [64, 112, '#fffaf2'], [78, 120, '#2e2b4f'], [92, 114, '#d9634a']].map(([x, y, c], k) => Array.from({ length: 4 }, (_, j) => `<ellipse cx="${x}" cy="${(y as number) + 14 - j * 4}" rx="11" ry="4" fill="${c}"/><ellipse cx="${x}" cy="${(y as number) + 14 - j * 4}" rx="6" ry="2" fill="#fff" opacity=".3"/>`).join('') + (k ? '' : '')).join('')}
      <g transform="translate(150 118) rotate(-10)"><rect x="-12" y="-16" width="24" height="32" rx="3" fill="#fffaf2"/><text y="5" text-anchor="middle" font-family="Jost, sans-serif" font-weight="700" font-size="14" fill="#d9634a">A</text></g>
      ${fig(288, 182, .62, { shades: true, hat: 'none', prop: PROP.cards })}`
  }
];

/** Banner als SVG; ohne eigene Wahl ergibt sich das Motiv stabil aus der ID der Serie */
export function bannerOf(id: string, choice?: number | null): { i: number; svg: string } {
  const i = choice ?? [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % BANNERS.length;
  const b = BANNERS[i] ?? BANNERS[0];
  return { i, svg: `<svg class="ser-banner-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${b.svg}</svg>` };
}

/** Siegerbild einer Serie: Nacht mit Feuerwerk, der Otter mit Sonnenbrille und Pokal auf der Schulter */
export function seriesChampScene(): string {
  const burst = (x: number, y: number, r: number, c: string) => Array.from({ length: 12 }, (_, k) => {
    const a = (k / 12) * Math.PI * 2;
    return `<circle cx="${(x + Math.cos(a) * r).toFixed(1)}" cy="${(y + Math.sin(a) * r).toFixed(1)}" r="${k % 2 ? 2.4 : 3.4}" fill="${c}"/>`;
  }).join('') + `<circle cx="${x}" cy="${y}" r="4" fill="${c}"/>`;
  return `<svg class="scene" viewBox="0 0 390 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="390" height="300" fill="#231e45"/>${stars(22, '#5b5490')}
    <g class="vl-glow">${burst(80, 70, 34, '#f3a98f')}${burst(310, 60, 40, '#86cbb8')}${burst(200, 40, 24, '#f2cf86')}${burst(330, 160, 22, '#bba8e6')}</g>
    <rect y="250" width="390" height="50" fill="#3a3170"/>
    <g transform="translate(195 250)"><rect x="-70" y="-26" width="140" height="26" rx="5" fill="#f2cf86"/><text y="-8" text-anchor="middle" font-family="Jost, sans-serif" font-weight="700" font-size="15" letter-spacing="3" fill="#2e2b4f">SERIENSIEG</text></g>
    <ellipse cx="195" cy="226" rx="50" ry="5" fill="#000" opacity=".2"/>
    <g transform="translate(195 224) scale(.82)">${otter({ shades: true })}</g>
  </svg>`;
}
