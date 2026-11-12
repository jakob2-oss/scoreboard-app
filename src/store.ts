import { useSyncExternalStore } from 'react';
import type { Category, GameEvent, Player, Result, Template } from './model/types';
import { type HistGame, type SeriesSort, type TimeFilter } from './game/stats';
import { configOf, defaultFreeConfig, makeFreeTemplate, updateFreeTemplate, type FreeConfig } from './game/templates';
import { realClock, type Clock } from './lib/id';
import { gameDef } from './game/games';
import { PLAYER_COLORS, pastel } from './lib/color';
import {
  notesOf, noteKey, isNoteField, setNotes, upperSum, bidPhase, fieldsOf, hasFields, isSplit, fieldLabel, restOf, addRound, addCategory, isCats, phaseIn, removeCategory, setPhase, anyScore, ranking, createGame, isResultOnly, fieldOf, inputOrder, isBids, setField, defaultRef, finish, liveRounds, nextStep, restore, roundFull, roundNumber, scoreOf, seated, setScore, setWin,
  type BidField, type GameState, type RoundRef
} from './game/engine';
import type { Repo } from './db';

export type Screen = 'home' | 'history' | 'people' | 'profile' | 'setup' | 'gamepage' | 'players' | 'game' | 'series';

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
  sheet: 'menu' | 'result' | 'cats' | 'notes' | null;
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
  /** Gelöschte eigene Spiele */
  goneKeys: string[];
  /** Kniffel: Feld wurde aus dem Überblick geöffnet, danach dorthin zurück */
  fromOverview: boolean;
  /** Neue Partie soll starten, obwohl eine mit Punkten läuft */
  confirmStart: boolean;
}

const initial: AppState = {
  ready: false, screen: 'home', players: [], template: null, pendingSave: false, templates: [], setup: defaultFreeConfig(), selected: [], game: null, undo: [],
  page: -1, edit: null, pad: false, sheet: null, toast: null, history: [], profile: null, detail: null,
  events: [], histTab: 'games', series: null, editKey: null, setupTemplate: false, goneKeys: [], fromOverview: false, confirmStart: false
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
      const ng = setField(base.state, base.roundId, edit.playerId, edit.field, value, clock);
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

  const actions = {
    async init() {
      try {
        const [loaded, game, templates, hist0, ev0] = await Promise.all([repo.loadPlayers(), repo.loadRunningGame(), repo.loadTemplates(), repo.loadHistory(), repo.loadEvents()]);
        const goneKeys = await repo.loadDeletedTemplateKeys();
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
        const g = game && { ...game, players: game.players.map(p => ({ ...p, color: pastel(p.color) })) };
        set({ ready: true, players, game: g, templates, history: named(history, templates), events, goneKeys });
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
    openSetup(asTemplate = false) { set({ setup: { ...defaultFreeConfig(), save: asTemplate }, screen: 'setup', editKey: null, setupTemplate: asTemplate }); },
    /** Eigenes Spiel öffnen: Einstellungen ansehen, ändern, löschen oder spielen */
    editTemplate(t: Template) {
      const known = new Set(state.players.map(p => p.id));
      set({ setup: configOf(t), screen: 'setup', editKey: t.key, setupTemplate: true, template: t, pendingSave: false, selected: readLast().filter(id => known.has(id)) });
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
      set({ template: structuredClone(t), pendingSave: false, selected: readLast().filter(id => known.has(id)), screen: 'gamepage' });
    },
    setTemplateEnd(end: Template['end']) { if (state.template) set({ template: { ...state.template, end } }); },
    toPlayers() { set({ screen: 'players' }); },

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
    /** Neue Partie starten. Läuft noch eine mit Punkten, wird erst gefragt: speichern oder verwerfen. */
    start(old?: 'save' | 'discard') {
      const t = state.template; if (!t) return;
      const chosen = state.selected.map(id => state.players.find(p => p.id === id)).filter((p): p is Player => !!p);
      if (chosen.length < t.players.min || chosen.length > t.players.max) return;
      const running = state.game;
      if (running && anyScore(running) && !old) { set({ confirmStart: true }); return; }
      set({ confirmStart: false });
      if (running) { if (old === 'save') actions.finishGame(); else actions.discardGame(true); }
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
    goPage(i: number, ref?: RoundRef, field?: BidField) {
      const g = state.game; if (!g) return;
      if (i < 0) { set({ page: -1, edit: null }); return; }
      const p = seated(g)[i]; if (!p) return;
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
    /** Notizfelder der laufenden Partie festlegen */
    setGameNotes(labels: string[]) {
      const g = state.game; if (!g) return;
      const ng = setNotes(g, labels, clock);
      set({ game: ng, undo: [...state.undo.slice(-99), g] }); persist(ng);
    },
    /** Phase 10: Haken „Phase geschafft“ umschalten */
    togglePhase() {
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
      actions.goPage(step.playerIndex, step.ref, step.field);
    },
    /** Weiter: nächster Spieler derselben Runde, nach dem letzten zurück zum Überblick. */
    next() {
      // Zweiteilige Runde: leere Meldung zählt als 0
      const e0 = state.edit, g0 = state.game;
      if (g0 && e0 && isSplit(g0) && e0.field === fieldsOf(g0)![0].key && numOf(e0.buf) === null) writeBuf({ ...e0, buf: '0', fresh: true });
      const g = state.game, e = state.edit; if (!g || !e) return;
      // Notizfeld: zurück zum Punktefeld desselben Spielers
      if (isNoteField(e.field)) { set({ edit: makeEdit(g, e.ref, e.playerId) }); return; }
      const players = seated(g), i = players.findIndex(p => p.id === e.playerId);
      if (e.field && e.ref !== 'new') {
        const order = inputOrder(g, e.ref), pos = order.indexOf(i);
        if (pos < order.length - 1) { actions.goPage(order[pos + 1], e.ref, e.field); return; }
        const fs = fieldsOf(g)!, full = roundFull(g, e.ref), firstDone = bidPhase(g, e.ref) === fs[1].key;
        set({ page: -1, edit: null });
        if (full) toast(`Runde ${roundNumber(g, e.ref)} komplett`);
        else if (e.field === fs[0].key && firstDone) toast(`${fieldLabel(g, fs[0].key, true)} komplett`);
        return;
      }
      // Kniffel: jeder trägt in ein Feld seiner Wahl ein, dann ist der Nächste dran
      if (isCats(g) && !state.pad) {
        if (state.fromOverview) { set({ page: -1, edit: null, fromOverview: false }); return; }
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
      if (hasFields(g)) { actions.goPage(seated(g).findIndex(p => p.id === playerId), ref); return; }
      // Kniffel: Auswahl auf der Spielerseite, danach zurück zum Überblick
      if (isCats(g)) { actions.goPage(seated(g).findIndex(p => p.id === playerId), ref); set({ fromOverview: true }); return; }
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
      const restored = restore(g, prev, clock);
      const e = state.edit;
      const ref = e && e.ref !== 'new' && !liveRounds(restored).some(r => r.id === e.ref) ? 'new' : e?.ref;
      set({ game: restored, undo: state.undo.slice(0, -1), edit: e && ref ? makeEdit(restored, ref, e.playerId, e.field) : null });
      persist(restored);
      toast('Rückgängig gemacht');
    },

    // ---------- Menü & Ergebnis
    openSheet(sheet: 'menu' | 'result' | 'cats' | 'notes') { set({ sheet, pad: false }); },
    closeSheet() { set({ sheet: null }); },
    setWin(win: 'high' | 'low') {
      const g = state.game; if (!g || g.game.rules.win === win) return;
      const ng = setWin(g, win, clock);
      set({ game: ng, undo: [...state.undo, g] }); persist(ng);
    },
    /** Beenden und speichern. Eine noch nicht gespeicherte Vorlage wird automatisch gesichert. */
    /** Beenden und speichern: Platz und Endpunktzahl je Spieler landen im Verlauf. */
    finishGame(eventId: string | null = null) {
      const g = state.game; if (!g) return;
      const f0 = finish(g, clock);
      const ev = eventId ? state.events.find(e => e.id === eventId) : undefined;
      const f = ev ? { ...f0, game: { ...f0.game, eventId: ev.id } } : f0;
      persist(f);
      const t = clock.now(), rk = ranking(f);
      if (anyScore(f)) {
        const results: Result[] = rk.map(x => {
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
          if (isBids(f)) {
            const rounds = liveRounds(f).filter(r => fieldOf(f, r.id, x.player.id, 'tricks') !== null);
            extra = { ...extra, rounds: rounds.length, hits: rounds.filter(r => fieldOf(f, r.id, x.player.id, 'bid') === fieldOf(f, r.id, x.player.id, 'tricks')).length };
          }
          return { id: clock.uid(), createdAt: t, updatedAt: t, gameId: f.game.id, playerId: x.player.id, total: x.total, place: x.place, ...(extra ? { extra } : {}) };
        });
        repo.saveResults(results).catch(() => toast('Speichern auf dem Gerät nicht möglich'));
        const h: HistGame = { id: f.game.id, key: f.game.rules.key, name: f.game.rules.name, finishedAt: t, occasion: ev?.name ?? null, eventId: ev?.id ?? null,
          results: results.map(r => ({ playerId: r.playerId, total: r.total, place: r.place, extra: r.extra })) };
        set({ history: [h, ...state.history] });
        try { localStorage.setItem('pz:lastEvent', ev?.id ?? ''); } catch { /* egal */ }
      }
            // Freies Spiel ohne Vorlage bleibt eine Einmal-Partie (nur im Verlauf)
      const auto = false;
      set({ game: null, undo: [], sheet: null, screen: 'home', page: -1, edit: null });
      toast(auto ? 'Partie und Vorlage gespeichert' : 'Partie gespeichert');
    },
    // ---------- Verlauf und Spieler
    openTab(screen: 'home' | 'history' | 'people') { set({ screen, detail: null, profile: null, series: null }); },
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
    updateEvent(id: string, patch: Partial<Pick<GameEvent, 'name' | 'points'>>) {
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
    closeSeries() { set({ screen: 'history', histTab: 'series', series: null }); },
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
      set({ game: null, undo: [], sheet: null, screen: 'home', page: -1, edit: null });
      if (!quiet || anyScore(g)) toast('Partie verworfen');
    },
    cancelStart() { set({ confirmStart: false }); },
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
