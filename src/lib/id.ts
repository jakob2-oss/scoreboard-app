/** Eindeutige ID, auf dem Gerät erzeugt (offline-fähig, kollisionsfrei beim Sync). */
export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);

export const nowIso = (): string => new Date().toISOString();

export type Clock = { now: () => string; uid: () => string };
export const realClock: Clock = { now: nowIso, uid };
