/**
 * Turnier im K.-o.-System. Duelle (Tischgröße 2, Best of 1, 3 oder 5) oder Tische mit mehreren Spielern,
 * von denen die Besten weiterkommen (eine Partie je Tisch). Reine Funktionen, keine Oberfläche.
 * Die nächste Runde entsteht, sobald alle Tische der laufenden Runde entschieden sind.
 */
export interface Match { id: string; players: string[]; games: string[]; wins: Record<string, number>; winners: string[] | null; bye?: boolean }
export interface BracketRound { matches: Match[] }
export interface Bracket { size: number; advance: number; bestOf: number; rounds: BracketRound[] }

/** Tische einer Runde aus der Reihenfolge; ist die Runde klein genug, ist es der Finaltisch (nur einer kommt weiter) */
function makeRound(order: string[], size: number, uid: () => string): BracketRound {
  if (order.length <= size) return { matches: [{ id: uid(), players: order, games: [], wins: {}, winners: order.length === 1 ? order : null, bye: order.length === 1 }] };
  const n = Math.ceil(order.length / size), tables: string[][] = Array.from({ length: n }, () => []);
  // Reihum verteilen, damit die Tische gleich groß sind (bei Duellen: 1 gegen 2, 3 gegen 4 …; Rest bekommt ein Freilos)
  if (size === 2) for (let i = 0; i < order.length; i += 2) tables[i / 2] = order.slice(i, i + 2);
  else order.forEach((id, i) => tables[i % n].push(id));
  return { matches: tables.map(p => ({ id: uid(), players: p, games: [], wins: {}, winners: p.length === 1 ? p : null, bye: p.length === 1 })) };
}

export function createBracket(order: string[], o: { size: number; advance: number; bestOf: number }, uid: () => string): Bracket {
  const size = Math.max(2, o.size), advance = size === 2 ? 1 : Math.min(Math.max(1, o.advance), size - 1);
  return { size, advance, bestOf: size === 2 ? o.bestOf : 1, rounds: [makeRound(order, size, uid)] };
}

/** Wie viele an einem Tisch weiterkommen: im Finale einer, sonst die eingestellte Zahl */
export const advanceOf = (b: Bracket, m: Match) => (isFinal(b, m) ? 1 : Math.min(b.advance, m.players.length - 1) || 1);
export const isFinal = (b: Bracket, m: Match) => { const r = b.rounds[b.rounds.length - 1]; return r.matches.length === 1 && r.matches[0].id === m.id; };
export const findMatch = (b: Bracket, id: string) => b.rounds.flatMap(r => r.matches).find(m => m.id === id);
export const champion = (b: Bracket): string | null => {
  const r = b.rounds[b.rounds.length - 1], m = r.matches[0];
  return r.matches.length === 1 && m.winners?.length === 1 && !m.bye ? m.winners[0] : null;
};
/** Siege, die man in einem Duell braucht (Best of 3: zwei) */
export const winsNeeded = (b: Bracket) => Math.floor(b.bestOf / 2) + 1;

/** Neue Runde, sobald alle Tische der letzten Runde entschieden sind (und noch kein Sieger feststeht) */
function advanceRounds(b: Bracket, uid: () => string): Bracket {
  const last = b.rounds[b.rounds.length - 1];
  if (last.matches.some(m => !m.winners)) return b;
  const next = last.matches.flatMap(m => m.winners!);
  if (next.length <= 1) return b;
  return { ...b, rounds: [...b.rounds, makeRound(next, b.size, uid)] };
}

/** Eine gespielte Partie zählt für einen Tisch: Duell nach Siegen (Best of), Tisch nach den Plätzen dieser Partie */
export function recordGame(b: Bracket, matchId: string, gameId: string, places: { playerId: string; place: number }[], uid: () => string): Bracket {
  const m0 = findMatch(b, matchId); if (!m0 || m0.winners || m0.games.includes(gameId)) return b;
  const mine = places.filter(p => m0.players.includes(p.playerId));
  if (!mine.length) return b;
  const wins = { ...m0.wins };
  mine.filter(p => p.place === 1).forEach(p => { wins[p.playerId] = (wins[p.playerId] ?? 0) + 1; });
  let winners: string[] | null = null;
  if (m0.players.length === 2) {
    // Duell: wer zuerst die nötigen Siege hat (Best of 1, 3, 5)
    const w = m0.players.find(id => (wins[id] ?? 0) >= winsNeeded(b)); if (w) winners = [w];
  } else {
    // Tisch: die besten Plätze dieser Partie kommen weiter
    winners = [...mine].sort((x, y) => x.place - y.place).slice(0, advanceOf(b, m0)).map(p => p.playerId);
  }
  return setRound(b, matchId, { ...m0, games: [...m0.games, gameId], wins, winners }, uid);
}

/** Sieger von Hand eintragen (wenn ohne App gespielt wurde); leer nimmt die Entscheidung zurück, solange die nächste Runde noch offen ist */
export function setWinners(b: Bracket, matchId: string, winners: string[], uid: () => string): Bracket {
  const m0 = findMatch(b, matchId); if (!m0) return b;
  const ri = b.rounds.findIndex(r => r.matches.some(m => m.id === matchId));
  if (ri < b.rounds.length - 1) return b;   // schon weitergespielt
  const need = advanceOf(b, m0), w = winners.filter(id => m0.players.includes(id)).slice(0, need);
  return setRound(b, matchId, { ...m0, winners: w.length === need ? w : null }, uid);
}

function setRound(b: Bracket, matchId: string, m: Match, uid: () => string): Bracket {
  const rounds = b.rounds.map(r => ({ matches: r.matches.map(x => (x.id === matchId ? m : x)) }));
  return advanceRounds({ ...b, rounds }, uid);
}

/** Name einer Runde vom Ende her: Finale, Halbfinale, Viertelfinale, Achtelfinale, sonst „Runde n“ */
export function roundName(b: Bracket, i: number, players: number): string {
  // Wie viele Runden es insgesamt geben wird, ergibt sich aus Spielerzahl, Tischgröße und Weiterkommenden
  let n = players, total = 1;
  while (n > b.size) { n = Math.ceil(n / b.size) * b.advance; total++; if (total > 20) break; }
  const fromEnd = total - 1 - i;
  if (b.size === 2) return ['Finale', 'Halbfinale', 'Viertelfinale', 'Achtelfinale'][fromEnd] ?? `Runde ${i + 1}`;
  return fromEnd === 0 ? 'Finaltisch' : `Runde ${i + 1}`;
}

/** Erwartete Spielerzahl je Runde (für leere Plätze im Baum): bis einer übrig ist */
export function plannedRounds(b: Bracket, players: number): number[] {
  const out = [players]; let n = players;
  while (n > 1 && out.length < 20) {
    n = n <= b.size ? 1 : b.size === 2 ? Math.ceil(n / 2) : Math.ceil(n / b.size) * b.advance;
    if (n > 1) out.push(n);
  }
  return out;
}
