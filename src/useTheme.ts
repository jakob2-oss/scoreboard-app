import { useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';
const KEY = 'pz:theme';
const listeners = new Set<() => void>();

function stored(): Theme | null {
  try { const v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : null; } catch { return null; }
}
function current(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === 'light' || set === 'dark') return set;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
/** Beim Start gespeicherte Wahl anwenden; ohne Wahl folgt die App dem System. */
export function applyStoredTheme() {
  const t = stored(); if (t) document.documentElement.dataset.theme = t;
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => listeners.forEach(l => l()));
}
export function toggleTheme() {
  const next: Theme = current() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem(KEY, next); } catch { /* privater Modus */ }
  listeners.forEach(l => l());
}
export function useTheme(): Theme {
  return useSyncExternalStore(l => { listeners.add(l); return () => listeners.delete(l); }, current);
}
