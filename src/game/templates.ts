import type { End, Template, Win } from '../model/types';
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
}

export const defaultFreeConfig = (): FreeConfig => ({ name: '', win: 'high', end: { type: 'none' }, steps: [...DEFAULT_STEPS], save: true });

export function fallbackName(date = new Date()): string {
  return 'Freies Spiel vom ' + date.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' });
}

/** Aus den Einstellungen des freien Spiels eine eigene Vorlage machen (eigener Schlüssel, eigene Statistik). */
export function makeFreeTemplate(cfg: FreeConfig, clock: Clock): Template {
  const t = clock.now();
  const steps = [...new Set(cfg.steps)].filter(n => n > 0).sort((a, b) => a - b).slice(0, MAX_STEPS);
  return {
    key: clock.uid(), version: 1, name: cfg.name.trim() || fallbackName(new Date(t)), scoring: 'rounds', win: cfg.win,
    end: cfg.end, players: { min: 1, max: 8 }, params: { steps: steps.length ? steps : [...DEFAULT_STEPS] },
    custom: true, createdAt: t, updatedAt: t, lastUsedAt: null
  };
}

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
