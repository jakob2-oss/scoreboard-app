import { useMemo, useRef, useState } from 'react';
import { act, useApp } from '../store';
import { endState, halfLabel, isLives, lifeState, seated, tableRounds, tokenState, type GameState } from '../game/engine';
import type { Player } from '../model/types';
import { Avatar } from './Avatar';
import { IconUndo } from './icons';
import { facing, FRONT, middleCards, room, SEATS, seatAngle, stack, TABLE, VIEW } from './table';

/** Platz i von n auf der Sitz-Ellipse, unten beginnend im Uhrzeigersinn (in viewBox-Koordinaten) */
function seatPos(i: number, n: number) {
  const a = seatAngle(i, n);
  // rot: Schild zeigt zum jeweiligen Spieler, damit jeder von seinem Platz aus lesen kann
  return { x: TABLE.cx + SEATS.rx * Math.cos(a), y: TABLE.cy + SEATS.ry * Math.sin(a), rot: facing(a) };
}

const DECKEL = '<svg viewBox="-10 -10 20 20" aria-hidden="true"><circle r="9.5" fill="#efe4cf"/><circle r="7.5" fill="#b5452f"/><circle r="4.4" fill="#efe4cf"/></svg>';

/** Tisch-Modus: Spieler sitzen um den Tisch, Antippen verteilt Leben bzw. Deckel, Ziehen tauscht Plätze */
export function TableView({ g }: { g: GameState }) {
  const s = useApp();
  const players = seated(g), n = players.length, lives = isLives(g);
  const ls = lives ? lifeState(g) : null, ts = lives ? null : tokenState(g);
  const done = !!endState(g)?.done;
  const rounds = tableRounds(g).length;
  const scene = useMemo(() => room(n), [n]);
  // Phase in der Mitte: bei Chic auch, ob aus der Mitte genommen oder zurückgespielt wird
  const step = ts && ts.mode === 'return' ? (ts.phase === 1 ? 'Aus der Mitte' : 'Zurückspielen') : null;
  const phase = lives ? `Runde ${rounds + 1}` : step ? (ts!.need > 1 ? `${halfLabel(ts!.need, ts!.half)}, ${step}` : step) : halfLabel(ts!.need, ts!.half);
  const phaseText = done ? 'Spielende' : phase, pillW = phaseText.length * 9.2 + 28;
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
    <div className={'tbl' + (s.fireMode ? ' fire' : '') + (n > 6 ? ' many' : '')}>
      <div className="tbl-stage" ref={stage}>
        <svg className="tbl-art" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} aria-hidden="true">
          <g dangerouslySetInnerHTML={{ __html: scene }} />
          <g key={lives ? rounds : ts!.middle} className="tb-mid-art" dangerouslySetInnerHTML={{ __html: middle }} />
          {[0, 180].map(r => (
            <g key={r} transform={`rotate(${r} ${TABLE.cx} ${TABLE.cy})`} className="tb-phase">
              <rect x={TABLE.cx - pillW / 2} y={TABLE.cy + 54} width={pillW} height="22" rx="11" fill="#1c1611" opacity=".55" />
              <text x={TABLE.cx} y={TABLE.cy + 69.5} textAnchor="middle">{phaseText}</text>
            </g>
          ))}
          {players.map((p, i) => <Front key={p.id} i={i} n={n} lives={ls ? { max: ls.lives, left: ls.left[p.id], swim: ls.swimming[p.id] } : null} hold={ts?.hold[p.id] ?? 0} />)}
        </svg>
        {ts && ts.middle > 0 && <div className="tb-count" style={{ left: `${(TABLE.cx - 18) / VIEW.w * 100}%`, top: `${(TABLE.cy - Math.min(ts.middle, 13) * 2.6 + 2.6) / VIEW.h * 100}%` }}>{ts.middle}</div>}
        {players.map((p, i) => {
          const pos = seatPos(i, n);
          const dragging = off?.i === i, target = off && off.i !== i && off.to === i;
          const out = ls ? ls.out[p.id] !== null : !!ts?.out[p.id], swim = ls ? ls.swimming[p.id] : false;
          const hold = ts?.hold[p.id] ?? 0, halves = ts?.halves[p.id] ?? 0;
          const label = ls ? `${p.name}, ${out ? 'raus' : swim ? 'schwimmt' : `${ls.left[p.id]} Leben`}` : (out ? `${p.name}, raus` : `${p.name}, ${hold} Deckel`);
          return (
            <button key={p.id} className={'tb-seat' + (dragging ? ' drag' : '') + (target ? ' target' : '') + (out ? ' out' : '') + (swim ? ' swim' : '')}
              style={{ left: `${pos.x / VIEW.w * 100}%`, top: `${pos.y / VIEW.h * 100}%`, ['--c' as string]: p.color,
                transform: `translate(calc(-50% + ${dragging ? off.dx : 0}px), calc(-50% + ${dragging ? off.dy : 0}px)) rotate(${pos.rot}deg)${dragging ? ' scale(1.08)' : ''}` }}
              aria-label={label} disabled={done && !dragging}
              onPointerDown={down(i)} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { drag.current = null; setOff(null); }}
              onClick={() => tap(p)}>
              <span className="tb-av"><Avatar p={p} /></span>
              <span className="tb-plate">
                <span className="tb-name">{p.name}</span>
                {ls ? (
                  <span className="tb-state">{out ? 'raus' : swim ? 'schwimmt' : `${ls.left[p.id]} Leben`}</span>
                ) : (
                  out ? <span className="tb-state">{ts?.gone[p.id] ? 'rausgeschickt' : 'raus'}</span> : <span className="tb-deck"><span className="tb-dk" key={hold} dangerouslySetInnerHTML={{ __html: DECKEL }} /><b>{hold}</b>
                    {halves > 0 && <span className="tb-halves">{Array.from({ length: halves }, (_, k) => <i key={k} />)}</span>}</span>
                )}
                {!!ts?.chic[p.id] && <span className="tb-chic">{ts.chic[p.id] > 1 ? `zahlt ${ts.chic[p.id]}×` : 'zahlt'}</span>}
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
        {halfRange(ts.need, ts.half).map(h => {
          const who = loserOf(h), cur = ts.half === h;
          return <span key={h} role="listitem" className={'tb-half' + (cur ? ' cur' : '') + (who ? ' lost' : '')}>
            {who ? <Avatar p={who} /> : null}{halfLabel(ts.need, h)}</span>;
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
  // Chic, zweite Phase: der Angetippte spielt eigene Deckel zurück in die Mitte
  if (ts.mode === 'return' && ts.phase === 2) return (
    <>
      <div className="scrim" onClick={() => act().closeSheet()} />
      <div className="bsheet" role="dialog" aria-label={`${p.name} spielt zurück`}>
        <div className="grab" />
        <div className="sheet-body">
          <h3>{p.name} spielt zurück</h3>
          <div className="eyebrow">Noch {ts.hold[to]} Deckel</div>
          <div className="tk-keys">
            {[1, 2, 3, 4, 5, 6].map(k => <button key={k} id={`tk-${k}`} disabled={k > ts.hold[to]} onClick={() => act().tableGive(k)}>{k}</button>)}
            <button className="wide" id="tk-all" onClick={() => act().tableGive('all')}>Alle</button>
          </div>
          {!!g.game.rules.params?.chic && <div className="tk-chic">
            <button id="tk-sendout" onClick={() => act().tableChic('out')}>Rausgeschickt</button>
            <button id="tk-chicloss" onClick={() => act().tableChic('loss')}>Chic aus dem Rohr</button>
          </div>}
        </div>
      </div>
    </>
  );
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
          {!!g.game.rules.params?.chic && <div className="tk-chic">
            <button id="tk-sendout" onClick={() => act().tableChic('out')}>Rausgeschickt</button>
            <button id="tk-chicloss" onClick={() => act().tableChic('loss')}>Chic aus dem Rohr</button>
          </div>}
        </div>
      </div>
    </>
  );
}

/** Was vor einem Spieler auf dem Tisch liegt: Münzen als Leben (Schwimmen) bzw. sein Deckelstapel (Schocken) */
function Front({ i, n, lives, hold }: { i: number; n: number; lives: { max: number; left: number; swim: boolean } | null; hold: number }) {
  const a = seatAngle(i, n);
  const x = TABLE.cx + FRONT.rx * Math.cos(a), y = TABLE.cy + FRONT.ry * Math.sin(a);
  const rot = facing(a);
  if (lives) {
    const m = lives.max, gap = Math.min(22, 60 / Math.max(1, m - 1));
    return (
      <g transform={`translate(${x} ${y}) rotate(${rot})`}>
        {Array.from({ length: m }, (_, k) => {
          const cx = (k - (m - 1) / 2) * gap, on = k < lives.left;
          return <g key={k} transform={`translate(${cx} 0)`}><g className={'tb-coin' + (on ? '' : ' gone')}>
            <circle cx="1.5" cy="2.5" r="10" fill="#000" opacity=".35" />
            <circle r="10" fill="#b8913f" /><circle r="7.8" fill="#e2c068" /><circle r="4" fill="#c9a24e" />
            <rect x="-4.5" y="-5.5" width="3" height="1.6" rx=".8" fill="#fff4cf" opacity=".7" transform="rotate(-30)" />
          </g></g>;
        })}
        {lives.swim && <g className="tb-wave">{[-1, 1].map(k => <path key={k} d={`M-20 ${k * 5}q5-5 10 0t10 0 10 0 10 0`} fill="none" stroke="#7fb8c9" strokeWidth="2.6" strokeLinecap="round" />)}</g>}
      </g>
    );
  }
  // Jeder Deckel liegt einzeln, leicht überlappend in Reihen zu fünf, zum Spieler hin
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {Array.from({ length: hold }, (_, k) => {
        const row = Math.floor(k / 5), col = k % 5, inRow = Math.min(5, hold - row * 5);
        const dx = (col - (inRow - 1) / 2) * 15 + (row % 2) * 4, dy = -row * 16;
        return <g key={k} className="tb-coaster" transform={`translate(${dx} ${dy}) rotate(${(k * 37) % 24 - 12})`}>
          <circle cx="1.5" cy="2.5" r="10" fill="#000" opacity=".3" />
          <circle r="10" fill="#f3ead6" /><circle r="8" fill="#b5452f" /><circle r="5.4" fill="#f3ead6" />
        </g>;
      })}
    </g>
  );
}

/** Welche Hälften unten stehen: bei zwei Hälften mit Finale alle drei, sonst bis zu vier rund um die laufende */
function halfRange(need: number, half: number): number[] {
  const top = need === 2 ? 3 : Math.max(need, half), from = Math.max(1, top - 3);
  return Array.from({ length: top - from + 1 }, (_, k) => from + k);
}
