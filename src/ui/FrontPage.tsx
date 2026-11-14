import { useMemo, useState } from 'react';
import { act, useApp } from '../store';
import { evenings, frontPage, type FrontPage as FP } from '../game/frontpage';
import { quipLevel } from '../lib/modes';
import { frontPng, frontSvg, type FrontLook, type FrontVariant } from './frontArt';
import { IconClose } from './icons';
import { dateShort } from './lookup';

/** Namen und Farben aller Spieler, auch gelöschter */
function useLook(): FrontLook {
  const { players, formerPlayers } = useApp();
  return useMemo(() => {
    const all = [...formerPlayers, ...players];
    return { names: Object.fromEntries(all.map(p => [p.id, p.name])), colors: Object.fromEntries(all.map(p => [p.id, p.color])) };
  }, [players, formerPlayers]);
}
function useFront(day: string | null): FP | null {
  const { history, events } = useApp(), look = useLook();
  return useMemo(() => (day ? frontPage(history, day, { level: quipLevel(), names: look.names, events }) : null), [day, history, events, look]);
}

const VARIANTS: { id: FrontVariant; label: string }[] = [{ id: 'zeitung', label: 'Zeitung' }, { id: 'sport', label: 'Sport' }, { id: 'poster', label: 'Poster' }];
/** Klartext ohne Hervorhebungs-Sternchen */
export const plain = (s: string) => s.replace(/\*/g, '');

/** Titelseite eines Abends, bildschirmfüllend, mit Wahl der Seite und Teilen als Bild */
export function FrontView() {
  const { front } = useApp(), fp = useFront(front), look = useLook();
  const [v, setV] = useState<FrontVariant | null>(null);
  const [busy, setBusy] = useState(false);
  if (!fp) return null;
  const variant = v ?? fp.variant, svg = frontSvg(fp, variant, look);
  const share = async () => {
    setBusy(true);
    try {
      const blob = await frontPng(svg), file = new File([blob], `oina-no-${fp.day}.png`, { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) await nav.share({ files: [file], title: plain(fp.lead.headline) });
      else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
    } catch { /* abgebrochen */ } finally { setBusy(false); }
  };
  return (
    <div className="front-ov" role="dialog" aria-label="Titelseite">
      <div className="front-top">
        <button className="icon-btn" onClick={() => { setV(null); act().openFront(null); }} aria-label="Schließen"><IconClose /></button>
        <div className="seg front-seg">
          {VARIANTS.map(x => <button key={x.id} aria-pressed={variant === x.id} data-variant={x.id} onClick={() => setV(x.id)}>{x.label}</button>)}
        </div>
        <span className="icon-btn ghost" aria-hidden="true" />
      </div>
      <div className="front-page" id="front-page" dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="front-actions">
        <button className="primary" id="front-share" disabled={busy} onClick={share}>{busy ? 'Einen Moment' : 'Teilen'}</button>
      </div>
    </div>
  );
}

/** Verlauf: Titelseiten der letzten Abende zum Durchwischen */
export function FrontStrip() {
  const { history, events } = useApp(), look = useLook();
  const list = useMemo(() => evenings(history).slice(-12).reverse()
    .map(e => frontPage(history, e.day, { level: quipLevel(), names: look.names, events })).filter((x): x is FP => !!x), [history, events, look]);
  if (!list.length) return null;
  return (
    <div className="group">
      <div className="eyebrow">Titelseiten</div>
      <div className="front-strip" id="front-strip">
        {list.map(fp => (
          <button key={fp.day} className="front-mini" onClick={() => act().openFront(fp.day)}>
            <small>{dateShort(fp.day + 'T12:00:00')}</small>
            <b>{plain(fp.lead.headline)}</b>
          </button>
        ))}
      </div>
    </div>
  );
}
