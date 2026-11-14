import { describe, expect, it } from 'vitest';
import { quip } from './quips';

describe('Otter-Sprüche', () => {
  it('setzt den Namen ein, wählt je Partie stabil, jede Stufe hat eigene Sprüche', () => {
    const a = quip('win', 'atzig', 'Clara', 'g1'), b = quip('win', 'atzig', 'Clara', 'g1');
    expect(a).toBe(b);
    expect(a).toContain('Clara');
    expect(quip('chicRohr', 'brav', 'Ben', 'x')).toBe('Ben zahlt die Runde.');
    for (const lvl of ['brav', 'frech', 'atzig'] as const) for (const e of ['win', 'last', 'kniffel', 'verfehlt'] as const) {
      const t = quip(e, lvl, 'Anna', 'seed');
      expect(t).not.toMatch(/\{name\}|·|→/);
    }
  });
});
