import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { act, useApp, type Edit } from '../store';
import {
  anyScore, catTurn, hasPhases, isCats, phaseIn, phasesDone, upperSum, roundFull, canAddRound, bidPhase, isResultOnly, unitOf, fieldOf, inputOrder, isBids, defaultRef, endState, liveRounds, nextStep, ranking, roundNumber, scoreOf, seated, totals,
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
  if (isCats(g)) return `Zug von ${seated(g)[catTurn(g)].name}`;
  if (isResultOnly(g)) return 'Endstand';
  if (isBids(g) && end.type === 'rounds') return `Runde ${n} von ${end.value}, ${bidPhase(g, liveRounds(g)[n - 1].id) === 'bid' ? 'Ansagen' : 'Stiche'}`;
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
      {s.sheet === 'cats' && <CatSheet g={g} />}
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
          {rounds.map((r, ri) => (<Fragment key={r.id}>
            <tr key={r.id} className={isBids(g) && ri === currentRoundIndex(g) ? 'cur' : ''}>
              {r.cat ? <th className="cat">{r.cat.label}{r.cat.fixed ? <small>{r.cat.fixed} Punkte</small> : null}</th> : <th className="rn">{ri + 1}</th>}
              {players.map(p => {
                const v = scoreOf(g, r.id, p.id);
                const active = !!edit && edit.ref === r.id && edit.playerId === p.id;
                const cls = ['cell', v === null ? 'empty' : '', v !== null && v < 0 ? 'neg' : '', v === 0 ? 'zero' : '', active ? 'active' : ''].join(' ');
                if (isBids(g)) {
                  const b = fieldOf(g, r.id, p.id, 'bid'), t2 = fieldOf(g, r.id, p.id, 'tricks'), has = b !== null || t2 !== null;
                  return (
                    <td key={p.id} className={'cell ' + (has ? 'pend' : 'empty') + (v !== null && v < 0 ? ' neg' : '')} onClick={() => act().openPad(r.id, p.id)} aria-label={`${p.name}, Runde ${ri + 1}`}>
                      {v === null ? '' : (v > 0 ? '+' : '') + fmt(v)}{has && <small>{b ?? '–'}/{t2 ?? '–'}</small>}
                    </td>
                  );
                }
                return <td key={p.id} className={cls} onClick={() => act().openPad(r.id, p.id)} aria-label={`${p.name}, Runde ${ri + 1}`}>{v === null ? '' : fmt(v)}</td>;
              })}
            </tr>
            {r.cat?.section === 'up' && rounds[ri + 1]?.cat?.section !== 'up' && g.game.rules.params?.bonus && (<>
              <tr className="calc"><th className="cat">Summe oben</th>{players.map(p => { const u = upperSum(g, p.id); return <td key={p.id} className={u.bonus ? 'hit' : ''}>{u.sum}/{g.game.rules.params!.bonus!.at}</td>; })}</tr>
              <tr className="calc"><th className="cat">Bonus</th>{players.map(p => { const u = upperSum(g, p.id); return <td key={p.id} className={u.bonus ? 'hit' : ''}>{u.bonus ? '+' + u.bonus : '–'}</td>; })}</tr>
            </>)}
          </Fragment>))}
          {!isBids(g) && !isResultOnly(g) && canAddRound(g) && rounds.length > 0 && roundFull(g, rounds[rounds.length - 1].id) && (
            <tr className="new-row">
              <th className="rn">{rounds.length + 1}</th>
              {players.map(p => {
                const active = !!edit && edit.ref === 'new' && edit.playerId === p.id;
                return <td key={p.id} className={'cell empty' + (active ? ' active' : '')} onClick={() => act().openPad('new', p.id)} aria-label={`${p.name}, Runde ${rounds.length + 1}`} />;
              })}
            </tr>
          )}
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
        : <button className="primary" id="round-go" onClick={() => act().roundGo()}>{step.field === 'bid' ? `Ansagen Runde ${step.roundNo}` : step.field === 'tricks' ? `Stiche Runde ${step.roundNo}` : isCats(g) ? `Zug von ${seated(g)[step.playerIndex].name}` : isResultOnly(g) ? 'Ergebnis eintragen' : `Runde ${step.roundNo} eintragen`}</button>}
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
      {isBids(g) && ref !== 'new' ? <BidEntry g={g} p={p} roundId={ref} edit={edit} /> : <div className="pp-entry">
        <div>{isResultOnly(g) ? <div className="lbl">{unitOf(g)}</div> : isCats(g) && ref !== 'new' ? <div className="lbl">{liveRounds(g).find(r => r.id === ref)?.cat?.label}</div> : <div className="lbl">Runde {roundNumber(g, ref)}</div>}</div>
        <span className={'val' + (value === null ? ' ph' : '') + (value !== null && value < 0 ? ' neg' : '')}>
          {value === null ? (edit?.buf === '-' ? '−' : '0') : fmt(value)}
        </span>
      </div>}
      {hasPhases(g) && <PhaseCard g={g} p={p} roundRef={ref} active={!!edit} />}
      {zeroSumHint(g, ref)}
      {isCats(g) && <CatList g={g} p={p} current={ref} onPick={pick} />}
      {!isResultOnly(g) && !isCats(g) && <div className="eyebrow">Verlauf</div>}
      <div className={'pp-hist' + (isResultOnly(g) || isCats(g) ? ' hide' : '')}>
        {rounds.map((r, k) => {
          const v = scoreOf(g, r.id, p.id);
          if (isBids(g)) {
            const b = fieldOf(g, r.id, p.id, 'bid'), t2 = fieldOf(g, r.id, p.id, 'tricks');
            if (k > currentRoundIndex(g) && b === null) return null;
            return <button key={r.id} aria-current={r.id === ref} onClick={() => pick(r.id)}><small>R{k + 1} {b ?? '–'}/{t2 ?? '–'}</small><b>{v === null ? '–' : (v > 0 ? '+' : '') + fmt(v)}</b></button>;
          }
          return <button key={r.id} aria-current={r.id === ref} onClick={() => pick(r.id)}><small>R{k + 1}</small><b>{v === null ? '–' : fmt(v)}</b></button>;
        })}
        {ref === 'new' && <button aria-current="true"><small>R{rounds.length + 1}</small><b>neu</b></button>}
      </div>
    </>
  );
}

// ---------------------------------------------------------------- Ziffernblock der Spielerseite

function Keypad({ g, edit, canUndo }: { g: GameState; edit: Edit; canUndo: boolean }) {
  const players = seated(g), i = players.findIndex(p => p.id === edit.playerId);
  const a = act();
  const d = (n: number) => <button key={n} className="key" onClick={() => a.digit(n)}>{n}</button>;
  const bids = !!edit.field && edit.ref !== 'new';
  const order = bids ? inputOrder(g, edit.ref as string) : null;
  const nextP2 = players[order ? order[order.indexOf(i) + 1] : i + 1];
  const cards = bids ? roundNumber(g, edit.ref) : 0;
  return (
    <div className="pp-panel">
      {bids ? (
        <div className="quick bids">
          {Array.from({ length: cards + 1 }, (_, k) => <button key={k} onClick={() => a.pick(k)}>{k}</button>)}
        </div>
      ) : <div className="quick">
        {(isCats(g) ? catKeys(g, edit.ref) : quickKeys(g)).map(k => (
          <button key={k.label} className={k.op === 'set' && k.label.length > 2 ? 'strike wide' : k.v < 0 ? 'strike' : ''}
            onClick={() => (k.op === 'add' ? a.add(k.v) : k.op === 'mul' ? a.mul(k.v) : a.setValue(k.v))}>{k.label}</button>
        ))}
      </div>}
      <div className="keys pp-keys">
        {d(1)}{d(2)}{d(3)}<button className="key fn" onClick={a.back} aria-label="Löschen"><IconBackspace /></button>
        {d(4)}{d(5)}{d(6)}<button className="key fn" onClick={a.clear} style={{ fontFamily: 'var(--f-body)', fontSize: 15 }}>Leeren</button>
        {d(7)}{d(8)}{d(9)}
        <button className="key go" onClick={a.next}>
          {nextP2 ? 'Weiter' : 'Fertig'}
          <span className="go-to">{nextP2 && <i style={css({ '--c': nextP2.color })} />}<span>{nextP2 ? nextP2.name : 'Überblick'}</span></span>
        </button>
        {bids
          ? <button className="key fn" id="field-toggle" onClick={() => a.selectField(edit.field === 'bid' ? 'tricks' : 'bid')} style={{ fontFamily: 'var(--f-body)', fontSize: 14 }}>{edit.field === 'bid' ? 'Stiche' : 'Ansage'}</button>
          : <button className="key fn" onClick={a.sign} aria-label="Vorzeichen">±</button>}{d(0)}
        <button className="key fn" onClick={a.undo} disabled={!canUndo} aria-label="Rückgängig"><IconUndo /></button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Wizard: Ansage und Stiche

function BidEntry({ g, p, roundId, edit }: { g: GameState; p: Player; roundId: string; edit: Edit | null }) {
  const players = seated(g), rounds = liveRounds(g), ri = rounds.findIndex(r => r.id === roundId), cards = ri + 1;
  const field = edit?.field ?? (fieldOf(g, roundId, p.id, 'bid') === null ? 'bid' : 'tricks');
  const val = (f: 'bid' | 'tricks') => (edit && edit.field === f ? numOf(edit.buf) : fieldOf(g, roundId, p.id, f));
  const sc = scoreOf(g, roundId, p.id);
  const sum = (f: 'bid' | 'tricks') => players.reduce((a, x) => a + (fieldOf(g, roundId, x.id, f) ?? 0), 0);
  const allTricks = players.every(x => fieldOf(g, roundId, x.id, 'tricks') !== null);
  const phase = bidPhase(g, roundId), sb = sum('bid'), stt = sum('tricks');
  const wrong = phase === 'tricks' && allTricks && stt !== cards;
  const hint = phase === 'bid' ? `Angesagt sind ${sb} von ${cards}` : wrong ? `Stiche ergeben ${stt} statt ${cards}` : `Angesagt ${sb}, geholt ${stt} von ${cards}`;
  const box = (f: 'bid' | 'tricks', label: string) => {
    const v = val(f);
    return (
      <button className="wz-f" aria-pressed={f === field} onClick={() => { if (edit) act().selectField(f); }}>
        <small>{label}</small><b className={v === null ? 'ph' : ''}>{v === null ? '–' : v}</b>
      </button>
    );
  };
  return (
    <div className="pp-entry wz">
      <div className="wz-top">
        <div><div className="lbl">Runde {ri + 1} mit {cards} {cards === 1 ? 'Karte' : 'Karten'}</div><small>{players[ri % players.length].name} gibt</small></div>
        <span className={'wz-sc' + (sc !== null && sc < 0 ? ' neg' : '')}>{sc === null ? '' : (sc > 0 ? '+' : '') + fmt(sc)}</span>
      </div>
      <div className="wz-fields">{box('bid', 'Ansage')}{box('tricks', 'Stiche')}</div>
      <div className={'wz-hint' + (wrong ? ' warn' : '')}>{hint}</div>
    </div>
  );
}

// ---------------------------------------------------------------- Kniffel, Phase 10, Nullsumme

/** Schnelltasten einer Kategorie: Vielfache, fester Wert und Streichen */
function catKeys(g: GameState, ref: RoundRef): QuickKey[] {
  const cat = ref === 'new' ? undefined : liveRounds(g).find(r => r.id === ref)?.cat;
  const vals = cat?.quick ?? (cat?.fixed ? [cat.fixed] : []);
  return [...vals.filter(v => v > 0).map(v => ({ label: String(v), op: 'set' as const, v })), { label: 'Streichen', op: 'set' as const, v: 0 }];
}

function CatList({ g, p, current, onPick }: { g: GameState; p: Player; current: RoundRef; onPick: (r: RoundRef) => void }) {
  const rounds = liveRounds(g), u = upperSum(g, p.id), b = g.game.rules.params?.bonus;
  return (
    <div className="pp-cats">
      {rounds.map((r, i) => {
        const v = scoreOf(g, r.id, p.id);
        return (
          <Fragment key={r.id}>
            <button className="pp-cat" aria-current={r.id === current} onClick={() => onPick(r.id)}>
              <span>{r.cat?.label}</span><span className="v">{v === null ? '–' : fmt(v)}</span>
            </button>
            {b && r.cat?.section === 'up' && rounds[i + 1]?.cat?.section !== 'up' && (
              <div className={'pp-cat calc' + (u.bonus ? ' hit' : '')}><span>Oben {u.sum} von {b.at}</span><span>Bonus {u.bonus ? '+' + u.bonus : '–'}</span></div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

const PHASES = ['2 Drillinge', '1 Drilling und 1 Viererfolge', '1 Vierling und 1 Viererfolge', '1 Siebenerfolge', '1 Achterfolge',
  '1 Neunerfolge', '2 Vierlinge', '7 Karten einer Farbe', '1 Fünfling und 1 Zwilling', '1 Fünfling und 1 Drilling'];

function PhaseCard({ g, p, roundRef, active }: { g: GameState; p: Player; roundRef: RoundRef; active: boolean }) {
  const rounds = liveRounds(g), ri = roundRef === 'new' ? rounds.length : rounds.findIndex(r => r.id === roundRef);
  const before = phasesDone(g, p.id, ri), total = phasesDone(g, p.id), attempt = Math.min(before + 1, 10);
  const ticked = roundRef !== 'new' && phaseIn(g, roundRef, p.id);
  return (
    <div className="ph-card" style={css({ '--c': p.color, '--on': onColor(p.color) })}>
      <div className="ph-dots">{Array.from({ length: 10 }, (_, k) => <i key={k} className={k < total ? 'on' : k === total ? 'now' : ''} />)}</div>
      <div className="ph-now"><small>Phase {attempt}</small><b>{PHASES[attempt - 1]}</b></div>
      <button className="ph-toggle" id="phase-toggle" aria-pressed={ticked} disabled={!active} onClick={() => act().togglePhase()}>{ticked ? 'Geschafft' : 'Geschafft?'}</button>
    </div>
  );
}

/** Nullsumme (Schafkopf, Doppelkopf): Hinweis, wenn eine volle Runde nicht 0 ergibt */
function zeroSumHint(g: GameState, ref: RoundRef) {
  if (!g.game.rules.params?.zeroSum || ref === 'new' || !roundFull(g, ref)) return null;
  const sum = seated(g).reduce((a, p) => a + (scoreOf(g, ref, p.id) ?? 0), 0);
  return sum === 0 ? null : <div className="zs-hint">Die Runde ergibt {fmt(sum)} statt 0</div>;
}

/** Kniffel: Kategorien der laufenden Partie verwalten */
function CatSheet({ g }: { g: GameState }) {
  const [label, setLabel] = useState('');
  const [section, setSection] = useState<'up' | 'low'>('low');
  const [fixed, setFixed] = useState('');
  const rounds = liveRounds(g);
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    act().addCategory({ label, section, ...(parseInt(fixed, 10) > 0 ? { fixed: parseInt(fixed, 10) } : {}) });
    setLabel(''); setFixed('');
  };
  return (
    <>
      <div className="scrim" onClick={() => act().closeSheet()} />
      <div className="bsheet" role="dialog" aria-label="Kategorien">
        <div className="grab" />
        <div className="sheet-body">
          <h3>Kategorien</h3>
          <div className="menu-list cat-edit">
            {rounds.map(r => (
              <div key={r.id} className="cat-row"><span>{r.cat?.label}</span><small>{r.cat?.section === 'up' ? 'oben' : 'unten'}</small>
                <button aria-label={`${r.cat?.label} entfernen`} onClick={() => act().removeCategory(r.id)}>✕</button></div>
            ))}
          </div>
          <form className="cat-add" onSubmit={add}>
            <input id="cat-name" value={label} onChange={e => setLabel(e.target.value)} placeholder="Neue Kategorie" maxLength={24} autoComplete="off" />
            <input id="cat-fixed" value={fixed} onChange={e => setFixed(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="Punkte" inputMode="numeric" aria-label="Feste Punkte" />
            <div className="seg"><button type="button" aria-pressed={section === 'up'} onClick={() => setSection('up')}>Oben</button><button type="button" aria-pressed={section === 'low'} onClick={() => setSection('low')}>Unten</button></div>
            <button className="primary" type="submit" disabled={!label.trim()}>Hinzufügen</button>
          </form>
        </div>
      </div>
    </>
  );
}
