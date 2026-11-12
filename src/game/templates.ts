import type { End, QuickKey, Scoring, Template, Win } from '../model/types';
import type { Clock } from '../lib/id';

/** Mögliche Zählschritte im freien Spiel; höchstens drei gleichzeitig (sechs Tasten). */
export const STEP_CHOICES = [1, 2, 5, 10, 20, 25, 50, 100];
export const MAX_STEPS = 3;
export const DEFAULT_STEPS = [1, 5, 10];

export interface FreeConfig {
  name: string;
  win: Win;
  end: End;
  steps: number[];
  /** Beim Start als Vorlage speichern */
  save: boolean;
  /** Notizfelder neben den Punkten */
  notes: string[];
  /** Aussehen eigener Spiele */
  look?: { color: string; pattern: string };
  /** Rundenspiel oder Endwertung (nur das Ergebnis am Ende) */
  mode: 'rounds' | 'result';
  /** Endwertung: gewertet nach Punkten oder Platz */
  unit: 'Punkte' | 'Platz';
  /** Rundenspiel: Punkte je Runde, zwei Werte je Runde (Summe) oder Rang je Runde */
  kind: Kind;
  /** Namen der zwei Werte (bei kind 'split') */
  splitNames: [string, string];
  /** Jede Runde ergibt zusammen 0 (mit Taste „Ausgleich“) */
  zeroSum: boolean;
  /** Eigene Schnelltasten */
  keys: QuickKey[];
}

export type Kind = 'points' | 'split' | 'rank';
export const MAX_KEYS = 3;

/** Wertung je Runde: ändert die Art nur bei normalen Rundenspielen (Wizard und Kniffel bleiben, wie sie sind) */
function kindRules(cfg: FreeConfig, prev?: Template): { scoring?: Scoring; params: Record<string, unknown> } {
  if (prev && prev.scoring !== 'rounds' && prev.scoring !== 'rank') return { params: {} };
  if (cfg.mode === 'result') return { scoring: 'rounds', params: { split: undefined, zeroSum: undefined } };
  if (cfg.kind === 'rank') return { scoring: 'rank', params: { split: undefined, zeroSum: undefined } };
  if (cfg.kind === 'split') {
    const old = prev?.params?.split;
    const names = cfg.splitNames.map((n, i) => n.trim() || (i ? 'Zweiter Wert' : 'Erster Wert'));
    return { scoring: 'rounds', params: { zeroSum: undefined, split: names.map((n, i) => ({ key: old?.[i]?.key ?? (i ? 'b' : 'a'), label: n, phase: n, ...(old?.[i]?.quick ? { quick: old[i].quick } : {}) })) } };
  }
  return { scoring: 'rounds', params: { split: undefined, zeroSum: cfg.zeroSum || undefined } };
}

const PLACE_KEYS = Array.from({ length: 6 }, (_, k) => ({ label: `${k + 1}.`, op: 'set' as const, v: k + 1 }));
/** Regeln, die sich aus der Art (Runden oder Endwertung) ergeben */
function modeRules(cfg: FreeConfig): Pick<Template, 'win' | 'end'> & { params: Record<string, unknown> } {
  if (cfg.mode !== 'result') return { win: cfg.win, end: cfg.end, params: { resultOnly: undefined, unit: undefined, quick: undefined } };
  const place = cfg.unit === 'Platz';
  return { win: place ? 'low' : cfg.win, end: { type: 'rounds', value: 1 }, params: { resultOnly: true, unit: cfg.unit, quick: place ? PLACE_KEYS : undefined } };
}
const clean = <T extends Record<string, unknown>>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

export const defaultFreeConfig = (): FreeConfig => ({ name: '', win: 'high', end: { type: 'none' }, steps: [...DEFAULT_STEPS], save: false, notes: [], mode: 'rounds', unit: 'Punkte', kind: 'points', splitNames: ['', ''], zeroSum: false, keys: [] });

export function fallbackName(date = new Date()): string {
  return 'Freies Spiel vom ' + date.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' });
}

/** Aus den Einstellungen des freien Spiels eine eigene Vorlage machen (eigener Schlüssel, eigene Statistik). */
/** Festes Spiel als eigenes Spiel kopieren (eigener Schlüssel, Regeln und Bild des Originals) */
export function copyAsOwn(t: Template, clock: Clock): Template {
  const now = clock.now();
  return { ...structuredClone(t), key: clock.uid(), version: 1, name: `${t.name} eigen`, custom: true,
    params: { ...structuredClone(t.params ?? {}), base: t.key }, createdAt: now, updatedAt: now, lastUsedAt: null };
}

export function makeFreeTemplate(cfg: FreeConfig, clock: Clock): Template {
  const t = clock.now();
  const steps = [...new Set(cfg.steps)].filter(n => n > 0).sort((a, b) => a - b).slice(0, MAX_STEPS);
  const m = modeRules(cfg), k = kindRules(cfg);
  return {
    key: clock.uid(), version: 1, name: cfg.name.trim() || fallbackName(new Date(t)), scoring: k.scoring ?? 'rounds', win: cfg.kind === 'rank' && cfg.mode !== 'result' ? 'high' : m.win,
    end: m.end, players: { min: cfg.kind === 'rank' ? 3 : 1, max: 8 },
    params: clean({ steps: steps.length ? steps : [...DEFAULT_STEPS], ...(cfg.notes.length ? { notes: [...cfg.notes] } : {}), ...(cfg.look ? { look: cfg.look } : {}), ...m.params, ...k.params,
      keys: cfg.keys.length && cfg.mode !== 'result' && cfg.kind !== 'rank' ? cfg.keys.slice(0, MAX_KEYS) : undefined }),
    custom: true, createdAt: t, updatedAt: t, lastUsedAt: null
  };
}

/** Freies Spiel bearbeiten: Einstellungen übernehmen, Schlüssel bleibt (Statistik bleibt zusammen), Version steigt bei Änderung */
export function updateFreeTemplate(t: Template, cfg: FreeConfig, clock: Clock): Template {
  const steps = [...new Set(cfg.steps)].filter(n => n > 0).sort((a, b) => a - b).slice(0, MAX_STEPS);
  // Art und Wertung nur neu setzen, wenn sie sich ändern; sonst bleiben Schnelltasten und Einheit
  // (z. B. bei Kopien fester Spiele wie Siedler oder Rommé) erhalten
  const cur = configOf(t);
  const m = cur.mode !== cfg.mode || cur.unit !== cfg.unit ? modeRules(cfg)
    : { win: cfg.mode === 'result' && cfg.unit === 'Platz' ? t.win : cfg.win, end: cfg.mode === 'result' ? t.end : cfg.end, params: {} };
  const k = kindRules(cfg, t);
  const params = clean({ ...t.params, steps: steps.length ? steps : [...DEFAULT_STEPS], notes: [...cfg.notes], ...(cfg.look ? { look: cfg.look } : {}), ...m.params, ...k.params,
    keys: cfg.keys.length && cfg.mode !== 'result' && cfg.kind !== 'rank' ? cfg.keys.slice(0, MAX_KEYS) : undefined });
  const scoring = k.scoring ?? t.scoring;
  const next: Template = { ...t, name: cfg.name.trim() || t.name, scoring, win: scoring === 'rank' ? 'high' : m.win, end: m.end, params,
    players: scoring === 'rank' ? { ...t.players, min: Math.max(3, t.players.min) } : t.players };
  const same = JSON.stringify([next.name, next.scoring, next.win, next.end, next.params, next.players]) === JSON.stringify([t.name, t.scoring, t.win, t.end, t.params, t.players]);
  return same ? t : { ...next, version: t.version + 1, updatedAt: clock.now() };
}

/** Einstellungen eines eigenen Spiels zum Bearbeiten */
export const configOf = (t: Template): FreeConfig => ({ name: t.name, win: t.win, end: t.end, steps: [...stepsOf(t)], save: true, notes: [...(t.params?.notes ?? [])], look: t.params?.look,
  mode: t.params?.resultOnly ? 'result' : 'rounds', unit: t.params?.unit === 'Platz' ? 'Platz' : 'Punkte',
  kind: t.scoring === 'rank' ? 'rank' : t.params?.split?.length === 2 ? 'split' : 'points',
  splitNames: [t.params?.split?.[0]?.label ?? '', t.params?.split?.[1]?.label ?? ''], zeroSum: !!t.params?.zeroSum, keys: [...(t.params?.keys ?? [])] });

export function stepsOf(t: Template): number[] {
  const s = t.params?.steps;
  return Array.isArray(s) && s.length ? s : DEFAULT_STEPS;
}

/** Kurze Beschreibung in ganzen Worten, z. B. „Höchste Punktzahl gewinnt, Ziel 500“ */
export function describeTemplate(t: Template): string {
  const w = t.win === 'high' ? 'Höchste Punktzahl gewinnt' : 'Niedrigste Punktzahl gewinnt';
  if (t.end.type === 'target') return `${w}, Ziel ${t.end.value}`;
  if (t.end.type === 'rounds') return `${w}, ${t.end.value} Runden`;
  return w;
}
