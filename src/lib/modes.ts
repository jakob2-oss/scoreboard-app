/**
 * Eingabe je Spiel: „block“ ist die eigens gestaltete Oberfläche (z. B. Wizard: Ansagen im Block, Stiche auf einem Blatt),
 * „simple“ die einfache Eingabe pro Spieler. Gemerkt je Spiel auf dem Gerät; ohne Speicher gilt „block“.
 */
export type EntryMode = 'block' | 'simple';
const KEY = (k: string) => 'pz:mode:' + k;
export function entryMode(key: string): EntryMode {
  try { return typeof localStorage !== 'undefined' && localStorage.getItem(KEY(key)) === 'simple' ? 'simple' : 'block'; } catch { return 'block'; }
}
export function setEntryMode(key: string, mode: EntryMode) {
  try { localStorage.setItem(KEY(key), mode); } catch { /* privater Modus */ }
}
/** Spiele mit eigener Oberfläche (nur dort gibt es die Wahl) */
export const hasBlockMode = (key: string, scoring: string) => scoring === 'bids' || key === 'wizard';

/** Wie frech der Otter kommentiert: brav (nur freundlich auf der Siegerseite), frech, atzig (cool und artsy) */
export type QuipLevel = 'brav' | 'frech' | 'atzig';
export function quipLevel(): QuipLevel {
  try { const v = localStorage.getItem('pz:quip'); return v === 'brav' || v === 'atzig' ? v : 'frech'; } catch { return 'frech'; }
}
export function setQuipLevel(v: QuipLevel) {
  try { localStorage.setItem('pz:quip', v); } catch { /* privater Modus */ }
}
