/** Kleine flache Abbildungen für Auszeichnungen und Rekorde (64×64), siehe docs/DESIGN.md */
export const AWARD_ART: Record<string, string> = {
  // Pokal mit Stern
  siege: `<svg viewBox="0 0 64 64"><path d="M20 14h24v12a12 12 0 0 1-24 0z" fill="#f2cf86"/><path d="M20 18h-6a6 6 0 0 0 8 8M44 18h6a6 6 0 0 1-8 8" fill="none" stroke="#e0b45e" stroke-width="4" stroke-linecap="round"/>
    <rect x="29" y="37" width="6" height="8" fill="#e0b45e"/><rect x="22" y="45" width="20" height="6" rx="3" fill="#e0b45e"/><circle cx="32" cy="24" r="4.5" fill="#fffaf2"/></svg>`,
  // Flamme
  serie: `<svg viewBox="0 0 64 64"><path d="M32 8c4 10 16 16 16 30a16 16 0 0 1-32 0c0-8 4-12 8-16 0 6 3 9 6 10-2-10 0-18 2-24z" fill="#f3a98f"/>
    <path d="M32 30c3 5 8 8 8 14a8 8 0 0 1-16 0c0-5 4-8 8-14z" fill="#f2cf86"/></svg>`,
  // Karte, Würfel, Spielstein
  allround: `<svg viewBox="0 0 64 64"><g transform="rotate(-12 22 32)"><rect x="10" y="16" width="22" height="30" rx="4" fill="#fffaf2"/><circle cx="21" cy="31" r="5" fill="#eda7bf"/></g>
    <g transform="rotate(10 44 38)"><rect x="32" y="26" width="22" height="22" rx="5" fill="#86cbb8"/><circle cx="38" cy="32" r="2.2" fill="#fffaf2"/><circle cx="48" cy="42" r="2.2" fill="#fffaf2"/><circle cx="43" cy="37" r="2.2" fill="#fffaf2"/></g>
    <circle cx="44" cy="15" r="5" fill="#bba8e6"/><path d="M38 24l6-6 6 6z" fill="#bba8e6"/></svg>`,
  // Regenwolke
  pech: `<svg viewBox="0 0 64 64"><circle cx="24" cy="28" r="10" fill="#b7bfd6"/><circle cx="36" cy="22" r="12" fill="#c6cde1"/><circle cx="45" cy="30" r="8" fill="#b7bfd6"/><rect x="16" y="28" width="36" height="10" rx="5" fill="#c6cde1"/>
    ${[22, 32, 42].map((x, k) => `<path d="M${x} ${44 + (k % 2) * 4}c1.5 3 2.6 4.8 2.6 6.2a2.6 2.6 0 0 1-5.2 0c0-1.4 1.1-3.2 2.6-6.2z" fill="#97c4e3"/>`).join('')}</svg>`
};

// Rekorde: Pokal (beste Punktzahl), Berg mit Fahne (Vorsprung), Sanduhr (längste Partie), Blitz (schnellster Sieg)
AWARD_ART.best = AWARD_ART.siege;
AWARD_ART.margin = `<svg viewBox="0 0 64 64"><path d="M6 52l18-26 10 12 8-10 16 24z" fill="#86cbb8"/><path d="M24 26l6 9-6-3-6 3z" fill="#fffaf2"/><rect x="41" y="12" width="2.6" height="18" rx="1.3" fill="#5b5a8f"/><path d="M43.6 13h11l-3 4 3 4h-11z" fill="#f3a98f"/></svg>`;
AWARD_ART.long = `<svg viewBox="0 0 64 64"><rect x="16" y="8" width="32" height="6" rx="3" fill="#bba8e6"/><rect x="16" y="50" width="32" height="6" rx="3" fill="#bba8e6"/>
  <path d="M20 14h24c0 10-8 14-8 18s8 8 8 18H20c0-10 8-14 8-18s-8-8-8-18z" fill="#ece6fb"/><path d="M26 44c2-3 4-4 6-4s4 1 6 4l2 6H24z" fill="#f2cf86"/><path d="M27 20h10c-1 4-3 6-5 7-2-1-4-3-5-7z" fill="#f2cf86"/></svg>`;
AWARD_ART.short = `<svg viewBox="0 0 64 64"><path d="M36 6L14 36h14l-4 22 26-32H36z" fill="#f2cf86"/><path d="M36 6l-8 20h8z" fill="#fffaf2" opacity=".5"/></svg>`;

// Rommé: niedriger Schnitt (fallende Säulen, kleine Null), Siegquote (Krone über einem Kreisanteil)
AWARD_ART.avg = `<svg viewBox="0 0 64 64"><rect x="10" y="18" width="12" height="36" rx="4" fill="#bba8e6"/><rect x="26" y="30" width="12" height="24" rx="4" fill="#97c4e3"/><rect x="42" y="42" width="12" height="12" rx="4" fill="#86cbb8"/><circle cx="48" cy="26" r="7" fill="none" stroke="#ef7a5c" stroke-width="4"/></svg>`;
AWARD_ART.rate = `<svg viewBox="0 0 64 64"><circle cx="32" cy="38" r="18" fill="#ece6fb"/><path d="M32 38V20a18 18 0 0 1 17 24z" fill="#86cbb8"/><path d="M18 14l5 6 9-10 9 10 5-6-2 10H20z" fill="#f2cf86"/></svg>`;
