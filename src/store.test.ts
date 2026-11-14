import { describe, expect, it } from 'vitest';
import { createStore, type Prefs } from './store';
import type { Repo } from './db';
import type { Clock } from './lib/id';
import type { Player } from './model/types';
import type { GameState } from './game/engine';
import { endState, fieldOf, liveRounds, ranking, seated, totals, dealerOf, phaseIn, phaseAt, lowerSum, gebotOf, outOf, scoreOf, nextStep } from './game/engine';
import { TPL } from './test/fixtures';
import { GAMES } from './game/games';
import type { Result, Template } from './model/types';

function testClock(): Clock {
  let n = 0; let t = Date.UTC(2026, 0, 1);
  return { uid: () => 'id' + (++n), now: () => new Date(t += 1000).toISOString() };
}
/** Speicher im Arbeitsspeicher, merkt sich den zuletzt gespeicherten Stand */
const nextStepKind = (g: Parameters<typeof nextStep>[0]) => nextStep(g).kind;
function memPrefs(): Prefs { let last: string[] = []; return { getLast: () => last, setLast: ids => { last = ids; } }; }
function memRepo() {
  const players: Player[] = []; let saved: GameState | null = null; let saves = 0; const templates: Template[] = []; const results: Result[] = [];
  const repo: Repo = {
    saveResults: async r => { results.push(...r); }, loadHistory: async () => [],
    exportAll: async () => ({ app: 'punktezettel', version: 1, exportedAt: '', tables: {} }), importAll: async () => 0,
    loadEvents: async () => [], loadDeletedTemplateKeys: async () => [], saveEvent: async () => undefined, setGameEvent: async () => undefined, deleteGame: async () => undefined,
    loadTemplates: async () => templates, saveTemplate: async t => { const i = templates.findIndex(x => x.key === t.key); if (i >= 0) templates[i] = t; else templates.push(t); },
    loadPlayers: async () => players.filter(p => !p.deletedAt), savePlayer: async p => { const i = players.findIndex(x => x.id === p.id); if (i >= 0) players[i] = p; else players.push(p); },
    loadDeletedPlayers: async () => players.filter(p => !!p.deletedAt),
    loadRunningGame: async () => (saved && saved.game.status === 'running' ? saved : null),
    loadRunningGames: async () => (saved && saved.game.status === 'running' ? [saved] : []),
    saveGame: async s => { saved = s; saves++; }
  };
  return { repo, last: () => saved, saves: () => saves, templates, results };
}
async function setup(tplKey = 'free', names = ['Anna', 'Ben', 'Clara']) {
  const mem = memRepo(); const st = createStore(mem.repo, testClock(), memPrefs()); const a = st.actions;
  await a.init();
  a.pickTemplate(TPL[tplKey]);
  for (const n of names) await a.addPlayer(n);
  a.start();
  return { st, a, mem };
}
const type = (a: ReturnType<typeof createStore>['actions'], n: number) => String(n).split('').forEach(d => a.digit(+d));

describe('Ablauf einer Runde', () => {
  it('startet im Überblick und führt Spieler für Spieler zurück zum Überblick', async () => {
    const { st, a, mem } = await setup();
    expect(st.get().screen).toBe('game');
    expect(st.get().page).toBe(-1);
    a.roundGo();
    expect(st.get().page).toBe(0);
    type(a, 12); a.next();
    expect(st.get().page).toBe(1);
    type(a, 7); a.next();
    type(a, 30); a.next();
    expect(st.get().page).toBe(-1);
    expect(st.get().toast?.text).toBe('Runde 1 komplett');
    expect(totals(st.get().game!)).toEqual({ id1: 12, id2: 7, id3: 30 });
    expect(totals(mem.last()!)).toEqual({ id1: 12, id2: 7, id3: 30 });
  });

  it('legt die nächste Runde erst beim ersten Wert an', async () => {
    const { st, a } = await setup('free', ['A', 'B']);
    a.roundGo(); type(a, 1); a.next(); type(a, 2); a.next();
    a.roundGo();
    expect(st.get().edit?.ref).toBe('new');
    expect(liveRounds(st.get().game!)).toHaveLength(1);
    a.next(); // ohne Eingabe weiter
    expect(st.get().edit?.ref).toBe('new');
    type(a, 5);
    expect(liveRounds(st.get().game!)).toHaveLength(2);
  });

  it('Schnelltasten, Vorzeichen und Löschen wirken auf den Wert', async () => {
    const { st, a } = await setup('free', ['A']);
    a.roundGo();
    a.add(10); a.add(5); a.add(-1);
    expect(totals(st.get().game!).id1).toBe(14);
    a.sign();
    expect(totals(st.get().game!).id1).toBe(-14);
    a.back(); a.back();
    expect(st.get().edit?.buf).toBe('-');
    expect(totals(st.get().game!).id1).toBe(0);
  });

  it('ersetzt beim ersten Tippen einen vorhandenen Wert', async () => {
    const { st, a } = await setup('free', ['A']);
    const r0 = liveRounds(st.get().game!)[0].id;
    a.openPad(r0, 'id1'); type(a, 40); a.closePad();
    a.openPad(r0, 'id1'); type(a, 9);
    expect(totals(st.get().game!).id1).toBe(9);
  });
});

describe('Bearbeiten im Überblick', () => {
  it('Ziffernblock springt zum nächsten Spieler und schließt nach dem letzten', async () => {
    const { st, a } = await setup('free', ['A', 'B']);
    const r0 = liveRounds(st.get().game!)[0].id;
    a.openPad(r0, 'id1'); type(a, 3); a.next();
    expect(st.get().pad).toBe(true);
    expect(st.get().edit?.playerId).toBe('id2');
    type(a, 4); a.next();
    expect(st.get().pad).toBe(false);
    expect(st.get().page).toBe(-1);
    expect(liveRounds(st.get().game!)).toHaveLength(1);
  });
});

describe('Rückgängig', () => {
  it('nimmt eine Feld-Eingabe als Ganzes zurück', async () => {
    const { st, a } = await setup('free', ['A', 'B']);
    a.roundGo(); type(a, 123); a.next(); type(a, 5);
    expect(st.get().undo).toHaveLength(2);
    a.undo();
    expect(totals(st.get().game!)).toEqual({ id1: 123, id2: 0 });
    a.undo();
    expect(totals(st.get().game!)).toEqual({ id1: 0, id2: 0 });
    expect(st.get().undo).toHaveLength(0);
  });
  it('entfernt eine neu angelegte Runde wieder', async () => {
    const { st, a } = await setup('free', ['A']);
    a.roundGo(); type(a, 1); a.next();
    a.roundGo(); type(a, 2);
    expect(liveRounds(st.get().game!)).toHaveLength(2);
    a.undo();
    expect(liveRounds(st.get().game!)).toHaveLength(1);
    expect(st.get().edit?.ref).toBe('new');
  });
});

describe('Spieler', () => {
  it('ändert die Reihenfolge am Tisch und startet in dieser Reihenfolge', async () => {
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), memPrefs()); const a = st.actions;
    await a.init(); a.pickTemplate(TPL.free);
    for (const n of ['A', 'B', 'C']) await a.addPlayer(n);
    a.moveSelected(0, 2);
    expect(st.get().selected).toEqual(['id2', 'id3', 'id1']);
    a.moveSelected(2, 0); a.moveSelected(1, 1); a.moveSelected(5, 0);
    expect(st.get().selected).toEqual(['id1', 'id2', 'id3']);
    a.moveSelected(2, 1); a.start();
    expect(seated(st.get().game!).map(p => p.name)).toEqual(['A', 'C', 'B']);
  });
  it('erkennt Namen ohne Groß-/Kleinschreibung und vergibt feste Farben', async () => {
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), memPrefs()); const a = st.actions;
    await a.init(); a.pickTemplate(TPL.free);
    await a.addPlayer('Anna'); await a.addPlayer(' anna '); await a.addPlayer('Ben');
    expect(st.get().players.map(p => p.name)).toEqual(['Anna', 'Ben']);
    expect(st.get().players[0].color).not.toBe(st.get().players[1].color);
    a.start();
    expect(seated(st.get().game!).map(p => p.color)).toEqual(st.get().players.map(p => p.color));
  });
  it('merkt sich die letzte Auswahl für die nächste Partie', async () => {
    const { st, a } = await setup('free', ['A', 'B']);
    a.goHome(); a.pickTemplate(TPL.t500);
    expect(st.get().selected).toEqual(['id1', 'id2']);
  });
});

describe('Eigene Spiele bearbeiten und löschen', () => {
  it('ändert die Vorlage, behält den Schlüssel und lässt laufende Partien unberührt', async () => {
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), memPrefs()); const a = st.actions;
    await a.init(); a.openSetup(true); a.updateSetup({ name: 'Wohnzimmer' }); a.setupNext();
    await a.addPlayer('A'); a.start();
    const key = st.get().templates[0].key;
    a.goHome(); a.editTemplate(st.get().templates[0]);
    expect(st.get().setup.name).toBe('Wohnzimmer');
    a.updateSetup({ name: 'Küche', win: 'low' }); a.saveSetupHome();
    expect(st.get().templates[0]).toMatchObject({ key, name: 'Küche', win: 'low', version: 2 });
    expect(st.get().game!.game.rules).toMatchObject({ name: 'Wohnzimmer', win: 'high' });
    a.editTemplate(st.get().templates[0]); a.saveSetupHome();
    expect(st.get().templates[0].version).toBe(2);
  });
  it('löscht weich und legt die Vorlage beim Beenden nicht neu an', async () => {
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), memPrefs()); const a = st.actions;
    await a.init(); a.openSetup(true); a.updateSetup({ name: 'Garten' }); a.setupNext();
    await a.addPlayer('A'); a.start();
    a.roundGo(); a.add(5); a.next();
    const key = st.get().templates[0].key;
    a.goHome(); a.deleteTemplate(key);
    expect(st.get().templates).toHaveLength(0);
    expect(mem.templates[0].deletedAt).toBeTruthy();
    a.finishGame();
    expect(st.get().templates).toHaveLength(0);
    expect(st.get().history[0].name).toBe('Garten');
  });
});

describe('Notizfelder', () => {
  it('zählen nicht zur Summe, bleiben beim Ändern der Punkte erhalten und landen im Ergebnis', async () => {
    const { st, a, mem } = await setup('free', ['A', 'B']);
    a.setGameNotes(['Straße', ' ', 'Straße']);
    expect(st.get().game!.game.rules.params?.notes).toEqual(['Straße']);
    a.roundGo(); a.add(10);
    a.selectField('n:Straße'); a.digit(2); a.next();
    expect(st.get().edit?.field).toBeUndefined();
    a.digit(5);
    const g = st.get().game!, r = liveRounds(g)[0];
    expect(totals(g).id1).toBe(5);
    expect(fieldOf(g, r.id, 'id1', 'n:Straße')).toBe(2);
    a.next(); a.add(3); a.next();
    a.finishGame();
    expect(mem.results.find(x => x.playerId === 'id1')!.extra).toMatchObject({ 'n:Straße': 2 });
    expect(r).toBeTruthy();
  });
});

describe('Arschloch', () => {
  it('verteilt Rollen per Antippen, der Letzte bleibt automatisch übrig, erneutes Antippen nimmt heraus', async () => {
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), memPrefs()); const a = st.actions;
    await a.init(); a.openGame(GAMES.find(g => g.template.key === 'arschloch')!.template); a.toPlayers();
    for (const n of ['A', 'B', 'C']) await a.addPlayer(n);
    a.start();
    a.roundGo();
    expect(st.get().sheet).toBe('ranks');
    a.rankTap('id2'); a.rankTap('id1');
    expect(st.get().sheet).toBeNull();
    expect(totals(st.get().game!)).toEqual({ id1: 0, id2: 2, id3: -2 });
    a.roundGo(); a.rankTap('id3'); a.rankTap('id3');
    expect(st.get().sheet).toBe('ranks');
    a.rankTap('id1'); a.rankTap('id3');
    a.finishGame();
    const ex = Object.fromEntries(mem.results.map(r => [r.playerId, r.extra]));
    // Runde 1: B, A, C; Runde 2: A, C, B
    expect(ex.id2).toMatchObject({ praes: 1, arsch: 1, praesStreak: 1 });
    expect(ex.id1).toMatchObject({ praes: 1, arsch: 0 });
    expect(ex.id3).toMatchObject({ praes: 0, arsch: 1 });
  });  it('das Arschloch der letzten Runde gibt', async () => {
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), memPrefs()); const a = st.actions;
    await a.init(); a.openGame(GAMES.find(g => g.template.key === 'arschloch')!.template); a.toPlayers();
    for (const n of ['A', 'B', 'C', 'D']) await a.addPlayer(n);
    a.start();
    expect(dealerOf(st.get().game!)?.id).toBe('id1');
    a.roundGo(); a.rankTap('id3'); a.rankTap('id1'); a.rankTap('id4');
    expect(dealerOf(st.get().game!)?.id).toBe('id2');
    a.roundGo(); a.rankTap('id2'); a.rankTap('id1'); a.rankTap('id3');
    expect(dealerOf(st.get().game!)?.id).toBe('id4');
  });
});

describe('Kniffel im Block', () => {
  it('Feld antippen öffnet die Auswahl im Block; Chance mit Ziffernblock; danach sagt die App, wer dran ist', async () => {
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), { ...memPrefs(), getMode: () => 'block' as const }); const a = st.actions;
    await a.init(); a.openGame(GAMES.find(g => g.template.key === 'kniffel')!.template); a.toPlayers();
    for (const n of ['A', 'B']) await a.addPlayer(n);
    a.start();
    const rounds = liveRounds(st.get().game!), einser = rounds[0], chance = rounds[rounds.length - 1];
    a.openPad(einser.id, 'id1');
    expect(st.get()).toMatchObject({ sheet: 'catpick', pad: false, page: -1, edit: { playerId: 'id1' } });
    a.pick(3);
    expect(st.get()).toMatchObject({ sheet: null, edit: null, fromOverview: false });
    expect(st.get().toast?.text).toBe('B ist dran');
    a.openPad(chance.id, 'id2');
    expect(st.get()).toMatchObject({ sheet: null, pad: true });
    a.digit(2); a.digit(2); a.next();
    expect(st.get()).toMatchObject({ pad: false, edit: null });
    expect(totals(st.get().game!)).toEqual({ id1: 3, id2: 22 });
    expect(lowerSum(st.get().game!, 'id2')).toBe(22);
  });
});

describe('Binokel im Block', () => {
  async function binokel() {
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), { ...memPrefs(), getMode: () => 'block' as const }); const a = st.actions;
    await a.init(); a.openGame(GAMES.find(g => g.template.key === 'binokel')!.template); a.toPlayers();
    for (const n of ['A', 'B', 'C']) await a.addPlayer(n);
    a.start(); return { st, a };
  }
  it('Wer spielt mit Gebot, dann Meldungen und Stiche im Block; Verfehlt zählt das Gebot doppelt negativ', async () => {
    const { st, a } = await binokel();
    expect(dealerOf(st.get().game!)?.id).toBe('id1');
    a.roundGo();
    expect(st.get().sheet).toBe('bidder');
    a.setBidder('id2', 250);
    expect(st.get()).toMatchObject({ sheet: null, pad: true, edit: { playerId: 'id1', field: 'meld' } });
    a.add(20); a.next(); a.add(100); a.next(); a.add(40); a.next();
    expect(st.get().pad).toBe(false);
    a.roundGo();
    expect(st.get()).toMatchObject({ pad: true, edit: { playerId: 'id1', field: 'play' } });
    a.add(50); a.next();
    a.add(100); a.binokelOut(2);
    a.add(60); a.next();
    const g = st.get().game!, r = liveRounds(g)[0];
    expect(totals(g)).toEqual({ id1: 70, id2: -500, id3: 100 });
    expect(gebotOf(g, r.id)).toEqual({ playerId: 'id2', gebot: 250 });
    expect(outOf(g, r.id, 'id2')).toBe(2);
    expect(dealerOf(g)?.id).toBe('id2');
  });
  it('Abgehen schon bei den Meldungen; ohne Gebot geht es direkt zu den Meldungen', async () => {
    const { st, a } = await binokel();
    a.roundGo(); a.setBidder('id1', 200);
    a.binokelOut(1);
    expect(st.get().edit).toMatchObject({ playerId: 'id2', field: 'meld' });
    const g = st.get().game!, r = liveRounds(g)[0];
    expect(scoreOf(g, r.id, 'id1')).toBe(-200);
    expect(outOf(g, r.id, 'id1')).toBe(1);
    a.add(40); a.next(); a.add(20); a.next();
    a.roundGo(); expect(st.get().edit).toMatchObject({ playerId: 'id2', field: 'play' });
    a.add(80); a.next(); a.add(60); a.next();
    expect(totals(st.get().game!)).toEqual({ id1: -200, id2: 120, id3: 80 });
    a.roundGo(); expect(st.get().sheet).toBe('bidder');
    a.setBidder(null, null);
    expect(st.get()).toMatchObject({ sheet: null, pad: true, edit: { ref: 'new', field: 'meld' } });
  });
});

describe('Doppelkopf und Schafkopf im Block', () => {
  it('Doppelkopf zu fünft: der Geber setzt aus; Bock danach verdoppelt die nächsten Runden', async () => {
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), { ...memPrefs(), getMode: () => 'block' as const }); const a = st.actions;
    await a.init();
    const t = GAMES.find(g => g.template.key === 'doppelkopf')!.template;
    a.openGame({ ...t, params: { ...t.params, bock: true } }); a.toPlayers();
    for (const n of ['A', 'B', 'C', 'D', 'E']) await a.addPlayer(n);
    a.start(); a.roundGo();
    expect(st.get().sheet).toBe('deal');
    a.setDeal({ declarers: ['id2', 'id3'], kind: 0, value: 2, won: true, bockAdd: true });
    expect(totals(st.get().game!)).toEqual({ id1: 0, id2: 2, id3: 2, id4: -2, id5: -2 });
    a.roundGo(); a.setDeal({ declarers: ['id3'], kind: 1, value: 1, won: false });
    // Bockrunde: doppelt; Geber B setzt aus, Solo C verliert dreifach
    expect(totals(st.get().game!)).toEqual({ id1: 2, id2: 2, id3: -4, id4: 0, id5: 0 });
  });
  it('Schafkopf: Sauspiel mit Schneider, die Summe ist immer 0', async () => {
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), { ...memPrefs(), getMode: () => 'block' as const }); const a = st.actions;
    await a.init(); a.openGame(GAMES.find(g => g.template.key === 'schafkopf')!.template); a.toPlayers();
    for (const n of ['A', 'B', 'C', 'D']) await a.addPlayer(n);
    a.start(); a.roundGo(); a.setDeal({ declarers: ['id1', 'id4'], kind: 0, value: 20, won: false });
    const tt = totals(st.get().game!);
    expect(tt).toEqual({ id1: -20, id2: 20, id3: 20, id4: -20 });
    expect(Object.values(tt).reduce((x, y) => x + y, 0)).toBe(0);
  });
});

describe('Uno und Phase 10 im Block', () => {
  const blockPrefs = () => ({ ...memPrefs(), getMode: () => 'block' as const });
  it('Uno: Sieger wählen, nur er trägt im Block ein, dann zurück; Geber rotiert', async () => {
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), blockPrefs()); const a = st.actions;
    await a.init(); a.openGame(GAMES.find(g => g.template.key === 'uno')!.template); a.toPlayers();
    for (const n of ['A', 'B', 'C']) await a.addPlayer(n);
    a.start();
    expect(dealerOf(st.get().game!)?.id).toBe('id1');
    a.roundGo(); expect(st.get().sheet).toBe('winner');
    a.pickWinner('id2');
    expect(st.get()).toMatchObject({ pad: true, page: -1, edit: { playerId: 'id2' } });
    a.add(50); a.add(20); a.next();
    expect(st.get()).toMatchObject({ pad: false, edit: null, fromOverview: false });
    expect(totals(st.get().game!)).toEqual({ id1: 0, id2: 70, id3: 0 });
    expect(dealerOf(st.get().game!)?.id).toBe('id2');
  });
  it('Phase 10: im Block eintragen und Phase abhaken', async () => {
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), blockPrefs()); const a = st.actions;
    await a.init(); a.openGame(GAMES.find(g => g.template.key === 'phase10')!.template); a.toPlayers();
    for (const n of ['A', 'B']) await a.addPlayer(n);
    a.start(); a.roundGo();
    expect(st.get()).toMatchObject({ pad: true, edit: { playerId: 'id1' } });
    a.setValue(0); a.togglePhase(); a.next();
    a.add(25); a.next();
    const g = st.get().game!, r = liveRounds(g)[0];
    expect(phaseIn(g, r.id, 'id1')).toBe(true);
    expect(phaseIn(g, r.id, 'id2')).toBe(false);
    expect(phaseAt(g, 1, 'id1')).toBe(2);
    expect(phaseAt(g, 1, 'id2')).toBe(1);
  });
});

describe('Erstellungsmodus: Wertung, Nullsumme, eigene Tasten', () => {
  async function fresh() {
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), memPrefs()); const a = st.actions;
    await a.init(); return { mem, st, a };
  }
  it('Zwei Werte je Runde: Summe zählt', async () => {
    const { st, a } = await fresh();
    a.openSetup(true); a.updateSetup({ name: 'Tichu', kind: 'split', splitNames: ['Ansage', 'Karten'] }); a.setupNext();
    await a.addPlayer('A'); await a.addPlayer('B'); a.start();
    expect(st.get().game!.game.rules.params?.split?.map(f => f.label)).toEqual(['Ansage', 'Karten']);
    a.roundGo(); a.add(100); a.next(); a.add(-100); a.next();
    a.roundGo(); a.add(30); a.next(); a.add(70); a.next();
    // id1 ist die Vorlage, die Spieler beginnen bei id2
    expect(totals(st.get().game!)).toEqual({ id2: 130, id3: -30 });
  });
  it('Rang je Runde: Rollen wie bei Arschloch', async () => {
    const { st, a } = await fresh();
    a.openSetup(true); a.updateSetup({ name: 'Bohnanza', kind: 'rank' }); a.setupNext();
    for (const n of ['A', 'B', 'C']) await a.addPlayer(n);
    a.start();
    expect(st.get().game!.game.rules).toMatchObject({ scoring: 'rank', win: 'high', players: { min: 3 } });
    a.roundGo(); a.rankTap('id4'); a.rankTap('id2');
    expect(totals(st.get().game!)).toEqual({ id2: 0, id3: -2, id4: 2 });
  });
  it('Nullsumme mit Ausgleich und eigene Tasten bleiben beim Bearbeiten erhalten', async () => {
    const { st, a, mem } = await fresh();
    a.openSetup(true); a.updateSetup({ name: 'Skat-Liste', zeroSum: true, keys: [{ label: 'Grand', op: 'add', v: 24 }] }); a.saveNewTemplate();
    const t = mem.templates[0];
    expect(t.params).toMatchObject({ zeroSum: true, keys: [{ label: 'Grand', op: 'add', v: 24 }] });
    expect(st.get().setup).toMatchObject({ kind: 'points', zeroSum: true });
    a.updateSetup({ name: 'Skat' }); a.saveSetupHome();
    expect(mem.templates[0].params).toMatchObject({ zeroSum: true, keys: [{ label: 'Grand' }] });
  });
  it('Kopie von Wizard behält ihre Wertung beim Bearbeiten', async () => {
    const { st, a } = await fresh();
    a.customizeGame(GAMES.find(g => g.template.key === 'wizard')!.template);
    a.updateSetup({ name: 'Wizard Haus' }); a.saveSetupHome();
    expect(st.get().templates[0]).toMatchObject({ scoring: 'bids', name: 'Wizard Haus' });
  });
});

describe('Teams', () => {
  it('bildet Teams aus einzelnen Spielern; Mitglieder bekommen Platz und Punkte ihres Teams', async () => {
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), memPrefs()); const a = st.actions;
    await a.init(); a.pickTemplate(TPL.free);
    for (const n of ['Anna', 'Ben', 'Clara', 'Dora']) await a.addPlayer(n);
    a.setTeamMode(true);
    expect(st.get().teamOf).toEqual({ id1: 0, id2: 1, id3: 0, id4: 1 });
    a.start();
    const g = st.get().game!;
    expect(seated(g).map(p => p.name)).toEqual(['Anna & Clara', 'Ben & Dora']);
    a.roundGo(); a.add(30); a.next(); a.add(10); a.next();
    a.deletePlayer('id3');
    expect(st.get().toast?.text).toBe('Clara spielt gerade mit');
    a.finishGame();
    const r = Object.fromEntries(mem.results.map(x => [x.playerId, [x.place, x.total]]));
    expect(r).toEqual({ id1: [1, 30], id3: [1, 30], id2: [2, 10], id4: [2, 10] });
    expect(st.get().history[0].results).toHaveLength(4);
  });
  it('braucht mindestens zwei Teams; Spieler wechseln per Antippen', async () => {
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), memPrefs()); const a = st.actions;
    await a.init(); a.pickTemplate(TPL.free);
    for (const n of ['A', 'B']) await a.addPlayer(n);
    a.setTeamMode(true); a.cycleTeam('id2');
    a.start();
    expect(st.get().game).toBeNull();
    a.cycleTeam('id2'); a.addTeam(); a.start();
    expect(seated(st.get().game!).map(p => p.name)).toEqual(['A', 'B']);
  });
  it('mehr als zwei Teams und bei jedem Spiel, auch Kniffel', async () => {
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), memPrefs()); const a = st.actions;
    await a.init(); a.openGame(GAMES.find(g => g.template.key === 'kniffel')!.template); a.toPlayers();
    for (const n of ['A', 'B', 'C', 'D', 'E', 'F']) await a.addPlayer(n);
    a.setTeamMode(true); a.addTeam();
    expect(st.get().teamCount).toBe(3);
    expect(Object.values(st.get().teamOf)).toEqual([0, 1, 2, 0, 1, 2]);
    a.removeTeam(); a.removeTeam();
    expect(st.get().teamCount).toBe(2);
    a.addTeam(); a.start();
    expect(seated(st.get().game!).map(p => p.name)).toEqual(['A & D', 'B & E', 'C & F']);
    expect(st.get().game!.game.rules.scoring).toBe('categories');
  });
});

describe('Spieler löschen', () => {
  it('nicht während er mitspielt; danach weg aus Auswahl und Liste, Name bleibt im Verlauf', async () => {
    const { st, a, mem } = await setup('free', ['Anna', 'Ben']);
    a.roundGo(); a.add(5); a.next(); a.add(3); a.next();
    a.deletePlayer('id2');
    expect(st.get().players).toHaveLength(2);
    expect(st.get().toast?.text).toBe('Ben spielt gerade mit');
    a.finishGame();
    a.deletePlayer('id2');
    expect(st.get().players.map(p => p.name)).toEqual(['Anna']);
    expect(st.get().formerPlayers.map(p => p.name)).toEqual(['Ben']);
    expect(st.get().history[0].results.map(r => r.playerId)).toContain('id2');
    expect(mem.repo).toBeTruthy();
    a.pickTemplate(TPL.free);
    expect(st.get().selected).toEqual(['id1']);
  });
});

describe('Laufende Partie beim Neustart', () => {
  it('parkt die laufende Partie beim Neustart und setzt beide fort', async () => {
    const { st, a, mem } = await setup('free', ['A', 'B']);
    a.roundGo(); a.add(10); a.next(); a.add(5); a.next();
    const first = st.get().game!.game.id;
    a.goHome(); a.pickTemplate(TPL.t500); a.start();
    const second = st.get().game!.game.id;
    expect(second).not.toBe(first);
    expect(st.get().parked.map(x => x.game.id)).toEqual([first]);
    a.roundGo(); a.add(7); a.next();
    a.goHome(); a.resume(first);
    expect(st.get().game!.game.id).toBe(first);
    expect(st.get().parked.map(x => x.game.id)).toEqual([second]);
    expect(st.get().screen).toBe('game');
    expect(totals(st.get().game!).id1).toBe(10);
    a.finishGame();
    expect(st.get().history[0].id).toBe(first);
    expect(st.get().parked.map(x => x.game.id)).toEqual([second]);
    a.resume(second);
    expect(st.get().game!.game.id).toBe(second);
    expect(mem.saves()).toBeGreaterThan(0);
  });
  it('parkt auch eine Partie, in der nur ein Haken gesetzt ist', async () => {
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), memPrefs()); const a = st.actions;
    await a.init(); a.openGame(GAMES.find(g => g.template.key === 'phase10')!.template); a.toPlayers();
    await a.addPlayer('A'); await a.addPlayer('B'); a.start();
    a.roundGo(); a.togglePhase();
    a.goHome(); a.pickTemplate(TPL.free); a.start();
    expect(st.get().parked).toHaveLength(1);
  });
  it('verwirft eine leere laufende Partie beim Neustart, statt sie zu parken', async () => {
    const { st, a, mem } = await setup('free', ['A']);
    a.goHome(); a.pickTemplate(TPL.t500); a.start();
    expect(st.get().parked).toHaveLength(0);
    expect(st.get().game!.game.rules.key).toBe('t500');
    expect(mem.last()!.game.rules.key).toBe('t500');
  });
  it('benennt Spieler um, auch in der laufenden Partie', async () => {
    const { st, a } = await setup('free', ['Anna', 'Ben']);
    a.renamePlayer('id1', 'Anne');
    expect(st.get().players[0].name).toBe('Anne');
    expect(seated(st.get().game!)[0].name).toBe('Anne');
    a.renamePlayer('id2', 'anne');
    expect(st.get().players[1].name).toBe('Ben');
  });
});

describe('Ende', () => {
  it('bietet nach Erreichen des Ziels das Ergebnis an und beendet die Partie', async () => {
    const { st, a, mem } = await setup('t500', ['A', 'B']);
    a.roundGo(); type(a, 600); a.next(); type(a, 10); a.next();
    a.roundGo();
    expect(st.get().sheet).toBe('result');
    a.finishGame();
    expect(st.get().game).toBeNull();
    expect(mem.last()!.game.status).toBe('finished');
    expect(st.get().screen).toBe('home');
  });
  it('setzt beim Wechsel von Gewinner-Regel einen Rückgängig-Schritt', async () => {
    const { st, a } = await setup('free', ['A']);
    a.setWin('low');
    expect(st.get().game!.game.rules.win).toBe('low');
    a.undo();
    expect(st.get().game!.game.rules.win).toBe('high');
  });
});

describe('Freies Spiel', () => {
  async function fresh() {
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), memPrefs()); const a = st.actions;
    await a.init(); return { mem, st, a };
  }
  it('übernimmt Gewinner, Ende und Zählschritte in die Partie', async () => {
    const { st, a } = await fresh();
    a.openSetup();
    a.updateSetup({ name: 'Rommé bei Oma', win: 'low', end: { type: 'target', value: 300 }, steps: [10, 5, 25] });
    a.setupNext();
    expect(st.get().screen).toBe('players');
    await a.addPlayer('A'); a.start();
    const rules = st.get().game!.game.rules;
    expect(rules).toMatchObject({ name: 'Rommé bei Oma', win: 'low', end: { type: 'target', value: 300 }, custom: true });
    expect(rules.params?.steps).toEqual([5, 10, 25]);
  });
  it('speichert die Vorlage beim Start, wenn gewünscht', async () => {
    const { st, a, mem } = await fresh();
    a.openSetup(); a.updateSetup({ name: 'Mein Spiel', save: true }); a.setupNext();
    await a.addPlayer('A'); a.start();
    expect(st.get().templates.map(t => t.name)).toEqual(['Mein Spiel']);
    expect(mem.templates).toHaveLength(1);
    expect(mem.templates[0].lastUsedAt).toBeTruthy();
    expect(mem.templates[0].key).toBe(st.get().game!.game.rules.key);
  });
  it('Freies Spiel bleibt eine Einmal-Partie: keine Vorlage, aber im Verlauf', async () => {
    const { st, a, mem } = await fresh();
    a.openSetup(); a.setupNext();
    await a.addPlayer('A'); a.start();
    a.roundGo(); a.add(5); a.next();
    a.finishGame();
    expect(mem.templates).toHaveLength(0);
    expect(st.get().history).toHaveLength(1);
    expect(st.get().toast?.text).toBe('Partie gespeichert');
  });
  it('Eigene Endwertung: nur das Ergebnis, nach Platz gewertet', async () => {
    const { st, a, mem } = await fresh();
    a.openSetup(true, 'result'); a.updateSetup({ name: 'Azul', unit: 'Platz', notes: ['Reihen'] }); a.setupNext();
    await a.addPlayer('A'); await a.addPlayer('B'); a.start();
    const r = st.get().game!.game.rules;
    expect(r).toMatchObject({ win: 'low', end: { type: 'rounds', value: 1 }, params: { resultOnly: true, unit: 'Platz', notes: ['Reihen'] } });
    expect(r.params?.quick?.[0]).toMatchObject({ label: '1.', op: 'set', v: 1 });
    a.roundGo(); a.setValue(2); a.next(); a.setValue(1); a.next();
    expect(ranking(st.get().game!)[0].player.name).toBe('B');
    a.goHome(); a.editTemplate(mem.templates[0]);
    expect(st.get().setup).toMatchObject({ mode: 'result', unit: 'Platz' });
    a.updateSetup({ unit: 'Punkte', win: 'high' }); a.saveSetupHome();
    expect(st.get().templates[0]).toMatchObject({ win: 'high', params: { resultOnly: true, unit: 'Punkte' } });
    expect(st.get().templates[0].params?.quick).toBeUndefined();
  });
  it('Festes Spiel anpassen: Kopie mit eigenem Schlüssel, Regeln und Schnelltasten bleiben, Original unverändert', async () => {
    const { st, a, mem } = await fresh();
    const romme = GAMES.find(g => g.template.key === 'romme')!.template;
    a.customizeGame(romme);
    const c = st.get().templates[0];
    expect(c).toMatchObject({ name: 'Rommé eigen', custom: true, scoring: 'rounds', win: 'low', params: { base: 'romme' } });
    expect(c.key).not.toBe('romme');
    expect(st.get().setupEditing).toBe(true);
    a.updateSetup({ name: 'Rommé bei Oma', notes: ['Joker'] }); a.saveSetupHome();
    const saved = mem.templates.find(t => t.key === c.key)!;
    expect(saved).toMatchObject({ name: 'Rommé bei Oma', params: { base: 'romme', notes: ['Joker'] } });
    expect(saved.params?.quick?.[0]).toMatchObject({ label: 'Raus' });
    expect(romme.name).toBe('Rommé');
  });
  it('Kopie von Siedler behält Einheit und Schnelltasten', async () => {
    const { st, a } = await fresh();
    a.customizeGame(GAMES.find(g => g.template.key === 'siedler')!.template);
    a.updateSetup({ notes: ['Häfen'] }); a.saveSetupHome();
    expect(st.get().templates[0].params).toMatchObject({ resultOnly: true, unit: 'Siegpunkte', notes: ['Häfen'] });
    expect(st.get().templates[0].params?.quick?.length).toBeGreaterThan(0);
  });
  it('Eigene Vorlage erstellen speichert sofort, mit Notizfeldern', async () => {
    const { st, a, mem } = await fresh();
    a.openSetup(true); a.updateSetup({ name: 'Carcassonne', notes: ['Wiesen'] }); a.setupNext();
    await a.addPlayer('A'); a.start();
    expect(mem.templates[0]).toMatchObject({ name: 'Carcassonne', params: { notes: ['Wiesen'] } });
    expect(st.get().game!.game.rules.params?.notes).toEqual(['Wiesen']);
  });
  it('spielt eine gespeicherte Vorlage erneut mit demselben Schlüssel', async () => {
    const { st, a, mem } = await fresh();
    a.openSetup(true); a.updateSetup({ name: 'X' }); a.setupNext(); await a.addPlayer('A'); a.start();
    const key = st.get().game!.game.rules.key;
    a.finishGame();
    expect(st.get().toast?.text).toBe('Partie gespeichert');
    a.pickTemplate(st.get().templates[0]); a.start();
    expect(st.get().game!.game.rules.key).toBe(key);
    expect(mem.templates).toHaveLength(1);
  });
  it('führt von der Spielerauswahl zurück zu den Einstellungen, solange die Vorlage neu ist', async () => {
    const { st, a } = await fresh();
    a.openSetup(); a.setupNext(); a.playersBack();
    expect(st.get().screen).toBe('setup');
  });
});

describe('Feste Spiele', () => {
  it('Rommé im Block: Runde direkt im Block eintragen, Spieler für Spieler; Umschalten auf Einzelseiten', async () => {
    let mode = 'block';
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), { ...memPrefs(), getMode: () => mode as 'block', setMode: (_k, m) => { mode = m; } }); const a = st.actions;
    await a.init(); a.openGame(GAMES.find(g => g.template.key === 'romme')!.template); a.toPlayers();
    for (const n of ['A', 'B', 'C']) await a.addPlayer(n);
    a.start(); a.roundGo();
    expect(st.get()).toMatchObject({ pad: true, page: -1, edit: { playerId: 'id1' } });
    a.setValue(0); a.next();
    expect(st.get().edit?.playerId).toBe('id2');
    a.add(20); a.add(5); a.mul(2); a.next();
    a.add(10); a.next();
    expect(st.get().pad).toBe(false);
    expect(totals(st.get().game!)).toEqual({ id1: 0, id2: 50, id3: 10 });
    a.switchEntry('romme');
    expect(mode).toBe('simple');
    expect(st.get()).toMatchObject({ pad: false, page: 0 });
  });
  it('Wizard-Ansageleiste wandert nicht in die nächste Partie (Rommé)', async () => {
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), { ...memPrefs(), getMode: () => 'block' }); const a = st.actions;
    await a.init(); a.openGame(GAMES.find(g => g.template.key === 'wizard')!.template); a.toPlayers();
    for (const n of ['A', 'B', 'C']) await a.addPlayer(n);
    a.start(); a.roundGo();
    expect(st.get().bidBar).not.toBeNull();
    a.goHome(); a.openGame(GAMES.find(g => g.template.key === 'romme')!.template); a.start();
    expect(st.get().game!.game.rules.key).toBe('romme');
    expect(st.get().bidBar).toBeNull();
  });
  it('Rommé: Raus, Schnelltasten und ×2, Ende per Option, keine eigene Vorlage', async () => {
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), memPrefs()); const a = st.actions;
    await a.init();
    a.openGame(GAMES.find(g => g.template.key === 'romme')!.template);
    expect(st.get().screen).toBe('gamepage');
    a.setTemplateEnd({ type: 'target', value: 1000 });
    a.toPlayers(); await a.addPlayer('A'); await a.addPlayer('B');
    a.playersBack(); expect(st.get().screen).toBe('gamepage');
    a.start();
    const g = () => st.get().game!;
    expect(g().game.rules).toMatchObject({ key: 'romme', win: 'low', end: { type: 'target', value: 1000 } });
    a.roundGo(); a.setValue(0); a.next();
    a.add(20); a.add(5); a.mul(2); a.next();
    expect(totals(g())).toEqual({ id1: 0, id2: 50 });
    expect(st.get().page).toBe(-1);
    a.finishGame();
    expect(mem.templates).toHaveLength(0);
    expect(GAMES.find(g => g.template.key === 'romme')!.template.end).toEqual({ type: 'none' });
  });
  it('startet direkt mit den letzten Spielern', async () => {
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), memPrefs()); const a = st.actions;
    await a.init(); a.pickTemplate(TPL.free); await a.addPlayer('A'); await a.addPlayer('B'); a.start(); a.finishGame();
    a.openGame(GAMES.find(g => g.template.key === 'skyjo')!.template);
    expect(st.get().selected).toHaveLength(2);
    a.start();
    expect(st.get().game!.game.rules.key).toBe('skyjo');
  });
});

describe('Wizard', () => {
  async function wiz() {
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), memPrefs()); const a = st.actions;
    await a.init(); a.openGame(GAMES.find(g => g.template.key === 'wizard')!.template); a.toPlayers();
    for (const n of ['A', 'B', 'C']) await a.addPlayer(n);
    a.start();
    return { st, a };
  }
  it('legt 60 ÷ Spieler Runden an und startet im Überblick', async () => {
    const { st } = await wiz();
    expect(liveRounds(st.get().game!)).toHaveLength(20);
    expect(st.get().page).toBe(-1);
  });
  it('führt durch Ansagen, zurück zum Überblick, dann Stiche, und rechnet', async () => {
    const { st, a } = await wiz();
    a.roundGo();
    expect(st.get().page).toBe(1);            // B beginnt, A gibt
    expect(st.get().edit?.field).toBe('bid');
    a.pick(1); expect(st.get().page).toBe(2);
    a.pick(0); expect(st.get().page).toBe(0);
    a.pick(0);
    expect(st.get().page).toBe(-1);
    expect(st.get().toast?.text).toBe('Ansagen komplett');
    a.roundGo();
    expect(st.get().edit?.field).toBe('tricks');
    a.pick(1); a.pick(0); a.pick(0);
    expect(st.get().page).toBe(-1);
    expect(st.get().toast?.text).toBe('Runde 1 komplett');
    expect(totals(st.get().game!)).toEqual({ id1: 20, id2: 30, id3: 20 });
    a.roundGo();
    expect(st.get().page).toBe(2);            // Runde 2: B gibt, C beginnt
    expect(st.get().edit?.field).toBe('bid');
  });
  it('begrenzt Werte auf die Kartenzahl und erlaubt Korrektur über das Feld', async () => {
    const { st, a } = await wiz();
    a.roundGo(); a.digit(7);
    expect(st.get().edit?.buf).toBe('1');
    a.selectField('tricks'); a.digit(0);
    a.selectField('bid'); a.digit(0);
    expect(totals(st.get().game!).id2).toBe(20);
    a.undo();
    expect(totals(st.get().game!).id2).toBe(-10);
  });
  it('öffnet beim Antippen einer Zelle die Spielerseite statt des Ziffernblocks', async () => {
    const { st, a } = await wiz();
    a.openPad(liveRounds(st.get().game!)[0].id, 'id3');
    expect(st.get().pad).toBe(false);
    expect(st.get().page).toBe(2);
  });
});

describe('Weitere Spiele', () => {
  async function play(key: string, names = ['A', 'B', 'C'], end?: Template['end']) {
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), memPrefs()); const a = st.actions;
    await a.init(); a.openGame(GAMES.find(g => g.template.key === key)!.template); if (end) a.setTemplateEnd(end); a.toPlayers();
    for (const n of names) await a.addPlayer(n);
    a.start();
    return { st, a };
  }
  it('Binokel: erst alle Meldungen, dann Stiche; Rundenwert ist die Summe', async () => {
    const { st, a } = await play('binokel');
    a.roundGo();
    expect(st.get().edit).toMatchObject({ field: 'meld', playerId: 'id1' });
    a.add(40); a.next(); a.add(20); a.next(); a.next();
    expect(st.get().page).toBe(-1);
    a.roundGo();
    expect(st.get().edit).toMatchObject({ field: 'play', playerId: 'id1' });
    a.add(50); a.add(50); a.next(); a.add(20); a.next(); a.digit(3); a.digit(0); a.digit(0); a.mul(-2); a.next();
    const g = st.get().game!;
    expect(totals(g)).toEqual({ id1: 140, id2: 40, id3: -600 });
    expect(liveRounds(g)).toHaveLength(1);
  });
  it('Schafkopf: Ausgleich ergänzt die Runde zu 0', async () => {
    const { st, a } = await play('schafkopf', ['A', 'B', 'C', 'D']);
    a.roundGo(); a.add(20); a.next(); a.add(20); a.next(); a.add(-20); a.next(); a.rest(); a.next();
    expect(totals(st.get().game!)).toEqual({ id1: 20, id2: 20, id3: -20, id4: -20 });
  });
  it('alle festen Spiele haben eindeutige Schlüssel und gültige Spielerzahlen', () => {
    const keys = GAMES.map(g => g.template.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const g of GAMES) expect(g.template.players.min).toBeLessThanOrEqual(g.template.players.max);
  });
  it('Monopoly: nur Platzierung, eine Eingabe je Spieler, dann Ergebnis', async () => {
    const { st, a } = await play('monopoly');
    expect(liveRounds(st.get().game!)).toHaveLength(1);
    a.roundGo(); a.setValue(2); a.next(); a.setValue(1); a.next(); a.setValue(3); a.next();
    expect(st.get().toast?.text).toBe('Ergebnis komplett');
    expect(ranking(st.get().game!).map(r => r.player.name)).toEqual(['B', 'A', 'C']);
    expect(endState(st.get().game!)?.done).toBe(true);
    a.roundGo();
    expect(st.get().sheet).toBe('result');
  });
  it('Siedler: höchste Siegpunkte gewinnen', async () => {
    const { st, a } = await play('siedler');
    a.roundGo(); a.setValue(10); a.next(); a.add(2); a.add(2); a.add(1); a.next(); a.digit(7); a.next();
    expect(totals(st.get().game!)).toEqual({ id1: 10, id2: 5, id3: 7 });
    expect(ranking(st.get().game!)[0].player.name).toBe('A');
  });
  it('Monopoly: Plätze per Antippen, der letzte ergibt sich, nochmal tippen nimmt zurück', async () => {
    const { st, a } = await play('monopoly', ['A', 'B', 'C', 'D']);
    const r = () => liveRounds(st.get().game!)[0].id, pl = (id: string) => scoreOf(st.get().game!, r(), id);
    a.placeTap('id2'); a.placeTap('id4');
    expect([pl('id1'), pl('id2'), pl('id3'), pl('id4')]).toEqual([null, 1, null, 2]);
    a.placeTap('id1');
    expect([pl('id1'), pl('id3')]).toEqual([3, 4]);
    expect(nextStepKind(st.get().game!)).toBe('result');
    a.placeTap('id4');
    expect([pl('id1'), pl('id2'), pl('id3'), pl('id4')]).toEqual([2, 1, 3, null]);
    a.undo();
    expect(pl('id4')).toBe(2);
    expect(ranking(st.get().game!)[0].player.name).toBe('B');
  });
  it('Uno endet bei 500, Scrabble rechnet mit ×3', async () => {
    const u = await play('uno', ['A', 'B'], { type: 'target', value: 500 });
    u.a.roundGo();
    expect(u.st.get().sheet).toBe('winner');
    u.a.pickWinner('id1');
    expect(u.st.get().edit?.playerId).toBe('id1');
    u.a.digit(5); u.a.digit(0); u.a.digit(0); u.a.next();
    expect(u.st.get().page).toBe(-1);
    expect(totals(u.st.get().game!)).toEqual({ id1: 500, id2: 0 });
    expect(endState(u.st.get().game!)?.done).toBe(true);
    const s = await play('scrabble', ['A', 'B']);
    s.a.roundGo(); s.a.add(10); s.a.add(1); s.a.add(1); s.a.mul(3);
    expect(totals(s.st.get().game!).id1).toBe(36);
  });
});

describe('Verlauf und Statistik', () => {
  it('speichert beim Beenden Platz und Endpunktzahl je Spieler samt Serie', async () => {
    const { st, a, mem } = await setup('free', ['A', 'B']);
    a.roundGo(); a.add(10); a.next(); a.add(5); a.next();
    const ev = a.createEvent('Urlaub')!;
    a.finishGame(ev.id);
    expect(mem.results.map(r => [r.playerId, r.place, r.total])).toEqual([['id1', 1, 10], ['id2', 2, 5]]);
    expect(st.get().history).toHaveLength(1);
    expect(st.get().history[0]).toMatchObject({ occasion: 'Urlaub', results: [{ playerId: 'id1', place: 1 }, { playerId: 'id2', place: 2 }] });
    expect(mem.last()!.game.eventId).toBe(ev.id);
    a.updateEvent(ev.id, { name: 'Südamerika 2026', points: [5, 3, 1] });
    expect(st.get().history[0].occasion).toBe('Südamerika 2026');
    expect(st.get().events[0].points).toEqual([5, 3, 1]);
    a.setGameEvent(st.get().history[0].id, null);
    expect(st.get().history[0]).toMatchObject({ eventId: null, occasion: null });
  });
  it('speichert keine Ergebnisse für eine Partie ohne Punkte', async () => {
    const { st, a, mem } = await setup('free', ['A']);
    a.finishGame();
    expect(mem.results).toHaveLength(0);
    expect(st.get().history).toHaveLength(0);
  });
  it('Wizard: merkt sich getroffene Ansagen für die Statistik', async () => {
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), memPrefs()); const a = st.actions;
    await a.init(); a.openGame(GAMES.find(g => g.template.key === 'wizard')!.template); a.toPlayers();
    for (const n of ['A', 'B', 'C']) await a.addPlayer(n);
    a.start(); a.roundGo(); a.pick(1); a.pick(0); a.pick(0); a.roundGo(); a.pick(1); a.pick(0); a.pick(1);
    a.finishGame();
    const ex = Object.fromEntries(mem.results.map(r => [r.playerId, r.extra]));
    expect(ex.id2).toEqual({ rounds: 1, hits: 1, rn: 1 });
    expect(ex.id1).toEqual({ rounds: 1, hits: 0, rn: 1 });
  });
  it('öffnet Profil und setzt Filter', async () => {
    const { st, a } = await setup('free', ['A', 'B']);
    a.openProfile('id1'); a.setProfile({ time: '30', vs: ['id2'] });
    expect(st.get().screen).toBe('profile');
    expect(st.get().profile).toMatchObject({ id: 'id1', time: '30', vs: ['id2'] });
    a.openTab('history');
    expect(st.get().profile).toBeNull();
  });
});
