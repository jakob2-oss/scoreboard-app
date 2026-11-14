import { useSyncExternalStore } from 'react';
import type { Category, GameEvent, Player, Result, Template } from './model/types';
import { haptic } from './lib/device';
import { entryMode, setEntryMode, type EntryMode } from './lib/modes';
import { type HistGame, type SeriesSort, type TimeFilter } from './game/stats';
import { configOf, copyAsOwn, defaultFreeConfig, makeFreeTemplate, updateFreeTemplate, type FreeConfig } from './game/templates';
import { realClock, type Clock } from './lib/id';
import { gameDef } from './game/games';
import { PLAYER_COLORS, pastel } from './lib/color';
import {
  isRanks, rankIn, setOrder, sendOut, chicLoss, blockEntry, catChoices, gebotOf, zeroWins, roundWins, playedRounds, bidTurn, isTable, halfLabel, isLives, loseLife, fire, giveTokens, schockOut, returnTokens, tokenState, lifeState, moveSeat, createTeamGame, membersOf, playsIn, isTeamGame, notesOf, noteKey, isNoteField, setNotes, upperSum, bidPhase, fieldsOf, hasFields, isSplit, fieldLabel, restOf, addRound, addCategory, isCats, phaseIn, removeCategory, setPhase, anyScore, ranking, createGame, isResultOnly, fieldOf, inputOrder, isBids, setField, defaultRef, finish, liveRounds, nextStep, restore, roundFull, roundNumber, scoreOf, seated, setScore, setWin,
  type BidField, type GameState, type RoundRef
} from './game/engine';
import type { Repo } from './db';

export type Screen = 'home' | 'history' | 'events' | 'people' | 'profile' | 'setup' | 'gamepage' | 'players' | 'game' | 'series';

/** Filter und Vergleich auf der Profilseite */
export interface ProfileView { id: string; time: TimeFilter; key: string | null; vs: string[] }

/** Aktive Eingabe: Ziel (Runde × Spieler) und der Text im Ziffernblock. */
export interface Edit { ref: RoundRef; playerId: string; buf: string; fresh: boolean; dirty: boolean; field?: BidField }

export interface AppState {
  ready: boolean;
  screen: Screen;
  players: Player[];
  template: Template | null;
  /** Neue Vorlage aus dem freien Spiel, die beim Start gespeichert werden soll */
  pendingSave: boolean;
  templates: Template[];
  setup: FreeConfig;
  selected: string[];
  game: GameState | null;
  undo: GameState[];
  /** -1 = Überblick, sonst Index des Spielers */
  page: number;
  edit: Edit | null;
  pad: boolean;
  sheet: 'menu' | 'result' | 'cats' | 'notes' | 'ranks' | 'winner' | 'tokens' | 'tricks' | 'catpick' | 'bidder' | null;
  /** Tisch-Modus: Wer bekommt Deckel (Schocken), Feuer-Auswahl aktiv (Schwimmen) */
  tokenTo: string | null;
  fireMode: boolean;
  /** Rang-Spiele: Runde, die gerade verteilt wird */
  rankRef: RoundRef | null;
  /** Wizard im Block: Runde, deren Ansagen gerade unten in der Leiste eingetragen werden */
  bidBar: string | null;
  toast: { text: string; n: number } | null;
  history: HistGame[];
  profile: ProfileView | null;
  /** Geöffnete Partie im Verlauf */
  detail: string | null;
  /** Serien und Spieleabende */
  events: GameEvent[];
  /** Verlauf: Partien oder Serien */
  histTab: 'games' | 'series';
  /** Geöffnete Serie und ihre Sortierung */
  series: { id: string; sort: SeriesSort } | null;
  /** Eigenes Spiel, das gerade bearbeitet wird */
  editKey: string | null;
  /** Einrichtung als eigene Vorlage (statt Freies Spiel) */
  setupTemplate: boolean;
  /** Eigenes Spiel wird gerade bearbeitet (statt angesehen) */
  setupEditing: boolean;
  /** Gelöschte eigene Spiele */
  goneKeys: string[];
  /** Kniffel: Feld wurde aus dem Überblick geöffnet, danach dorthin zurück */
  fromOverview: boolean;
  /** Gelöschte Spieler: nur für Namen im Verlauf */
  formerPlayers: Player[];
  /** Weitere laufende Partien (geparkt), zuletzt geänderte zuerst */
  parked: GameState[];
  /** Teams bilden: an, Team je gewähltem Spieler (Index) und Anzahl Teams */
  teamMode: boolean;
  teamOf: Record<string, number>;
  teamCount: number;
  /** Lieblingsspiele (Schlüssel), stehen oben auf der Startseite */
  favs: string[];
}

const initial: AppState = {
  tokenTo: null, fireMode: false, favs: [], bidBar: null,
  ready: false, screen: 'home', players: [], template: null, pendingSave: false, templates: [], setup: defaultFreeConfig(), selected: [], game: null, undo: [],
  page: -1, edit: null, pad: false, sheet: null, toast: null, history: [], profile: null, detail: null,
  events: [], histTab: 'games', series: null, editKey: null, setupTemplate: false, setupEditing: false, goneKeys: [], fromOverview: false, parked: [], teamMode: false, teamOf: {}, teamCount: 2, rankRef: null, formerPlayers: []
};

/** Kleine Einstellungen (letzte Spielerauswahl), austauschbar für Tests. */
export interface Prefs { getLast(): string[]; setLast(ids: string[]): void; getFavs?(): string[]; setFavs?(keys: string[]): void;
  /** Eingabe je Spiel; ohne: einfache Eingabe */
  getMode?(key: string): EntryMode; setMode?(key: string, mode: EntryMode): void }
const LAST_KEY = 'pz:lastPlayers';
export const browserPrefs: Prefs = {
  getLast: () => { try { return JSON.parse(localStorage.getItem(LAST_KEY) || '[]'); } catch { return []; } },
  setLast: ids => { try { localStorage.setItem(LAST_KEY, JSON.stringify(ids)); } catch { /* privater Modus */ } },
  getFavs: () => { try { return JSON.parse(localStorage.getItem('pz:favs') || '[]'); } catch { return []; } },
  setFavs: keys => { try { localStorage.setItem('pz:favs', JSON.stringify(keys)); } catch { /* privater Modus */ } },
  getMode: entryMode, setMode: setEntryMode
};

/** Teams sind möglich bei normalen Rundenspielen und Endwertungen (nicht Wizard, Kniffel, Phase 10) */
/** Teams gehen bei jedem Spiel: ein Team sitzt am Tisch wie ein Spieler */
export const canTeam = (_t: Template) => true;

export function createStore(repo: Repo, clock: Clock = realClock, prefs: Prefs = browserPrefs) {
  const readLast = prefs.getLast, writeLast = prefs.setLast;
  const modeOf = (key: string): EntryMode => prefs.getMode?.(key) ?? 'simple';
  let state = initial;
  const listeners = new Set<() => void>();
  const set = (patch: Partial<AppState>) => { state = { ...state, ...patch }; listeners.forEach(l => l()); };
  const get = () => state;
  let toastN = 0;
  const toast = (text: string) => set({ toast: { text, n: ++toastN } });

  const names = (l: string[]) => (l.length < 2 ? l.join('') : l.slice(0, -1).join(', ') + ' und ' + l[l.length - 1]);
  const persist = (g: GameState) => {
    repo.saveGame(g).catch(() => toast('Speichern auf dem Gerät nicht möglich'));
  };

  /** Vorlage speichern und in der Liste nach vorn holen */
  /** Namen eigener Spiele im Verlauf aktuell halten (die Partie selbst behält ihre eingefrorenen Regeln) */
  const named = (h: HistGame[], tpls: Template[]) => h.map(x => { const t = tpls.find(y => y.key === x.key); return t && t.name !== x.name ? { ...x, name: t.name } : x; });
  const saveTemplate = (t: Template) => {
    const templates = [t, ...state.templates.filter(x => x.key !== t.key)];
    set({ templates, pendingSave: false, history: named(state.history, templates) });
    repo.saveTemplate(t).catch(() => toast('Speichern auf dem Gerät nicht möglich'));
  };

  const numOf = (buf: string): number | null => (buf === '' || buf === '-' ? null : parseInt(buf, 10));
  const valueAt = (g: GameState, ref: RoundRef, playerId: string) => (ref === 'new' ? null : scoreOf(g, ref, playerId));
  const makeEdit = (g: GameState, ref: RoundRef, playerId: string, field?: BidField): Edit => {
    if (isNoteField(field)) {
      const v = ref === 'new' ? null : fieldOf(g, ref, playerId, field!);
      return { ref, playerId, field, buf: v === null ? '' : String(v), fresh: v !== null, dirty: false };
    }
    const fs = fieldsOf(g);
    if (fs && ref === 'new') return { ref, playerId, field: fs[0].key, buf: '', fresh: false, dirty: false };
    if (fs && ref !== 'new') {
      const f = field || (fieldOf(g, ref, playerId, fs[0].key) === null ? fs[0].key : fs[1].key);
      const v = fieldOf(g, ref, playerId, f);
      return { ref, playerId, field: f, buf: v === null ? '' : String(v), fresh: v !== null, dirty: false };
    }
    const v = valueAt(g, ref, playerId);
    return { ref, playerId, buf: v === null ? '' : String(v), fresh: v !== null, dirty: false };
  };

  /** Ziffernblock-Text übernehmen: sofort speichern, ein Rückgängig-Schritt pro Feld. */
  const writeBuf = (edit: Edit) => {
    const g = state.game; if (!g) return;
    const value = numOf(edit.buf);
    if (edit.ref === 'new' && value === null) { set({ edit }); return; }
    if (edit.field) {
      // Neue Runde entsteht erst mit dem ersten Wert
      const base = edit.ref === 'new' ? addRound(g, clock) : { state: g, roundId: edit.ref };
      let ng = setField(base.state, base.roundId, edit.playerId, edit.field, value, clock);
      // Binokel: wer von Hand nachträgt, hebt „abgegangen“ oder „verfehlt“ wieder auf
      if (!isNoteField(edit.field) && fieldOf(ng, base.roundId, edit.playerId, 'res') !== null) ng = setField(ng, base.roundId, edit.playerId, 'res', null, clock);
      const stored = fieldOf(ng, base.roundId, edit.playerId, edit.field);
      set({ game: ng, undo: edit.dirty ? state.undo : [...state.undo.slice(-99), g], edit: { ...edit, ref: base.roundId, dirty: true, buf: stored === null ? edit.buf : String(stored) } });
      persist(ng); return;
    }
    const undo = edit.dirty ? state.undo : [...state.undo.slice(-99), g];
    const r = setScore(g, edit.ref, edit.playerId, value, clock);
    const next: Edit = { ...edit, dirty: true, ref: r.roundId ?? edit.ref };
    set({ game: r.state, undo, edit: next });
    persist(r.state);
  };

  const smallestTeam = (sel: string[]) => {
    const n = Array.from({ length: state.teamCount }, (_, k) => sel.filter(id => state.teamOf[id] === k).length);
    return n.indexOf(Math.min(...n));
  };

  const actions = {
    async init() {
      try {
        const [loaded, running, templates, hist0, ev0] = await Promise.all([repo.loadPlayers(), repo.loadRunningGames(), repo.loadTemplates(), repo.loadHistory(), repo.loadEvents()]);
        const goneKeys = await repo.loadDeletedTemplateKeys();
        const formerPlayers = await repo.loadDeletedPlayers();
        // Frühere Freitext-Anlässe einmalig zu Serien machen
        const events = [...ev0]; let history = hist0;
        const loose = [...new Set(hist0.filter(h => h.occasion && !h.eventId).map(h => h.occasion!))];
        if (loose.length) {
          const t = clock.now();
          for (const name of loose) {
            const e = events.find(x => x.name === name) ?? { id: clock.uid(), name, createdAt: t, updatedAt: t };
            if (!events.includes(e)) { events.push(e); await repo.saveEvent(e); }
          }
          history = hist0.map(h => {
            if (!h.occasion || h.eventId) return h;
            const e = events.find(x => x.name === h.occasion)!;
            repo.setGameEvent(h.id, e.id, t).catch(() => undefined);
            return { ...h, eventId: e.id };
          });
        }
        // Ältere, kräftige Spielerfarben einmalig auf Pastell umstellen
        const players = loaded.map(p => (pastel(p.color) === p.color ? p : { ...p, color: pastel(p.color), updatedAt: clock.now() }));
        players.forEach((p, i) => { if (p !== loaded[i]) repo.savePlayer(p).catch(() => undefined); });
        const soft = (x: GameState) => ({ ...x, players: x.players.map(p => ({ ...p, color: pastel(p.color) })) });
        const [g = null, ...parked] = running.map(soft);
        set({ ready: true, players, game: g, parked, templates, history: named(history, templates), events, goneKeys, formerPlayers, favs: prefs.getFavs?.() ?? [] });
      } catch {
        set({ ready: true });
        toast('Gerätespeicher nicht verfügbar – Daten gehen beim Schließen verloren');
      }
    },
    /** Sicherung als Text (JSON) */
    async exportData(): Promise<string> { return JSON.stringify(await repo.exportAll()); },
    /** Sicherung einlesen und neu laden */
    async importData(text: string) {
      try {
        const n = await repo.importAll(JSON.parse(text));
        await actions.init();
        toast(n ? `${n} Einträge übernommen` : 'Nichts Neues in der Sicherung');
      } catch { toast('Diese Datei ist keine Sicherung'); }
    },
    goHome() { set({ screen: 'home', pad: false, sheet: null, edit: null, editKey: null }); },

    // ---------- Freies Spiel einrichten
    /** Freies Spiel (Einmal-Partie) oder eigene Vorlage erstellen */
    openSetup(asTemplate = false, mode: 'rounds' | 'result' = 'rounds') { set({ setup: { ...defaultFreeConfig(), save: asTemplate, mode }, screen: 'setup', editKey: null, setupTemplate: asTemplate }); },
    /** Eigenes Spiel öffnen: Einstellungen ansehen, ändern, löschen oder spielen */
    editTemplate(t: Template) {
      const known = new Set(state.players.map(p => p.id));
      set({ setup: configOf(t), screen: 'setup', editKey: t.key, setupTemplate: true, setupEditing: false, template: t, pendingSave: false, selected: readLast().filter(id => known.has(id)) });
    },
    setSetupEditing(on: boolean) { set({ setupEditing: on }); },
    /** Festes Spiel anpassen: als eigenes Spiel kopieren und gleich bearbeiten (das Original bleibt) */
    customizeGame(t: Template) {
      const c = copyAsOwn(t, clock);
      saveTemplate(c);
      actions.editTemplate(c);
      set({ setupEditing: true });
      toast('Als eigenes Spiel gespeichert');
    },
    /** Neue eigene Vorlage speichern, ohne gleich zu spielen; danach ihre Seite */
    saveNewTemplate() {
      const t = makeFreeTemplate(state.setup, clock);
      saveTemplate(t);
      actions.editTemplate(t);
      toast('Gespeichert');
    },
    /** Änderungen am eigenen Spiel speichern; laufende und beendete Partien behalten ihre Regeln */
    saveSetup(): Template | null {
      const old = state.templates.find(t => t.key === state.editKey); if (!old) return null;
      const t = updateFreeTemplate(old, state.setup, clock);
      if (t !== old) saveTemplate(t);
      return t;
    },
    saveSetupHome() { const t = actions.saveSetup(); if (t) { actions.editTemplate(t); toast('Gespeichert'); } },
    /** Eigenes Spiel löschen: nur als gelöscht markiert, Verlauf und Statistik bleiben */
    deleteTemplate(key: string) {
      const old = state.templates.find(t => t.key === key); if (!old) return;
      const t = clock.now(), gone = { ...old, updatedAt: t, deletedAt: t };
      set({ templates: state.templates.filter(x => x.key !== key), goneKeys: [...state.goneKeys, key], screen: 'home', editKey: null });
      repo.saveTemplate(gone).catch(() => toast('Speichern auf dem Gerät nicht möglich'));
      toast(`${old.name} gelöscht`);
    },
    updateSetup(patch: Partial<FreeConfig>) { set({ setup: { ...state.setup, ...patch } }); },
    /** Einstellungen übernehmen und weiter zur Spielerauswahl */
    setupNext() {
      const known = new Set(state.players.map(p => p.id));
      if (state.editKey) {
        const t = actions.saveSetup();
        if (t) { set({ template: t, pendingSave: false, selected: readLast().filter(id => known.has(id)), screen: 'players' }); return; }
      }
      set({ template: makeFreeTemplate(state.setup, clock), pendingSave: state.setup.save, selected: readLast().filter(id => known.has(id)), screen: 'players' });
    },
    playersBack() {
      const t = state.template;
      if (t && !t.custom) { set({ screen: 'gamepage' }); return; }
      if (state.editKey) { set({ screen: 'setup' }); return; }
      set({ screen: state.pendingSave || !state.templates.some(x => x.key === t?.key) ? 'setup' : 'home' });
    },

    // ---------- Spielseite eines festen Spiels (Rommé, Skyjo, …)
    openGame(t: Template) {
      const known = new Set(state.players.map(p => p.id));
      set({ teamMode: false, teamOf: {}, template: structuredClone(t), pendingSave: false, selected: readLast().filter(id => known.has(id)), screen: 'gamepage' });
    },
    setTemplateEnd(end: Template['end']) { if (state.template) set({ template: { ...state.template, end } }); },
    /** Einstellung auf der Spielseite, z. B. bei Schwimmen „nur der Erste schwimmt“ */
    setTemplateParam(key: string, value: unknown) { if (state.template) set({ template: { ...state.template, params: { ...state.template.params, [key]: value } } }); },
    toPlayers() { set({ screen: 'players' }); },

    // ---------- Spieler wählen
    pickTemplate(t: Template) {
      const known = new Set(state.players.map(p => p.id));
      set({ template: t, pendingSave: false, selected: readLast().filter(id => known.has(id)), screen: 'players' });
    },
    /** Teams bilden: an oder aus; Vorschlag über Kreuz (1. und 3. gegen 2. und 4.) */
    setTeamMode(on: boolean) {
      set({ teamMode: on, teamCount: 2, teamOf: on ? Object.fromEntries(state.selected.map((id, i) => [id, i % 2])) : {} });
    },
    /** Spieler ins nächste Team schieben */
    cycleTeam(id: string) { set({ teamOf: { ...state.teamOf, [id]: ((state.teamOf[id] ?? 0) + 1) % state.teamCount } }); },
    /** Team dazu oder weg; die Spieler werden reihum neu verteilt */
    setTeamCount(k: number) {
      const count = Math.max(2, Math.min(k, Math.max(2, state.selected.length)));
      set({ teamCount: count, teamOf: Object.fromEntries(state.selected.map((id, i) => [id, i % count])) });
    },
    addTeam() { actions.setTeamCount(state.teamCount + 1); },
    removeTeam() { actions.setTeamCount(state.teamCount - 1); },
    /** Reihenfolge am Tisch ändern (Drag-and-drop) */
    moveSelected(from: number, to: number) {
      const sel = [...state.selected];
      if (from < 0 || from >= sel.length || to < 0 || to >= sel.length || from === to) return;
      const [x] = sel.splice(from, 1); sel.splice(to, 0, x);
      set({ selected: sel });
    },
    toggleSelect(id: string) {
      const sel = state.selected.includes(id) ? state.selected.filter(x => x !== id) : [...state.selected, id];
      set({ selected: sel, teamOf: state.teamMode && state.teamOf[id] === undefined && sel.includes(id) ? { ...state.teamOf, [id]: smallestTeam(sel) } : state.teamOf });
    },
    async addPlayer(rawName: string) {
      const name = rawName.trim().slice(0, 18);
      if (!name) return;
      const existing = state.players.find(p => p.name.toLowerCase() === name.toLowerCase());
      if (existing) { if (!state.selected.includes(existing.id)) set({ selected: [...state.selected, existing.id] }); return; }
      const t = clock.now();
      const p: Player = { id: clock.uid(), name, color: PLAYER_COLORS[state.players.length % PLAYER_COLORS.length], createdAt: t, updatedAt: t };
      set({ players: [...state.players, p], selected: [...state.selected, p.id] });
      repo.savePlayer(p).catch(() => toast('Speichern auf dem Gerät nicht möglich'));
    },
    /** Neue Partie starten. Eine laufende wird geparkt (leere werden verworfen) und bleibt unter „Laufende Partien“. */
    start() {
      const t = state.template; if (!t) return;
      const chosen = state.selected.map(id => state.players.find(p => p.id === id)).filter((p): p is Player => !!p);
      if (chosen.length < t.players.min || chosen.length > t.players.max) return;
      const running = state.game;
      if (running) {
        // Leer heißt: gar nichts eingetragen (auch kein Haken, keine Notiz)
        if (running.entries.some(e => !e.deletedAt)) set({ parked: [running, ...state.parked], game: null });
        else { const parked = state.parked; actions.discardGame(true); set({ parked }); }
      }
      writeLast(state.selected);
      // Vorlage merken bzw. als zuletzt gespielt markieren
      const known = state.templates.some(x => x.key === t.key);
      if (known || state.pendingSave) saveTemplate({ ...t, lastUsedAt: clock.now(), updatedAt: clock.now() });
      const teams = state.teamMode && canTeam(t)
        ? Array.from({ length: state.teamCount }, (_, k) => ({ members: chosen.filter(p => (state.teamOf[p.id] ?? 0) === k) })).filter(x => x.members.length)
        : null;
      if (teams && teams.length < 2) return;
      const g = teams ? createTeamGame(t, teams, clock) : createGame(t, chosen, clock);
      set({ bidBar: null, game: g, undo: [], screen: 'game', page: -1, edit: null, pad: false, sheet: null });
      persist(g);
    },
    /** Partie fortsetzen; ohne ID die aktive, sonst eine geparkte (die aktive wird dafür geparkt) */
    resume(id?: string) {
      if (id && state.game?.game.id !== id) {
        const target = state.parked.find(x => x.game.id === id); if (!target) return;
        const parked = [...(state.game ? [state.game] : []), ...state.parked.filter(x => x !== target)];
        set({ bidBar: null, game: target, parked, undo: [] });
      }
      if (state.game) set({ bidBar: null, screen: 'game', page: -1, edit: null, pad: false, sheet: null });
    },

    // ---------- Navigation in der Partie
    /** Seite wechseln; optional mit festem Ziel (Runde), sonst Standardziel des Spielers. */
    goPage(i: number, ref?: RoundRef, field?: BidField) {
      const g = state.game; if (!g) return;
      if (i < 0) { set({ page: -1, edit: null }); return; }
      const p = seated(g)[i]; if (!p) return;
      // Rang-Spiele: Spielerseite zeigt nur Rollen und Verlauf, Eingabe über die Verteilung
      if (isRanks(g)) { set({ page: i, pad: false, edit: null }); return; }
      set({ page: i, pad: false, fromOverview: false, edit: makeEdit(g, ref ?? defaultRef(g, p.id), p.id, field) });
    },
    selectRef(ref: RoundRef) {
      const g = state.game, e = state.edit; if (!g || !e) return;
      set({ edit: makeEdit(g, ref, e.playerId) });
    },
    /** Wizard: zwischen Ansage und Stichen wechseln */
    selectField(field: BidField) {
      const g = state.game, e = state.edit; if (!g || !e) return;
      set({ edit: makeEdit(g, e.ref, e.playerId, field) });
    },
    // ---------- Rang pro Runde (Arschloch)
    openRanks(ref: RoundRef) { set({ sheet: 'ranks', rankRef: ref, pad: false, edit: null }); },
    /** Spieler in der Reihenfolge des Fertigwerdens antippen; erneutes Antippen nimmt ihn (und alle danach) heraus.
     *  Wer als Letzter übrig bleibt, wird automatisch eingetragen. */
    rankTap(playerId: string) {
      haptic('tap');
      const g = state.game, ref = state.rankRef; if (!g || !ref) return;
      const players = seated(g);
      const cur = ref === 'new' ? [] : players.filter(p => rankIn(g, ref, p.id) !== null).sort((a, b) => rankIn(g, ref, a.id)! - rankIn(g, ref, b.id)!).map(p => p.id);
      let order = cur.includes(playerId) ? cur.slice(0, cur.indexOf(playerId)) : [...cur, playerId];
      if (order.length === players.length - 1) order = [...order, players.find(p => !order.includes(p.id))!.id];
      const r = setOrder(g, ref, order, clock);
      set({ game: r.state, undo: [...state.undo.slice(-99), g], rankRef: r.roundId });
      persist(r.state);
      if (order.length === players.length) { set({ sheet: null, rankRef: null }); toast(`Runde ${roundNumber(r.state, r.roundId)} verteilt`); }
    },
    /** Nur der Sieger zählt (Uno): alle anderen bekommen 0, dann Punkte des Siegers eingeben */
    pickWinner(playerId: string) {
      haptic('tap');
      const g = state.game, ref = state.rankRef; if (!g || !ref) return;
      let ng = g, id: RoundRef = ref;
      for (const p of seated(g)) {
        if (p.id === playerId) continue;
        const r = setScore(ng, id, p.id, 0, clock); ng = r.state; id = r.roundId ?? id;
      }
      set({ game: ng, undo: [...state.undo.slice(-99), g], sheet: null, rankRef: null });
      persist(ng);
      // Uno im Block: nur der Sieger trägt ein, direkt unter dem Block
      if (blockEntry(ng) && modeOf(ng.game.rules.key) === 'block') set({ page: -1, pad: true, edit: makeEdit(ng, id, playerId), fromOverview: true });
      else { actions.goPage(seated(ng).findIndex(p => p.id === playerId), id); set({ fromOverview: true }); }
    },
    /** Skat: alle haben gepasst, die Runde zählt für niemanden */
    passRound() {
      const g = state.game, ref = state.rankRef; if (!g || !ref) return;
      haptic('tap');
      let ng = g, id: RoundRef = ref;
      for (const p of seated(g)) { const r = setScore(ng, id, p.id, 0, clock); ng = r.state; id = r.roundId ?? id; }
      set({ game: ng, undo: [...state.undo.slice(-99), g], sheet: null, rankRef: null }); persist(ng);
      toast(`Runde ${roundNumber(ng, id)} eingepasst`);
    },
    rankReset() {
      const g = state.game, ref = state.rankRef; if (!g || !ref || ref === 'new') return;
      const r = setOrder(g, ref, [], clock);
      set({ game: r.state, undo: [...state.undo.slice(-99), g] }); persist(r.state);
    },
    /** Spiel als Favorit markieren oder wieder lösen */
    toggleFav(key: string) {
      const favs = state.favs.includes(key) ? state.favs.filter(k => k !== key) : [...state.favs, key];
      set({ favs }); prefs.setFavs?.(favs);
      toast(favs.includes(key) ? 'Bei den Favoriten' : 'Aus den Favoriten entfernt');
    },
    // ---------- Tisch-Modus
    /** Schwimmen: Antippen kostet ein Leben; im Feuer-Modus verlieren alle anderen eins */
    tableTap(playerId: string) {
      haptic('tap');
      const g = state.game; if (!g || !isTable(g)) return;
      if (!isLives(g)) {
        const t = tokenState(g);
        if (t.loser || t.out[playerId] || (t.mode === 'return' && t.phase === 2 && !t.hold[playerId])) return;
        set({ sheet: 'tokens', tokenTo: playerId, pad: false }); return;
      }
      const fm = state.fireMode, ng = fm ? fire(g, playerId, clock) : loseLife(g, playerId, clock);
      set({ fireMode: false });
      if (ng === g) return;
      set({ game: ng, undo: [...state.undo.slice(-99), g] }); persist(ng);
      const p = seated(ng).find(x => x.id === playerId)!, ls = lifeState(ng);
      if (ls.alive.length < 2) return;
      if (fm) toast(`Feuer von ${p.name}`);
      else if (ls.swimming[playerId]) toast(`${p.name} schwimmt`);
      else if (ls.out[playerId] !== null) toast(`${p.name} ist raus`);
    },
    setFireMode(on: boolean) { set({ fireMode: on }); },
    /** Chic: der Angetippte schickt sich raus (positiv) oder würfelt Chic aus dem Rohr (verliert sofort) */
    tableChic(kind: 'out' | 'loss') {
      const g = state.game, to = state.tokenTo; if (!g || !to) return;
      const ng = kind === 'out' ? sendOut(g, to, clock) : chicLoss(g, to, clock);
      if (ng === g) return;
      haptic(kind === 'out' ? 'success' : 'tap');
      set({ game: ng, undo: [...state.undo.slice(-99), g], sheet: null, tokenTo: null }); persist(ng);
      const p = seated(ng).find(x => x.id === to)!, ts = tokenState(ng);
      if (kind === 'loss') toast(`${p.name} zahlt die Runde`);
      else if (ts.loser) toast(`${p.name} ist raus, ${seated(ng).find(x => x.id === ts.loser)!.name} verliert`);
      else toast(`${p.name} hat sich rausgeschickt`);
    },
    /** Schocken: n Deckel an den Verlierer, aus der Mitte oder vom Sieger (from) */
    tableGive(n: number | 'schock' | 'all', from: string | null = null) {
      const g = state.game, to = state.tokenTo; if (!g || !to) return;
      const before = tokenState(g);
      // Chic, zweite Phase: der Angetippte spielt Deckel zurück in die Mitte
      const back = before.mode === 'return' && before.phase === 2;
      const ng = back ? returnTokens(g, to, n === 'all' || n === 'schock' ? before.hold[to] : n, clock)
        : n === 'schock' || n === 'all' ? schockOut(g, to, clock) : giveTokens(g, to, n, from, clock);
      if (ng === g) return;
      set({ game: ng, undo: [...state.undo.slice(-99), g], sheet: null, tokenTo: null }); persist(ng);
      const after = tokenState(ng), players = seated(ng);
      haptic(after.half > before.half ? 'success' : 'tap');
      // Wer hat die Hälfte verloren (bei Chic nicht unbedingt der Angetippte)
      const p = players.find(x => after.halves[x.id] > before.halves[x.id]);
      if (p && !after.loser) { toast(halfLabel(after.need, after.half) === 'Finale' ? `${p.name} verliert die Hälfte, jetzt das Finale` : `${p.name} verliert die Hälfte`); return; }
      if (after.mode !== 'return' || after.loser) return;
      const gone = players.filter(x => after.out[x.id] && !before.out[x.id]).map(x => x.name);
      if (before.phase === 1 && after.phase === 2) toast(gone.length ? `Mitte leer, ${names(gone)} ${gone.length > 1 ? 'sind' : 'ist'} raus` : 'Mitte leer');
      else if (gone.length) toast(`${names(gone)} ist raus`);
    },
    /** Sitzplatz am Tisch verschieben */
    moveSeat(from: number, to: number) {
      const g = state.game; if (!g) return;
      const ng = moveSeat(g, from, to, clock);
      if (ng === g) return;
      set({ game: ng }); persist(ng);
    },
    /** Notizfelder der laufenden Partie festlegen */
    setGameNotes(labels: string[]) {
      const g = state.game; if (!g) return;
      const ng = setNotes(g, labels, clock);
      set({ game: ng, undo: [...state.undo.slice(-99), g] }); persist(ng);
    },
    /** Phase 10: Haken „Phase geschafft“ umschalten */
    togglePhase() {
      haptic('tap');
      const g = state.game, e = state.edit; if (!g || !e) return;
      const on = !(e.ref !== 'new' && phaseIn(g, e.ref, e.playerId));
      const r = setPhase(g, e.ref, e.playerId, on, clock);
      set({ game: r.state, undo: [...state.undo.slice(-99), g], edit: { ...e, ref: r.roundId } });
      persist(r.state);
    },
    /** Kniffel: Kategorie hinzufügen oder entfernen */
    addCategory(cat: Category) {
      const g = state.game; if (!g || !cat.label.trim()) return;
      const ng = addCategory(g, { ...cat, label: cat.label.trim() }, clock);
      set({ game: ng, undo: [...state.undo.slice(-99), g] }); persist(ng);
    },
    removeCategory(roundId: string) {
      const g = state.game; if (!g) return;
      const ng = removeCategory(g, roundId, clock);
      set({ game: ng, undo: [...state.undo.slice(-99), g], edit: null, page: -1 }); persist(ng);
    },
    /** Wert setzen und gleich weiter (Wizard-Schnelltasten) */
    pick(n: number) { actions.setValue(n); actions.next(); },
    /** Knopf im Überblick: zum nächsten offenen Feld */
    roundGo() {
      const g = state.game; if (!g) return;
      const step = nextStep(g);
      if (step.kind === 'result') { set({ sheet: 'result' }); return; }
      if (isRanks(g)) { actions.openRanks(step.ref); return; }
      if (g.game.rules.params?.winnerOnly) { set({ sheet: 'winner', rankRef: step.ref, pad: false, edit: null }); return; }
      // Wizard im Block: Ansagen unten in der Leiste, Stiche auf eigenem Blatt
      if (isBids(g) && modeOf(g.game.rules.key) === 'block' && step.ref !== 'new') {
        if (step.field === 'bid') set({ bidBar: step.ref, page: -1, pad: false, edit: null });
        else set({ sheet: 'tricks', rankRef: step.ref, bidBar: null, page: -1, pad: false, edit: null });
        return;
      }
      // Binokel im Block: erst „Wer spielt?“ mit Gebot, dann Meldungen und Stiche im Ziffernblock unter dem Block
      if (isSplit(g) && blockEntry(g) && modeOf(g.game.rules.key) === 'block' && step.field) {
        const fs = fieldsOf(g)!;
        const untouched = step.ref === 'new' || seated(g).every(p => fieldOf(g, step.ref as string, p.id, fs[0].key) === null);
        if (g.game.rules.params?.bidder && step.field === fs[0].key && untouched && !gebotOf(g, step.ref)) {
          set({ sheet: 'bidder', rankRef: step.ref, page: -1, pad: false, edit: null }); return;
        }
        set({ page: -1, pad: true, sheet: null, fromOverview: false, edit: makeEdit(g, step.ref, seated(g)[step.playerIndex].id, step.field) }); return;
      }
      // Rommé und Co. im Block: Ziffernblock direkt unter der Zeile, Spieler für Spieler
      if (blockEntry(g) && !isBids(g) && !isCats(g) && !step.field && modeOf(g.game.rules.key) === 'block') {
        set({ page: -1 }); actions.openPad(step.ref, seated(g)[step.playerIndex].id); return;
      }
      actions.goPage(step.playerIndex, step.ref, step.field);
    },
    // ---------- Wizard im Block
    /** Ansage für den, der dran ist (oder den angetippten); dann weiter zum Nächsten */
    bidPick(n: number, playerId?: string) {
      const g = state.game, ref = state.bidBar; if (!g || !ref) return;
      const who = playerId ?? bidTurn(g, ref); if (!who) return;
      haptic('tap');
      const ng = setField(g, ref, who, 'bid', n, clock);
      set({ game: ng, undo: [...state.undo.slice(-99), g] }); persist(ng);
      if (!bidTurn(ng, ref)) { set({ bidBar: null }); toast('Ansagen komplett'); }
    },
    /** Letzte Ansage zurücknehmen (der Spieler ist dann wieder dran) */
    bidBack() {
      const g = state.game, ref = state.bidBar; if (!g || !ref) return;
      const players = seated(g), order = inputOrder(g, ref).map(k => players[k].id);
      const done = order.filter(id => fieldOf(g, ref, id, 'bid') !== null);
      const last = done[done.length - 1]; if (!last) { set({ bidBar: null }); return; }
      const ng = setField(g, ref, last, 'bid', null, clock);
      set({ game: ng, undo: [...state.undo.slice(-99), g] }); persist(ng);
    },
    closeBidBar() { set({ bidBar: null }); },
    /** Endwertung nach Platz (Monopoly …): Antippen vergibt den nächsten freien Platz, nochmal nimmt ihn zurück */
    placeTap(playerId: string) {
      const g = state.game; if (!g) return;
      const ref = liveRounds(g)[0]?.id ?? 'new';
      const players = seated(g);
      const placed = players.filter(p => p.id !== playerId && ref !== 'new' && scoreOf(g, ref, p.id) !== null)
        .sort((a, b) => scoreOf(g, ref, a.id)! - scoreOf(g, ref, b.id)!).map(p => p.id);
      const had = ref !== 'new' && scoreOf(g, ref, playerId) !== null;
      const order = had ? placed : [...placed, playerId];
      // Letzter Platz ergibt sich von selbst
      const rest = players.filter(p => !order.includes(p.id));
      if (!had && rest.length === 1) order.push(rest[0].id);
      let ng = g, id: RoundRef = ref;
      for (const p of players) {
        const k = order.indexOf(p.id), want = k < 0 ? null : k + 1;
        if ((id === 'new' ? null : scoreOf(ng, id, p.id)) === want) continue;
        if (want === null && id === 'new') continue;
        const r = setScore(ng, id, p.id, want, clock); ng = r.state; id = r.roundId ?? id;
      }
      haptic('tap');
      set({ game: ng, undo: [...state.undo.slice(-99), g] }); persist(ng);
    },
    /** Binokel: wer spielt, mit welchem Gebot; danach Meldungen im Block. Ohne Angabe geht es gleich weiter. */
    setBidder(playerId: string | null, gebot: number | null) {
      const g = state.game, ref = state.rankRef; if (!g || !ref) return;
      let ng = g, id: RoundRef = ref;
      if (playerId && gebot && gebot > 0) {
        if (id === 'new') { const a = addRound(ng, clock); ng = a.state; id = a.roundId; }
        for (const p of seated(ng)) if (fieldOf(ng, id, p.id, 'gebot') !== null) ng = setField(ng, id, p.id, 'gebot', null, clock);
        ng = setField(ng, id, playerId, 'gebot', gebot, clock);
        set({ game: ng, undo: [...state.undo.slice(-99), g] }); persist(ng);
      }
      haptic('tap');
      const fs = fieldsOf(ng)!;
      set({ sheet: null, rankRef: null, page: -1, pad: true, fromOverview: false, edit: makeEdit(ng, id, seated(ng)[0].id, fs[0].key) });
    },
    /** Binokel: Spielmacher geht ab (Gebot einfach negativ) oder verfehlt (doppelt); die Meldung zählt dann nicht */
    binokelOut(k: 1 | 2) {
      const g = state.game, e = state.edit; if (!g || !e || e.ref === 'new') return;
      const b = gebotOf(g, e.ref); if (!b || b.playerId !== e.playerId) return;
      const fs = fieldsOf(g)!;
      let ng = setField(g, e.ref, e.playerId, fs[0].key, 0, clock);
      ng = setField(ng, e.ref, e.playerId, fs[1].key, -k * b.gebot, clock);
      ng = setField(ng, e.ref, e.playerId, 'res', k, clock);
      haptic('tap');
      set({ game: ng, undo: [...state.undo.slice(-99), g], edit: { ...makeEdit(ng, e.ref, e.playerId, e.field), dirty: true } }); persist(ng);
      actions.next();
    },
    /** Stiche aller auf einmal eintragen */
    tricksCommit(ref: string, tricks: Record<string, number>) {
      const g = state.game; if (!g) return;
      let ng = g;
      for (const p of seated(g)) if (tricks[p.id] !== undefined) ng = setField(ng, ref, p.id, 'tricks', tricks[p.id], clock);
      haptic('tap');
      set({ game: ng, undo: [...state.undo.slice(-99), g], sheet: null, rankRef: null }); persist(ng);
      toast(`Runde ${roundNumber(ng, ref)} eingetragen`);
    },
    /** Umschalten zwischen Block und manueller Eingabe pro Spieler; geht direkt dort weiter, wo man war */
    switchEntry(key: string) {
      const g = state.game; if (!g) return;
      const next: EntryMode = modeOf(key) === 'block' ? 'simple' : 'block';
      actions.setEntryMode(key, next);
      if (g.game.rules.key === key && nextStep(g).kind !== 'result') actions.roundGo();
    },
    /** Eingabe je Spiel: ausführlich im Block oder einfach pro Spieler (gemerkt je Spiel) */
    setEntryMode(key: string, mode: EntryMode) {
      prefs.setMode?.(key, mode);
      set({ bidBar: null, sheet: null, pad: false, edit: null });
      toast(mode === 'block' ? 'Eintragen im Block' : 'Eintragen pro Spieler');
    },
    /** Weiter: nächster Spieler derselben Runde, nach dem letzten zurück zum Überblick. */
    next() {
      haptic('tap');
      // Zweiteilige Runde: leere Meldung zählt als 0
      const e0 = state.edit, g0 = state.game;
      if (g0 && e0 && isSplit(g0) && e0.field === fieldsOf(g0)![0].key && numOf(e0.buf) === null) writeBuf({ ...e0, buf: '0', fresh: true });
      const g = state.game, e = state.edit; if (!g || !e) return;
      // Notizfeld: zurück zum Punktefeld desselben Spielers
      if (isNoteField(e.field)) { set({ edit: makeEdit(g, e.ref, e.playerId) }); return; }
      // Nur der Sieger zählt: nach seiner Eingabe zurück zum Überblick
      if (state.fromOverview && !isCats(g)) {
        const full = e.ref !== 'new' && roundFull(g, e.ref);
        set({ page: -1, edit: null, fromOverview: false, pad: false });
        if (full) toast(`Runde ${roundNumber(g, e.ref)} komplett`);
        return;
      }
      const players = seated(g), i = players.findIndex(p => p.id === e.playerId);
      if (e.field && e.ref !== 'new') {
        const order = inputOrder(g, e.ref), pos = order.indexOf(i);
        if (pos < order.length - 1) {
          if (state.pad) set({ edit: makeEdit(g, e.ref, players[order[pos + 1]].id, e.field) });
          else actions.goPage(order[pos + 1], e.ref, e.field);
          return;
        }
        const fs = fieldsOf(g)!, full = roundFull(g, e.ref), firstDone = bidPhase(g, e.ref) === fs[1].key;
        set({ page: -1, edit: null, pad: false });
        if (full) toast(`Runde ${roundNumber(g, e.ref)} komplett`);
        else if (e.field === fs[0].key && firstDone) toast(`${fieldLabel(g, fs[0].key, true)} komplett`);
        return;
      }
      // Kniffel: jeder trägt in ein Feld seiner Wahl ein, dann ist der Nächste dran
      if (isCats(g) && (!state.pad || state.fromOverview)) {
        if (state.fromOverview) {
          const turn = actions.catDone(e);
          set({ page: -1, edit: null, fromOverview: false, pad: false, sheet: null });
          if (turn) toast(turn);
          return;
        }
        if (i < players.length - 1) { actions.goPage(i + 1); return; }
        set({ page: -1, edit: null }); toast('Zug fertig'); return;
      }
      if (i < players.length - 1) {
        const ref = e.ref;
        if (state.pad) set({ edit: makeEdit(g, ref, players[i + 1].id) });
        else actions.goPage(i + 1, ref);
        return;
      }
      const no = roundNumber(g, e.ref);
      const done = e.ref !== 'new' && roundFull(g, e.ref);
      if (state.pad) { set({ pad: false, edit: null }); return; }
      set({ page: -1, edit: null });
      if (done) toast(isResultOnly(g) ? 'Ergebnis komplett' : `Runde ${no} komplett`);
    },
    openPad(ref: string, playerId: string) {
      const g = state.game; if (!g) return;
      if (isRanks(g)) { actions.openRanks(ref); return; }
      if (hasFields(g)) {
        if (isSplit(g) && blockEntry(g) && modeOf(g.game.rules.key) === 'block') { set({ pad: true, page: -1, edit: makeEdit(g, ref, playerId), fromOverview: true }); return; }
        actions.goPage(seated(g).findIndex(p => p.id === playerId), ref); return;
      }
      // Kniffel: Auswahl auf der Spielerseite, danach zurück zum Überblick
      if (isCats(g)) {
        // Im Block: Auswahl der Werte direkt über dem Block; freie Felder (Chance) mit dem Ziffernblock
        if (blockEntry(g) && modeOf(g.game.rules.key) === 'block') {
          const cat = liveRounds(g).find(r => r.id === ref)?.cat;
          if (catChoices(cat)) set({ sheet: 'catpick', pad: false, page: -1, edit: makeEdit(g, ref, playerId), fromOverview: true });
          else set({ sheet: null, pad: true, page: -1, edit: makeEdit(g, ref, playerId), fromOverview: true });
          return;
        }
        actions.goPage(seated(g).findIndex(p => p.id === playerId), ref); set({ fromOverview: true }); return;
      }
      set({ pad: true, edit: makeEdit(g, ref, playerId) });
    },
    closePad() { set({ pad: false, edit: null, fromOverview: false, sheet: state.sheet === 'catpick' ? null : state.sheet }); },
    /** Kniffel im Block: nach einem Eintrag sagen, wer dran ist (nur wenn der Zug gewechselt hat) */
    catDone(e: Edit): string | null {
      const g = state.game; if (!g || !e.dirty) return null;
      const st = nextStep(g); if (st.kind === 'result') return null;
      const who = seated(g)[st.playerIndex];
      return who.id !== e.playerId ? `${who.name} ist dran` : null;
    },

    // ---------- Ziffernblock
    digit(d: number) {
      const e = state.edit; if (!e) return;
      let buf = e.fresh ? (e.buf.startsWith('-') ? '-' : '') : e.buf;
      if (buf.replace('-', '').length >= 6) return;
      buf = (buf === '0' ? '' : buf === '-0' ? '-' : buf) + d;
      writeBuf({ ...e, buf, fresh: false });
    },
    mul(n: number) { const e = state.edit; if (!e) return; writeBuf({ ...e, buf: String((numOf(e.buf) ?? 0) * n), fresh: false }); },
    setValue(n: number) { const e = state.edit; if (!e) return; writeBuf({ ...e, buf: String(n), fresh: true }); },
    /** Nullsumme: Wert so setzen, dass die Runde 0 ergibt */
    rest() { const g = state.game, e = state.edit; if (!g || !e) return; writeBuf({ ...e, buf: String(restOf(g, e.ref, e.playerId)), fresh: true }); },
    add(n: number) { const e = state.edit; if (!e) return; writeBuf({ ...e, buf: String((numOf(e.buf) ?? 0) + n), fresh: false }); },
    sign() { const e = state.edit; if (!e) return; writeBuf({ ...e, buf: e.buf.startsWith('-') ? e.buf.slice(1) : '-' + e.buf, fresh: false }); },
    back() { const e = state.edit; if (!e) return; writeBuf({ ...e, buf: e.fresh ? '' : e.buf.slice(0, -1), fresh: false }); },
    clear() { const e = state.edit; if (!e) return; writeBuf({ ...e, buf: '', fresh: false }); },

    undo() {
      const g = state.game; if (!g || !state.undo.length) return;
      const prev = state.undo[state.undo.length - 1];
      const restored0 = restore(g, prev, clock);
      // Sitzplätze bleiben, wie sie gerade sind (Verschieben ist kein Spielzug)
      const restored = { ...restored0, game: { ...restored0.game, seats: g.game.seats } };
      const e = state.edit;
      const ref = e && e.ref !== 'new' && !liveRounds(restored).some(r => r.id === e.ref) ? 'new' : e?.ref;
      set({ game: restored, undo: state.undo.slice(0, -1), edit: e && ref ? makeEdit(restored, ref, e.playerId, e.field) : null });
      persist(restored);
      toast('Rückgängig gemacht');
    },

    // ---------- Menü & Ergebnis
    openSheet(sheet: 'menu' | 'result' | 'cats' | 'notes' | 'ranks' | 'winner') { set({ sheet, pad: false, fireMode: false }); },
    closeSheet() { set({ sheet: null, tokenTo: null }); },
    setWin(win: 'high' | 'low') {
      const g = state.game; if (!g || g.game.rules.win === win) return;
      const ng = setWin(g, win, clock);
      set({ game: ng, undo: [...state.undo, g] }); persist(ng);
    },
    /** Beenden und speichern. Eine noch nicht gespeicherte Vorlage wird automatisch gesichert. */
    /** Beenden und speichern: Platz und Endpunktzahl je Spieler landen im Verlauf. */
    finishGame(eventId: string | null = null) {
      const g = state.game; if (!g) return;
      haptic('success');
      const f0 = finish(g, clock);
      const ev = eventId ? state.events.find(e => e.id === eventId) : undefined;
      const f = ev ? { ...f0, game: { ...f0.game, eventId: ev.id } } : f0;
      persist(f);
      const t = clock.now(), rk = ranking(f);
      if (anyScore(f)) {
        // Teampartie: jedes Mitglied bekommt Platz, Punkte und Kennzahlen seines Teams
        const rn = playedRounds(f);
        const results: Result[] = rk.flatMap(x => {
          let extra: Result['extra'];
          if (isCats(f)) {
            const k = liveRounds(f).filter(r => r.cat?.fixed === 50 && scoreOf(f, r.id, x.player.id) === 50).length;
            extra = { kniffel: k, bonus: upperSum(f, x.player.id).bonus > 0 ? 1 : 0 };
          }
          const notes = notesOf(f);
          if (notes.length) {
            extra = { ...extra };
            for (const n of notes) extra[noteKey(n)] = liveRounds(f).reduce((a, r) => a + (fieldOf(f, r.id, x.player.id, noteKey(n)) ?? 0), 0);
          }
          if (isRanks(f)) {
            // Rollen-Statistik: wie oft Präsident und Arschloch, längste Präsidenten-Serie
            const n = seated(f).length, ranks = liveRounds(f).map(r => rankIn(f, r.id, x.player.id));
            let streak = 0, best = 0;
            for (const rk2 of ranks) { streak = rk2 === 1 ? streak + 1 : 0; best = Math.max(best, streak); }
            extra = { ...extra, praes: ranks.filter(v => v === 1).length, arsch: ranks.filter(v => v === n).length, praesStreak: best };
          }
          if (isTable(f)) {
            // Schwimmen: geschwommen und Leben übrig; Schocken: verlorene Hälften und Schock aus
            if (isLives(f)) { const ls = lifeState(f); extra = { ...extra, left: Math.max(0, ls.left[x.player.id]), swum: ls.left[x.player.id] <= 0 ? 1 : 0 }; }
            else { const ts = tokenState(f); extra = { ...extra, halves: ts.halves[x.player.id], schock: ts.schock[x.player.id] }; }
          }
          if (isBids(f)) {
            const rounds = liveRounds(f).filter(r => fieldOf(f, r.id, x.player.id, 'tricks') !== null);
            extra = { ...extra, rounds: rounds.length, hits: rounds.filter(r => fieldOf(f, r.id, x.player.id, 'bid') === fieldOf(f, r.id, x.player.id, 'tricks')).length };
          }
          // Rommé: gewonnene Runden (0 geschrieben) für die Siegquote
          if (zeroWins(f)) extra = { ...extra, wins: roundWins(f, x.player.id) };
          // Rundenzahl für Rekorde (längste Partie); bei reinen Endwertungen ohne Bedeutung
          if (rn) extra = { ...extra, rn };
          return membersOf(f, x.player.id).map(pid => ({ id: clock.uid(), createdAt: t, updatedAt: t, gameId: f.game.id, playerId: pid, total: x.total, place: x.place, ...(extra ? { extra: { ...extra, ...(isTeamGame(f) ? { team: 1 } : {}) } } : isTeamGame(f) ? { extra: { team: 1 } } : {}) }));
        });
        repo.saveResults(results).catch(() => toast('Speichern auf dem Gerät nicht möglich'));
        const h: HistGame = { id: f.game.id, key: f.game.rules.key, name: f.game.rules.name, finishedAt: t, occasion: ev?.name ?? null, eventId: ev?.id ?? null,
          results: results.map(r => ({ playerId: r.playerId, total: r.total, place: r.place, extra: r.extra })) };
        set({ history: [h, ...state.history] });
        try { localStorage.setItem('pz:lastEvent', ev?.id ?? ''); } catch { /* egal */ }
      }
            // Freies Spiel ohne Vorlage bleibt eine Einmal-Partie (nur im Verlauf)
      const auto = false;
      set({ bidBar: null, game: null, undo: [], sheet: null, screen: 'home', page: -1, edit: null });
      toast(auto ? 'Partie und Vorlage gespeichert' : 'Partie gespeichert');
    },
    /** Oina no: Partie speichern und gleich noch eine mit denselben Regeln, Spielern und Plätzen */
    oinaNo(eventId: string | null = null) {
      const g = state.game; if (!g) return;
      const rules = structuredClone(g.game.rules), order = seated(g), teams = g.game.teams;
      const person = (id: string) => state.players.find(p => p.id === id);
      actions.finishGame(eventId);
      const ng = teams?.length
        ? createTeamGame(rules, order.map(tp => ({ members: (teams.find(t => t.id === tp.id)?.members ?? []).map(person).filter((p): p is Player => !!p) })), clock)
        : createGame(rules, order.map(p => person(p.id)).filter((p): p is Player => !!p), clock);
      if (seated(ng).length < Math.max(1, rules.players.min)) return;
      set({ bidBar: null, game: ng, undo: [], screen: 'game', page: -1, edit: null, pad: false, sheet: null, fireMode: false, tokenTo: null });
      persist(ng);
      toast('Oina no! Neue Partie läuft');
    },
    // ---------- Verlauf und Spieler
    openTab(screen: 'home' | 'history' | 'events' | 'people') { set({ screen, detail: null, profile: null, series: null }); },
    setHistTab(histTab: 'games' | 'series') { set({ histTab, detail: null }); },
    // ---------- Serien
    /** Neue Serie anlegen; gibt sie zurück (leerer Name: nichts) */
    createEvent(name: string): GameEvent | null {
      const n = name.trim(); if (!n) return null;
      const t = clock.now();
      const e: GameEvent = { id: clock.uid(), name: n, createdAt: t, updatedAt: t };
      set({ events: [...state.events, e] });
      repo.saveEvent(e).catch(() => toast('Speichern auf dem Gerät nicht möglich'));
      return e;
    },
    /** Serie starten (Spieleabend, Urlaub …): läuft, bis sie beendet wird; neue Partien gehören dazu */
    startEvent(name: string): GameEvent | null {
      const e = actions.createEvent(name); if (!e) return null;
      actions.resumeEvent(e.id);
      return state.events.find(x => x.id === e.id) ?? e;
    },
    /** Serie (wieder) laufen lassen; eine andere laufende pausiert dann */
    resumeEvent(id: string) {
      const t = clock.now();
      const events = state.events.map(e => (e.id === id ? { ...e, active: true, endedAt: null, updatedAt: t } : e.active ? { ...e, active: false, updatedAt: t } : e));
      set({ events });
      for (const e of events.filter(x => x.updatedAt === t)) repo.saveEvent(e).catch(() => toast('Speichern auf dem Gerät nicht möglich'));
      try { localStorage.setItem('pz:lastEvent', id); } catch { /* egal */ }
    },
    /** Serie beenden: sie bekommt ihre Abschlussseite */
    endEvent(id: string) {
      const old = state.events.find(e => e.id === id); if (!old) return;
      const e = { ...old, active: false, endedAt: clock.now(), updatedAt: clock.now() };
      set({ events: state.events.map(x => (x.id === id ? e : x)) });
      repo.saveEvent(e).catch(() => toast('Speichern auf dem Gerät nicht möglich'));
    },
    updateEvent(id: string, patch: Partial<Pick<GameEvent, 'name' | 'points' | 'banner'>>) {
      const old = state.events.find(e => e.id === id); if (!old) return;
      if (patch.name !== undefined && !patch.name.trim()) return;
      const e = { ...old, ...patch, updatedAt: clock.now() };
      set({ events: state.events.map(x => (x.id === id ? e : x)), history: patch.name ? state.history.map(h => (h.eventId === id ? { ...h, occasion: e.name } : h)) : state.history });
      repo.saveEvent(e).catch(() => toast('Speichern auf dem Gerät nicht möglich'));
    },
    /** Partie im Verlauf einer Serie zuordnen oder lösen */
    setGameEvent(gameId: string, eventId: string | null) {
      const ev = eventId ? state.events.find(e => e.id === eventId) : undefined;
      set({ history: state.history.map(h => (h.id === gameId ? { ...h, eventId: ev?.id ?? null, occasion: ev?.name ?? null } : h)) });
      repo.setGameEvent(gameId, ev?.id ?? null, clock.now()).catch(() => toast('Speichern auf dem Gerät nicht möglich'));
    },
    /** Partie aus dem Verlauf löschen; Statistik rechnet ohne sie */
    deleteHistoryGame(id: string) {
      const h = state.history.find(x => x.id === id); if (!h) return;
      set({ history: state.history.filter(x => x.id !== id), detail: null });
      repo.deleteGame(id, clock.now()).catch(() => toast('Speichern auf dem Gerät nicht möglich'));
      toast(`${h.name} gelöscht`);
    },
    openSeries(id: string) { set({ screen: 'series', series: { id, sort: 'perf' }, detail: null }); },
    setSeriesSort(sort: SeriesSort) { if (state.series) set({ series: { ...state.series, sort } }); },
    closeSeries() { set({ screen: 'events', series: null }); },
    openDetail(id: string | null) { set({ detail: id }); },
    /** Revanche: dasselbe Spiel mit denselben Spielern */
    rematch(gameId: string) {
      const h = state.history.find(x => x.id === gameId); if (!h) return;
      const t = gameDef(h.key)?.template ?? state.templates.find(x => x.key === h.key); if (!t) return;
      const ids = h.results.map(r => r.playerId).filter(id => state.players.some(p => p.id === id));
      set({ template: structuredClone(t), pendingSave: false, editKey: null, selected: ids, screen: 'players', profile: null });
    },
    openProfile(id: string) { set({ screen: 'profile', profile: { id, time: 'all', key: null, vs: [] } }); },
    setProfile(patch: Partial<ProfileView>) { if (state.profile) set({ profile: { ...state.profile, ...patch } }); },
    discardGame(quiet = false) {
      const g = state.game; if (!g) return;
      const t = clock.now();
      persist({ ...g, game: { ...g.game, status: 'abandoned', updatedAt: t, deletedAt: t } });
      set({ bidBar: null, game: null, undo: [], sheet: null, screen: 'home', page: -1, edit: null });
      if (!quiet || anyScore(g)) toast('Partie verworfen');
    },
    /** Kurze Meldung (z. B. aus der Oberfläche) */
    notify(text: string) { toast(text); },
    /** Spieler löschen: verschwindet aus Auswahl und Liste, der Name bleibt im Verlauf */
    deletePlayer(id: string) {
      const p = state.players.find(x => x.id === id); if (!p) return;
      if ([state.game, ...state.parked].some(x => x && playsIn(x, id))) { toast(`${p.name} spielt gerade mit`); return; }
      const t = clock.now(), gone = { ...p, updatedAt: t, deletedAt: t };
      const selected = state.selected.filter(x => x !== id);
      writeLast(readLast().filter(x => x !== id));
      set({ players: state.players.filter(x => x.id !== id), formerPlayers: [...state.formerPlayers, gone], selected, screen: 'people', profile: null });
      repo.savePlayer(gone).catch(() => toast('Speichern auf dem Gerät nicht möglich'));
      toast(`${p.name} gelöscht`);
    },
    /** Spieler umbenennen (Name bleibt eindeutig) */
    renamePlayer(id: string, raw: string) {
      const name = raw.trim().slice(0, 18), p = state.players.find(x => x.id === id);
      if (!p || !name || name === p.name) return;
      if (state.players.some(x => x.id !== id && x.name.toLowerCase() === name.toLowerCase())) { toast(`${name} gibt es schon`); return; }
      const np = { ...p, name, updatedAt: clock.now() };
      const g = state.game && { ...state.game, players: state.game.players.map(x => (x.id === id ? { ...x, name } : x)) };
      set({ players: state.players.map(x => (x.id === id ? np : x)), game: g });
      repo.savePlayer(np).catch(() => toast('Speichern auf dem Gerät nicht möglich'));
    }
  };

  return {
    get, actions,
    subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
  };
}

export type Store = ReturnType<typeof createStore>;

let current: Store | null = null;
export function setAppStore(s: Store) { current = s; }
export function useApp(): AppState {
  const s = current!;
  return useSyncExternalStore(s.subscribe, s.get);
}
export const act = () => current!.actions;
