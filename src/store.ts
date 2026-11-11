import { useSyncExternalStore } from 'react';
import type { Player, Template } from './model/types';
import { defaultFreeConfig, makeFreeTemplate, type FreeConfig } from './game/templates';
import { realClock, type Clock } from './lib/id';
import { PLAYER_COLORS } from './lib/color';
import {
  createGame, defaultRef, finish, liveRounds, nextStep, restore, roundFull, roundNumber, scoreOf, seated, setScore, setWin,
  type GameState, type RoundRef
} from './game/engine';
import type { Repo } from './db';

export type Screen = 'home' | 'setup' | 'players' | 'game';

/** Aktive Eingabe: Ziel (Runde × Spieler) und der Text im Ziffernblock. */
export interface Edit { ref: RoundRef; playerId: string; buf: string; fresh: boolean; dirty: boolean }

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
  sheet: 'menu' | 'result' | null;
  toast: { text: string; n: number } | null;
}

const initial: AppState = {
  ready: false, screen: 'home', players: [], template: null, pendingSave: false, templates: [], setup: defaultFreeConfig(), selected: [], game: null, undo: [],
  page: -1, edit: null, pad: false, sheet: null, toast: null
};

/** Kleine Einstellungen (letzte Spielerauswahl), austauschbar für Tests. */
export interface Prefs { getLast(): string[]; setLast(ids: string[]): void }
const LAST_KEY = 'pz:lastPlayers';
export const browserPrefs: Prefs = {
  getLast: () => { try { return JSON.parse(localStorage.getItem(LAST_KEY) || '[]'); } catch { return []; } },
  setLast: ids => { try { localStorage.setItem(LAST_KEY, JSON.stringify(ids)); } catch { /* privater Modus */ } }
};

export function createStore(repo: Repo, clock: Clock = realClock, prefs: Prefs = browserPrefs) {
  const readLast = prefs.getLast, writeLast = prefs.setLast;
  let state = initial;
  const listeners = new Set<() => void>();
  const set = (patch: Partial<AppState>) => { state = { ...state, ...patch }; listeners.forEach(l => l()); };
  const get = () => state;
  let toastN = 0;
  const toast = (text: string) => set({ toast: { text, n: ++toastN } });

  const persist = (g: GameState) => {
    repo.saveGame(g).catch(() => toast('Speichern auf dem Gerät nicht möglich'));
  };

  /** Vorlage speichern und in der Liste nach vorn holen */
  const saveTemplate = (t: Template) => {
    set({ templates: [t, ...state.templates.filter(x => x.key !== t.key)], pendingSave: false });
    repo.saveTemplate(t).catch(() => toast('Speichern auf dem Gerät nicht möglich'));
  };

  const numOf = (buf: string): number | null => (buf === '' || buf === '-' ? null : parseInt(buf, 10));
  const valueAt = (g: GameState, ref: RoundRef, playerId: string) => (ref === 'new' ? null : scoreOf(g, ref, playerId));
  const makeEdit = (g: GameState, ref: RoundRef, playerId: string): Edit => {
    const v = valueAt(g, ref, playerId);
    return { ref, playerId, buf: v === null ? '' : String(v), fresh: v !== null, dirty: false };
  };

  /** Ziffernblock-Text übernehmen: sofort speichern, ein Rückgängig-Schritt pro Feld. */
  const writeBuf = (edit: Edit) => {
    const g = state.game; if (!g) return;
    const value = numOf(edit.buf);
    if (edit.ref === 'new' && value === null) { set({ edit }); return; }
    const undo = edit.dirty ? state.undo : [...state.undo.slice(-99), g];
    const r = setScore(g, edit.ref, edit.playerId, value, clock);
    const next: Edit = { ...edit, dirty: true, ref: r.roundId ?? edit.ref };
    set({ game: r.state, undo, edit: next });
    persist(r.state);
  };

  const actions = {
    async init() {
      try {
        const [players, game, templates] = await Promise.all([repo.loadPlayers(), repo.loadRunningGame(), repo.loadTemplates()]);
        set({ ready: true, players, game, templates });
      } catch {
        set({ ready: true });
        toast('Gerätespeicher nicht verfügbar – Daten gehen beim Schließen verloren');
      }
    },
    goHome() { set({ screen: 'home', pad: false, sheet: null, edit: null }); },

    // ---------- Freies Spiel einrichten
    openSetup() { set({ setup: defaultFreeConfig(), screen: 'setup' }); },
    updateSetup(patch: Partial<FreeConfig>) { set({ setup: { ...state.setup, ...patch } }); },
    /** Einstellungen übernehmen und weiter zur Spielerauswahl */
    setupNext() {
      const known = new Set(state.players.map(p => p.id));
      set({ template: makeFreeTemplate(state.setup, clock), pendingSave: state.setup.save, selected: readLast().filter(id => known.has(id)), screen: 'players' });
    },
    playersBack() { set({ screen: state.pendingSave || !state.templates.some(t => t.key === state.template?.key) ? 'setup' : 'home' }); },

    // ---------- Spieler wählen
    pickTemplate(t: Template) {
      const known = new Set(state.players.map(p => p.id));
      set({ template: t, pendingSave: false, selected: readLast().filter(id => known.has(id)), screen: 'players' });
    },
    /** Reihenfolge am Tisch ändern (Drag-and-drop) */
    moveSelected(from: number, to: number) {
      const sel = [...state.selected];
      if (from < 0 || from >= sel.length || to < 0 || to >= sel.length || from === to) return;
      const [x] = sel.splice(from, 1); sel.splice(to, 0, x);
      set({ selected: sel });
    },
    toggleSelect(id: string) {
      const sel = state.selected.includes(id) ? state.selected.filter(x => x !== id) : [...state.selected, id];
      set({ selected: sel });
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
    start() {
      const t = state.template; if (!t) return;
      const chosen = state.selected.map(id => state.players.find(p => p.id === id)).filter((p): p is Player => !!p);
      if (chosen.length < t.players.min || chosen.length > t.players.max) return;
      writeLast(state.selected);
      // Vorlage merken bzw. als zuletzt gespielt markieren
      const known = state.templates.some(x => x.key === t.key);
      if (known || state.pendingSave) saveTemplate({ ...t, lastUsedAt: clock.now(), updatedAt: clock.now() });
      const g = createGame(t, chosen, clock);
      set({ game: g, undo: [], screen: 'game', page: -1, edit: null, pad: false, sheet: null });
      persist(g);
    },
    resume() { if (state.game) set({ screen: 'game', page: -1, edit: null, pad: false, sheet: null }); },

    // ---------- Navigation in der Partie
    /** Seite wechseln; optional mit festem Ziel (Runde), sonst Standardziel des Spielers. */
    goPage(i: number, ref?: RoundRef) {
      const g = state.game; if (!g) return;
      if (i < 0) { set({ page: -1, edit: null }); return; }
      const p = seated(g)[i]; if (!p) return;
      set({ page: i, pad: false, edit: makeEdit(g, ref ?? defaultRef(g, p.id), p.id) });
    },
    selectRef(ref: RoundRef) {
      const g = state.game, e = state.edit; if (!g || !e) return;
      set({ edit: makeEdit(g, ref, e.playerId) });
    },
    /** Knopf im Überblick: zum nächsten offenen Feld */
    roundGo() {
      const g = state.game; if (!g) return;
      const step = nextStep(g);
      if (step.kind === 'result') { set({ sheet: 'result' }); return; }
      actions.goPage(step.playerIndex, step.ref);
    },
    /** Weiter: nächster Spieler derselben Runde, nach dem letzten zurück zum Überblick. */
    next() {
      const g = state.game, e = state.edit; if (!g || !e) return;
      const players = seated(g), i = players.findIndex(p => p.id === e.playerId);
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
      if (done) toast(`Runde ${no} komplett`);
    },
    openPad(ref: string, playerId: string) {
      const g = state.game; if (!g) return;
      set({ pad: true, edit: makeEdit(g, ref, playerId) });
    },
    closePad() { set({ pad: false, edit: null }); },

    // ---------- Ziffernblock
    digit(d: number) {
      const e = state.edit; if (!e) return;
      let buf = e.fresh ? (e.buf.startsWith('-') ? '-' : '') : e.buf;
      if (buf.replace('-', '').length >= 6) return;
      buf = (buf === '0' ? '' : buf === '-0' ? '-' : buf) + d;
      writeBuf({ ...e, buf, fresh: false });
    },
    add(n: number) { const e = state.edit; if (!e) return; writeBuf({ ...e, buf: String((numOf(e.buf) ?? 0) + n), fresh: false }); },
    sign() { const e = state.edit; if (!e) return; writeBuf({ ...e, buf: e.buf.startsWith('-') ? e.buf.slice(1) : '-' + e.buf, fresh: false }); },
    back() { const e = state.edit; if (!e) return; writeBuf({ ...e, buf: e.fresh ? '' : e.buf.slice(0, -1), fresh: false }); },
    clear() { const e = state.edit; if (!e) return; writeBuf({ ...e, buf: '', fresh: false }); },

    undo() {
      const g = state.game; if (!g || !state.undo.length) return;
      const prev = state.undo[state.undo.length - 1];
      const restored = restore(g, prev, clock);
      const e = state.edit;
      const ref = e && e.ref !== 'new' && !liveRounds(restored).some(r => r.id === e.ref) ? 'new' : e?.ref;
      set({ game: restored, undo: state.undo.slice(0, -1), edit: e && ref ? makeEdit(restored, ref, e.playerId) : null });
      persist(restored);
      toast('Rückgängig gemacht');
    },

    // ---------- Menü & Ergebnis
    openSheet(sheet: 'menu' | 'result') { set({ sheet, pad: false }); },
    closeSheet() { set({ sheet: null }); },
    setWin(win: 'high' | 'low') {
      const g = state.game; if (!g || g.game.rules.win === win) return;
      const ng = setWin(g, win, clock);
      set({ game: ng, undo: [...state.undo, g] }); persist(ng);
    },
    /** Beenden und speichern. Eine noch nicht gespeicherte Vorlage wird automatisch gesichert. */
    finishGame() {
      const g = state.game; if (!g) return;
      const f = finish(g, clock); persist(f);
      const rules = g.game.rules;
      const auto = rules.custom && !state.templates.some(t => t.key === rules.key);
      if (auto) saveTemplate({ ...rules, lastUsedAt: clock.now(), updatedAt: clock.now() });
      set({ game: null, undo: [], sheet: null, screen: 'home', page: -1, edit: null });
      toast(auto ? 'Partie und Vorlage gespeichert' : 'Partie gespeichert');
    },
    discardGame() {
      const g = state.game; if (!g) return;
      const t = clock.now();
      persist({ ...g, game: { ...g.game, status: 'abandoned', updatedAt: t, deletedAt: t } });
      set({ game: null, undo: [], sheet: null, screen: 'home', page: -1, edit: null });
      toast('Partie verworfen');
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
