/**
 * Gerätefunktionen: leichtes Vibrieren und Bildschirm wach halten.
 * Alles optional: wo der Browser es nicht kann, passiert einfach nichts.
 */

const HAPTIC_KEY = 'pz:haptic';
export const hapticOn = () => { try { return localStorage.getItem(HAPTIC_KEY) !== 'off'; } catch { return true; } };
export const setHapticOn = (on: boolean) => { try { localStorage.setItem(HAPTIC_KEY, on ? 'on' : 'off'); } catch { /* privater Modus */ } };

let tick: HTMLLabelElement | null = null;
/** iPhone (Safari ab 17.4): Antippen eines Schalter-Elements löst ein kurzes Haptik-Feedback aus */
function iosTick() {
  if (!tick) {
    const input = document.createElement('input');
    input.type = 'checkbox'; input.setAttribute('switch', ''); input.id = 'pz-haptic'; input.style.display = 'none';
    tick = document.createElement('label'); tick.htmlFor = 'pz-haptic'; tick.style.display = 'none';
    document.body.append(input, tick);
  }
  tick.click();
}

/** Kurzes Feedback beim Eintragen; „success“ etwas deutlicher (Sieg, Hälfte verloren) */
export function haptic(kind: 'tap' | 'success' = 'tap') {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !hapticOn()) return;
  try {
    if (typeof navigator.vibrate === 'function') { navigator.vibrate(kind === 'success' ? [16, 70, 28] : 10); return; }
    if (/iP(hone|ad|od)/.test(navigator.userAgent)) { iosTick(); if (kind === 'success') setTimeout(iosTick, 120); }
  } catch { /* egal */ }
}

/** Bildschirm wach halten, solange eine Partie offen ist. Gibt eine Funktion zum Lösen zurück. */
export function keepAwake(): () => void {
  type Lock = { release(): Promise<void> };
  const nav = navigator as Navigator & { wakeLock?: { request(type: 'screen'): Promise<Lock> } };
  if (!nav.wakeLock) return () => undefined;
  let lock: Lock | null = null, stopped = false;
  const get = () => { if (!stopped && document.visibilityState === 'visible') nav.wakeLock!.request('screen').then(l => { if (stopped) l.release(); else lock = l; }).catch(() => undefined); };
  const onVis = () => { if (document.visibilityState === 'visible') get(); };
  get(); document.addEventListener('visibilitychange', onVis);
  return () => { stopped = true; document.removeEventListener('visibilitychange', onVis); lock?.release().catch(() => undefined); lock = null; };
}
