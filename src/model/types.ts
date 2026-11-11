// Datenmodell v1 – siehe docs/DATENMODELL.md
// Alle Datensätze: UUID vom Gerät, Zeitstempel für Sync, Löschen nur als Markierung.

export type ISODate = string;

export interface Base {
  id: string;
  createdAt: ISODate;
  updatedAt: ISODate;
  deletedAt?: ISODate | null;
}

/** Person am Tisch, ohne Account. Kann später mit einem Account verknüpft werden. */
export interface Player extends Base {
  name: string;
  color: string;
  linkedUserId?: string | null;
  mergedIntoId?: string | null;
}

export type Scoring = 'rounds' | 'bids' | 'categories' | 'rank' | 'result';
export type Win = 'high' | 'low';
export type End =
  | { type: 'none' }
  | { type: 'target'; value: number }
  | { type: 'rounds'; value: number }
  | { type: 'categories' };

/** Regeln als Konfiguration aus Bausteinen, versioniert. */
export interface Template {
  key: string;
  version: number;
  name: string;
  scoring: Scoring;
  win: Win;
  end: End;
  players: { min: number; max: number };
  params?: Record<string, unknown>;
  custom?: boolean;
}

export type GameStatus = 'running' | 'finished' | 'abandoned';

export interface Seat { playerId: string; seat: number; team?: string | null }

export interface Game extends Base {
  /** Eingefrorene Kopie der Vorlage – spätere Regeländerungen ändern alte Partien nicht. */
  rules: Template;
  status: GameStatus;
  startedAt: ISODate;
  finishedAt?: ISODate | null;
  seats: Seat[];
  eventId?: string | null;
  place?: string | null;
  groupId?: string | null;
}

export interface Round extends Base { gameId: string; index: number }

/** Eingaben je Baustein. Punkte werden daraus berechnet, nicht gespeichert. */
export type EntryValues =
  | { score: number }
  | { bid?: number | null; tricks?: number | null }
  | { rank: number }
  | { phaseDone?: boolean; score?: number };

/** Kleinste Einheit: eine Eingabe pro Spieler und Runde bzw. Kategorie. */
export interface Entry extends Base {
  gameId: string;
  roundId?: string | null;
  categoryKey?: string | null;
  playerId: string;
  values: EntryValues;
  updatedBy?: string | null;
}

export interface Result extends Base { gameId: string; playerId: string; total: number; place: number }

export interface GameEvent extends Base { name: string; from?: ISODate | null; to?: ISODate | null }
