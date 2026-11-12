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
  params?: TemplateParams;
  custom?: boolean;
  /** Nur bei gespeicherten eigenen Vorlagen */
  createdAt?: ISODate;
  updatedAt?: ISODate;
  lastUsedAt?: ISODate | null;
  deletedAt?: ISODate | null;
}

/** Schnelltaste: Wert addieren, setzen oder multiplizieren */
/** Schnelltaste. 'rest': Wert so setzen, dass die Runde 0 ergibt (Nullsumme) */
export interface QuickKey { label: string; op: 'add' | 'set' | 'mul' | 'rest'; v: number }

/** Ein Feld einer zweiteiligen Runde, z. B. Binokel: Meldung und Stiche */
export interface SplitField { key: string; label: string; /** Mehrzahl für den Ablauf („Meldungen Runde 2“) */ phase: string; quick?: QuickKey[] }

export interface TemplateParams {
  /** Zählschritte für die Schnelltasten, z. B. [1, 5, 10] → −10 −5 −1 +1 +5 +10 */
  steps?: number[];
  /** Eigene Schnelltasten eines Spiels; ersetzt die aus steps abgeleiteten */
  quick?: QuickKey[];
  /** Zweiteilige Runde: erst alle das erste Feld, dann alle das zweite; Rundenwert ist die Summe */
  split?: SplitField[];
  /** Notizfelder neben den Punkten (z. B. „Längste Straße“), zählen nicht zur Summe */
  notes?: string[];
  /** Aussehen eigener Spiele: Farbe und Muster der Szene */
  look?: { color: string; pattern: string };
  /** Kopie eines festen Spiels: Schlüssel des Originals (für Bild und Regeltexte) */
  base?: string;
  /** Nur das Endergebnis wird notiert (eine einzige Eingabe je Spieler), z. B. Siedler oder Monopoly */
  resultOnly?: boolean;
  /** Kategorien-Zettel (Kniffel); jede Kategorie ist eine Zeile */
  categories?: Category[];
  /** Bonus für die obere Hälfte, z. B. 35 ab 63 */
  bonus?: { at: number; value: number };
  /** Phase 10: Haken „Phase geschafft“ je Runde, Rang erst nach Phase */
  phases?: boolean;
  /** Nullsummenspiel (Schafkopf, Doppelkopf): Rundensumme muss 0 ergeben */
  zeroSum?: boolean;
  /** Was eingetragen wird, z. B. „Siegpunkte“ oder „Platz“ */
  unit?: string;
  [key: string]: unknown;
}

export type GameStatus = 'running' | 'finished' | 'abandoned';

/** Team einer Partie (nur innerhalb der Partie, keine eigene Person) */
export interface Team { id: string; name: string; color: string; members: string[] }

export interface Seat { playerId: string; seat: number; team?: string | null }

export interface Game extends Base {
  /** Eingefrorene Kopie der Vorlage – spätere Regeländerungen ändern alte Partien nicht. */
  rules: Template;
  status: GameStatus;
  startedAt: ISODate;
  finishedAt?: ISODate | null;
  seats: Seat[];
  /** Teampartie: Teams spielen wie Spieler (Sitzplätze verweisen auf Team-IDs); members sind echte Spieler */
  teams?: Team[];
  eventId?: string | null;
  place?: string | null;
  groupId?: string | null;
}

/** Kategorie eines Zettels (z. B. Kniffel): oben zählt für den Bonus */
/** Kniffel-Kategorie. quick: erlaubte Werte, fixed: fester Wert, range: Augensumme von bis (Pasch). Ohne alles: freie Eingabe. */
export interface Category { label: string; section: 'up' | 'low'; fixed?: number; quick?: number[]; range?: [number, number] }

export interface Round extends Base { gameId: string; index: number; cat?: Category }

/** Eingaben je Baustein. Punkte werden daraus berechnet, nicht gespeichert. */
export type EntryValues =
  | { score: number }
  | { bid?: number | null; tricks?: number | null }
  | { rank: number }
  | { phase?: boolean; score?: number };

/** Kleinste Einheit: eine Eingabe pro Spieler und Runde bzw. Kategorie. */
export interface Entry extends Base {
  gameId: string;
  roundId?: string | null;
  categoryKey?: string | null;
  playerId: string;
  values: EntryValues;
  updatedBy?: string | null;
}

export interface Result extends Base {
  gameId: string; playerId: string; total: number; place: number;
  /** Spielspezifische Kennzahlen, z. B. Wizard: { hits, rounds } */
  extra?: Record<string, number | boolean>;
}

/** Serie oder Spieleabend, z. B. „Südamerika 2026“. Partien verweisen per eventId darauf. */
export interface GameEvent extends Base {
  name: string; from?: ISODate | null; to?: ISODate | null;
  /** Platzpunkte je Platz (Index 0 = Platz 1); fehlt: Vorschlag 3, 2, 1 */
  points?: number[];
}
