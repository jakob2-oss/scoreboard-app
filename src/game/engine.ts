import type { Category, Entry, Game, Player, Round, SplitField, Template } from '../model/types';
import type { Clock } from '../lib/id';
import { wizardOrder, wizardRounds, wizardScore } from '../rules/wizard';

/** Alles, was zu einer Partie gehört. Reine Daten, keine Oberfläche. */
export interface GameState {
  game: Game;
  players: Player[];
  rounds: Round[];
  entries: Entry[];
}

/** Ziel einer Eingabe: bestehende Runde oder eine neue, die beim ersten Wert entsteht. */
export type RoundRef = string | 'new';

const alive = <T extends { deletedAt?: string | null }>(x: T) => !x.deletedAt;

// ---------------------------------------------------------------- Lesen

/** Spieler in Sitzreihenfolge. */
export function seated(s: GameState): Player[] {
  return [...s.game.seats].sort((a, b) => a.seat - b.seat)
    .map(seat => s.players.find(p => p.id === seat.playerId))
    .filter((p): p is Player => !!p);
}

export function liveRounds(s: GameState): Round[] {
  const sec = (r: Round) => (r.cat ? (r.cat.section === 'up' ? 0 : 1) : 0);
  return s.rounds.filter(alive).sort((a, b) => sec(a) - sec(b) || a.index - b.index);
}

export const isCats = (s: GameState) => s.game.rules.scoring === 'categories';
// ---------------------------------------------------------------- Tisch-Modus: Leben verlieren, Deckel verteilen
/** Jede Aktion am Tisch ist eine eigene „Runde“ mit Einträgen; so funktionieren Rückgängig und Speichern wie gewohnt. */
export const isLives = (s: GameState) => s.game.rules.scoring === 'lives';
export const isTokens = (s: GameState) => s.game.rules.scoring === 'tokens';
export const isTable = (s: GameState) => isLives(s) || isTokens(s);
type TableValues = { loss?: number; take?: number; give?: number; halfLost?: boolean; schock?: boolean };
const tv = (e: Entry) => e.values as TableValues;
const roundEntries = (s: GameState, roundId: string) => s.entries.filter(e => !e.deletedAt && e.roundId === roundId);
/** Aktionen am Tisch (Runden mit Einträgen) */
export const tableRounds = (s: GameState) => liveRounds(s).filter(r => roundEntries(s, r.id).length > 0);

export interface LifeState {
  lives: number;
  /** Gibt es die Phase „Schwimmen“ nach dem letzten Leben? */
  swim: boolean;
  /** Verbleibende Leben (0 = schwimmt, -1 = raus) */
  left: Record<string, number>;
  swimming: Record<string, boolean>;
  /** Nummer der Aktion, mit der ein Spieler rausflog (null = noch dabei) */
  out: Record<string, number | null>;
  alive: string[];
}
export function lifeState(s: GameState): LifeState {
  const lives = s.game.rules.params?.lives ?? 3, swim = s.game.rules.params?.swim !== false, players = seated(s);
  // Ohne Schwimmen ist man mit dem letzten Leben raus
  const limit = swim ? lives : lives - 1;
  const loss: Record<string, number> = {}, out: Record<string, number | null> = {};
  players.forEach(p => { loss[p.id] = 0; out[p.id] = null; });
  tableRounds(s).forEach((r, i) => {
    for (const e of roundEntries(s, r.id)) if (tv(e).loss && e.playerId in loss) {
      loss[e.playerId] += tv(e).loss!;
      if (loss[e.playerId] > limit && out[e.playerId] === null) out[e.playerId] = i;
    }
  });
  const left: Record<string, number> = {}, swimming: Record<string, boolean> = {};
  for (const p of players) { left[p.id] = Math.max(swim ? -1 : 0, lives - loss[p.id]); swimming[p.id] = swim && loss[p.id] === lives; }
  return { lives, swim, left, swimming, out, alive: players.filter(p => out[p.id] === null).map(p => p.id) };
}
/** Schwimmen: Verlierer der Runde verliert ein Leben. Mehrere auf einmal bei „Feuer“ (alle anderen). Wer raus ist, nicht mehr. */
export function loseLife(s: GameState, playerIds: string | string[], clock: Clock): GameState {
  const ls = lifeState(s);
  if (ls.alive.length < 2) return s;
  const ids = (Array.isArray(playerIds) ? playerIds : [playerIds]).filter(id => ls.out[id] === null);
  if (!ids.length) return s;
  const a = addRound(s, clock), t = clock.now();
  return { ...a.state, entries: [...a.state.entries, ...ids.map(playerId => ({ id: clock.uid(), createdAt: t, updatedAt: t, gameId: s.game.id, roundId: a.roundId, playerId, values: { loss: 1 } as never }))] };
}
/** Feuer: alle anderen, die noch dabei sind, verlieren ein Leben */
export function fire(s: GameState, playerId: string, clock: Clock): GameState {
  return loseLife(s, lifeState(s).alive.filter(id => id !== playerId), clock);
}

export interface TokenState {
  total: number;
  /** Verlorene Hälften, mit denen man die Partie verliert */
  need: number;
  /** Laufende Hälfte (1, 2, Finale 3 …) */
  half: number;
  middle: number;
  hold: Record<string, number>;
  halves: Record<string, number>;
  /** Wer hat bei einer Aktion die meisten Deckel bekommen, und wie viele */
  maxTake: { n: number; who: string[] };
  schock: Record<string, number>;
  /** Deckel insgesamt bekommen, über alle Hälften (weniger ist besser) */
  taken: Record<string, number>;
  /** Zweite Phase: weitergeben (Schocken) oder zurück in die Mitte (Chic) */
  mode: 'pass' | 'return';
  /** Phase der laufenden Hälfte: 1 aus der Mitte, 2 sobald die Mitte einmal leer war */
  phase: 1 | 2;
  /** Chic: wer in dieser Hälfte keine Deckel mehr hat und damit raus ist */
  out: Record<string, boolean>;
  /** Wer zwei Hälften verloren hat (Partie verloren) */
  loser: string | null;
}
export function tokenState(s: GameState): TokenState {
  const total = s.game.rules.params?.tokens ?? 13, need = Math.max(1, s.game.rules.params?.halves ?? 2), players = seated(s);
  const hold: Record<string, number> = {}, halves: Record<string, number> = {}, schock: Record<string, number> = {}, taken: Record<string, number> = {};
  players.forEach(p => { hold[p.id] = 0; halves[p.id] = 0; schock[p.id] = 0; taken[p.id] = 0; });
  const mode = s.game.rules.params?.phase2 === 'return' ? 'return' : 'pass';
  const out: Record<string, boolean> = {};
  players.forEach(p => { out[p.id] = false; });
  let half = 1, phase: 1 | 2 = 1, maxTake = { n: 0, who: [] as string[] };
  for (const r of tableRounds(s)) {
    let lost: string | null = null;
    for (const e of roundEntries(s, r.id)) {
      if (!(e.playerId in hold)) continue;
      const v = tv(e);
      if (v.take) {
        hold[e.playerId] += v.take; taken[e.playerId] += v.take;
        if (v.take > maxTake.n) maxTake = { n: v.take, who: [e.playerId] };
        else if (v.take === maxTake.n && !maxTake.who.includes(e.playerId)) maxTake.who.push(e.playerId);
      }
      if (v.give) hold[e.playerId] -= v.give;
      if (v.schock) schock[e.playerId]++;
      if (v.halfLost) lost = e.playerId;
    }
    if (lost) { halves[lost]++; half++; phase = 1; players.forEach(p => { hold[p.id] = 0; out[p.id] = false; }); continue; }
    // Mitte leer: zweite Phase. Bei Chic ist raus, wer dann (oder später) keine Deckel hat
    if (phase === 1 && players.reduce((x, p) => x + hold[p.id], 0) === total) phase = 2;
    if (phase === 2 && mode === 'return') players.forEach(p => { if (hold[p.id] === 0) out[p.id] = true; });
  }
  const middle = total - players.reduce((x, p) => x + hold[p.id], 0);
  const loser = players.find(p => halves[p.id] >= need)?.id ?? null;
  return { total, need, mode, phase, out, half, middle, hold, halves, maxTake, schock, taken, loser };
}
/**
 * Schocken: Deckel an den Verlierer der Runde. Solange die Mitte nicht leer ist, kommen sie aus der Mitte,
 * danach vom Gewinner (from). Wer alle Deckel hat, verliert die Hälfte; alles geht zurück in die Mitte.
 */
export function giveTokens(s: GameState, to: string, n: number, from: string | null, clock: Clock, schock = false): GameState {
  const st = tokenState(s);
  if (st.loser || (st.mode === 'return' && st.phase === 2)) return s;
  const giver = st.middle > 0 ? null : from;
  if (st.middle === 0 && (!giver || giver === to)) return s;
  const amount = Math.max(0, Math.min(n, giver ? st.hold[giver] : st.middle));
  if (!amount) return s;
  const a = addRound(s, clock), t = clock.now();
  const after = st.hold[to] + amount, middleAfter = giver ? st.middle : st.middle - amount;
  const halfLost = middleAfter === 0 && after === st.total;
  const entries: Entry[] = [{ id: clock.uid(), createdAt: t, updatedAt: t, gameId: s.game.id, roundId: a.roundId, playerId: to,
    values: { take: amount, ...(schock ? { schock: true } : {}), ...(halfLost ? { halfLost: true } : {}) } as never }];
  if (giver) entries.push({ id: clock.uid(), createdAt: t, updatedAt: t, gameId: s.game.id, roundId: a.roundId, playerId: giver, values: { give: amount } as never });
  return { ...a.state, entries: [...a.state.entries, ...entries] };
}

/**
 * Chic, zweite Phase: der Sieger der Runde spielt Deckel zurück in die Mitte. Wer keine mehr hat, ist raus;
 * wer als Letzter noch Deckel hat, verliert die Hälfte.
 */
export function returnTokens(s: GameState, from: string, n: number, clock: Clock): GameState {
  const st = tokenState(s);
  if (st.loser || st.mode !== 'return' || st.phase !== 2 || st.out[from]) return s;
  const amount = Math.max(0, Math.min(n, st.hold[from]));
  if (!amount) return s;
  const a = addRound(s, clock), t = clock.now();
  const e = (playerId: string, values: TableValues): Entry => ({ id: clock.uid(), createdAt: t, updatedAt: t, gameId: s.game.id, roundId: a.roundId, playerId, values: values as never });
  const holders = seated(s).filter(p => (p.id === from ? st.hold[p.id] - amount : st.hold[p.id]) > 0);
  const entries = [e(from, { give: amount })];
  if (holders.length === 1) entries.push(e(holders[0].id, { halfLost: true }));
  return { ...a.state, entries: [...a.state.entries, ...entries] };
}

/** Sitzplatz verschieben: Spieler an Position from rückt auf Position to, die anderen rücken nach */
export function moveSeat(s: GameState, from: number, to: number, clock: Clock): GameState {
  const order = [...s.game.seats].sort((a, b) => a.seat - b.seat);
  if (from === to || from < 0 || to < 0 || from >= order.length || to >= order.length) return s;
  const [m] = order.splice(from, 1); order.splice(to, 0, m);
  return { ...s, game: { ...touch(s, clock), seats: order.map((x, i) => ({ ...x, seat: i })) } };
}
/** Name der laufenden Phase: „1. Hälfte“, bei zwei Hälften danach „Finale“ */
export function halfLabel(need: number, h: number): string {
  return need === 2 && h === 3 ? 'Finale' : `${h}. Hälfte`;
}
/** Schock aus: der Verlierer bekommt sofort alle Deckel und verliert die Hälfte */
export function schockOut(s: GameState, to: string, clock: Clock): GameState {
  const st = tokenState(s);
  if (st.loser) return s;
  // Chic: Schock aus nimmt nur den Rest der Mitte, in der zweiten Phase gibt es ihn nicht
  if (st.mode === 'return') return st.phase === 1 ? giveTokens(s, to, st.middle, null, clock, true) : s;
  const a = addRound(s, clock), t = clock.now();
  const e = (playerId: string, values: TableValues): Entry => ({ id: clock.uid(), createdAt: t, updatedAt: t, gameId: s.game.id, roundId: a.roundId, playerId, values: values as never });
  const others = seated(s).filter(p => p.id !== to && st.hold[p.id] > 0);
  return { ...a.state, entries: [...a.state.entries, e(to, { take: st.total - st.hold[to], schock: true, halfLost: true }), ...others.map(p => e(p.id, { give: st.hold[p.id] }))] };
}

/** Rang pro Runde (Arschloch): Reihenfolge des Fertigwerdens ergibt Rolle und Punkte */
export const isRanks = (s: GameState) => s.game.rules.scoring === 'rank';

export interface Role { name: string; short: string; points: number }
/** Rolle für Platz 1..n: Präsident, Vize-Präsident, Bürger, Vize-Arschloch, Arschloch */
export function roleOf(rank: number, n: number): Role {
  if (rank === 1) return { name: 'Präsident', short: 'P', points: 2 };
  if (rank === n) return { name: 'Arschloch', short: 'A', points: -2 };
  if (n >= 4 && rank === 2) return { name: 'Vize-Präsident', short: 'VP', points: 1 };
  if (n >= 4 && rank === n - 1) return { name: 'Vize-Arschloch', short: 'VA', points: -1 };
  return { name: 'Bürger', short: 'B', points: 0 };
}
/** Platz eines Spielers in einer Runde (Rang-Spiele) */
export function rankIn(s: GameState, roundId: string, playerId: string): number | null {
  const e = s.entries.find(x => !x.deletedAt && x.roundId === roundId && x.playerId === playerId);
  const r = e ? (e.values as { rank?: number }).rank : undefined;
  return typeof r === 'number' ? r : null;
}
/** Reihenfolge einer Runde setzen (wer zuerst fertig war, steht vorn). Nicht Genannte verlieren ihren Platz. */
export function setOrder(s: GameState, ref: RoundRef, order: string[], clock: Clock): { state: GameState; roundId: string } {
  let state = s; let roundId = ref;
  if (ref === 'new') { const a = addRound(state, clock); state = a.state; roundId = a.roundId; }
  const t = clock.now();
  let entries = state.entries.map(e => {
    if (e.deletedAt || e.roundId !== roundId) return e;
    const i = order.indexOf(e.playerId);
    return i < 0 ? { ...e, updatedAt: t, deletedAt: t } : (e.values as { rank?: number }).rank === i + 1 ? e : { ...e, updatedAt: t, values: { rank: i + 1 } };
  });
  for (const [i, pid] of order.entries()) {
    if (!entries.some(e => !e.deletedAt && e.roundId === roundId && e.playerId === pid))
      entries = [...entries, { id: clock.uid(), createdAt: t, updatedAt: t, gameId: state.game.id, roundId, playerId: pid, values: { rank: i + 1 } }];
  }
  return { state: { ...state, game: touch(state, clock), entries }, roundId };
}
export const hasPhases = (s: GameState) => !!s.game.rules.params?.phases;
/** Phase 10: an welcher Phase ein Spieler in einer Runde gearbeitet hat (1 bis 10) */
export const phaseAt = (s: GameState, roundIndex: number, playerId: string) => Math.min(phasesDone(s, playerId, roundIndex) + 1, 10);

/** Kniffel: erlaubte Werte einer Kategorie (ohne Streichen) oder null für freie Eingabe (Chance, eigene ohne Vorgabe) */
export function catChoices(cat: Category | undefined): number[] | null {
  if (!cat) return null;
  if (cat.quick && cat.quick.length) return cat.quick.filter(v => v > 0);
  if (cat.fixed) return [cat.fixed];
  if (cat.range) return Array.from({ length: cat.range[1] - cat.range[0] + 1 }, (_, k) => cat.range![0] + k);
  // Ältere Partien: Pasch hatte noch keinen Bereich
  if (/pasch$/i.test(cat.label)) return Array.from({ length: 26 }, (_, k) => 5 + k);
  return null;
}

/** Summe der oberen Kategorien und ob der Bonus erreicht ist */
export function upperSum(s: GameState, playerId: string): { sum: number; bonus: number } {
  const b = s.game.rules.params?.bonus;
  const sum = liveRounds(s).filter(r => r.cat?.section === 'up').reduce((a, r) => a + (scoreOf(s, r.id, playerId) ?? 0), 0);
  return { sum, bonus: b && sum >= b.at ? b.value : 0 };
}

/** Phase 10: Anzahl geschaffter Phasen (optional nur Runden vor einem Index) */
export function phasesDone(s: GameState, playerId: string, beforeIndex = Infinity): number {
  return liveRounds(s).slice(0, beforeIndex).filter(r => {
    const e = entryOf(s, r.id, playerId);
    return !!e && (e.values as { phase?: boolean }).phase === true;
  }).length;
}
export function phaseIn(s: GameState, roundId: string, playerId: string): boolean {
  const e = entryOf(s, roundId, playerId);
  return !!e && (e.values as { phase?: boolean }).phase === true;
}

/** Kniffel: wer ist dran? Erster Spieler mit den wenigsten ausgefüllten Feldern. */
export function catTurn(s: GameState): number {
  const rounds = liveRounds(s);
  const cnt = seated(s).map(p => rounds.filter(r => scoreOf(s, r.id, p.id) !== null).length);
  return cnt.indexOf(Math.min(...cnt));
}

function entryOf(s: GameState, roundId: string, playerId: string): Entry | undefined {
  return s.entries.find(e => alive(e) && e.roundId === roundId && e.playerId === playerId);
}

/** Spiele, bei denen nur das Endergebnis notiert wird */
export const isResultOnly = (s: GameState) => !!s.game.rules.params?.resultOnly;
export const unitOf = (s: GameState) => s.game.rules.params?.unit || 'Punkte';

/** Feldname einer zweiteiligen Runde: Wizard 'bid' und 'tricks', sonst aus der Vorlage (z. B. Binokel 'meld', 'play') */
export type BidField = string;
export const isBids = (s: GameState) => s.game.rules.scoring === 'bids';
/** Spiel mit eigens gestalteter Eingabe im Block (Wizard, Rommé …); die Einzelseiten bleiben wählbar */
export const blockEntry = (s: GameState) => isBids(s) || !!s.game.rules.params?.block;
/** Rommé: Rundensieg ist eine 0 */
export const zeroWins = (s: GameState) => !!s.game.rules.params?.zeroWins;
/** Anzahl gewonnener Runden (0 geschrieben) */
export const roundWins = (s: GameState, pid: string) => liveRounds(s).filter(r => scoreOf(s, r.id, pid) === 0).length;
/** Verlauf der Summe nach jeder vollständigen Runde, je Spieler */
export function runningTotals(s: GameState): Record<string, number[]> {
  const players = seated(s), out: Record<string, number[]> = Object.fromEntries(players.map(p => [p.id, [0]]));
  for (const r of liveRounds(s)) {
    if (!roundFull(s, r.id)) continue;
    for (const p of players) { const a = out[p.id]; a.push(a[a.length - 1] + (scoreOf(s, r.id, p.id) ?? 0)); }
  }
  return out;
}
const WIZARD_FIELDS: SplitField[] = [{ key: 'bid', label: 'Ansage', phase: 'Ansagen' }, { key: 'tricks', label: 'Stiche', phase: 'Stiche' }];
/** Felder einer zweiteiligen Runde oder null */
export function fieldsOf(s: GameState): SplitField[] | null {
  if (isBids(s)) return WIZARD_FIELDS;
  const f = s.game.rules.params?.split;
  return f && f.length === 2 ? f : null;
}
export const hasFields = (s: GameState) => !!fieldsOf(s);
/** Zweiteilig, aber nicht Wizard (Rundenwert ist die Summe der Felder) */
export const isSplit = (s: GameState) => !isBids(s) && hasFields(s);

/** Wert eines Feldes (Ansage, Stiche, Meldung …) eines Spielers in einer Runde */
export function fieldOf(s: GameState, roundId: string, playerId: string, field: BidField): number | null {
  const e = entryOf(s, roundId, playerId);
  if (!e) return null;
  const v = (e.values as Record<string, unknown>)[field];
  return typeof v === 'number' ? v : null;
}

export function scoreOf(s: GameState, roundId: string, playerId: string): number | null {
  if (isTable(s)) return null;
  if (isRanks(s)) {
    const r = rankIn(s, roundId, playerId);
    return r === null ? null : roleOf(r, seated(s).length).points;
  }
  if (isBids(s)) {
    const b = fieldOf(s, roundId, playerId, 'bid'), t = fieldOf(s, roundId, playerId, 'tricks');
    return b !== null && t !== null ? wizardScore(b, t) : null;
  }
  const sp = fieldsOf(s);
  if (sp) {
    const a = fieldOf(s, roundId, playerId, sp[0].key), b = fieldOf(s, roundId, playerId, sp[1].key);
    return b !== null ? (a ?? 0) + b : null;
  }
  const e = entryOf(s, roundId, playerId);
  return e && 'score' in e.values && typeof e.values.score === 'number' ? e.values.score : null;
}

export function roundFull(s: GameState, roundId: string): boolean {
  return seated(s).every(p => scoreOf(s, roundId, p.id) !== null);
}

export function anyScore(s: GameState): boolean {
  if (isTable(s)) return tableRounds(s).length > 0;
  return liveRounds(s).some(r => seated(s).some(p => scoreOf(s, r.id, p.id) !== null));
}

export function totals(s: GameState): Record<string, number> {
  const t: Record<string, number> = {};
  // Tisch-Modus: Leben übrig (Schwimmen) bzw. verlorene Hälften (Schocken)
  if (isLives(s)) { const ls = lifeState(s); for (const p of seated(s)) t[p.id] = Math.max(0, ls.left[p.id]); return t; }
  if (isTokens(s)) { const ts = tokenState(s); for (const p of seated(s)) t[p.id] = ts.halves[p.id]; return t; }
  const rounds = liveRounds(s);
  for (const p of seated(s)) t[p.id] = rounds.reduce((sum, r) => sum + (scoreOf(s, r.id, p.id) ?? 0), 0) + (isCats(s) ? upperSum(s, p.id).bonus : 0);
  return t;
}

export interface Rank { player: Player; total: number; place: number }

/** Rangliste mit geteilten Plätzen bei Gleichstand. */
export function ranking(s: GameState): Rank[] {
  const t = totals(s);
  const high = s.game.rules.win === 'high';
  const ph = hasPhases(s);
  // Gleichstand auflösen: Schwimmen nach Ausscheiden (später raus ist besser), Schocken nach Deckeln jetzt, dann insgesamt (weniger ist besser)
  const ls = isLives(s) ? lifeState(s) : null, ts = isTokens(s) ? tokenState(s) : null;
  const tb = (id: string) => (ls ? (ls.out[id] === null ? 1e9 : ls.out[id]!) : ts ? -(ts.hold[id] * 1000 + ts.taken[id]) : 0);
  const arr = seated(s).map(player => ({ player, total: t[player.id], place: 0, ph: ph ? phasesDone(s, player.id) : 0, tb: tb(player.id) }))
    .sort((a, b) => (b.ph - a.ph) || (high ? b.total - a.total : a.total - b.total) || (b.tb - a.tb));
  let place = 0; let last: string | null = null;
  arr.forEach((x, i) => { const k = x.ph + '|' + x.total + '|' + x.tb; if (k !== last) { place = i + 1; last = k; } x.place = place; });
  return arr;
}

/** Index der laufenden Runde: erste unvollständige, sonst die letzte. */
export function currentRoundIndex(s: GameState): number {
  const rounds = liveRounds(s);
  const i = rounds.findIndex(r => !roundFull(s, r.id));
  return i === -1 ? Math.max(0, rounds.length - 1) : i;
}

export interface EndState { done: boolean; text: string }

export function endState(s: GameState): EndState | null {
  const end = s.game.rules.end;
  const rounds = liveRounds(s);
  if (isLives(s)) {
    const ls = lifeState(s);
    if (seated(s).length < 2 || ls.alive.length > 1) return null;
    const w = seated(s).find(p => p.id === ls.alive[0]);
    return { done: true, text: w ? `${w.name} bleibt übrig` : 'Alle sind raus' };
  }
  if (isTokens(s)) {
    const ts = tokenState(s);
    return ts.loser ? { done: true, text: `${seated(s).find(p => p.id === ts.loser)?.name} verliert die Partie` } : null;
  }
  if (isCats(s)) return rounds.length && rounds.every(r => roundFull(s, r.id)) ? { done: true, text: 'Alle Felder ausgefüllt' } : null;
  if (hasPhases(s)) {
    const fin = seated(s).filter(p => phasesDone(s, p.id) >= 10);
    if (!fin.length) return null;
    const last = rounds[rounds.length - 1], full = !!last && roundFull(s, last.id);
    return { done: full, text: `${fin.map(p => p.name).join(', ')} ${fin.length > 1 ? 'haben' : 'hat'} Phase 10 geschafft` + (full ? '' : '. Runde noch zu Ende eintragen') };
  }
  if (end.type === 'rounds') {
    const done = rounds.length >= end.value && rounds.slice(0, end.value).every(r => roundFull(s, r.id));
    return done ? { done: true, text: `${end.value} Runden gespielt` } : null;
  }
  if (end.type === 'target') {
    const t = totals(s);
    const hit = seated(s).filter(p => t[p.id] >= end.value);
    if (!hit.length) return null;
    const last = rounds[rounds.length - 1];
    const full = !!last && roundFull(s, last.id);
    return { done: full, text: `${hit.map(p => p.name).join(', ')} über ${end.value}` + (full ? '' : '. Runde noch zu Ende eintragen') };
  }
  return null;
}

export function canAddRound(s: GameState): boolean {
  if (isCats(s)) return false;
  const end = s.game.rules.end;
  if (end.type === 'rounds' && liveRounds(s).length >= end.value) return false;
  const e = endState(s);
  return !(e && e.done);
}

/** Standardziel einer Spielerseite: erste Runde ohne Wert, sonst neue Runde, sonst die letzte. */
export function defaultRef(s: GameState, playerId: string): RoundRef {
  const open = liveRounds(s).find(r => scoreOf(s, r.id, playerId) === null);
  if (open) return open.id;
  if (canAddRound(s)) return 'new';
  const rounds = liveRounds(s);
  return rounds.length ? rounds[rounds.length - 1].id : 'new';
}

export type NextStep =
  | { kind: 'round'; ref: RoundRef; roundNo: number; playerIndex: number; field?: BidField }
  | { kind: 'result' };

/** Was als Nächstes eingetragen wird (für den Knopf im Überblick). */
export function nextStep(s: GameState): NextStep {
  const e = endState(s);
  if (e && e.done) return { kind: 'result' };
  const rounds = liveRounds(s);
  const players = seated(s);
  if (isCats(s)) {
    const pi = catTurn(s), open = rounds.find(r => scoreOf(s, r.id, players[pi].id) === null);
    return open ? { kind: 'round', ref: open.id, roundNo: 0, playerIndex: pi } : { kind: 'result' };
  }
  const i = rounds.findIndex(r => !roundFull(s, r.id));
  if (i >= 0 && hasFields(s)) {
    const r = rounds[i], field = bidPhase(s, r.id);
    const first = inputOrder(s, r.id).find(k => fieldOf(s, r.id, players[k].id, field) === null) ?? 0;
    return { kind: 'round', ref: r.id, roundNo: i + 1, playerIndex: first, field };
  }
  if (i >= 0) {
    const r = rounds[i];
    return { kind: 'round', ref: r.id, roundNo: i + 1, playerIndex: players.findIndex(p => scoreOf(s, r.id, p.id) === null) };
  }
  if (canAddRound(s)) return { kind: 'round', ref: 'new', roundNo: rounds.length + 1, playerIndex: 0, field: fieldsOf(s)?.[0].key };
  return { kind: 'result' };
}

/** Wizard: wer als Nächstes ansagt (Reihenfolge ab links vom Geber); null, wenn alle angesagt haben */
export function bidTurn(s: GameState, roundId: string): string | null {
  const players = seated(s);
  const k = inputOrder(s, roundId).find(i => fieldOf(s, roundId, players[i].id, 'bid') === null);
  return k === undefined ? null : players[k].id;
}

/** Zweiteilige Runde: erst alle das erste Feld (Ansagen, Meldungen), dann alle das zweite */
export function bidPhase(s: GameState, roundId: RoundRef): BidField {
  const [a, b] = fieldsOf(s) ?? WIZARD_FIELDS;
  if (roundId === 'new') return a.key;
  return seated(s).every(p => fieldOf(s, roundId, p.id, a.key) !== null) ? b.key : a.key;
}
/** Beschriftung eines Feldes */
export const fieldLabel = (s: GameState, f: BidField, plural = false) => {
  const x = (fieldsOf(s) ?? WIZARD_FIELDS).find(y => y.key === f);
  return x ? (plural ? x.phase : x.label) : f;
};

/** Wert, mit dem die Runde zusammen 0 ergibt (ohne den eigenen Eintrag) */
export function restOf(s: GameState, ref: RoundRef, playerId: string): number {
  if (ref === 'new') return 0;
  return -seated(s).filter(p => p.id !== playerId).reduce((a, p) => a + (scoreOf(s, ref, p.id) ?? 0), 0);
}

/** Gespielte Runden (für Rekorde): bei Tisch-Spielen jede Aktion, sonst Runden mit Werten; reine Endwertung 0 */
export function playedRounds(s: GameState): number {
  if (isResultOnly(s)) return 0;
  if (isTable(s)) return tableRounds(s).length;
  return liveRounds(s).filter(r => seated(s).some(p => scoreOf(s, r.id, p.id) !== null)).length;
}

/** Spiele mit Geber: Wizard und alle mit params.dealer */
export const hasDealer = (s: GameState) => isBids(s) || !!s.game.rules.params?.dealer;
/** Wer gibt in der laufenden Runde? Der Geber rotiert reihum, in Runde 1 gibt der erste Platz.
 *  Arschloch: Es gibt das Arschloch der Runde davor. */
export function dealerOf(s: GameState): Player | null {
  if (!hasDealer(s)) return null;
  const players = seated(s);
  if (!players.length) return null;
  // Laufende Runde: die erste unvollständige, sonst die nächste neue
  const rounds = liveRounds(s); let i = rounds.findIndex(r => !roundFull(s, r.id));
  if (i === -1) i = rounds.length;
  if (isRanks(s) && i > 0) {
    const last = players.find(p => rankIn(s, rounds[i - 1].id, p.id) === players.length);
    if (last) return last;
  }
  return players[i % players.length];
}

/** Reihenfolge der Eingabe in einer Runde: bei Wizard beginnt der Spieler links vom Geber. */
export function inputOrder(s: GameState, roundId: string): number[] {
  const n = seated(s).length;
  if (!isBids(s)) return Array.from({ length: n }, (_, k) => k);
  return wizardOrder(n, Math.max(0, liveRounds(s).findIndex(r => r.id === roundId)));
}

export function roundNumber(s: GameState, ref: RoundRef): number {
  if (ref === 'new') return liveRounds(s).length + 1;
  return liveRounds(s).findIndex(r => r.id === ref) + 1;
}

// ---------------------------------------------------------------- Ändern (rein, liefert neuen Zustand)

/** Teampartie: jedes Team spielt wie ein Spieler; Mitglieder bekommen beim Beenden Platz und Punkte des Teams */
export function createTeamGame(rules: Template, teams: { members: Player[] }[], clock: Clock): GameState {
  const t = clock.now();
  const list = teams.filter(x => x.members.length).map(x => ({
    id: 'team-' + clock.uid(), name: teamName(x.members.map(m => m.name)), color: x.members[0].color, members: x.members.map(m => m.id)
  }));
  const pseudo: Player[] = list.map(x => ({ id: x.id, name: x.name, color: x.color, createdAt: t, updatedAt: t }));
  const s = createGame(rules, pseudo, clock);
  return { ...s, game: { ...s.game, teams: list } };
}
export const teamName = (names: string[]) => (names.length < 2 ? names.join('') : names.slice(0, -1).join(', ') + ' & ' + names[names.length - 1]);
export const isTeamGame = (s: GameState) => !!s.game.teams?.length;
/** Mitglieder eines Sitzplatzes: bei Teams die Spieler des Teams, sonst der Spieler selbst */
export const membersOf = (s: GameState, seatId: string): string[] => s.game.teams?.find(x => x.id === seatId)?.members ?? [seatId];
/** Spielt dieser Spieler (direkt oder im Team) in der Partie mit? */
export const playsIn = (s: GameState, playerId: string) => s.game.seats.some(x => membersOf(s, x.playerId).includes(playerId));

export function createGame(rules: Template, players: Player[], clock: Clock): GameState {
  const t = clock.now();
  const game: Game = {
    id: clock.uid(), createdAt: t, updatedAt: t, rules: structuredClone(rules), status: 'running', startedAt: t,
    seats: players.map((p, i) => ({ playerId: p.id, seat: i }))
  };
  if (rules.scoring === 'bids') game.rules.end = { type: 'rounds', value: wizardRounds(players.length) };
  const end = game.rules.end;
  const cats = rules.scoring === 'categories' ? rules.params?.categories ?? [] : null;
  const n = cats ? cats.length : rules.scoring === 'lives' || rules.scoring === 'tokens' ? 0 : end.type === 'rounds' ? end.value : 1;
  const rounds: Round[] = Array.from({ length: n }, (_, index) => ({ id: clock.uid(), createdAt: t, updatedAt: t, gameId: game.id, index, ...(cats ? { cat: { ...cats[index] } } : {}) }));
  return { game, players: players.map(p => ({ ...p })), rounds, entries: [] };
}

function touch(s: GameState, clock: Clock): Game {
  return { ...s.game, updatedAt: clock.now() };
}

export function addRound(s: GameState, clock: Clock): { state: GameState; roundId: string } {
  const t = clock.now();
  const index = liveRounds(s).reduce((m, r) => Math.max(m, r.index + 1), 0);
  const r: Round = { id: clock.uid(), createdAt: t, updatedAt: t, gameId: s.game.id, index };
  return { state: { ...s, game: touch(s, clock), rounds: [...s.rounds, r] }, roundId: r.id };
}

/**
 * Wert setzen (oder mit null löschen). Bei ref 'new' entsteht die Runde erst mit dem ersten Wert.
 * Löschen markiert den Eintrag (deletedAt), damit es später synchronisiert werden kann.
 */
export function setScore(s: GameState, ref: RoundRef, playerId: string, value: number | null, clock: Clock): { state: GameState; roundId: string | null } {
  let state = s; let roundId: string | null = ref === 'new' ? null : ref;
  if (ref === 'new') {
    if (value === null) return { state: s, roundId: null };
    const added = addRound(state, clock); state = added.state; roundId = added.roundId;
  }
  const t = clock.now();
  const existing = state.entries.find(e => alive(e) && e.roundId === roundId && e.playerId === playerId);
  let entries: Entry[];
  if (existing) {
    // Haken (Phase 10) und Notizwerte bleiben erhalten
    const { score: _old, ...keep } = existing.values as Record<string, unknown>;
    const rest = Object.fromEntries(Object.entries(keep).filter(([, v]) => v !== null && v !== undefined && v !== false));
    entries = state.entries.map(e => e !== existing ? e
      : value === null ? (Object.keys(rest).length ? { ...e, updatedAt: t, values: rest as Entry['values'] } : { ...e, updatedAt: t, deletedAt: t })
        : { ...e, updatedAt: t, values: { ...rest, score: value } as Entry['values'] });
  } else if (value !== null) {
    entries = [...state.entries, { id: clock.uid(), createdAt: t, updatedAt: t, gameId: state.game.id, roundId, playerId, values: { score: value } }];
  } else entries = state.entries;
  return { state: { ...state, game: touch(state, clock), entries }, roundId };
}

/** Phase 10: Haken „Phase geschafft“ setzen oder entfernen. Bei 'new' entsteht die Runde. */
export function setPhase(s: GameState, ref: RoundRef, playerId: string, on: boolean, clock: Clock): { state: GameState; roundId: string } {
  let state = s; let roundId = ref;
  if (ref === 'new') { const a = addRound(state, clock); state = a.state; roundId = a.roundId; }
  const t = clock.now();
  const existing = state.entries.find(e => alive(e) && e.roundId === roundId && e.playerId === playerId);
  const score = existing && typeof (existing.values as { score?: number }).score === 'number' ? (existing.values as { score: number }).score : undefined;
  const values = { ...(on ? { phase: true } : {}), ...(score !== undefined ? { score } : {}) };
  const entries: Entry[] = existing
    ? state.entries.map(e => (e !== existing ? e : Object.keys(values).length ? { ...e, updatedAt: t, values } : { ...e, updatedAt: t, deletedAt: t }))
    : on ? [...state.entries, { id: clock.uid(), createdAt: t, updatedAt: t, gameId: state.game.id, roundId, playerId, values }] : state.entries;
  return { state: { ...state, game: touch(state, clock), entries }, roundId };
}

/** Kniffel: Kategorie hinzufügen (neue Zeile) */
export function addCategory(s: GameState, cat: Category, clock: Clock): GameState {
  const t = clock.now();
  const index = s.rounds.reduce((m, r) => Math.max(m, r.index + 1), 0);
  return { ...s, game: touch(s, clock), rounds: [...s.rounds, { id: clock.uid(), createdAt: t, updatedAt: t, gameId: s.game.id, index, cat }] };
}

/** Kniffel: Kategorie entfernen (Zeile und ihre Werte werden als gelöscht markiert) */
export function removeCategory(s: GameState, roundId: string, clock: Clock): GameState {
  const t = clock.now();
  return {
    ...s, game: touch(s, clock),
    rounds: s.rounds.map(r => (r.id === roundId ? { ...r, updatedAt: t, deletedAt: t } : r)),
    entries: s.entries.map(e => (e.roundId === roundId && alive(e) ? { ...e, updatedAt: t, deletedAt: t } : e))
  };
}

/** Notizfelder der Partie (zählen nicht zur Summe) */
export const notesOf = (s: GameState): string[] => s.game.rules.params?.notes ?? [];
export const noteKey = (label: string) => 'n:' + label;
export const isNoteField = (f?: string) => !!f && f.startsWith('n:');
/** Notizfelder der laufenden Partie ändern (Werte bleiben gespeichert, auch wenn ein Feld entfernt wird) */
export function setNotes(s: GameState, notes: string[], clock: Clock): GameState {
  const rules = { ...s.game.rules, params: { ...s.game.rules.params, notes: [...new Set(notes.map(n => n.trim()).filter(Boolean))] } };
  return { ...s, game: { ...touch(s, clock), rules } };
}

/** Wizard: Ansage oder Stiche setzen (null löscht den Wert). Begrenzt auf 0 bis Kartenzahl der Runde. */
export function setField(s: GameState, roundId: string, playerId: string, field: BidField, value: number | null, clock: Clock): GameState {
  const t = clock.now();
  const cards = liveRounds(s).findIndex(r => r.id === roundId) + 1;
  // Wizard: 0 bis Kartenzahl; sonst frei
  const v = value === null ? null : isBids(s) ? Math.min(Math.max(0, value), cards) : value;
  const existing = s.entries.find(e => alive(e) && e.roundId === roundId && e.playerId === playerId);
  const entries: Entry[] = existing
    ? s.entries.map(e => (e !== existing ? e : { ...e, updatedAt: t, values: { ...e.values, [field]: v } }))
    : [...s.entries, { id: clock.uid(), createdAt: t, updatedAt: t, gameId: s.game.id, roundId, playerId, values: { [field]: v } }];
  return { ...s, game: touch(s, clock), entries };
}

export function setWin(s: GameState, win: 'high' | 'low', clock: Clock): GameState {
  return { ...s, game: { ...touch(s, clock), rules: { ...s.game.rules, win } } };
}

export function finish(s: GameState, clock: Clock): GameState {
  const t = clock.now();
  return { ...s, game: { ...s.game, status: 'finished', finishedAt: t, updatedAt: t } };
}

/**
 * Rückgängig: früheren Zustand wiederherstellen, aber sync-fähig.
 * Was seitdem neu entstanden ist, wird als gelöscht markiert; geänderte Datensätze bekommen einen neuen Zeitstempel.
 */
export function restore(current: GameState, prev: GameState, clock: Clock): GameState {
  const t = clock.now();
  const merge = <T extends { id: string; updatedAt: string; deletedAt?: string | null }>(cur: T[], old: T[]): T[] => {
    const oldIds = new Set(old.map(x => x.id));
    const restored = old.map(o => {
      const c = cur.find(x => x.id === o.id);
      return c && JSON.stringify(c) !== JSON.stringify(o) ? { ...o, updatedAt: t } : o;
    });
    const removed = cur.filter(c => !oldIds.has(c.id) && !c.deletedAt).map(c => ({ ...c, updatedAt: t, deletedAt: t }));
    return [...restored, ...removed];
  };
  return { ...prev, game: { ...prev.game, updatedAt: t }, rounds: merge(current.rounds, prev.rounds), entries: merge(current.entries, prev.entries) };
}
