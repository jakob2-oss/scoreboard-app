import { useCallback, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const KEY = 'pz:theme';

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function stored(): Theme | null {
  try { const v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : null; } catch { return null; }
}

/** Hell/Dunkel: ohne eigene Wahl folgt die App dem System. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => stored() ?? systemTheme());
  useEffect(() => {
    if (stored()) document.documentElement.dataset.theme = theme;
  }, [theme]);
  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(KEY, next); } catch { /* privater Modus */ }
    setTheme(next);
  }, [theme]);
  return { theme, toggle };
}
