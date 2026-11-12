import { describe, expect, it } from 'vitest';
import { configOf, defaultFreeConfig, describeTemplate, makeFreeTemplate, updateFreeTemplate } from './templates';

const clock = () => { let n = 0; return { uid: () => 'k' + (++n), now: () => new Date(Date.UTC(2026, 0, 1, 0, 0, n)).toISOString() }; };

describe('Eigene Spiele im Tisch-Modus', () => {
  it('Leben verlieren: Standard 3 Leben, offenes Ende, höchste gewinnt', () => {
    const t = makeFreeTemplate({ ...defaultFreeConfig(), name: 'Mau', kind: 'lives', win: 'low', end: { type: 'target', value: 100 } }, clock());
    expect(t.scoring).toBe('lives');
    expect(t.params?.lives).toBe(3);
    expect(t.win).toBe('high');
    expect(t.end).toEqual({ type: 'none' });
    expect(t.players).toEqual({ min: 2, max: 10 });
    expect(describeTemplate(t)).toBe('3 Leben und Schwimmen, der Letzte gewinnt');
    const u = makeFreeTemplate({ ...defaultFreeConfig(), kind: 'lives', swim: false, start: 4 }, clock());
    expect([u.params?.lives, u.params?.swim]).toEqual([4, false]);
    expect(configOf(u).swim).toBe(false);
    expect(configOf(t).kind).toBe('lives');
  });
  it('Deckel verteilen mit eigener Zahl, später zurück zu Punkten', () => {
    const c = clock();
    const t = makeFreeTemplate({ ...defaultFreeConfig(), name: 'Meier', kind: 'tokens', start: 9 }, c);
    expect([t.scoring, t.params?.tokens, t.win]).toEqual(['tokens', 9, 'low']);
    expect(configOf(t).start).toBe(9);
    const h = updateFreeTemplate(t, { ...configOf(t), halves: 3 }, c);
    expect([h.params?.halves, configOf(h).halves, h.version]).toEqual([3, 3, 2]);
    const p = updateFreeTemplate(h, { ...configOf(h), kind: 'points' }, c);
    expect(p.scoring).toBe('rounds');
    expect(p.params?.tokens).toBeUndefined();
    expect(p.params?.halves).toBeUndefined();
  });
});
