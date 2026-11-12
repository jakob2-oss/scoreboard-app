import { describe, expect, it } from 'vitest';
import { createStore, type Prefs } from './store';
import type { Repo } from './db';
import type { Clock } from './lib/id';
import type { Player } from './model/types';
import type { GameState } from './game/engine';
import { endState, liveRounds, ranking, seated, totals } from './game/engine';
import { TPL } from './test/fixtures';
import { GAMES } from './game/games';
import type { Result, Template } from './model/types';

function testClock(): Clock {
  let n = 0; let t = Date.UTC(2026, 0, 1);
  return { uid: () => 'id' + (++n), now: () => new Date(t += 1000).toISOString() };
}
/** Speicher im Arbeitsspeicher, merkt sich den zuletzt gespeicherten Stand */
function memPrefs(): Prefs { let last: string[] = []; return { getLast: () => last, setLast: ids => { last = ids; } }; }
function memRepo() {
  const players: Player[] = []; let saved: GameState | null = null; let saves = 0; const templates: Template[] = []; const results: Result[] = [];
  const repo: Repo = {
    saveResults: async r => { results.push(...r); }, loadHistory: async () => [],
    loadTemplates: async () => templates, saveTemplate: async t => { const i = templates.findIndex(x => x.key === t.key); if (i >= 0) templates[i] = t; else templates.push(t); },
    loadPlayers: async () => players, savePlayer: async p => { players.push(p); },
    loadRunningGame: async () => (saved && saved.game.status === 'running' ? saved : null),
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
  it('speichert die Vorlage spätestens beim Beenden automatisch', async () => {
    const { st, a, mem } = await fresh();
    a.openSetup(); a.updateSetup({ save: false }); a.setupNext();
    await a.addPlayer('A'); a.start();
    expect(mem.templates).toHaveLength(0);
    a.finishGame();
    expect(mem.templates).toHaveLength(1);
    expect(mem.templates[0].name).toMatch(/^Freies Spiel vom /);
    expect(st.get().toast?.text).toBe('Partie und Vorlage gespeichert');
  });
  it('spielt eine gespeicherte Vorlage erneut mit demselben Schlüssel', async () => {
    const { st, a, mem } = await fresh();
    a.openSetup(); a.updateSetup({ name: 'X' }); a.setupNext(); await a.addPlayer('A'); a.start();
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
    expect(GAMES.find(g => g.template.key === 'romme')!.template.end).toEqual({ type: 'target', value: 500 });
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
  async function play(key: string, names = ['A', 'B', 'C']) {
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), memPrefs()); const a = st.actions;
    await a.init(); a.openGame(GAMES.find(g => g.template.key === key)!.template); a.toPlayers();
    for (const n of names) await a.addPlayer(n);
    a.start();
    return { st, a };
  }
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
  it('Uno endet bei 500, Scrabble rechnet mit ×3', async () => {
    const u = await play('uno', ['A', 'B']);
    u.a.roundGo(); u.a.digit(5); u.a.digit(0); u.a.digit(0); u.a.next(); u.a.digit(0); u.a.next();
    expect(endState(u.st.get().game!)?.done).toBe(true);
    const s = await play('scrabble', ['A', 'B']);
    s.a.roundGo(); s.a.add(10); s.a.add(1); s.a.add(1); s.a.mul(3);
    expect(totals(s.st.get().game!).id1).toBe(36);
  });
});

describe('Verlauf und Statistik', () => {
  it('speichert beim Beenden Platz und Endpunktzahl je Spieler samt Anlass', async () => {
    const { st, a, mem } = await setup('free', ['A', 'B']);
    a.roundGo(); a.add(10); a.next(); a.add(5); a.next();
    a.finishGame('Urlaub');
    expect(mem.results.map(r => [r.playerId, r.place, r.total])).toEqual([['id1', 1, 10], ['id2', 2, 5]]);
    expect(st.get().history).toHaveLength(1);
    expect(st.get().history[0]).toMatchObject({ occasion: 'Urlaub', results: [{ playerId: 'id1', place: 1 }, { playerId: 'id2', place: 2 }] });
    expect(mem.last()!.game.place).toBe('Urlaub');
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
    expect(ex.id2).toEqual({ rounds: 1, hits: 1 });
    expect(ex.id1).toEqual({ rounds: 1, hits: 0 });
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
