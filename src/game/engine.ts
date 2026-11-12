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
export const hasPhases = (s: GameState) => !!s.game.rules.params?.phases;

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
  return liveRounds(s).some(r => seated(s).some(p => scoreOf(s, r.id, p.id) !== null));
}

export function totals(s: GameState): Record<string, number> {
  const t: Record<string, number> = {};
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
  const arr = seated(s).map(player => ({ player, total: t[player.id], place: 0, ph: ph ? phasesDone(s, player.id) : 0 }))
    .sort((a, b) => (b.ph - a.ph) || (high ? b.total - a.total : a.total - b.total));
  let place = 0; let last: string | null = null;
  arr.forEach((x, i) => { const k = x.ph + '|' + x.total; if (k !== last) { place = i + 1; last = k; } x.place = place; });
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

export function createGame(rules: Template, players: Player[], clock: Clock): GameState {
  const t = clock.now();
  const game: Game = {
    id: clock.uid(), createdAt: t, updatedAt: t, rules: structuredClone(rules), status: 'running', startedAt: t,
    seats: players.map((p, i) => ({ playerId: p.id, seat: i }))
  };
  if (rules.scoring === 'bids') game.rules.end = { type: 'rounds', value: wizardRounds(players.length) };
  const end = game.rules.end;
  const cats = rules.scoring === 'categories' ? rules.params?.categories ?? [] : null;
  const n = cats ? cats.length : end.type === 'rounds' ? end.value : 1;
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
