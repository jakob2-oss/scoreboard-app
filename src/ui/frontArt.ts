// Titelseite als SVG (405 × 720, Hochformat 9:16): dieselbe Zeichnung für die Anzeige und das geteilte Bild.
// Drei Seiten: Zeitung (Klatschblatt), Sport (Tabelle) und Poster. Flach, ohne Konturen.
import type { FrontPage } from '../game/frontpage';
import { onColor } from '../lib/color';
import { otter } from './trophy';

export const FW = 405, FH = 720;
const FONT = 'Jost, Futura, -apple-system, system-ui, sans-serif';
const INK = '#1d1a2e', PAPER = '#fbf6ec', RED = '#d9463a', GREY = '#6f6a8a';

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------------------------------------------------------------- Text messen und umbrechen

let ctx: CanvasRenderingContext2D | null | undefined;
/** Breite eines Textes in Jost; ohne Canvas (Tests) geschätzt */
export function textWidth(s: string, size: number, weight = 700, spacing = 0): number {
  if (ctx === undefined) { try { ctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null; } catch { ctx = null; } }
  const extra = spacing * s.length;
  if (!ctx) return s.length * size * (weight >= 700 ? .58 : .52) + extra;
  ctx.font = `${weight} ${size}px ${FONT}`;
  return ctx.measureText(s).width + extra;
}

interface Word { t: string; hi: boolean }
/** Text mit *Hervorhebung* in Wörter zerlegen */
function words(text: string): Word[] {
  const out: Word[] = [];
  text.split(/(\*[^*]+\*)/).forEach(part => {
    const hi = part.startsWith('*') && part.endsWith('*') && part.length > 1;
    (hi ? part.slice(1, -1) : part).split(/\s+/).filter(Boolean).forEach(t => out.push({ t, hi }));
  });
  return out;
}
/** Zeilenumbruch nach Breite */
export function wrap(text: string, size: number, maxW: number, weight = 700, upper = false, spacing = 0): Word[][] {
  const lines: Word[][] = []; let cur: Word[] = [];
  const w = (ws: Word[]) => textWidth(ws.map(x => x.t).join(' '), size, weight, spacing);
  for (const word of words(text).map(x => (upper ? { ...x, t: x.t.toUpperCase() } : x))) {
    if (cur.length && w([...cur, word]) > maxW) { lines.push(cur); cur = [word]; } else cur.push(word);
  }
  if (cur.length) lines.push(cur);
  return lines;
}
/** Zeilen als <text> mit hervorgehobenen Wörtern in eigener Farbe */
function lines(ls: Word[][], x: number, y: number, size: number, lh: number, fill: string, hiFill: string, weight = 700, extra = ''): string {
  return ls.map((l, i) => `<text x="${x}" y="${y + i * lh}" font-size="${size}" font-weight="${weight}" fill="${fill}" ${extra}>${l.map((wd, k) => `<tspan${wd.hi ? ` fill="${hiFill}"` : ''}>${esc(wd.t)}${k < l.length - 1 ? ' ' : ''}</tspan>`).join('')}</text>`).join('');
}
/** Größte Schrift (in Stufen), bei der der Text in höchstens maxLines Zeilen passt */
function fit(text: string, sizes: number[], maxW: number, maxLines: number, weight = 700, upper = false) {
  for (const s of sizes) { const ls = wrap(text, s, maxW, weight, upper); if (ls.length <= maxLines) return { size: s, ls }; }
  const s = sizes[sizes.length - 1]; return { size: s, ls: wrap(text, s, maxW, weight, upper).slice(0, maxLines) };
}

const dateLine = (day: string) => new Date(day + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase();
const shell = (body: string, bg: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${FW} ${FH}" width="${FW}" height="${FH}" font-family="${FONT}"><rect width="${FW}" height="${FH}" fill="${bg}"/>${body}</svg>`;

export interface FrontLook { names: Record<string, string>; colors: Record<string, string> }

// ---------------------------------------------------------------- Zeitung

function zeitung(fp: FrontPage, o: FrontLook): string {
  const nm = (id: string) => o.names[id] ?? '?';
  let b = `<text x="22" y="52" font-size="32" font-weight="700" fill="${INK}" letter-spacing="-.5">Oina no?</text>
    <text x="${FW - 22}" y="50" font-size="11" font-weight="600" fill="${INK}" text-anchor="end" letter-spacing="1.2">${esc(dateLine(fp.day))}</text>
    <rect x="22" y="62" width="${FW - 44}" height="4" fill="${INK}"/>`;
  const kick = fp.lead.kicker.toUpperCase(), kw = textWidth(kick, 13, 700, 1.8) + 16;
  b += `<rect x="22" y="80" width="${kw}" height="22" fill="${RED}"/><text x="30" y="96" font-size="13" font-weight="700" fill="#fff" letter-spacing="1.8">${esc(kick)}</text>`;
  const h = fit(fp.lead.headline, [42, 36, 31, 27], FW - 44, 4, 700, true), lh = h.size * 1.0;
  let y = 116 + h.size * .82;
  b += lines(h.ls, 22, y, h.size, lh, INK, RED, 700, 'letter-spacing="-.5"');
  y += (h.ls.length - 1) * lh + 18;
  // Kurzmeldungen unten, Foto füllt den Platz dazwischen
  const colW = (FW - 44 - 16) / 2;
  const briefs = fp.briefs.slice(0, 2).map(s => ({ title: s.title, ls: wrap(s.text, 13.5, colW, 400) }));
  const briefH = briefs.length ? 22 + Math.max(...briefs.map(x => x.ls.length)) * 18 : 0;
  const capY = FH - 30 - briefH - 14, photoH = Math.max(120, capY - 18 - y);
  b += `<defs><clipPath id="fp-ph"><rect x="22" y="${y}" width="${FW - 44}" height="${photoH}" rx="14"/></clipPath></defs>
    <g clip-path="url(#fp-ph)"><rect x="22" y="${y}" width="${FW - 44}" height="${photoH}" fill="#d3a072"/><rect x="22" y="${y + photoH - 34}" width="${FW - 44}" height="34" fill="#9c6b47"/>
    <rect x="22" y="${y + photoH - 34}" width="${FW - 44}" height="5" fill="#b07c55"/>
    <g transform="translate(${FW / 2} ${y + photoH - 12}) scale(${Math.min(.95, (photoH - 20) / 190)})">${otter({ shades: true, hat: 'crown' })}</g>
    <text x="36" y="${y + 26}" font-size="12" font-weight="700" fill="#fff6ea" letter-spacing="2">EXKLUSIV</text></g>`;
  b += `<text x="22" y="${y + photoH + 16}" font-size="11.5" fill="${GREY}">${esc(fp.caption)}</text>`;
  briefs.forEach((br, i) => {
    const x = 22 + i * (colW + 16), by = FH - 30 - briefH + 14;
    b += `<text x="${x}" y="${by}" font-size="15" font-weight="700" fill="${INK}">${esc(br.title)}</text>`;
    b += lines(br.ls, x, by + 20, 13.5, 18, INK, INK, 400);
  });
  b += `<text x="22" y="${FH - 14}" font-size="10" font-weight="600" fill="${GREY}" letter-spacing="1.4">ABEND NR. ${fp.number}</text>`;
  void nm;
  return shell(b, PAPER);
}

// ---------------------------------------------------------------- Sport

function sport(fp: FrontPage, o: FrontLook): string {
  const nm = (id: string) => o.names[id] ?? '?', W = '#ffffff', GOLD = '#f0b13e', MINT = '#9ff0c3', ROSE = '#ffb3a8';
  const top = fp.liga ? `${fp.liga.name}, Spieltag ${fp.liga.matchday}` : `Abend Nr. ${fp.number}`;
  let b = `<text x="22" y="44" font-size="12" font-weight="700" fill="${W}" opacity=".8" letter-spacing="2.2">${esc(top.toUpperCase())}</text>`;
  const h = fit(fp.lead.headline, [38, 33, 28], FW - 44, 3, 700);
  b += lines(h.ls, 22, 58 + h.size * .9, h.size, h.size * 1.02, W, GOLD);
  let y = 58 + h.size * .9 + (h.ls.length - 1) * h.size * 1.02 + 22;
  // Ergebnis-Kasten
  const left = fp.duel ? 'Duell des Abends' : 'Abend', sub = `${fp.games} ${fp.games === 1 ? 'Partie' : 'Partien'}, ${fp.kinds} ${fp.kinds === 1 ? 'Spiel' : 'Spiele'}`;
  const big = fp.duel ? `${fp.duel.winsA}:${fp.duel.winsB}` : String(fp.star.wins);
  const right = fp.duel ? [`${nm(fp.duel.a)}`, `gegen ${nm(fp.duel.b)}`] : ['Siege', nm(fp.star.id)];
  b += `<rect x="22" y="${y}" width="${FW - 44}" height="96" rx="18" fill="${W}"/>
    <text x="40" y="${y + 44}" font-size="15" font-weight="700" fill="${INK}">${esc(left)}</text><text x="40" y="${y + 64}" font-size="12.5" fill="${GREY}">${esc(sub)}</text>
    <text x="${FW / 2 + 10}" y="${y + 66}" font-size="52" font-weight="700" fill="${INK}" text-anchor="middle">${esc(big)}</text>
    <text x="${FW - 40}" y="${y + 44}" font-size="13" fill="${INK}" text-anchor="end">${esc(right[0])}</text><text x="${FW - 40}" y="${y + 63}" font-size="13" fill="${INK}" text-anchor="end">${esc(right[1])}</text>`;
  y += 112;
  // Tabelle: Liga mit Bewegung und Punkten, sonst Siege des Abends
  const rows = (fp.liga ? fp.liga.rows : fp.table).slice(0, 6);
  const places = fp.liga ? fp.liga.places : rows.map((_, i) => i + 1);
  const rh = 40, th = rows.length * rh + 30;
  b += `<rect x="22" y="${y}" width="${FW - 44}" height="${th}" rx="18" fill="${W}" opacity=".1"/>
    <text x="${FW - 38}" y="${y + 22}" font-size="10.5" font-weight="700" fill="${W}" opacity=".7" text-anchor="end" letter-spacing="1.4">${fp.liga ? 'PUNKTE' : 'SIEGE'}</text>`;
  rows.forEach((r, i) => {
    const ry = y + 30 + i * rh + 26, mv = fp.liga?.moves[r.playerId];
    b += `<text x="38" y="${ry}" font-size="15" font-weight="600" fill="${W}" opacity=".7">${places[i]}</text>
      <text x="64" y="${ry}" font-size="17" font-weight="600" fill="${W}">${esc(nm(r.playerId))}</text>
      ${fp.liga ? `<text x="${FW - 96}" y="${ry}" font-size="14" font-weight="700" fill="${typeof mv === 'number' && mv > 0 ? MINT : typeof mv === 'number' && mv < 0 ? ROSE : W}" text-anchor="end">${mv === 'neu' ? 'neu' : typeof mv === 'number' && mv ? (mv > 0 ? '▲ ' : '▼ ') + Math.abs(mv) : '–'}</text>` : ''}
      <text x="${FW - 38}" y="${ry}" font-size="17" font-weight="700" fill="${W}" text-anchor="end">${fp.liga ? r.points : r.wins}</text>
      ${i < rows.length - 1 ? `<rect x="38" y="${ry + 13}" width="${FW - 76}" height="1" fill="${W}" opacity=".15"/>` : ''}`;
  });
  y += th + 16;
  // Star des Abends
  const sid = fp.liga?.star ?? fp.star.id, col = o.colors[sid] ?? '#86cbb8', starRow = fp.table.find(r => r.playerId === sid);
  if (y + 72 < FH - 16) {
    b += `<rect x="22" y="${y}" width="${FW - 44}" height="70" rx="18" fill="${GOLD}"/>
      <circle cx="58" cy="${y + 35}" r="22" fill="${col}"/><text x="58" y="${y + 42}" font-size="19" font-weight="700" fill="${onColor(col)}" text-anchor="middle">${esc(nm(sid).charAt(0).toUpperCase())}</text>
      <text x="92" y="${y + 29}" font-size="10.5" font-weight="700" fill="${INK}" letter-spacing="1.6">STAR DES ABENDS</text>
      <text x="92" y="${y + 51}" font-size="19" font-weight="700" fill="${INK}">${esc(nm(sid))}, ${starRow ? `${starRow.wins} ${starRow.wins === 1 ? 'Sieg' : 'Siege'}` : ''}</text>`;
    y += 86;
  }
  // Kurzmeldungen füllen den Rest
  for (const br of fp.briefs.filter(x => x.title !== 'Rote Laterne')) {
    const ls = wrap(br.text, 14, FW - 44, 400), need = 22 + ls.length * 19;
    if (y + need > FH - 40) break;
    b += `<text x="22" y="${y + 10}" font-size="11" font-weight="700" fill="${GOLD}" letter-spacing="1.6">${esc(br.title.toUpperCase())}</text>`;
    b += lines(ls, 22, y + 30, 14, 19, W, W, 400);
    y += need + 14;
  }
  if (fp.laterne && y + 10 < FH - 16) b += `<text x="22" y="${FH - 24}" font-size="13" font-weight="600" fill="${W}" opacity=".85">Rote Laterne: ${esc(nm(fp.laterne))}</text>`;
  return shell(b, '#1f6b4a');
}

// ---------------------------------------------------------------- Poster

const PALETTES = [
  { bg: '#ff7a59', blobs: ['#ffb25b', '#bba8e6', '#86cbb8'], big: '#fff6ea', ink: INK },
  { bg: '#3a3170', blobs: ['#5b4fa6', '#ef7a5c', '#f2cf86'], big: '#fff6ea', ink: '#fff6ea' },
  { bg: '#86cbb8', blobs: ['#f2cf86', '#ef7a5c', '#fbf6ec'], big: INK, ink: INK }
];
function poster(fp: FrontPage): string {
  const p = PALETTES[[...fp.day].reduce((h, c) => h + c.charCodeAt(0), 0) % PALETTES.length];
  const big = fp.lead.poster.length ? fp.lead.poster.map(s => s.toUpperCase()) : ['OINA', 'NO?'];
  const widest = Math.max(...big.map(s => textWidth(s, 100, 700, -3)));
  const size = Math.min(104, Math.floor(100 * (FW - 40) / widest)), lh = size * .86;
  const sum = wrap(fp.summary, 18, FW - 44, 600);
  const sumY = FH - 34 - (sum.length - 1) * 24;
  const bigY = sumY - 34 - (big.length - 1) * lh;
  let b = `<circle cx="70" cy="420" r="230" fill="${p.blobs[0]}"/><circle cx="360" cy="70" r="140" fill="${p.blobs[1]}"/><circle cx="300" cy="360" r="82" fill="${p.blobs[2]}"/>
    <g transform="translate(300 ${Math.min(400, bigY - size * .7)}) scale(1.05)">${otter({ shades: true, hat: 'cap' })}</g>
    <text x="24" y="46" font-size="14" font-weight="700" fill="${p.ink}" letter-spacing="3">ABEND NR. ${fp.number}</text>`;
  b += big.map((s, i) => `<text x="20" y="${bigY + i * lh}" font-size="${size}" font-weight="700" fill="${p.big}" letter-spacing="-3">${esc(s)}</text>`).join('');
  b += lines(sum, 24, sumY, 18, 24, p.ink, p.ink, 600);
  return shell(b, p.bg);
}

export type FrontVariant = FrontPage['variant'];
export function frontSvg(fp: FrontPage, v: FrontVariant, o: FrontLook): string {
  return v === 'sport' ? sport(fp, o) : v === 'poster' ? poster(fp) : zeitung(fp, o);
}

// ---------------------------------------------------------------- Als Bild teilen

let fontCss: Promise<string> | null = null;
/** Jost als eingebettete Schrift, damit das Bild auch ohne Netz-Schrift gleich aussieht (sonst Futura) */
function embeddedFont(): Promise<string> {
  fontCss ??= (async () => {
    try {
      const css = await (await fetch('https://fonts.googleapis.com/css2?family=Jost:wght@400;600;700&display=swap')).text();
      const blocks = css.split('@font-face').slice(1).filter(x => /U\+0000-00FF/.test(x));
      const out: string[] = [];
      for (const bl of blocks) {
        const url = /url\((https:[^)]+)\)/.exec(bl)?.[1], weight = /font-weight:\s*(\d+)/.exec(bl)?.[1]; if (!url || !weight) continue;
        const buf = new Uint8Array(await (await fetch(url)).arrayBuffer());
        let bin = ''; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
        out.push(`@font-face{font-family:Jost;font-weight:${weight};src:url(data:font/woff2;base64,${btoa(bin)}) format('woff2')}`);
      }
      return out.join('');
    } catch { return ''; }
  })();
  return fontCss;
}

/** SVG in ein PNG (1080 × 1920) umwandeln */
export async function frontPng(svg: string): Promise<Blob> {
  const css = await embeddedFont();
  const full = css ? svg.replace(/^<svg([^>]*)>/, (m) => `${m}<style>${css}</style>`) : svg;
  const url = URL.createObjectURL(new Blob([full], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('Bild')); img.src = url; });
    await new Promise(r => setTimeout(r, 120)); // Safari: Schrift im Bild braucht einen Moment
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1920;
    c.getContext('2d')!.drawImage(img, 0, 0, 1080, 1920);
    return await new Promise<Blob>((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('Bild'))), 'image/png'));
  } finally { URL.revokeObjectURL(url); }
}
