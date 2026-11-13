import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { act, useApp, type Edit } from '../store';
import {
  anyScore, catTurn, hasPhases, isCats, phaseIn, phasesDone, upperSum, roundFull, canAddRound, bidPhase, isResultOnly, unitOf, fieldOf, inputOrder, isBids, defaultRef, endState, liveRounds, nextStep, ranking, roundNumber, scoreOf, seated, totals,
  currentRoundIndex, bidTurn, dealerOf, halfLabel, isTable, isLives, tableRounds, tokenState, isRanks, rankIn, roleOf, fieldsOf, fieldLabel, isSplit, catChoices, notesOf, noteKey, isNoteField, type GameState, type RoundRef
} from '../game/engine';
import { fmt, onColor } from '../lib/color';
import { stepsOf } from '../game/templates';
import type { Player, QuickKey } from '../model/types';
import { Avatar } from './Avatar';
import { Crown, IconBack, IconBackspace, IconDots, IconGrid, IconUndo } from './icons';
import { MenuSheet, PadSheet, ResultSheet } from './Sheets';
import { keepAwake } from '../lib/device';
import { TableDock, TableView, TokenSheet } from './Table';
import { BidBar, MiniHand, TricksSheet } from './Wizard';
import { entryMode } from '../lib/modes';
import { accentStyle } from './accent';

const css = (vars: Record<string, string>) => vars as React.CSSProperties;
const numOf = (buf: string) => (buf === '' || buf === '-' ? null : parseInt(buf, 10));

/** Schnelltasten aus den Zählschritten der Vorlage: −10 −5 −1 +1 +5 +10 */
export function quickKeys(g: GameState): QuickKey[] {
  const p = g.game.rules.params, own = p?.quick;
  const s = [...stepsOf(g.game.rules)].sort((a, b) => a - b);
  let keys: QuickKey[] = own && own.length ? own : [...s].reverse().map(n => -n).concat(s).map(n => ({ label: n > 0 ? '+' + n : '\u2212' + -n, op: 'add' as const, v: n }));
  // Nullsumme: Ausgleich-Taste; eigene Tasten aus dem Erstellungsmodus dahinter
  if (p?.zeroSum && !keys.some(k => k.op === 'rest')) keys = [...keys, { label: 'Ausgleich', op: 'rest', v: 0 }];
  if (p?.keys?.length) keys = [...keys, ...p.keys];
  return keys;
}

function subtitle(g: GameState): string {
  const end = g.game.rules.end, n = currentRoundIndex(g) + 1;
  if (isLives(g)) return `Runde ${tableRounds(g).length + 1}`;
  if (isTable(g)) { const t = tokenState(g); return halfLabel(t.need, t.half); }
  if (isCats(g)) return `Zug von ${seated(g)[catTurn(g)].name}`;
  if (isResultOnly(g)) return 'Endstand';
  // Geber: steht im Untertitel und über seiner Spalte
  const d = dealerOf(g), gives = d ? `, ${d.name} gibt` : '';
  if (isBids(g) && end.type === 'rounds') return `Runde ${n} von ${end.value}${gives}`;
  if (end.type === 'rounds') return `Runde ${n} von ${end.value}${gives}`;
  if (d) return end.type === 'target' ? `Runde ${n}, Ziel ${end.value}${gives}` : `Runde ${n}${gives}`;
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

  const wizBlock = isBids(g) && entryMode(g.game.rules.key) === 'block';
  // Bildschirm bleibt an, solange die Partie offen ist
  useEffect(() => keepAwake(), []);

  const end = endState(g);
  return (
    <section className={'screen' + (s.pad ? ' pad-open' : '') + (wizBlock ? ' wz' : '') + (wizBlock && s.bidBar ? ' bidding' : '')} id="s-game" ref={screenRef} style={accentStyle(g.game.rules.key)}>
      <div className="top gutter">
        <button className="icon-btn" onClick={() => act().goHome()} aria-label="Zum Start"><IconBack /></button>
        <div className="grow"><h2>{g.game.rules.name}</h2><div className="sub">{subtitle(g)}</div></div>
        <button className="text-btn" onClick={() => act().openSheet('result')}>Beenden</button>
        <button className="icon-btn" onClick={() => act().openSheet('menu')} aria-label="Menü"><IconDots /></button>
      </div>

      {isTable(g) ? <TableView g={g} /> : <div className="sheet-wrap pp-mode">
        <div className="pp-tabs gutter" role="tablist">
          <button className="pp-tab" role="tab" aria-label="Überblick" aria-current={s.page === -1} onClick={() => act().goPage(-1)}><IconGrid /></button>
          {players.map((p, i) => (
            <button key={p.id} className="pp-tab" role="tab" aria-label={p.name} aria-current={s.page === i}
              style={css({ '--c': p.color })} onClick={() => act().goPage(i)}><span className="dot" /></button>
          ))}
        </div>
        <div className="pp-swipe" ref={swipe} onScroll={onScroll}>
          <section className="pp-page ov" aria-label="Überblick"><div className="ov-scroll">
            <Board g={g} edit={s.pad ? s.edit : null} /></div></section>
          {players.map((p, i) => (
            <section key={p.id} className="pp-page gutter" aria-label={p.name} style={css({ '--c': p.color })}>
              <PlayerPage g={g} p={p} i={i} edit={s.page === i ? s.edit : null} />
            </section>
          ))}
        </div>
      </div>}

      {end && !s.pad && !isTable(g) && (
        <div className="banner gutter">
          <div className="grow"><b>{end.done ? 'Spielende erreicht' : 'Fast geschafft'}</b><br /><span>{end.text}</span></div>
          {end.done && <button onClick={() => act().openSheet('result')}>Ergebnis</button>}
        </div>
      )}

      {!s.pad && (
        <div className="dock gutter">
          {isTable(g) ? <TableDock g={g} canUndo={s.undo.length > 0} />
            : s.bidBar && s.page < 0 ? <BidBar g={g} roundId={s.bidBar} />
            : s.page < 0 || isRanks(g) ? <OverviewDock g={g} canUndo={s.undo.length > 0} />
            : s.edit && (isCats(g) && s.edit.ref !== 'new' && catChoices(g.rounds.find(r => r.id === s.edit!.ref)?.cat)
              ? <CatPicker g={g} edit={s.edit} canUndo={s.undo.length > 0} />
              : <Keypad g={g} edit={s.edit} canUndo={s.undo.length > 0} />)}
        </div>
      )}

      {s.pad && s.edit && <PadSheet ref={padRef} g={g} edit={s.edit} />}
      {s.sheet === 'menu' && <MenuSheet g={g} />}
      {s.sheet === 'result' && <ResultSheet g={g} />}
      {s.sheet === 'cats' && <CatSheet g={g} />}
      {s.sheet === 'notes' && <NotesSheet g={g} />}
      {s.sheet === 'ranks' && s.rankRef && <RankSheet g={g} roundRef={s.rankRef} />}
      {s.sheet === 'winner' && s.rankRef && <WinnerSheet g={g} roundRef={s.rankRef} />}
      {s.sheet === 'tokens' && s.tokenTo && <TokenSheet key={s.tokenTo} g={g} to={s.tokenTo} />}
      {s.sheet === 'tricks' && s.rankRef && s.rankRef !== 'new' && <TricksSheet key={s.rankRef} g={g} roundId={s.rankRef} />}
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
  const end = g.game.rules.end, dealer = dealerOf(g);
  const blockMode = isBids(g) && entryMode(g.game.rules.key) === 'block', bar = useApp().bidBar;
  // Während der Ansagen: die Zelle dessen, der dran ist, in den sichtbaren Bereich holen
  const turnId = bar ? bidTurn(g, bar) : null;
  useEffect(() => {
    if (!bar) return;
    const cell = tableRef.current?.querySelector<HTMLElement>('td.cell.turn');
    cell?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [bar, turnId]);
  return (
    <>
      <table className="grid" ref={tableRef}>
        <thead>
          <tr>
            <th className="corner">{blockMode ? <MiniHand cards={handCards(g)} /> : '#'}</th>
            {players.map((p, i) => (
              <th key={p.id} onClick={() => act().goPage(i)}><div className="pn"><Avatar p={p} /><span>{p.name}</span>{hasPhases(g) && <small className="ph-n">Phase {Math.min(phasesDone(g, p.id) + 1, 10)}</small>}{dealer?.id === p.id && <small className="dealer-tag">gibt</small>}</div></th>
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
                if (isRanks(g)) {
                  const rk2 = rankIn(g, r.id, p.id), role = rk2 === null ? null : roleOf(rk2, players.length);
                  return (
                    <td key={p.id} className={'cell rank' + (role ? ' r-' + role.short.toLowerCase() : ' empty')} onClick={() => act().openPad(r.id, p.id)} aria-label={`${p.name}, Runde ${ri + 1}`}>
                      {role && <>{role.short}<small>{role.points > 0 ? '+' + role.points : fmt(role.points)}</small></>}
                    </td>
                  );
                }
                const fs = fieldsOf(g);
                if (fs) {
                  const b = fieldOf(g, r.id, p.id, fs[0].key), t2 = fieldOf(g, r.id, p.id, fs[1].key), has = b !== null || t2 !== null;
                  const wiz = isBids(g);
                  // Wizard im Block: Ansage groß, solange die Stiche fehlen; danach Punkte mit Treffer-Punkt und „2 von 2“
                  if (wiz && blockMode) {
                    const turn = bar === r.id && bidTurn(g, r.id) === p.id;
                    return (
                      <td key={p.id} className={'cell wzc ' + (has ? 'pend' : 'empty') + (v !== null && v < 0 ? ' neg' : '') + (turn ? ' turn' : '')}
                        onClick={() => (bar === r.id ? undefined : act().openPad(r.id, p.id))} aria-label={`${p.name}, Runde ${ri + 1}`}>
                        {v !== null ? <>{(v > 0 ? '+' : '') + fmt(v)}<small><i className={b === t2 ? 'hit' : 'miss'} />{t2} {b === t2 ? 'von' : 'statt'} {b}</small></>
                          : b !== null ? <span className="bidn">{b}</span> : turn ? <span className="bidn q">?</span> : ''}
                      </td>
                    );
                  }
                  return (
                    <td key={p.id} className={'cell ' + (has ? 'pend' : 'empty') + (v !== null && v < 0 ? ' neg' : '') + (active ? ' active' : '')} onClick={() => act().openPad(r.id, p.id)} aria-label={`${p.name}, Runde ${ri + 1}`}>
                      {v === null ? (wiz || b === null ? '' : fmt(b)) : (wiz && v > 0 ? '+' : '') + fmt(v)}
                      {has && (wiz ? <small>{b ?? '–'}/{t2 ?? '–'}</small> : v !== null && <small>{fmt(b ?? 0)} + {fmt(t2!)}</small>)}
                    </td>
                  );
                }
                const struck = !!r.cat && v === 0;
                const nts = notesOf(g).map(n => [n, fieldOf(g, r.id, p.id, noteKey(n))] as const).filter(([, x]) => x !== null && x !== 0);
                return <td key={p.id} className={cls + (struck ? ' struck' : '')} onClick={() => act().openPad(r.id, p.id)} aria-label={`${p.name}, ${r.cat ? r.cat.label : 'Runde ' + (ri + 1)}`}>
                  {v === null ? '' : struck ? '–' : fmt(v)}{nts.length > 0 && <small className="nt">{nts.map(([n, x]) => `${n} ${fmt(x!)}`).join(', ')}</small>}</td>;
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
              if (started && end.type === 'target') meta = g.game.rules.win === 'high'
                ? (t[p.id] >= end.value ? 'Ziel erreicht' : `noch ${end.value - t[p.id]}`)
                : (t[p.id] >= end.value ? 'Grenze erreicht' : `noch ${end.value - t[p.id]}`);
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
        : <button className="primary" id="round-go" onClick={() => act().roundGo()}>{step.field ? `${fieldLabel(g, step.field, true)} Runde ${step.roundNo}` : isCats(g) ? `Zug von ${seated(g)[step.playerIndex].name}` : isRanks(g) ? `Runde ${step.roundNo} verteilen` : isResultOnly(g) ? 'Ergebnis eintragen' : `Runde ${step.roundNo} eintragen`}</button>}
    </>
  );
}

// ---------------------------------------------------------------- Spielerseite

function PlayerPage({ g, p, i, edit }: { g: GameState; p: Player; i: number; edit: Edit | null }) {
  const t = totals(g), rk = ranking(g), x = rk.find(y => y.player.id === p.id)!, started = anyScore(g);
  const ref: RoundRef = edit ? edit.ref : defaultRef(g, p.id);
  const noteOn = isNoteField(edit?.field);
  const value = edit && !noteOn ? numOf(edit.buf) : ref === 'new' ? null : scoreOf(g, ref, p.id);
  const end = g.game.rules.end;
  let place = started ? `${x.place}. Platz` : 'Noch keine Punkte';
  if (started && end.type === 'target') place += t[p.id] >= end.value ? (g.game.rules.win === 'high' ? ', Ziel erreicht' : ', Grenze erreicht') : `, noch ${end.value - t[p.id]} bis ${end.value}`;
  const rounds = liveRounds(g);
  const pick = (r: RoundRef) => (edit ? act().selectRef(r) : act().goPage(i, r));
  return (
    <>
      <div className="pp-hero">
        <div className="who"><Avatar p={p} big /><div><h3>{p.name}</h3><div className="place">{started && x.place === 1 && <Crown />}{place}</div></div></div>
        <div className="score-pill"><small>Punkte</small><b>{fmt(t[p.id])}</b></div>
      </div>
      {isRanks(g) ? <RankCard g={g} p={p} /> : isBids(g) && ref !== 'new' ? <BidEntry g={g} p={p} roundId={ref} edit={edit} /> : isSplit(g) ? <SplitEntry g={g} p={p} roundRef={ref} edit={edit} /> : <div className="pp-entry">
        <div>{isResultOnly(g) ? <div className="lbl">{unitOf(g)}</div> : isCats(g) && ref !== 'new' ? <div className="lbl">{liveRounds(g).find(r => r.id === ref)?.cat?.label}</div> : <div className="lbl">Runde {roundNumber(g, ref)}</div>}</div>
        <span className={'val' + (value === null ? ' ph' : '') + (value !== null && value < 0 ? ' neg' : '')}>
          {value === null ? (edit?.buf === '-' ? '−' : isCats(g) ? '–' : '0') : isCats(g) && value === 0 ? '–' : fmt(value)}
        </span>
      </div>}
      {notesOf(g).length > 0 && !isBids(g) && !isSplit(g) && (
        <div className="pp-notes">
          {notesOf(g).map(n => {
            const k = noteKey(n), on = edit?.field === k;
            const v = on ? numOf(edit!.buf) : ref === 'new' ? null : fieldOf(g, ref, p.id, k);
            return (
              <button key={n} className="pp-note" data-note={n} aria-pressed={on}
                onClick={() => (edit ? act().selectField(on ? '' : k) : act().goPage(i, ref, k))}>
                <small>{n}</small><b className={v === null ? 'ph' : ''}>{v === null ? '–' : fmt(v)}</b>
              </button>
            );
          })}
        </div>
      )}
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
          if (isRanks(g)) { const rk2 = rankIn(g, r.id, p.id); return <button key={r.id} onClick={() => act().openRanks(r.id)}><small>R{k + 1}</small><b>{rk2 === null ? '–' : roleOf(rk2, seated(g).length).short}</b></button>; }
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
  const bids = isBids(g) && edit.ref !== 'new';
  const order = edit.field && edit.ref !== 'new' ? inputOrder(g, edit.ref) : null;
  const splitKeys = isSplit(g) ? fieldsOf(g)!.find(f => f.key === edit.field)?.quick : undefined;
  const back = useApp().fromOverview && !isCats(g);
  const nextP2 = back ? undefined : players[order ? order[order.indexOf(i) + 1] : i + 1];
  const cards = bids ? roundNumber(g, edit.ref) : 0;
  return (
    <div className="pp-panel">
      {bids ? (
        <div className="quick bids">
          {Array.from({ length: cards + 1 }, (_, k) => <button key={k} onClick={() => a.pick(k)}>{k}</button>)}
        </div>
      ) : <div className="quick">
        {(isCats(g) ? catKeys(g, edit.ref) : splitKeys ?? quickKeys(g)).map(k => (
          <button key={k.label} className={k.label.length > 3 || ((k.op === 'set' || k.op === 'rest') && k.label.length > 2) ? 'strike wide' : k.v < 0 ? 'strike' : ''}
            onClick={() => (k.op === 'add' ? a.add(k.v) : k.op === 'mul' ? a.mul(k.v) : k.op === 'rest' ? a.rest() : a.setValue(k.v))}>{k.label}</button>
        ))}
      </div>}
      <div className="keys pp-keys">
        {d(1)}{d(2)}{d(3)}<button className="key fn" onClick={a.back} aria-label="Löschen"><IconBackspace /></button>
        {d(4)}{d(5)}{d(6)}<button className="key fn" onClick={a.clear} style={{ fontFamily: 'var(--f-body)', fontSize: 15 }}>Leeren</button>
        {d(7)}{d(8)}{d(9)}
        <button className="key go" onClick={a.next}>
          {isNoteField(edit.field) ? 'Fertig' : nextP2 ? 'Weiter' : 'Fertig'}
          <span className="go-to">{!isNoteField(edit.field) && nextP2 && <i style={css({ '--c': nextP2.color })} />}<span>{isNoteField(edit.field) ? 'Punkte' : nextP2 ? nextP2.name : 'Überblick'}</span></span>
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

// ---------------------------------------------------------------- Zweiteilige Runde (Binokel: Meldung und Stiche)

function SplitEntry({ g, p, roundRef, edit }: { g: GameState; p: Player; roundRef: RoundRef; edit: Edit | null }) {
  const fs = fieldsOf(g)!;
  const field = edit?.field ?? fs[0].key;
  const val = (f: string) => (edit && edit.field === f ? numOf(edit.buf) : roundRef === 'new' ? null : fieldOf(g, roundRef, p.id, f));
  const a = val(fs[0].key), b = val(fs[1].key);
  const sum = b === null ? null : (a ?? 0) + b;
  const box = (f: string, label: string) => {
    const v = val(f);
    return (
      <button className="wz-f" data-field={f} aria-pressed={f === field} onClick={() => { if (edit) act().selectField(f); }}>
        <small>{label}</small><b className={(v === null ? 'ph' : '') + (v !== null && v < 0 ? ' neg' : '')}>{v === null ? '–' : fmt(v)}</b>
      </button>
    );
  };
  return (
    <div className="pp-entry wz">
      <div className="wz-top">
        <div><div className="lbl">Runde {roundNumber(g, roundRef)}</div></div>
        <span className={'wz-sc' + (sum !== null && sum < 0 ? ' neg' : '')}>{sum === null ? '' : fmt(sum)}</span>
      </div>
      <div className="wz-fields">{box(fs[0].key, fs[0].label)}{box(fs[1].key, fs[1].label)}</div>
    </div>
  );
}

// ---------------------------------------------------------------- Kniffel: nur passende Werte zur Auswahl

function CatPicker({ g, edit, canUndo }: { g: GameState; edit: Edit; canUndo: boolean }) {
  const cat = g.rounds.find(r => r.id === edit.ref)?.cat;
  const choices = catChoices(cat) ?? [];
  const cur = numOf(edit.buf);
  const a = act();
  return (
    <div className="pp-panel cat-pick">
      <div className={'cp-grid' + (choices.length > 6 ? ' many' : '')}>
        {choices.map(v => <button key={v} aria-pressed={cur === v} onClick={() => a.pick(v)}>{v}</button>)}
      </div>
      <div className="cp-row">
        <button className="cp-fn" onClick={a.undo} disabled={!canUndo} aria-label="Rückgängig"><IconUndo /></button>
        <button className="cp-fn" onClick={a.clear} disabled={cur === null}>Leeren</button>
        <button className="cp-strike" id="cat-strike" aria-pressed={cur === 0} onClick={() => a.pick(0)}>Streichen</button>
      </div>
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
              <span>{r.cat?.label}</span><span className={'v' + (v === 0 ? ' struck' : '')}>{v === null ? '' : v === 0 ? 'gestrichen' : fmt(v)}</span>
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

/** Notizfelder der laufenden Partie: anlegen und entfernen (zählen nicht zur Summe) */
function NotesSheet({ g }: { g: GameState }) {
  const [label, setLabel] = useState('');
  const notes = notesOf(g);
  const add = (e: React.FormEvent) => { e.preventDefault(); if (label.trim()) act().setGameNotes([...notes, label]); setLabel(''); };
  return (
    <>
      <div className="scrim" onClick={() => act().closeSheet()} />
      <div className="bsheet" role="dialog" aria-label="Notizfelder">
        <div className="grab" />
        <div className="sheet-body">
          <h3>Notizfelder</h3>
          {notes.length > 0 && <div className="menu-list cat-edit">
            {notes.map(n => (
              <div key={n} className="cat-row"><span>{n}</span><small /><button aria-label={`${n} entfernen`} onClick={() => act().setGameNotes(notes.filter(x => x !== n))}>✕</button></div>
            ))}
          </div>}
          <form className="ser-add" onSubmit={add}>
            <input id="game-note" value={label} onChange={e => setLabel(e.target.value)} placeholder="Neues Feld" maxLength={18} autoComplete="off" />
            <button className="primary" type="submit" disabled={!label.trim() || notes.length >= 4}>Hinzufügen</button>
          </form>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- Rang pro Runde (Arschloch)

/** Spielerseite: aktuelle Rolle und wie oft welche Rolle */
function RankCard({ g, p }: { g: GameState; p: Player }) {
  const n = seated(g).length, rounds = liveRounds(g).filter(r => rankIn(g, r.id, p.id) !== null);
  const last = rounds.length ? roleOf(rankIn(g, rounds[rounds.length - 1].id, p.id)!, n) : null;
  const count = (name: string) => rounds.filter(r => roleOf(rankIn(g, r.id, p.id)!, n).name === name).length;
  return (
    <div className="pp-entry rank-card">
      <div><div className="lbl">{last ? last.name : 'Noch keine Rolle'}</div>
        <small>{rounds.length ? `${count('Präsident')}× Präsident, ${count('Arschloch')}× Arschloch` : ''}</small></div>
      {last && <span className={'role-badge r-' + last.short.toLowerCase()}>{last.short}</span>}
    </div>
  );
}

/** Rollen verteilen: Spieler in der Reihenfolge antippen, in der sie fertig wurden */
function RankSheet({ g, roundRef }: { g: GameState; roundRef: RoundRef }) {
  const players = seated(g), n = players.length;
  const rankOf = (id: string) => (roundRef === 'new' ? null : rankIn(g, roundRef, id));
  const done = players.filter(p => rankOf(p.id) !== null).length;
  return (
    <>
      <div className="scrim" onClick={() => act().closeSheet()} />
      <div className="bsheet" role="dialog" aria-label="Rollen verteilen">
        <div className="grab" />
        <div className="sheet-body">
          <h3>Runde {roundNumber(g, roundRef)}</h3>
          <div className="eyebrow">{done < n ? `Wer wurde als ${done + 1}. fertig?` : 'Verteilt'}</div>
          <div className="rank-list">
            {players.map(p => {
              const r = rankOf(p.id), role = r === null ? null : roleOf(r, n);
              return (
                <button key={p.id} className={'rank-row' + (role ? ' set r-' + role.short.toLowerCase() : '')} onClick={() => act().rankTap(p.id)}>
                  <Avatar p={p} /><span className="nm">{p.name}</span>
                  {role ? <span className="rl"><small>{r}.</small>{role.name}</span> : <span className="rl ph">–</span>}
                </button>
              );
            })}
          </div>
          <div className="pad-actions">
            <button className="secondary" onClick={() => act().rankReset()} disabled={!done}>Zurücksetzen</button>
            <button className="primary" onClick={() => act().closeSheet()}>Fertig</button>
          </div>
        </div>
      </div>
    </>
  );
}

/** Uno: Sieger der Runde antippen, alle anderen bekommen 0 */
function WinnerSheet({ g, roundRef }: { g: GameState; roundRef: RoundRef }) {
  return (
    <>
      <div className="scrim" onClick={() => act().closeSheet()} />
      <div className="bsheet" role="dialog" aria-label="Sieger der Runde">
        <div className="grab" />
        <div className="sheet-body">
          <h3>Runde {roundNumber(g, roundRef)}</h3>
          <div className="eyebrow">{g.game.rules.params?.soloPrompt ?? 'Wer hat gewonnen?'}</div>
          <div className="rank-list">
            {seated(g).map(p => (
              <button key={p.id} className="rank-row" onClick={() => act().pickWinner(p.id)}><Avatar p={p} /><span className="nm">{p.name}</span></button>
            ))}
          </div>
          {g.game.rules.params?.soloPrompt && <div className="pad-actions"><button className="secondary" id="pass-round" onClick={() => act().passRound()}>Eingepasst</button></div>}
        </div>
      </div>
    </>
  );
}

/** Karten der laufenden Wizard-Runde (für den Fächer) */
function handCards(g: GameState): number {
  const rounds = liveRounds(g), i = rounds.findIndex(r => !roundFull(g, r.id));
  return i === -1 ? rounds.length : i + 1;
}
