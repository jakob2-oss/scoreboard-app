export const PLAYER_COLORS = ['#f3a98f', '#86cbb8', '#f2cf86', '#eda7bf', '#97c4e3', '#bba8e6', '#b2d59a', '#f4bf91'];

/** Frühere, kräftigere Spielerfarben auf die Pastellpalette umstellen */
const OLD_TO_PASTEL: Record<string, string> = {
  '#ef7a5c': '#f3a98f', '#3fb39b': '#86cbb8', '#f0b13e': '#f2cf86', '#e2709a': '#eda7bf',
  '#5fa8d3': '#97c4e3', '#9a7ad6': '#bba8e6', '#7cb85a': '#b2d59a', '#f09a4a': '#f4bf91'
};
export const pastel = (c: string): string => OLD_TO_PASTEL[c.toLowerCase()] ?? c;

/** Lesbare Schriftfarbe auf einer Spielerfarbe (weiß oder dunkel). */
export function onColor(hex: string): string {
  const c = parseInt(hex.slice(1), 16);
  const ch = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = 0.2126 * ch((c >> 16) & 255) + 0.7152 * ch((c >> 8) & 255) + 0.0722 * ch(c & 255);
  return L > 0.42 ? '#2e2b4f' : '#ffffff';
}

/** Zahl mit echtem Minuszeichen. */
export const fmt = (n: number): string => (n < 0 ? '−' + Math.abs(n) : String(n));
