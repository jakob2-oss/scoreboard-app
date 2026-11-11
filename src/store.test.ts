import { describe, expect, it } from 'vitest';
import { createStore, type Prefs } from './store';
import type { Repo } from './db';
import type { Clock } from './lib/id';
import type { Player } from './model/types';
import type { GameState } from './game/engine';
import { liveRounds, seated, totals } from './game/engine';
import { FREE_TEMPLATES } from './game/templates';

function testClock(): Clock {
  let n = 0; let t = Date.UTC(2026, 0, 1);
  return { uid: () => 'id' + (++n), now: () => new Date(t += 1000).toISOString() };
}
/** Speicher im Arbeitsspeicher, merkt sich den zuletzt gespeicherten Stand */
function memPrefs(): Prefs { let last: string[] = []; return { getLast: () => last, setLast: ids => { last = ids; } }; }
function memRepo() {
  const players: Player[] = []; let saved: GameState | null = null; let saves = 0;
  const repo: Repo = {
    loadPlayers: async () => players, savePlayer: async p => { players.push(p); },
    loadRunningGame: async () => (saved && saved.game.status === 'running' ? saved : null),
    saveGame: async s => { saved = s; saves++; }
  };
  return { repo, last: () => saved, saves: () => saves };
}
async function setup(tplKey = 'free', names = ['Anna', 'Ben', 'Clara']) {
  const mem = memRepo(); const st = createStore(mem.repo, testClock(), memPrefs()); const a = st.actions;
  await a.init();
  a.pickTemplate(FREE_TEMPLATES.find(t => t.key === tplKey)!);
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
  it('erkennt Namen ohne Groß-/Kleinschreibung und vergibt feste Farben', async () => {
    const mem = memRepo(); const st = createStore(mem.repo, testClock(), memPrefs()); const a = st.actions;
    await a.init(); a.pickTemplate(FREE_TEMPLATES[0]);
    await a.addPlayer('Anna'); await a.addPlayer(' anna '); await a.addPlayer('Ben');
    expect(st.get().players.map(p => p.name)).toEqual(['Anna', 'Ben']);
    expect(st.get().players[0].color).not.toBe(st.get().players[1].color);
    a.start();
    expect(seated(st.get().game!).map(p => p.color)).toEqual(st.get().players.map(p => p.color));
  });
  it('merkt sich die letzte Auswahl für die nächste Partie', async () => {
    const { st, a } = await setup('free', ['A', 'B']);
    a.goHome(); a.pickTemplate(FREE_TEMPLATES[1]);
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
