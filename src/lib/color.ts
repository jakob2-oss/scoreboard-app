export const PLAYER_COLORS = ['#ef7a5c', '#3fb39b', '#f0b13e', '#e2709a', '#5fa8d3', '#9a7ad6', '#7cb85a', '#f09a4a'];

/** Lesbare Schriftfarbe auf einer Spielerfarbe (weiß oder dunkel). */
export function onColor(hex: string): string {
  const c = parseInt(hex.slice(1), 16);
  const ch = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = 0.2126 * ch((c >> 16) & 255) + 0.7152 * ch((c >> 8) & 255) + 0.0722 * ch(c & 255);
  return L > 0.42 ? '#2e2b4f' : '#ffffff';
}

/** Zahl mit echtem Minuszeichen. */
export const fmt = (n: number): string => (n < 0 ? '−' + Math.abs(n) : String(n));
