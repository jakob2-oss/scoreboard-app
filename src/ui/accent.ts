/** Spielfarbe in der laufenden Partie: Hauptknopf, Titel, Geber. Nur für Spiele mit eigens gestalteter Oberfläche. */
const ACCENT: Record<string, [string, string]> = {
  wizard: ['#9a7ad6', '#c3aef3']
};
export const accentStyle = (key: string): React.CSSProperties | undefined => {
  const a = ACCENT[key];
  return a ? ({ ['--primary' as string]: a[0], ['--i-coral' as string]: a[1], ['--acc' as string]: a[0], ['--acc-l' as string]: a[1] } as React.CSSProperties) : undefined;
};
