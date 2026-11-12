import Dexie, { type Table } from 'dexie';
import type { Entry, Game, GameEvent, Player, Result, Round, Template } from './model/types';
import type { HistGame } from './game/stats';
import type { GameState } from './game/engine';

/** Lokale Datenbank auf dem Gerät (IndexedDB). Tabellen entsprechen docs/DATENMODELL.md. */
export class PzDb extends Dexie {
  players!: Table<Player, string>;
  games!: Table<Game, string>;
  rounds!: Table<Round, string>;
  entries!: Table<Entry, string>;
  templates!: Table<Template, string>;
  results!: Table<Result, string>;
  events!: Table<GameEvent, string>;
  constructor(name = 'punktezettel') {
    super(name);
    this.version(1).stores({
      players: 'id, name, updatedAt',
      games: 'id, status, updatedAt',
      rounds: 'id, gameId, updatedAt',
      entries: 'id, gameId, roundId, playerId, updatedAt'
    });
    // v2: eigene Vorlagen (freie Spiele)
    this.version(2).stores({ templates: 'key, updatedAt, lastUsedAt' });
    // v3: Endergebnisse abgeschlossener Partien (Platz und Endpunktzahl je Spieler)
    this.version(3).stores({ results: 'id, gameId, playerId' });
    // v4: Serien und Spieleabende
    this.version(4).stores({ events: 'id, updatedAt' });
  }
}

export interface Repo {
  loadPlayers(): Promise<Player[]>;
  savePlayer(p: Player): Promise<void>;
  loadRunningGame(): Promise<GameState | null>;
  loadTemplates(): Promise<Template[]>;
  saveResults(r: Result[]): Promise<void>;
  /** Abgeschlossene Partien mit Ergebnissen, neueste zuerst */
  loadHistory(): Promise<HistGame[]>;
  saveTemplate(t: Template): Promise<void>;
  /** Schlüssel gelöschter eigener Vorlagen (damit sie beim Beenden nicht neu entstehen) */
  loadDeletedTemplateKeys(): Promise<string[]>;
  saveGame(s: GameState): Promise<void>;
  loadEvents(): Promise<GameEvent[]>;
  saveEvent(e: GameEvent): Promise<void>;
  /** Abgeschlossene Partie einer Serie zuordnen (null löst sie) */
  setGameEvent(gameId: string, eventId: string | null, at: string): Promise<void>;
}

export function createRepo(db: PzDb): Repo {
  return {
    async loadPlayers() {
      return (await db.players.toArray()).filter(p => !p.deletedAt).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    async savePlayer(p) { await db.players.put(p); },
    /** Eigene Vorlagen, zuletzt gespielte zuerst */
    async loadTemplates() {
      const key = (t: Template) => t.lastUsedAt || t.createdAt || '';
      return (await db.templates.toArray()).filter(t => !t.deletedAt).sort((a, b) => key(b).localeCompare(key(a)));
    },
    async saveTemplate(t) { await db.templates.put(t); },
    async loadDeletedTemplateKeys() { return (await db.templates.toArray()).filter(t => t.deletedAt).map(t => t.key); },
    async saveResults(r) { await db.results.bulkPut(r); },
    async loadHistory() {
      const games = (await db.games.where('status').equals('finished').toArray()).filter(g => !g.deletedAt);
      const [results, events] = await Promise.all([db.results.toArray(), db.events.toArray()]);
      const live = new Map(events.filter(e => !e.deletedAt).map(e => [e.id, e.name]));
      return games.map(g => ({
        id: g.id, key: g.rules.key, name: g.rules.name, finishedAt: g.finishedAt || g.updatedAt,
        eventId: g.eventId && live.has(g.eventId) ? g.eventId : null,
        occasion: (g.eventId && live.get(g.eventId)) || g.place || null,
        results: results.filter(r => r.gameId === g.id && !r.deletedAt).sort((a, b) => a.place - b.place)
          .map(r => ({ playerId: r.playerId, total: r.total, place: r.place, extra: r.extra }))
      })).filter(h => h.results.length).sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));
    },
    async loadEvents() { return (await db.events.toArray()).filter(e => !e.deletedAt); },
    async saveEvent(e) { await db.events.put(e); },
    async setGameEvent(gameId, eventId, at) { await db.games.update(gameId, { eventId, updatedAt: at }); },
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
