import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { PzDb, createRepo } from './db';
import { createGame, finish, liveRounds, restore, setScore, totals } from './game/engine';
import { FREE_TEMPLATES } from './game/templates';
import type { Player } from './model/types';
import type { Clock } from './lib/id';

function testClock(): Clock {
  let n = 0; let t = Date.UTC(2026, 0, 1);
  return { uid: () => 'id' + (++n), now: () => new Date(t += 1000).toISOString() };
}
let dbNo = 0;
const freshRepo = () => createRepo(new PzDb('test-' + (++dbNo)));
const players: Player[] = [
  { id: 'a', name: 'Anna', color: '#ef7a5c', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'b', name: 'Ben', color: '#3fb39b', createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' }
];

describe('Lokale Datenbank', () => {
  it('speichert Spieler und liefert sie in Anlege-Reihenfolge', async () => {
    const repo = freshRepo();
    await repo.savePlayer(players[1]);
    await repo.savePlayer(players[0]);
    expect((await repo.loadPlayers()).map(p => p.name)).toEqual(['Anna', 'Ben']);
  });

  it('lädt eine laufende Partie vollständig wieder', async () => {
    const repo = freshRepo(); const c = testClock();
    for (const p of players) await repo.savePlayer(p);
    let s = createGame(FREE_TEMPLATES[0], players, c);
    const r0 = liveRounds(s)[0].id;
    s = setScore(s, r0, 'a', 12, c).state;
    s = setScore(s, r0, 'b', 7, c).state;
    await repo.saveGame(s);
    const loaded = await repo.loadRunningGame();
    expect(loaded).not.toBeNull();
    expect(totals(loaded!)).toEqual({ a: 12, b: 7 });
    expect(loaded!.players.map(p => p.name)).toEqual(['Anna', 'Ben']);
  });

  it('behält nach Rückgängig gelöschte Datensätze als Markierung', async () => {
    const repo = freshRepo(); const c = testClock();
    for (const p of players) await repo.savePlayer(p);
    let s = createGame(FREE_TEMPLATES[0], players, c);
    const snap = s;
    s = setScore(s, liveRounds(s)[0].id, 'a', 5, c).state;
    await repo.saveGame(s);
    s = restore(s, snap, c);
    await repo.saveGame(s);
    const loaded = await repo.loadRunningGame();
    expect(totals(loaded!)).toEqual({ a: 0, b: 0 });
    expect(loaded!.entries).toHaveLength(1);
    expect(loaded!.entries[0].deletedAt).toBeTruthy();
  });

  it('liefert keine laufende Partie mehr, wenn sie beendet wurde', async () => {
    const repo = freshRepo(); const c = testClock();
    const s = createGame(FREE_TEMPLATES[0], players, c);
    await repo.saveGame(s);
    await repo.saveGame(finish(s, c));
    expect(await repo.loadRunningGame()).toBeNull();
  });
});
