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

export type StoryKind = RivalNews['kind'] | 'sweep' | 'lastStreak' | 'drought' | 'leader' | 'star'
  | 'premiere' | 'debut' | 'firstWin' | 'hattrick' | 'everyone' | 'close' | 'blowout' | 'marathon' | 'variety' | 'night' | 'redLamp' | 'tie' | 'double';
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

/** Text je Frech-Stufe, gern mit mehreren Varianten */
type T = Record<QuipLevel, string | string[]>;
const hash = (x: string) => [...x].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
/** Variante stabil aus dem seed (Abend und Geschichte), damit dieselbe Titelseite gleich bleibt */
const pick = (t: T, level: QuipLevel, seed = '') => { const v = t[level]; return Array.isArray(v) ? v[hash(seed) % v.length] : v; };

export function rivalStory(n: RivalNews, nm: (id: string) => string, level: QuipLevel, seed = ''): Story {
  const W = nm(n.who), O = nm(n.other), a = n.after.a === n.who ? n.after.winsA : n.after.winsB, b = n.after.a === n.who ? n.after.winsB : n.after.winsA;
  const score = `${a} zu ${b}`, sd = seed + n.kind + n.who + n.other;
  const s = (kicker: string, headline: T, title: string, text: string, poster: string[]): Story =>
    ({ kind: n.kind, weight: newsWeight(n), kicker, headline: pick(headline, level, sd), title, text, poster, who: n.who });
  switch (n.kind) {
    case 'streak': return s('Dauerduell', {
      brav: [`${W} gewinnt zum *${ordWord(n.n)}* Mal in Folge gegen ${O}`, `${W} bleibt gegen ${O} ungeschlagen, *${numWord(n.n)}* Siege in Serie`],
      frech: [`${W} schlägt ${O} zum *${ordWord(n.n)}* Mal in Folge`, `${O} sucht noch das Rezept gegen ${W}. *${cap(numWord(n.n))}* Pleiten in Serie`, `${W} gegen ${O}: Es wird *langsam peinlich*`],
      atzig: [`${W} schlägt ${O}. *Wieder.*`, `${W}. ${O}. Das *alte Lied.*`, `Serie Nummer *${n.n}.* ${W} über ${O}.`]
    }, 'Dauerduell', `${W} schlägt ${O} zum ${ordWord(n.n)} Mal in Folge.`, [W, 'SCHON', 'WIEDER.']);
    case 'revenge': return s('Revanche', {
      brav: [`${W} beendet ${gen(O)} Siegesserie`, `Endlich: ${W} schlägt ${O} *wieder*`],
      frech: [`Revanche! ${W} stoppt ${O} nach *${numWord(n.n)}* Niederlagen`, `${O} verliert gegen ${W}. Die Serie ist *Geschichte*`, `${W} hat ${gen(O)} Serie *beerdigt*`],
      atzig: [`${W} dreht das Duell. ${O} *staunt.*`, `Plot-Twist: ${W} schlägt ${O}.`, `${gen(O)} Serie? *War einmal.*`]
    }, 'Revanche', `${W} beendet ${gen(O)} Serie von ${numWord(n.n)} Siegen.`, ['REVANCHE.', W, 'SAGT', 'DANKE.']);
    case 'lead': return s('Machtwechsel', {
      brav: [`${W} übernimmt im Duell mit ${O} die *Führung*`, `${W} liegt gegen ${O} jetzt *vorn*`],
      frech: [`Machtwechsel: ${W} zieht an ${O} *vorbei*`, `${O} muss ${W} jetzt *hinterherschauen*`],
      atzig: [`Neue Ordnung. ${W} *vor* ${O}.`, `${W} übernimmt. ${O} *notiert.*`]
    }, 'Machtwechsel', `${W} führt im Duell mit ${O} jetzt ${score}.`, ['NEUE', 'ORDNUNG.', W, 'VORN.']);
    case 'level': return s('Ausgleich', {
      brav: [`${W} gleicht im Duell mit ${O} *aus*`, `Wieder *Gleichstand* zwischen ${W} und ${O}`],
      frech: [`Ausgleich! ${W} holt ${O} *ein*`, `${O} hat sich zu früh gefreut. *${score}*`],
      atzig: [`${W} und ${O}. *${score}.* Alles offen.`, `Patt. ${W} gegen ${O}, *${score}.*`]
    }, 'Ausgleich', `${W} und ${O} stehen jetzt ${score}.`, [`${a} ZU ${b}.`, 'ALLES', 'OFFEN.']);
    case 'milestone': return s('Jubiläum', {
      brav: `${W} und ${O} spielen zum *${n.n}.* Mal gegeneinander`,
      frech: `*${n.n}* Duelle und ${W} und ${O} können nicht voneinander lassen`,
      atzig: `${W} gegen ${O}. Folge *${n.n}.*`
    }, 'Jubiläum', `${n.n}. Duell, ${W} liegt ${score} ${a >= b ? 'vorn' : 'zurück'}.`, [`FOLGE ${n.n}.`, W, 'GEGEN', `${O}.`]);
    default: return s('Duell', {
      brav: [`${W} gewinnt das Duell gegen ${O}`, `${W} hat gegen ${O} die *Nase vorn*`],
      frech: [`${W} schlägt ${O}, *mal wieder*`, `${O} gegen ${W}: Es bleibt *schwierig*`],
      atzig: [`${W} gegen ${O}. *${score}.*`, `${W} über ${O}. *Notiert.*`]
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

  const stories: Story[] = rivalNews(before, tonight).map(n => rivalStory(n, nm, L, day));
  const G = tonight.length, kinds = new Set(tonight.map(g => g.key)).size;
  const add = (kind: StoryKind, weight: number, who: string, kicker: string, headline: T, title: string, text: string, poster: string[]) =>
    stories.push({ kind, weight, who, kicker, headline: pick(headline, L, day + kind + who), title, text, poster });
  const winsOf = (id: string) => tonight.filter(g => resultOf(g, id)?.place === 1).length;
  const playedOf = (id: string) => tonight.filter(g => resultOf(g, id)).length;

  if (G >= 2 && star.wins === G) add('sweep', 8 + G, star.id, 'Triumph', {
    brav: [G === 2 ? `${S} gewinnt *beide* Partien` : `${S} gewinnt *alle ${numWord(G)}* Partien`, `Makellos: ${S} gewinnt *jede* Partie`],
    frech: [`${S} gewinnt alles. *Alles.*`, `${S} lässt *nichts* übrig`, `Die anderen durften *zuschauen*`],
    atzig: [`${S}. *${G} von ${G}.* Fertig.`, `Perfekter Abend. *${S}.*`]
  }, 'Makellos', G === 2 ? `${S} gewinnt beide Partien des Abends.` : `${S} gewinnt alle ${numWord(G)} Partien des Abends.`, ['ALLES', `${S}.`]);

  for (const id of players) {
    const N = nm(id), w = winsOf(id), pl = playedOf(id);
    const lastRun = runFromEnd(upto, id, g => isLast(g, id));
    if (lastRun >= 3 && tonight.some(g => isLast(g, id))) add('lastStreak', 3 + lastRun, id, 'Drama', {
      brav: [`${N} landet zum *${ordWord(lastRun)}* Mal in Folge hinten`],
      frech: [`${N} verteidigt den letzten Platz zum *${ordWord(lastRun)}* Mal`, `${N} hat ein Abo auf den *letzten Platz*`],
      atzig: [`${N} sammelt letzte Plätze. Nummer *${lastRun}.*`, `${N} bleibt sich *treu.* Ganz hinten.`]
    }, 'Hinten dran', `${N} landet zum ${ordWord(lastRun)} Mal in Folge auf dem letzten Platz.`, [N, 'HÄLT', 'DIE', 'STELLUNG.']);
    else if (pl >= 2 && tonight.every(g => !resultOf(g, id) || isLast(g, id))) add('redLamp', 4, id, 'Drama', {
      brav: [`Für ${N} war heute nicht der Abend`],
      frech: [`${N} ist in *jeder* Partie Schlusslicht`, `${N} zahlt die Runde. *Und die nächste.*`],
      atzig: [`${N}. Konsequent *ganz hinten.*`]
    }, 'Rote Laterne', `${N} landet in allen ${numWord(pl)} Partien hinten.`, [N, 'ZAHLT.']);
    const prev = before.filter(g => resultOf(g, id));
    if (!prev.length) {
      if (idx > 0 && w) add('debut', 6.5, id, 'Neu dabei', {
        brav: [`${N} gewinnt gleich beim ersten Mal`, `Starker Einstand für ${N}`],
        frech: [`Neu dabei und *schon gewonnen*: ${N}`, `${N} kommt, sieht und *gewinnt*`],
        atzig: [`${N}. Debüt. *Sieg.*`, `Neues Gesicht, *alter Glanz.* ${N}.`]
      }, 'Einstand', `${N} spielt zum ersten Mal mit und gewinnt.`, ['NEU.', N, 'GEWINNT.']);
      else if (idx > 0) add('debut', 1.5, id, 'Neu dabei', { brav: `Willkommen, ${N}`, frech: `${N} ist neu und lernt noch`, atzig: `Neu am Tisch: *${N}.*` }, 'Neu dabei', `${N} spielt zum ersten Mal mit.`, ['HALLO,', `${N}.`]);
    } else if (w && !prev.some(g => resultOf(g, id)!.place === 1)) add('firstWin', 7, id, 'Erster Sieg', {
      brav: [`Der *erste Sieg* für ${N}`, `${N} gewinnt *zum ersten Mal*`],
      frech: [`Es ist passiert: ${N} *gewinnt*`, `${N} gewinnt. Die Welt *staunt*`],
      atzig: [`${N}. Erster Sieg. *Rahmt das ein.*`]
    }, 'Erster Sieg', `${N} gewinnt zum ersten Mal überhaupt.`, ['ENDLICH', `${N}.`]);
    else if (w) {
      const dry = runFromEnd(before, id, g => resultOf(g, id)!.place !== 1);
      if (dry >= 5) add('drought', 5 + Math.min(4, dry / 3), id, 'Comeback', {
        brav: [`${N} gewinnt wieder`, `Durststrecke vorbei für ${N}`],
        frech: [`${N} gewinnt endlich wieder. *Nach ${dry} Partien.*`, `${N} hat das Gewinnen *nicht verlernt*`],
        atzig: [`${N} ist *zurück.*`, `Comeback des Jahres. *${N}.*`]
      }, 'Durststrecke vorbei', `${N} gewinnt zum ersten Mal nach ${dry} Partien.`, [N, 'IST', 'ZURÜCK.']);
    }
    // Dreierpack: drei Siege hintereinander an diesem Abend (ohne alle gewonnen)
    let run = 0, best = 0; for (const g of tonight) { if (!resultOf(g, id)) continue; run = resultOf(g, id)!.place === 1 ? run + 1 : 0; best = Math.max(best, run); }
    if (best >= 3 && w < G) add('hattrick', 5 + best, id, 'Lauf', {
      brav: [`${N} gewinnt *${numWord(best)}* Partien in Folge`],
      frech: [`${N} ist nicht zu bremsen: *${numWord(best)}* Siege am Stück`, `Hattrick! ${N} läuft *heiß*`],
      atzig: [`${N} on fire. *${best} am Stück.*`]
    }, 'Lauf', `${N} gewinnt ${numWord(best)} Partien hintereinander.`, [N, 'LÄUFT.']);
    else if (w === 2 && G >= 3 && id === star.id) add('double', 3, id, 'Doppelpack', {
      brav: [`Doppelpack für ${N}`], frech: [`${N} gewinnt zweimal und *redet von nichts anderem*`], atzig: [`Zwei Siege. *${N}.* Läuft.`]
    }, 'Doppelpack', `${N} gewinnt zwei Partien.`, ['ZWEI', 'FÜR', `${N}.`]);
  }

  if (players.length >= 3 && G >= players.length && players.every(id => winsOf(id) > 0)) add('everyone', 5, star.id, 'Gerecht', {
    brav: [`*Jeder* gewinnt mindestens einmal`, `Ein Abend mit *lauter Siegern*`],
    frech: [`Kuschelabend: *jeder* gewinnt mal`, `Heute gibt es *keine* Verlierer. Fast.`],
    atzig: [`Alle gewinnen. *Sozialismus am Spieltisch.*`, `Fair verteilt. *Verdächtig fair.*`]
  }, 'Für jeden was', `Alle ${numWord(players.length)} gewinnen mindestens eine Partie.`, ['JEDER', 'MAL.']);

  // Knappe und klare Partien (nur mit echten Punkten, nicht bei Platz-Spielen)
  for (const g of tonight) {
    const r = [...g.results].sort((x, y) => x.place - y.place), [r1, r2] = r;
    if (!r1 || !r2 || r1.place === r2.place || g.results.every(x => x.total === x.place)) continue;
    const gap = Math.abs(r1.total - r2.total), top = Math.max(1, Math.abs(r1.total), Math.abs(r2.total)), W = nm(r1.playerId), O = nm(r2.playerId);
    if (gap > 0 && gap <= Math.max(2, top * .03)) add('close', 4.5, r1.playerId, 'Krimi', {
      brav: [`${W} gewinnt ${g.name} *ganz knapp*`, `Krimi beim ${g.name}: ${W} vor ${O}`],
      frech: [`${W} gewinnt ${g.name} mit *${gap === 1 ? 'einem Punkt' : `${gap} Punkten`}*. ${O} schäumt`, `Fotofinish beim ${g.name}: ${W} hauchdünn vor ${O}`],
      atzig: [`${g.name}. ${W}. *Millimeter.*`, `${gap === 1 ? 'Ein Punkt' : `${gap} Punkte`}. ${W} über ${O}. *Kunst.*`]
    }, 'Fotofinish', `${W} gewinnt ${g.name} mit ${gap === 1 ? 'einem Punkt' : `${gap} Punkten`} vor ${O}.`, ['KNAPP.', W, 'VORN.']);
    else if (r.length >= 2 && gap >= top * .5 && top >= 20) add('blowout', 3, r1.playerId, 'Machtdemonstration', {
      brav: [`Deutlicher Sieg für ${W} beim ${g.name}`],
      frech: [`${W} zerlegt alle beim ${g.name}`, `${g.name}: ${W} spielt allein, die anderen *zählen mit*`],
      atzig: [`${g.name}. ${W}. *Kein Wettbewerb.*`]
    }, 'Klare Sache', `${W} gewinnt ${g.name} mit großem Vorsprung.`, ['KLARE', 'SACHE.', W]);
    if (r1.place === 1 && g.results.filter(x => x.place === 1).length > 1) add('tie', 3, r1.playerId, 'Unentschieden', {
      brav: [`Geteilter Sieg beim ${g.name}`], frech: [`${g.name} endet *unentschieden*. Keiner gibt nach.`], atzig: [`${g.name}. *Patt.* Stilvoll.`]
    }, 'Geteilt', `${g.name} endet mit geteiltem ersten Platz.`, ['PATT.']);
  }

  if (G >= 6) add('marathon', 3 + G / 4, star.id, 'Marathon', {
    brav: [`*${cap(numWord(G))}* Partien an einem Abend`],
    frech: [`*${cap(numWord(G))}* Partien. Morgen ist auch noch ein Tag`, `Keiner wollte nach Hause: *${numWord(G)}* Partien`],
    atzig: [`${G} Partien. *Durchgezogen.*`]
  }, 'Marathon', `${cap(numWord(G))} Partien an einem Abend.`, [`${G}`, 'PARTIEN.']);
  if (kinds >= 3) add('variety', 2.5, star.id, 'Querbeet', {
    brav: [`*${cap(numWord(kinds))}* Spiele an einem Abend`], frech: [`Querbeet: *${numWord(kinds)}* Spiele, keiner hatte genug`], atzig: [`${cap(numWord(kinds))} Spiele. *Ein Abend.*`]
  }, 'Querbeet', `${cap(numWord(kinds))} verschiedene Spiele.`, ['QUER', 'BEET.']);
  const lastH = new Date(tonight[G - 1].finishedAt).getHours();
  if (lastH < 6) add('night', 2.5, star.id, 'Nachteulen', {
    brav: [`Gespielt bis *nach Mitternacht*`], frech: [`Um ${lastH} Uhr war noch *lange nicht Schluss*`, `Die Nachbarn wissen jetzt, *wer gewonnen hat*`], atzig: [`${lastH} Uhr. *Noch eine Runde.*`]
  }, 'Nachteulen', `Die letzte Partie endet nach ${lastH} Uhr.`, ['NOCH', 'EINE', 'RUNDE.']);
  if (idx === 0) add('premiere', 6, star.id, 'Premiere', {
    brav: [`Der *erste* Abend, ${S} gewinnt`], frech: [`Erster Abend, erster Sieger: *${S}*`, `Es beginnt. Und ${S} hat *schon gewonnen*`], atzig: [`Abend eins. *${S}.*`]
  }, 'Premiere', `Der erste Abend in der Geschichte dieser Runde.`, ['ABEND', 'EINS.', `${S}.`]);

  // Liga: der Abend gehört (überwiegend) zu einer Liga
  let liga: LigaInfo | null = null;
  const counts = new Map<string, number>(); tonight.forEach(g => g.eventId && counts.set(g.eventId, (counts.get(g.eventId) ?? 0) + 1));
  const evId = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const ev = evId ? o.events?.find(e => e.id === evId && e.kind === 'liga') : undefined;
  if (ev && counts.get(ev.id)! * 2 >= G) {
    const games = upto.filter(g => g.eventId === ev.id), pts = ev.points ?? DEFAULT_POINTS;
    const rows = seriesTable(games, pts, 'points'), moves = tableMoves(games, pts, 'points'), ds = dayStar(games, pts);
    liga = { eventId: ev.id, name: ev.name, matchday: matchdays(games).length, rows, places: seriesPlaces(rows, 'points'), moves, star: ds?.playerId ?? null };
    const lead = rows[0], mv = lead ? moves[lead.playerId] : 0, LN = lead ? nm(lead.playerId) : '';
    if (lead && typeof mv === 'number' && mv > 0) add('leader', 12, lead.playerId, 'Tabelle', {
      brav: [`${LN} übernimmt die *Tabellenspitze*`], frech: [`${LN} stürmt an die *Spitze*`, `Neuer Tabellenführer: *${LN}*`], atzig: [`${LN}. *Ganz oben.*`]
    }, 'Tabellenspitze', `${LN} führt die ${ev.name} jetzt an.`, [LN, 'GANZ', 'OBEN.']);
    else if (lead && liga.matchday === 1) add('leader', 5, lead.playerId, 'Auftakt', {
      brav: [`${LN} führt nach dem *ersten Spieltag*`], frech: [`Auftakt nach Maß für *${LN}*`], atzig: [`Spieltag eins. *${LN} vorn.*`]
    }, 'Auftakt', `${LN} führt die ${ev.name} nach dem ersten Spieltag an.`, [LN, 'VORN.']);
  }

  const lostAll = players.filter(id => !winsOf(id));
  const starStory: Story = {
    kind: 'star', weight: 2, kicker: 'Abend', who: star.id,
    headline: pick({
      brav: [`${S} gewinnt den Abend`, `${S} ist der Star des Abends`, `${S} holt ${plural(star.wins, 'Sieg', 'Siege')}`],
      frech: [`${S} holt sich den Abend`, `${S} gewinnt und wird es *allen erzählen*`, `Alle gegen ${S}. Und ${S} *gewinnt*`, lostAll.length ? `${S} gewinnt, ${nm(lostAll[0])} *guckt zu*` : `${S} räumt ab`],
      atzig: [`Der Abend gehört *${S}.*`, `${S}. *Einfach ${S}.*`, `Heute: *${S}.*`]
    }, L, day + 'star'),
    title: 'Abendsieg', text: `${S} gewinnt ${star.wins} von ${G} ${G === 1 ? 'Partie' : 'Partien'}.`, poster: [S, 'WAR', 'HIER.']
  };
  stories.push(starStory);
  stories.sort((a, b) => b.weight - a.weight);
  const lead = stories[0];
  // Kurzmeldungen: zwei weitere, möglichst über andere Leute oder andere Themen; die Rote Laterne, wenn Platz ist
  const briefs: Story[] = [];
  for (const s of stories.slice(1)) {
    if (briefs.length >= 2) break;
    if (s.kind === 'star' && lead.who === star.id) continue;
    if (s.kind === lead.kind && s.who === lead.who) continue;
    if (!briefs.some(b => b.kind === s.kind)) briefs.push(s);
  }
  if (laterne && briefs.length < 2 && !briefs.some(b => b.kind === 'redLamp') && lead.kind !== 'redLamp') briefs.push({
    kind: 'star', weight: 0, kicker: '', who: laterne, headline: '', poster: [],
    title: 'Rote Laterne', text: pick({ brav: [`${nm(laterne)} hat noch Luft nach oben.`, `${nm(laterne)} übt noch.`], frech: [`${nm(laterne)} zahlt die Runde.`, `${nm(laterne)} spendiert die nächste Runde.`], atzig: [`${nm(laterne)} sammelt Inspiration.`, `${nm(laterne)} spielt auf lange Sicht.`] }, L, day + 'lamp')
  });
  if (briefs.length < 2 && lead.kind !== 'star') briefs.push(starStory);

  // Duell des Abends: Paar mit den meisten gemeinsamen Partien heute, Siege nur am Abend
  let duel: FrontPage['duel'] = null;
  for (let i = 0; i < players.length; i++) for (let j = i + 1; j < players.length; j++) {
    const a = players[i], b = players[j]; let wa = 0, wb = 0, n = 0;
    for (const g of tonight) { const ra = resultOf(g, a), rb = resultOf(g, b); if (!ra || !rb) continue; n++; if (ra.place < rb.place) wa++; else if (rb.place < ra.place) wb++; }
    if (n && (!duel || n > duel.winsA + duel.winsB || (wa + wb > duel.winsA + duel.winsB))) duel = wa >= wb ? { a, b, winsA: wa, winsB: wb } : { a: b, b: a, winsA: wb, winsB: wa };
  }
  if (['streak', 'revenge', 'lead', 'level', 'milestone', 'win'].includes(lead.kind)) {
    // Schlagzeile über ein Duell: dieses Paar in den Kasten
    const n = rivalNews(before, tonight).find(x => x.who === lead.who);
    if (n) { let wa = 0, wb = 0; for (const g of tonight) { const ra = resultOf(g, n.who), rb = resultOf(g, n.other); if (ra && rb) { if (ra.place < rb.place) wa++; else if (rb.place < ra.place) wb++; } } duel = { a: n.who, b: n.other, winsA: wa, winsB: wb }; }
  }

  const caption = pick({
    brav: [`${S} freut sich über ${plural(star.wins, 'Sieg', 'Siege')}.`, `${S} nach dem Abend: zufrieden.`],
    frech: [`${S} nach dem Abend: unbeeindruckt.`, `${S} gibt keine Interviews.`, `${S} lässt sich feiern. Ausgiebig.`],
    atzig: [`${S}, ganz entspannt.`, `${S}, Sonnenbrille auf, Blick nach vorn.`]
  }, L, day + 'cap');
  const summary = cap(`${plural(G, 'Partie', 'Partien', 'eine')}, ${plural(star.wins, 'Sieg', 'Siege')} für ${S}`) + (laterne ? `, die Rote Laterne für ${nm(laterne)}.` : '.');
  const variant = liga ? 'sport' : L === 'atzig' ? 'poster' : 'zeitung';
  return { day, number: idx + 1, games: G, kinds, lead, briefs, star, laterne, caption, summary, table, duel, liga, variant };
}
