/** Wizard: Treffer = 20 + 10 je Stich, daneben = −10 je Stich Abweichung. */
export function wizardScore(bid: number, tricks: number): number {
  return bid === tricks ? 20 + 10 * tricks : -10 * Math.abs(bid - tricks);
}

/** Rundenzahl: 60 Karten geteilt durch die Spielerzahl (3–6 Spieler). */
export function wizardRounds(players: number): number {
  if (players < 3 || players > 6) throw new RangeError('Wizard braucht 3 bis 6 Spieler');
  return Math.floor(60 / players);
}

/** Der Geber rotiert; es beginnt der Spieler links vom Geber. */
export function wizardOrder(players: number, roundIndex: number): number[] {
  const start = (roundIndex % players + 1) % players;
  return Array.from({ length: players }, (_, k) => (start + k) % players);
}
