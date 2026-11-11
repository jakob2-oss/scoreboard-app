import { describe, expect, it } from 'vitest';
import { wizardOrder, wizardRounds, wizardScore } from './wizard';

describe('Wizard', () => {
  it('belohnt genaue Ansagen', () => {
    expect(wizardScore(0, 0)).toBe(20);
    expect(wizardScore(2, 2)).toBe(40);
  });
  it('bestraft Abweichungen je Stich', () => {
    expect(wizardScore(2, 0)).toBe(-20);
    expect(wizardScore(1, 4)).toBe(-30);
  });
  it('berechnet die Rundenzahl aus 60 Karten', () => {
    expect(wizardRounds(3)).toBe(20);
    expect(wizardRounds(4)).toBe(15);
    expect(wizardRounds(6)).toBe(10);
    expect(() => wizardRounds(2)).toThrow();
  });
  it('lässt den Spieler links vom Geber beginnen', () => {
    expect(wizardOrder(3, 0)).toEqual([1, 2, 0]);
    expect(wizardOrder(3, 1)).toEqual([2, 0, 1]);
  });
});
