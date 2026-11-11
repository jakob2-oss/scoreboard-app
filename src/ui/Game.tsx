import { useEffect, useLayoutEffect, useRef } from 'react';
import { act, useApp, type Edit } from '../store';
import {
  anyScore, defaultRef, endState, liveRounds, nextStep, ranking, roundNumber, scoreOf, seated, totals,
  currentRoundIndex, type GameState, type RoundRef
} from '../game/engine';
import { fmt, onColor } from '../lib/color';
import { stepsOf } from '../game/templates';
import type { Player, QuickKey } from '../model/types';
import { Avatar } from './Avatar';
import { Crown, IconBack, IconBackspace, IconDots, IconGrid, IconUndo } from './icons';
import { MenuSheet, PadSheet, ResultSheet } from './Sheets';

const css = (vars: Record<string, string>) => vars as React.CSSProperties;
const numOf = (buf: string) => (buf === '' || buf === '-' ? null : parseInt(buf, 10));

/** Schnelltasten aus den Zählschritten der Vorlage: −10 −5 −1 +1 +5 +10 */
export function quickKeys(g: GameState): QuickKey[] {
  const own = g.game.rules.params?.quick;
  if (own && own.length) return own;
  const s = [...stepsOf(g.game.rules)].sort((a, b) => a - b);
  return [...s].reverse().map(n => -n).concat(s).map(n => ({ label: n > 0 ? '+' + n : '\u2212' + -n, op: 'add' as const, v: n }));
}

function subtitle(g: GameState): string {
  const end = g.game.rules.end, n = currentRoundIndex(g) + 1;
  if (end.type === 'rounds') return `Runde ${n} von ${end.value}`;
  if (end.type === 'target') return `Runde ${n}, Ziel ${end.value}`;
  return `Runde ${n}`;
}

export function GameScreen() {
  const s = useApp();
  const g = s.game!;
  const players = seated(g);
  const swipe = useRef<HTMLDivElement>(null);
  const settle = useRef<number>();
  const padRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLElement>(null);

  // Seite per Code ansteuern (Knöpfe, Punkte, Weiter)
  const first = useRef(true);
  useLayoutEffect(() => {
    const sw = swipe.current; if (!sw) return;
    const left = (s.page + 1) * sw.clientWidth;
    if (Math.abs(sw.scrollLeft - left) < 2) { first.current = false; return; }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    sw.scrollTo({ left, behavior: first.current || reduce ? 'auto' : 'smooth' });
    first.current = false;
  }, [s.page]);

  // Wischen: nach dem Einrasten die Seite übernehmen
  const onScroll = () => {
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      const sw = swipe.current; if (!sw || !sw.isConnected || !sw.clientWidth) return;
      const i = Math.round(sw.scrollLeft / sw.clientWidth) - 1;
      if (i !== s.page) act().goPage(i);
    }, 90);
  };
  useEffect(() => () => window.clearTimeout(settle.current), []);

  // Platz für den Ziffernblock im Bottom-Sheet freihalten
  useLayoutEffect(() => {
    const el = screenRef.current; if (!el) return;
    el.style.paddingBottom = s.pad && padRef.current ? padRef.current.offsetHeight + 'px' : '';
  });

  const end = endState(g);
  return (
    <section className={'screen' + (s.pad ? ' pad-open' : '')} id="s-game" ref={screenRef}>
      <div className="top gutter">
        <button className="icon-btn" onClick={() => act().goHome()} aria-label="Zum Start"><IconBack /></button>
        <div className="grow"><h2>{g.game.rules.name}</h2><div className="sub">{subtitle(g)}</div></div>
        <button className="text-btn" onClick={() => act().openSheet('result')}>Beenden</button>
        <button className="icon-btn" onClick={() => act().openSheet('menu')} aria-label="Menü"><IconDots /></button>
      </div>

      <div className="sheet-wrap pp-mode">
        <div className="pp-tabs gutter" role="tablist">
          <button className="pp-tab" role="tab" aria-label="Überblick" aria-current={s.page === -1} onClick={() => act().goPage(-1)}><IconGrid /></button>
          {players.map((p, i) => (
            <button key={p.id} className="pp-tab" role="tab" aria-label={p.name} aria-current={s.page === i}
              style={css({ '--c': p.color })} onClick={() => act().goPage(i)}><span className="dot" /></button>
          ))}
        </div>
        <div className="pp-swipe" ref={swipe} onScroll={onScroll}>
          <section className="pp-page ov" aria-label="Überblick"><div className="ov-scroll"><Board g={g} edit={s.pad ? s.edit : null} /></div></section>
          {players.map((p, i) => (
            <section key={p.id} className="pp-page gutter" aria-label={p.name} style={css({ '--c': p.color })}>
              <PlayerPage g={g} p={p} i={i} edit={s.page === i ? s.edit : null} />
            </section>
          ))}
        </div>
      </div>

      {end && !s.pad && (
        <div className="banner gutter">
          <div className="grow"><b>{end.done ? 'Spielende erreicht' : 'Fast geschafft'}</b><br /><span>{end.text}</span></div>
          {end.done && <button onClick={() => act().openSheet('result')}>Ergebnis</button>}
        </div>
      )}

      {!s.pad && (
        <div className="dock gutter">
          {s.page < 0 ? <OverviewDock g={g} canUndo={s.undo.length > 0} />
            : s.edit && <Keypad g={g} edit={s.edit} canUndo={s.undo.length > 0} />}
        </div>
      )}

      {s.pad && s.edit && <PadSheet ref={padRef} g={g} edit={s.edit} />}
      {s.sheet === 'menu' && <MenuSheet g={g} />}
      {s.sheet === 'result' && <ResultSheet g={g} />}
    </section>
  );
}

// ---------------------------------------------------------------- Überblick (Spielbrett)

function Board({ g, edit }: { g: GameState; edit: Edit | null }) {
  // Beim Bearbeiten das aktive Feld sichtbar halten
  const tableRef = useRef<HTMLTableElement>(null);
  useEffect(() => {
    if (!edit) return;
    const cell = tableRef.current?.querySelector<HTMLElement>('td.cell.active');
    const box = tableRef.current?.parentElement;
    if (!cell || !box) return;
    const c = cell.getBoundingClientRect(), b = box.getBoundingClientRect(), head = 70;
    if (c.top < b.top + head) box.scrollTop -= b.top + head - c.top;
    else if (c.bottom > b.bottom) box.scrollTop += c.bottom - b.bottom + 8;
  }, [edit?.ref, edit?.playerId]);
  const players = seated(g), rounds = liveRounds(g), t = totals(g), rk = ranking(g), started = anyScore(g);
  const lead = started ? rk.filter(x => x.place === 1).map(x => x.player.id) : [];
  const end = g.game.rules.end;
  return (
    <>
      <table className="grid" ref={tableRef}>
        <thead>
          <tr>
            <th className="corner">#</th>
            {players.map((p, i) => (
              <th key={p.id} onClick={() => act().goPage(i)}><div className="pn"><Avatar p={p} /><span>{p.name}</span></div></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rounds.map((r, ri) => (
            <tr key={r.id}>
              <th className="rn">{ri + 1}</th>
              {players.map(p => {
                const v = scoreOf(g, r.id, p.id);
                const active = !!edit && edit.ref === r.id && edit.playerId === p.id;
                const cls = ['cell', v === null ? 'empty' : '', v !== null && v < 0 ? 'neg' : '', v === 0 ? 'zero' : '', active ? 'active' : ''].join(' ');
                return <td key={p.id} className={cls} onClick={() => act().openPad(r.id, p.id)} aria-label={`${p.name}, Runde ${ri + 1}`}>{v === null ? '' : fmt(v)}</td>;
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th>Σ</th>
            {players.map(p => {
              const x = rk.find(y => y.player.id === p.id)!;
              let meta = started ? `${x.place}. Platz` : ' ';
              if (started && end.type === 'target' && g.game.rules.win === 'high') meta = t[p.id] >= end.value ? 'Ziel erreicht' : `noch ${end.value - t[p.id]}`;
              const isLead = lead.includes(p.id);
              return (
                <td key={p.id} className={isLead ? 'lead' : ''} style={css({ '--c': p.color, '--on': onColor(p.color) })}>
                  <div className="tt"><span className="tot">{fmt(t[p.id])}</span><span className="meta">{isLead && <Crown />}{meta}</span></div>
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </>
  );
}

function OverviewDock({ g, canUndo }: { g: GameState; canUndo: boolean }) {
  const step = nextStep(g);
  return (
    <>
      <button className="secondary" disabled={!canUndo} onClick={() => act().undo()} aria-label="Rückgängig"><IconUndo /></button>
      {step.kind === 'result'
        ? <button className="primary" onClick={() => act().openSheet('result')}>Ergebnis</button>
        : <button className="primary" onClick={() => act().roundGo()}>Runde {step.roundNo} eintragen →</button>}
    </>
  );
}

// ---------------------------------------------------------------- Spielerseite

function PlayerPage({ g, p, i, edit }: { g: GameState; p: Player; i: number; edit: Edit | null }) {
  const t = totals(g), rk = ranking(g), x = rk.find(y => y.player.id === p.id)!, started = anyScore(g);
  const ref: RoundRef = edit ? edit.ref : defaultRef(g, p.id);
  const value = edit ? numOf(edit.buf) : ref === 'new' ? null : scoreOf(g, ref, p.id);
  const end = g.game.rules.end;
  let place = started ? `${x.place}. Platz` : 'Noch keine Punkte';
  if (started && end.type === 'target' && g.game.rules.win === 'high') place += t[p.id] >= end.value ? ', Ziel erreicht' : `, noch ${end.value - t[p.id]} bis ${end.value}`;
  const rounds = liveRounds(g);
  const pick = (r: RoundRef) => (edit ? act().selectRef(r) : act().goPage(i, r));
  return (
    <>
      <div className="pp-hero">
        <div className="who"><Avatar p={p} big /><div><h3>{p.name}</h3><div className="place">{started && x.place === 1 && <Crown />}{place}</div></div></div>
        <div className="score-pill"><small>Punkte</small><b>{fmt(t[p.id])}</b></div>
      </div>
      <div className="pp-entry">
        <div><div className="lbl">Runde {roundNumber(g, ref)}</div><small>{ref === 'new' ? 'neue Runde' : 'Punkte dieser Runde'}</small></div>
        <span className={'val' + (value === null ? ' ph' : '') + (value !== null && value < 0 ? ' neg' : '')}>
          {value === null ? (edit?.buf === '-' ? '−' : '0') : fmt(value)}
        </span>
      </div>
      <div className="eyebrow">Verlauf</div>
      <div className="pp-hist">
        {rounds.map((r, k) => {
          const v = scoreOf(g, r.id, p.id);
          return <button key={r.id} aria-current={r.id === ref} onClick={() => pick(r.id)}><small>R{k + 1}</small><b>{v === null ? '·' : fmt(v)}</b></button>;
        })}
        {ref === 'new' && <button aria-current="true"><small>R{rounds.length + 1}</small><b>neu</b></button>}
      </div>
    </>
  );
}

// ---------------------------------------------------------------- Ziffernblock der Spielerseite

function Keypad({ g, edit, canUndo }: { g: GameState; edit: Edit; canUndo: boolean }) {
  const players = seated(g), i = players.findIndex(p => p.id === edit.playerId), nextP = players[i + 1];
  const a = act();
  const d = (n: number) => <button key={n} className="key" onClick={() => a.digit(n)}>{n}</button>;
  return (
    <div className="pp-panel">
      <div className="quick">
        {quickKeys(g).map(k => (
          <button key={k.label} className={k.op === 'set' ? 'strike wide' : k.v < 0 ? 'strike' : ''}
            onClick={() => (k.op === 'add' ? a.add(k.v) : k.op === 'mul' ? a.mul(k.v) : a.setValue(k.v))}>{k.label}</button>
        ))}
      </div>
      <div className="keys pp-keys">
        {d(1)}{d(2)}{d(3)}<button className="key fn" onClick={a.back} aria-label="Löschen"><IconBackspace /></button>
        {d(4)}{d(5)}{d(6)}<button className="key fn" onClick={a.clear} style={{ fontFamily: 'var(--f-body)', fontSize: 15 }}>Leeren</button>
        {d(7)}{d(8)}{d(9)}
        <button className="key go" onClick={a.next}>
          {nextP ? 'Weiter' : 'Fertig'}
          <span className="go-to">{nextP && <i style={css({ '--c': nextP.color })} />}<span>{nextP ? nextP.name : 'Überblick'}</span></span>
        </button>
        <button className="key fn" onClick={a.sign} aria-label="Vorzeichen">±</button>{d(0)}
        <button className="key fn" onClick={a.undo} disabled={!canUndo} aria-label="Rückgängig"><IconUndo /></button>
      </div>
    </div>
  );
}
