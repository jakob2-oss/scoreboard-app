import Dexie, { type Table } from 'dexie';
import type { Entry, Game, Player, Round } from './model/types';
import type { GameState } from './game/engine';

/** Lokale Datenbank auf dem Gerät (IndexedDB). Tabellen entsprechen docs/DATENMODELL.md. */
export class PzDb extends Dexie {
  players!: Table<Player, string>;
  games!: Table<Game, string>;
  rounds!: Table<Round, string>;
  entries!: Table<Entry, string>;
  constructor(name = 'punktezettel') {
    super(name);
    this.version(1).stores({
      players: 'id, name, updatedAt',
      games: 'id, status, updatedAt',
      rounds: 'id, gameId, updatedAt',
      entries: 'id, gameId, roundId, playerId, updatedAt'
    });
  }
}

export interface Repo {
  loadPlayers(): Promise<Player[]>;
  savePlayer(p: Player): Promise<void>;
  loadRunningGame(): Promise<GameState | null>;
  saveGame(s: GameState): Promise<void>;
}

export function createRepo(db: PzDb): Repo {
  return {
    async loadPlayers() {
      return (await db.players.toArray()).filter(p => !p.deletedAt).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    async savePlayer(p) { await db.players.put(p); },
    async loadRunningGame() {
      const running = (await db.games.where('status').equals('running').toArray())
        .filter(g => !g.deletedAt).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
      if (!running) return null;
      const [rounds, entries, players] = await Promise.all([
        db.rounds.where('gameId').equals(running.id).toArray(),
        db.entries.where('gameId').equals(running.id).toArray(),
        db.players.bulkGet(running.seats.map(s => s.playerId))
      ]);
      return { game: running, rounds, entries, players: players.filter((p): p is Player => !!p) };
    },
    /** Speichert den kompletten Stand einer Partie. Gelöschtes bleibt als Markierung erhalten. */
    async saveGame(s) {
      // Spieler werden separat gespeichert (savePlayer), damit eine Partie sie nie überschreibt.
      await db.transaction('rw', db.games, db.rounds, db.entries, async () => {
        await db.games.put(s.game);
        await db.rounds.bulkPut(s.rounds);
        await db.entries.bulkPut(s.entries);
      });
    }
  };
}

let repo: Repo | null = null;
/** Gemeinsame Instanz für die App. Fehler (z. B. gesperrter Speicher) meldet der Store als Hinweis. */
export function appRepo(): Repo {
  if (!repo) repo = createRepo(new PzDb());
  return repo;
}
