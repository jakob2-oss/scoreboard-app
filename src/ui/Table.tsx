import { useMemo, useRef, useState } from 'react';
import { act, useApp } from '../store';
import { endState, isLives, lifeState, seated, tableRounds, tokenState, type GameState } from '../game/engine';
import type { Player } from '../model/types';
import { Avatar } from './Avatar';
import { IconUndo } from './icons';
import { middleCards, room, SEATS, stack, TABLE, VIEW } from './table';

/** Platz i von n auf der Sitz-Ellipse, unten beginnend im Uhrzeigersinn (in viewBox-Koordinaten) */
function seatPos(i: number, n: number) {
  const a = Math.PI / 2 + (i / n) * Math.PI * 2;
  return { x: TABLE.cx + SEATS.rx * Math.cos(a), y: TABLE.cy + SEATS.ry * Math.sin(a) };
}

const BUOY = `<svg viewBox="-12 -12 24 24" aria-hidden="true"><circle r="11" fill="#fffaf2"/>${[0, 1, 2, 3].map(k => {
  const a0 = k * Math.PI / 2 + .4, a1 = a0 + .75;
  return `<path d="M0 0L${11 * Math.cos(a0)} ${11 * Math.sin(a0)}A11 11 0 0 1 ${11 * Math.cos(a1)} ${11 * Math.sin(a1)}z" fill="#ef7a5c"/>`;
}).join('')}<circle r="5.5" fill="#97c4e3"/></svg>`;
const DECKEL = '<svg viewBox="-10 -10 20 20" aria-hidden="true"><circle r="9.5" fill="#fffaf2"/><circle r="7.5" fill="#f3a98f"/><circle r="4.4" fill="#fffaf2"/></svg>';

/** Tisch-Modus: Spieler sitzen um den Tisch, Antippen verteilt Leben bzw. Deckel, Ziehen tauscht Plätze */
export function TableView({ g }: { g: GameState }) {
  const s = useApp();
  const players = seated(g), n = players.length, lives = isLives(g);
  const ls = lives ? lifeState(g) : null, ts = lives ? null : tokenState(g);
  const done = !!endState(g)?.done;
  const rounds = tableRounds(g).length;
  const scene = useMemo(() => room(lives ? 'lives' : 'tokens'), [lives]);
  const middle = lives ? middleCards(rounds) : stack(ts!.middle);

  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ i: number; x0: number; y0: number; moved: boolean; id: number } | null>(null);
  const [off, setOff] = useState<{ i: number; dx: number; dy: number; to: number } | null>(null);
  // Nach dem Ziehen löst der Browser manchmal noch einen Klick aus; der zählt nicht als Antippen
  const dragEnd = useRef(0);

  const nearest = (i: number, dx: number, dy: number) => {
    const el = stage.current; if (!el) return i;
    const k = VIEW.w / el.clientWidth, p = seatPos(i, n), x = p.x + dx * k, y = p.y + dy * k;
    let best = i, bd = Infinity;
    for (let j = 0; j < n; j++) { const q = seatPos(j, n), d = (q.x - x) ** 2 + (q.y - y) ** 2; if (d < bd) { bd = d; best = j; } }
    return best;
  };
  const down = (i: number) => (e: React.PointerEvent) => {
    drag.current = { i, x0: e.clientX, y0: e.clientY, moved: false, id: e.pointerId }; dragEnd.current = 0;
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current; if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
    if (!d.moved && dx * dx + dy * dy < 100) return;
    if (!d.moved) { d.moved = true; (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); }
    setOff({ i: d.i, dx, dy, to: nearest(d.i, dx, dy) });
  };
  const up = (e: React.PointerEvent) => {
    const d = drag.current; drag.current = null;
    if (!d || !d.moved) return;
    dragEnd.current = performance.now();
    const to = nearest(d.i, e.clientX - d.x0, e.clientY - d.y0);
    setOff(null);
    if (to !== d.i) act().moveSeat(d.i, to);
  };
  const tap = (p: Player) => {
    if (performance.now() - dragEnd.current < 350) return;
    if (!done) act().tableTap(p.id);
  };

  return (
    <div className={'tbl' + (s.fireMode ? ' fire' : '')}>
      <div className="tbl-stage" ref={stage}>
        <svg className="tbl-art" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} aria-hidden="true">
          <g dangerouslySetInnerHTML={{ __html: scene }} />
          <g key={lives ? rounds : ts!.middle} className="tb-mid-art" dangerouslySetInnerHTML={{ __html: middle }} />
        </svg>
        {ts && ts.middle > 0 && <div className="tb-count" style={{ left: `${(TABLE.cx - 18) / VIEW.w * 100}%`, top: `${(TABLE.cy - Math.min(ts.middle, 13) * 2.6 + 2.6) / VIEW.h * 100}%` }}>{ts.middle}</div>}
        {players.map((p, i) => {
          const pos = seatPos(i, n);
          const dragging = off?.i === i, target = off && off.i !== i && off.to === i;
          const out = ls ? ls.out[p.id] !== null : false, swim = ls ? ls.swimming[p.id] : false;
          const hold = ts?.hold[p.id] ?? 0, halves = ts?.halves[p.id] ?? 0;
          const label = ls ? `${p.name}, ${out ? 'raus' : swim ? 'schwimmt' : `${ls.left[p.id]} Leben`}` : `${p.name}, ${hold} Deckel`;
          return (
            <button key={p.id} className={'tb-seat' + (dragging ? ' drag' : '') + (target ? ' target' : '') + (out ? ' out' : '') + (swim ? ' swim' : '')}
              style={{ left: `${pos.x / VIEW.w * 100}%`, top: `${pos.y / VIEW.h * 100}%`, ['--c' as string]: p.color,
                ...(dragging ? { transform: `translate(calc(-50% + ${off.dx}px), calc(-50% + ${off.dy}px)) scale(1.08)` } : {}) }}
              aria-label={label} disabled={done && !dragging}
              onPointerDown={down(i)} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { drag.current = null; setOff(null); }}
              onClick={() => tap(p)}>
              <span className="tb-av"><Avatar p={p} />{swim && <span className="tb-buoy" dangerouslySetInnerHTML={{ __html: BUOY }} />}</span>
              <span className="tb-plate">
                <span className="tb-name">{p.name}</span>
                {ls ? (
                  out ? <span className="tb-state">raus</span>
                    : <span className="tb-coins">{Array.from({ length: ls.lives }, (_, k) => <i key={k} className={k < ls.left[p.id] ? '' : 'gone'} />)}</span>
                ) : (
                  <span className="tb-deck"><span className="tb-dk" key={hold} dangerouslySetInnerHTML={{ __html: DECKEL }} /><b>{hold}</b>
                    {halves > 0 && <span className="tb-halves">{Array.from({ length: halves }, (_, k) => <i key={k} />)}</span>}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Leiste unter dem Tisch: Rückgängig, bei Schwimmen „Feuer“, bei Schocken die Hälften */
export function TableDock({ g, canUndo }: { g: GameState; canUndo: boolean }) {
  const s = useApp(), lives = isLives(g), done = !!endState(g)?.done;
  const undo = <button className="secondary" disabled={!canUndo} onClick={() => act().undo()} aria-label="Rückgängig"><IconUndo /></button>;
  if (done) return <>{undo}<button className="primary" onClick={() => act().openSheet('result')}>Ergebnis</button></>;
  if (lives) return s.fireMode
    ? <><div className="tb-ask">Wer hat Feuer?</div><button className="secondary" onClick={() => act().setFireMode(false)}>Abbrechen</button></>
    : <>{undo}<button className="secondary wide" id="fire" onClick={() => act().setFireMode(true)}>Feuer</button></>;
  const ts = tokenState(g), players = seated(g);
  const loserOf = (h: number) => {
    // Wer hat die h-te Hälfte verloren? Aus der Reihenfolge der Hälften ablesen
    const lost = tableRounds(g).flatMap(r => g.entries.filter(e => !e.deletedAt && e.roundId === r.id && (e.values as { halfLost?: boolean }).halfLost).map(e => e.playerId));
    return players.find(p => p.id === lost[h - 1]);
  };
  return (
    <>{undo}
      <div className="tb-halfs" role="list">
        {[1, 2, 3].map(h => {
          const who = loserOf(h), cur = ts.half === h;
          return <span key={h} role="listitem" className={'tb-half' + (cur ? ' cur' : '') + (who ? ' lost' : '')}>
            {who ? <Avatar p={who} /> : null}{h === 3 ? 'Finale' : `${h}. Hälfte`}</span>;
        })}
      </div>
    </>
  );
}

/** Schocken: wie viele Deckel bekommt der Verlierer, und von wem (wenn die Mitte leer ist) */
export function TokenSheet({ g, to }: { g: GameState; to: string }) {
  const ts = tokenState(g), players = seated(g), p = players.find(x => x.id === to)!;
  const givers = players.filter(x => x.id !== to && ts.hold[x.id] > 0);
  const [from, setFrom] = useState<string | null>(givers.length === 1 ? givers[0].id : null);
  const fromMiddle = ts.middle > 0, ready = fromMiddle || !!from;
  return (
    <>
      <div className="scrim" onClick={() => act().closeSheet()} />
      <div className="bsheet" role="dialog" aria-label={`Deckel für ${p.name}`}>
        <div className="grab" />
        <div className="sheet-body">
          <h3>Deckel für {p.name}</h3>
          {fromMiddle ? <div className="eyebrow">Noch {ts.middle} in der Mitte</div> : <>
            <div className="eyebrow">Von</div>
            <div className="tk-from">
              {givers.map(x => <button key={x.id} aria-pressed={from === x.id} onClick={() => setFrom(x.id)}><Avatar p={x} /><span>{x.name}</span><small>{ts.hold[x.id]}</small></button>)}
            </div>
          </>}
          <div className="tk-keys">
            {[1, 2, 3, 4, 5, 6].map(k => <button key={k} id={`tk-${k}`} disabled={!ready} onClick={() => act().tableGive(k, from)}>{k}</button>)}
            <button className="wide" id="tk-schock" onClick={() => act().tableGive('schock')}>Schock aus</button>
          </div>
        </div>
      </div>
    </>
  );
}
