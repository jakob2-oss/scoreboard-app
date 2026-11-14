/**
 * Titelseite nach einem Spieleabend: Schlagzeile, Kurzmeldungen, Tabelle und Poster-Zeilen.
 * Ein Abend sind alle Partien eines Tages; was bis 6 Uhr früh endet, zählt zum Vortag.
 * Reine Funktionen, keine Oberfläche. Der Ton folgt der Frech-Stufe.
 */
import type { QuipLevel } from '../lib/modes';
import { newsWeight, rivalNews, type RivalNews } from './rivals';
import { DEFAULT_POINTS, dayStar, matchdays, performance, resultOf, seriesPlaces, seriesTable, tableMoves, type HistGame, type SeriesRow } from './stats';

const pad = (n: number) => String(n).padStart(2, '0');
/** Tag des Abends (Ortszeit), Partien bis 6 Uhr früh gehören zum Vortag */
export function eveningOf(iso: string): string {
  const d = new Date(Date.parse(iso) - 6 * 36e5);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export interface Evening { day: string; games: HistGame[] }
/** Alle Abende in zeitlicher Reihenfolge */
export function evenings(list: HistGame[]): Evening[] {
  const map = new Map<string, HistGame[]>();
  for (const g of [...list].sort((a, b) => a.finishedAt.localeCompare(b.finishedAt))) {
    const d = eveningOf(g.finishedAt); map.set(d, [...(map.get(d) ?? []), g]);
  }
  return [...map.entries()].map(([day, games]) => ({ day, games }));
}

// ---------------------------------------------------------------- Wörter

const NUM = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];
const ORD = ['', 'ersten', 'zweiten', 'dritten', 'vierten', 'fünften', 'sechsten', 'siebten', 'achten', 'neunten', 'zehnten', 'elften', 'zwölften'];
/** „vier“, ab 13 als Ziffer; vor einem Hauptwort „ein“ bzw. „eine“ für die Eins */
export const numWord = (n: number, one = 'eins') => (n === 1 ? one : n < NUM.length ? NUM[n] : String(n));
export const ordWord = (n: number) => (n < ORD.length ? ORD[n] : `${n}.`);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** Genitiv eines Namens: „Bens“, „Max’“ */
export const gen = (name: string) => (/[sßxz]$/i.test(name) ? name + '’' : name + 's');
const plural = (n: number, one: string, many: string, art = 'ein') => `${numWord(n, art)} ${n === 1 ? one : many}`;

// ---------------------------------------------------------------- Geschichten

export type StoryKind = RivalNews['kind'] | 'sweep' | 'lastStreak' | 'drought' | 'leader' | 'star';
export interface Story {
  kind: StoryKind; weight: number;
  /** Rubrik über der Schlagzeile */
  kicker: string;
  /** Schlagzeile; *so* markierte Wörter werden hervorgehoben */
  headline: string;
  /** Kurzmeldung: Titel und ein Satz */
  title: string; text: string;
  /** Poster: drei bis vier kurze Zeilen in Großbuchstaben */
  poster: string[];
  /** Wer die Geschichte macht */
  who: string;
}

type T = Record<QuipLevel, string>;
const pick = (t: T, level: QuipLevel) => t[level];

export function rivalStory(n: RivalNews, nm: (id: string) => string, level: QuipLevel): Story {
  const W = nm(n.who), O = nm(n.other), a = n.after.a === n.who ? n.after.winsA : n.after.winsB, b = n.after.a === n.who ? n.after.winsB : n.after.winsA;
  const score = `${a} zu ${b}`;
  const s = (kicker: string, headline: T, title: string, text: string, poster: string[]): Story =>
    ({ kind: n.kind, weight: newsWeight(n), kicker, headline: pick(headline, level), title, text, poster, who: n.who });
  switch (n.kind) {
    case 'streak': return s('Dauerduell', {
      brav: `${W} gewinnt zum *${ordWord(n.n)}* Mal in Folge gegen ${O}`,
      frech: `${W} schlägt ${O} zum *${ordWord(n.n)}* Mal in Folge`,
      atzig: `${W} schlägt ${O}. *Wieder.*`
    }, 'Dauerduell', `${W} schlägt ${O} zum ${ordWord(n.n)} Mal in Folge.`, [W, 'SCHON', 'WIEDER.']);
    case 'revenge': return s('Revanche', {
      brav: `${W} beendet ${gen(O)} Siegesserie`,
      frech: `Revanche! ${W} stoppt ${O} nach *${numWord(n.n)}* Niederlagen`,
      atzig: `${W} dreht das Duell. ${O} *staunt.*`
    }, 'Revanche', `${W} beendet ${gen(O)} Serie von ${numWord(n.n)} Siegen.`, ['REVANCHE.', W, 'SAGT', 'DANKE.']);
    case 'lead': return s('Machtwechsel', {
      brav: `${W} übernimmt im Duell mit ${O} die *Führung*`,
      frech: `Machtwechsel: ${W} zieht an ${O} *vorbei*`,
      atzig: `Neue Ordnung. ${W} *vor* ${O}.`
    }, 'Machtwechsel', `${W} führt im Duell mit ${O} jetzt ${score}.`, ['NEUE', 'ORDNUNG.', W, 'VORN.']);
    case 'level': return s('Ausgleich', {
      brav: `${W} gleicht im Duell mit ${O} *aus*`,
      frech: `Ausgleich! ${W} holt ${O} *ein*`,
      atzig: `${W} und ${O}. *${score}.* Alles offen.`
    }, 'Ausgleich', `${W} und ${O} stehen jetzt ${score}.`, [`${a} ZU ${b}.`, 'ALLES', 'OFFEN.']);
    case 'milestone': return s('Jubiläum', {
      brav: `${W} und ${O} spielen zum *${n.n}.* Mal gegeneinander`,
      frech: `*${n.n}* Duelle und ${W} und ${O} können nicht voneinander lassen`,
      atzig: `${W} gegen ${O}. Folge *${n.n}.*`
    }, 'Jubiläum', `${n.n}. Duell, ${W} liegt ${score} ${a >= b ? 'vorn' : 'zurück'}.`, [`FOLGE ${n.n}.`, W, 'GEGEN', `${O}.`]);
    default: return s('Duell', {
      brav: `${W} gewinnt das Duell gegen ${O}`,
      frech: `${W} schlägt ${O}, mal wieder`,
      atzig: `${W} gegen ${O}. *${score}.*`
    }, 'Duell', `${W} gegen ${O} steht jetzt ${score}.`, [W, 'GEGEN', `${O}.`]);
  }
}

/** Letzter Platz: schlechteste Platzierung einer Partie mit mindestens zwei Plätzen */
const isLast = (g: HistGame, id: string) => { const r = resultOf(g, id); const worst = Math.max(...g.results.map(x => x.place)); return !!r && worst > 1 && r.place === worst; };
/** Wie oft hintereinander (rückwärts ab dem Ende) ein Spieler in seinen Partien `test` erfüllt */
function runFromEnd(list: HistGame[], id: string, test: (g: HistGame) => boolean): number {
  let n = 0;
  for (const g of [...list].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))) { if (!resultOf(g, id)) continue; if (!test(g)) break; n++; }
  return n;
}

export interface LigaInfo { eventId: string; name: string; matchday: number; rows: SeriesRow[]; places: number[]; moves: Record<string, number | 'neu'>; star: string | null }
export interface FrontPage {
  day: string; number: number;
  games: number; kinds: number;
  lead: Story; briefs: Story[];
  star: { id: string; wins: number } ;
  laterne: string | null;
  /** Bildunterschrift zum Foto des Siegers */
  caption: string;
  /** Zusammenfassung in einem Satz (Poster) */
  summary: string;
  /** Wertung des Abends (Siege, Platzpunkte) */
  table: SeriesRow[];
  /** Duell des Abends: häufigstes Paar heute mit Siegen am Abend */
  duel: { a: string; b: string; winsA: number; winsB: number } | null;
  liga: LigaInfo | null;
  variant: 'zeitung' | 'sport' | 'poster';
}

export interface FrontOpts { level: QuipLevel; names: Record<string, string>; events?: { id: string; name: string; kind?: string; points?: number[] }[] }

/** Titelseite eines Abends; `all` ist der ganze Verlauf (für Rivalitäten und Serien), `day` der Abend (eveningOf) */
export function frontPage(all: HistGame[], day: string, o: FrontOpts): FrontPage | null {
  const evs = evenings(all), idx = evs.findIndex(e => e.day === day); if (idx < 0) return null;
  const tonight = evs[idx].games, ids = new Set(tonight.map(g => g.id));
  const start = tonight[0].finishedAt;
  const before = all.filter(g => g.finishedAt < start && !ids.has(g.id)), upto = [...before, ...tonight];
  const nm = (id: string) => o.names[id] ?? '?', L = o.level;
  const table = seriesTable(tonight, DEFAULT_POINTS, 'points');
  const top = [...table].sort((a, b) => b.wins - a.wins || b.points - a.points || b.perf - a.perf)[0];
  const star = { id: top.playerId, wins: top.wins }, S = nm(star.id);
  const players = table.map(r => r.playerId);
  const low = players.length > 1 ? [...players].sort((a, b) => performance(tonight, a).score - performance(tonight, b).score)[0] : null;
  const laterne = low && low !== star.id ? low : null;

  const stories: Story[] = rivalNews(before, tonight).map(n => rivalStory(n, nm, L));
  const G = tonight.length;
  if (G >= 2 && star.wins === G) stories.push({
    kind: 'sweep', weight: 8 + G, kicker: 'Triumph', who: star.id,
    headline: pick({ brav: `${S} gewinnt *alle ${numWord(G)}* Partien`, frech: `${S} gewinnt alles. *Alles.*`, atzig: `${S}. *${G} von ${G}.* Fertig.` }, L),
    title: 'Makellos', text: `${S} gewinnt alle ${numWord(G)} Partien des Abends.`, poster: ['ALLES', `${S}.`]
  });
  for (const id of players) {
    const lastRun = runFromEnd(upto, id, g => isLast(g, id));
    if (lastRun >= 3 && tonight.some(g => isLast(g, id))) stories.push({
      kind: 'lastStreak', weight: 3 + lastRun, kicker: 'Drama', who: id,
      headline: pick({ brav: `${nm(id)} landet zum *${ordWord(lastRun)}* Mal in Folge hinten`, frech: `${nm(id)} verteidigt den letzten Platz zum *${ordWord(lastRun)}* Mal`, atzig: `${nm(id)} sammelt letzte Plätze. Nummer *${lastRun}.*` }, L),
      title: 'Hinten dran', text: `${nm(id)} landet zum ${ordWord(lastRun)} Mal in Folge auf dem letzten Platz.`,
      poster: [nm(id), 'HÄLT', 'DIE', 'STELLUNG.']
    });
    const won = tonight.filter(g => resultOf(g, id)?.place === 1);
    if (won.length) {
      const dry = runFromEnd(before, id, g => resultOf(g, id)!.place !== 1);
      if (dry >= 5) stories.push({
        kind: 'drought', weight: 5 + Math.min(4, dry / 3), kicker: 'Comeback', who: id,
        headline: pick({ brav: `${nm(id)} gewinnt wieder`, frech: `${nm(id)} gewinnt endlich wieder. *Nach ${dry} Partien.*`, atzig: `${nm(id)} ist *zurück.*` }, L),
        title: 'Durststrecke vorbei', text: `${nm(id)} gewinnt zum ersten Mal nach ${dry} Partien.`, poster: [nm(id), 'IST', 'ZURÜCK.']
      });
    }
  }

  // Liga: der Abend gehört (überwiegend) zu einer Liga
  let liga: LigaInfo | null = null;
  const counts = new Map<string, number>(); tonight.forEach(g => g.eventId && counts.set(g.eventId, (counts.get(g.eventId) ?? 0) + 1));
  const evId = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const ev = evId ? o.events?.find(e => e.id === evId && e.kind === 'liga') : undefined;
  if (ev && counts.get(ev.id)! * 2 >= G) {
    const games = upto.filter(g => g.eventId === ev.id), pts = ev.points ?? DEFAULT_POINTS;
    const rows = seriesTable(games, pts, 'points'), moves = tableMoves(games, pts, 'points'), ds = dayStar(games, pts);
    liga = { eventId: ev.id, name: ev.name, matchday: matchdays(games).length, rows, places: seriesPlaces(rows, 'points'), moves, star: ds?.playerId ?? null };
    const lead = rows[0], mv = lead ? moves[lead.playerId] : 0;
    if (lead && typeof mv === 'number' && mv > 0) stories.push({
      kind: 'leader', weight: 12, kicker: 'Tabelle', who: lead.playerId,
      headline: pick({ brav: `${nm(lead.playerId)} übernimmt die *Tabellenspitze*`, frech: `${nm(lead.playerId)} stürmt an die *Spitze*`, atzig: `${nm(lead.playerId)}. *Ganz oben.*` }, L),
      title: 'Tabellenspitze', text: `${nm(lead.playerId)} führt die ${ev.name} jetzt an.`, poster: [nm(lead.playerId), 'GANZ', 'OBEN.']
    });
  }

  const starStory: Story = {
    kind: 'star', weight: 2, kicker: 'Abend', who: star.id,
    headline: pick({ brav: `${S} gewinnt den Abend`, frech: `${S} holt sich den Abend`, atzig: `Der Abend gehört *${S}.*` }, L),
    title: 'Abendsieg', text: `${S} gewinnt ${star.wins} von ${G} ${G === 1 ? 'Partie' : 'Partien'}.`, poster: [S, 'WAR', 'HIER.']
  };
  stories.push(starStory);
  stories.sort((a, b) => b.weight - a.weight);
  const lead = stories[0];
  // Kurzmeldungen: zwei weitere, möglichst über andere Leute; die Rote Laterne, wenn Platz ist
  const briefs: Story[] = [];
  for (const s of stories.slice(1)) { if (briefs.length >= 2) break; if (s.kind === 'star' && lead.who === star.id) continue; if (!briefs.some(b => b.who === s.who && b.kind === s.kind)) briefs.push(s); }
  if (laterne && briefs.length < 2) briefs.push({
    kind: 'star', weight: 0, kicker: '', who: laterne, headline: '', poster: [],
    title: 'Rote Laterne', text: pick({ brav: `${nm(laterne)} hat noch Luft nach oben.`, frech: `${nm(laterne)} zahlt die Runde.`, atzig: `${nm(laterne)} sammelt Inspiration.` }, L)
  });
  if (briefs.length < 2 && lead.kind !== 'star') briefs.push(starStory);

  // Duell des Abends: Paar mit den meisten gemeinsamen Partien heute, Siege nur am Abend
  let duel: FrontPage['duel'] = null;
  for (let i = 0; i < players.length; i++) for (let j = i + 1; j < players.length; j++) {
    const a = players[i], b = players[j]; let wa = 0, wb = 0, n = 0;
    for (const g of tonight) { const ra = resultOf(g, a), rb = resultOf(g, b); if (!ra || !rb) continue; n++; if (ra.place < rb.place) wa++; else if (rb.place < ra.place) wb++; }
    if (n && (!duel || n > duel.winsA + duel.winsB || (wa + wb > duel.winsA + duel.winsB))) duel = wa >= wb ? { a, b, winsA: wa, winsB: wb } : { a: b, b: a, winsA: wb, winsB: wa };
  }
  if (lead.kind !== 'star' && lead.kind !== 'sweep' && lead.kind !== 'lastStreak' && lead.kind !== 'drought' && lead.kind !== 'leader') {
    // Schlagzeile über ein Duell: dieses Paar in den Kasten
    const n = rivalNews(before, tonight).find(x => x.who === lead.who);
    if (n) { let wa = 0, wb = 0; for (const g of tonight) { const ra = resultOf(g, n.who), rb = resultOf(g, n.other); if (ra && rb) { if (ra.place < rb.place) wa++; else if (rb.place < ra.place) wb++; } } duel = { a: n.who, b: n.other, winsA: wa, winsB: wb }; }
  }

  const kinds = new Set(tonight.map(g => g.key)).size;
  const caption = pick({ brav: `${S} freut sich über ${plural(star.wins, 'Sieg', 'Siege')}.`, frech: `${S} nach dem Abend: unbeeindruckt.`, atzig: `${S}, ganz entspannt.` }, L);
  const summary = cap(`${plural(G, 'Partie', 'Partien', 'eine')}, ${plural(star.wins, 'Sieg', 'Siege')} für ${S}`) + (laterne ? `, die Rote Laterne für ${nm(laterne)}.` : '.');
  const variant = liga ? 'sport' : L === 'atzig' ? 'poster' : 'zeitung';
  return { day, number: idx + 1, games: G, kinds, lead, briefs, star, laterne, caption, summary, table, duel, liga, variant };
}
