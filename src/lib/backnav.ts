/**
 * Zurück wie in einer App: der Browser-Verlauf (Zurück-Taste, Wischen in Safari) und, als installierte App
 * auf dem iPhone, eine Wischgeste vom linken Rand führen zur Seite, von der man gekommen ist.
 */
import { act } from '../store';

const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

export function setupBackNav(): () => void {
  // Browser-Verlauf: jede gemerkte Seite bekommt einen Eintrag; Zurück im Browser nimmt sie wieder vom Stapel
  let skip = 0, depth = 0, fromPop = false;
  const onNav = (e: Event) => {
    const kind = (e as CustomEvent<'push' | 'pop'>).detail;
    if (kind === 'push') { history.pushState({ oina: ++depth }, ''); return; }
    // In der App zurück (Knopf, Geste, Ansicht geschlossen): den Browser-Eintrag mit zurücknehmen
    if (!fromPop && depth > 0) { depth--; skip++; history.back(); }
  };
  const onPop = () => {
    if (skip > 0) { skip--; return; }
    depth = Math.max(0, depth - 1);
    fromPop = true; act().goBack(); fromPop = false;
  };
  window.addEventListener('oina:nav', onNav);
  window.addEventListener('popstate', onPop);

  // Wischgeste vom linken Rand (nur als installierte App, im Browser macht das Safari selbst)
  let x0 = 0, y0 = 0, el: HTMLElement | null = null, on = false;
  const start = (e: TouchEvent) => {
    const t = e.touches[0];
    if (!standalone() || e.touches.length > 1 || t.clientX > 24 || !act().canGoBack()) return;
    x0 = t.clientX; y0 = t.clientY; on = true;
    el = document.querySelector<HTMLElement>('.front-ov') ?? document.querySelector<HTMLElement>('.screen');
  };
  const move = (e: TouchEvent) => {
    if (!on || !el) return;
    const dx = e.touches[0].clientX - x0, dy = e.touches[0].clientY - y0;
    if (Math.abs(dy) > 40 && dx < 30) { reset(); return; }
    el.style.transition = 'none'; el.style.transform = `translateX(${Math.max(0, dx)}px)`;
  };
  const end = (e: TouchEvent) => {
    if (!on || !el) return;
    const dx = (e.changedTouches[0]?.clientX ?? x0) - x0, target = el;
    on = false;
    if (dx > Math.min(110, window.innerWidth * .3)) {
      target.style.transition = 'transform .18s ease-out'; target.style.transform = `translateX(${window.innerWidth}px)`;
      setTimeout(() => { target.style.transition = ''; target.style.transform = ''; act().goBack(); }, 170);
    } else reset();
  };
  const reset = () => {
    on = false; if (!el) return;
    const t = el; t.style.transition = 'transform .18s ease-out'; t.style.transform = '';
    setTimeout(() => { t.style.transition = ''; }, 200);
  };
  window.addEventListener('touchstart', start, { passive: true });
  window.addEventListener('touchmove', move, { passive: true });
  window.addEventListener('touchend', end);
  window.addEventListener('touchcancel', reset);
  return () => {
    window.removeEventListener('oina:nav', onNav); window.removeEventListener('popstate', onPop);
    window.removeEventListener('touchstart', start); window.removeEventListener('touchmove', move);
    window.removeEventListener('touchend', end); window.removeEventListener('touchcancel', reset);
  };
}
