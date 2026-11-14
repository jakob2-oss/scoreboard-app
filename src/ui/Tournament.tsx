import { useMemo, useState } from 'react';
import { act, useApp } from '../store';
import { advanceOf, champion, createBracket, plannedRounds, roundName, winsNeeded, type Bracket, type Match } from '../game/bracket';
import { GAMES } from '../game/games';
import type { GameEvent, Template } from '../model/types';
import { Avatar } from './Avatar';
import { GameIcon } from './GamePage';
import { iconFor, nameList, playerOf } from './lookup';
import { seriesChampScene } from './banners';

const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/** Turnier anlegen: Teilnehmer, Format (Duelle oder Tische), Paarung (auslosen oder von Hand), Vorschau der ersten Runde */
export function TournamentSetup({ ev }: { ev: GameEvent }) {
  const { players } = useApp();
  const [sel, setSel] = useState<string[]>([]);
  const [tables, setTables] = useState(false);
  const [size, setSize] = useState(4), [adv, setAdv] = useState(2), [bestOf, setBestOf] = useState(1);
  const [manual, setManual] = useState(false);
  const [seed, setSeed] = useState(0);
  const order = useMemo(() => (manual ? sel : shuffle(sel)), [sel, manual, seed]);
  const opts = { size: tables ? size : 2, advance: tables ? adv : 1, bestOf: tables ? 1 : bestOf };
  const preview = sel.length >= 2 ? createBracket(order, opts, (() => { let n = 0; return () => 'p' + (++n); })()) : null;
  const tap = (id: string) => setSel(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));
  const stepper = (label: string, v: number, set: (n: number) => void, min: number, max: number, id: string) => (
    <div className="pt-row"><span className="pt-place">{label}</span>
      <button className="pt-btn" aria-label={`${label} weniger`} disabled={v <= min} onClick={() => set(Math.max(min, v - 1))}>−</button>
      <b className="pt-val" id={id}>{v}</b>
      <button className="pt-btn" aria-label={`${label} mehr`} disabled={v >= max} onClick={() => set(Math.min(max, v + 1))}>+</button></div>
  );
  return (
    <div className="tn-setup" id="tn-setup">
      <div className="group"><div className="eyebrow">Teilnehmer</div>
        <div className="chips">{players.map(p => <button key={p.id} className="chip" aria-pressed={sel.includes(p.id)} onClick={() => tap(p.id)}>{manual && sel.includes(p.id) ? `${sel.indexOf(p.id) + 1}. ` : ''}{p.name}</button>)}</div>
      </div>
      <div className="seg" role="group" aria-label="Format">
        <button id="tn-duel" aria-pressed={!tables} onClick={() => setTables(false)}>Duelle</button>
        <button id="tn-tables" aria-pressed={tables} onClick={() => setTables(true)}>Tische</button>
      </div>
      {tables
        ? <div className="card ser-points">{stepper('Am Tisch', size, n => { setSize(n); setAdv(a => Math.min(a, n - 1)); }, 3, 8, 'tn-size')}{stepper('Kommen weiter', adv, setAdv, 1, size - 1, 'tn-adv')}</div>
        : <div className="seg" role="group" aria-label="Best of">
          {[1, 3, 5].map(n => <button key={n} id={`tn-bo-${n}`} aria-pressed={bestOf === n} onClick={() => setBestOf(n)}>{n === 1 ? 'Eine Partie' : `Best of ${n}`}</button>)}
        </div>}
      <div className="seg" role="group" aria-label="Paarung">
        <button id="tn-draw" aria-pressed={!manual} onClick={() => setManual(false)}>Auslosen</button>
        <button id="tn-manual" aria-pressed={manual} onClick={() => setManual(true)}>Von Hand</button>
      </div>
      {preview && <div className="group"><div className="eyebrow">{roundName(preview, 0, sel.length)}</div>
        <div className="tn-preview">
          {preview.rounds[0].matches.map((m, i) => <div key={i} className="tn-pre">{m.bye ? <>{playerOf(players, m.players[0]).name}<small>Freilos</small></> : nameList(m.players.map(id => playerOf(players, id).name))}</div>)}
        </div>
        {!manual && <button className="text-btn" id="tn-shuffle" onClick={() => setSeed(x => x + 1)}>Neu mischen</button>}
      </div>}
      <button className="primary" id="tn-start" disabled={sel.length < 2} onClick={() => act().bracketCreate(ev.id, order, opts)}>Turnier starten</button>
    </div>
  );
}

/** Turnierbaum: Runden nebeneinander, Tische mit Spielern und Siegen; offene Tische lassen sich spielen oder von Hand entscheiden */
export function TournamentView({ ev }: { ev: GameEvent }) {
  const { players } = useApp();
  const b = ev.bracket!;
  const [open, setOpen] = useState<string | null>(null);
  const total = b.rounds[0].matches.reduce((a, m) => a + m.players.length, 0);
  const champ = champion(b), m = open ? b.rounds.flatMap(r => r.matches).find(x => x.id === open) : undefined;
  return (
    <>
      {champ && <div className="ser-champ-card" id="tn-champ">
        <div className="ser-trophy" dangerouslySetInnerHTML={{ __html: seriesChampScene() }} />
        <div className="ser-champ">{playerOf(players, champ).name} gewinnt das Turnier</div>
      </div>}
      <div className="tn-tree" id="tn-tree">
        {b.rounds.map((r, ri) => (
          <div key={ri} className="tn-round">
            <div className="eyebrow">{roundName(b, ri, total)}</div>
            {r.matches.map(x => <MatchCard key={x.id} b={b} m={x} onOpen={() => setOpen(x.id)} />)}
          </div>
        ))}
        {plannedRounds(b, total).slice(b.rounds.length).map((n, k) => {
          const ri = b.rounds.length + k, tables = n <= b.size ? 1 : Math.ceil(n / b.size);
          return (
            <div key={'plan' + ri} className="tn-round plan">
              <div className="eyebrow">{roundName(b, ri, total)}</div>
              {Array.from({ length: tables }, (_, i) => <div key={i} className="tn-match tn-empty" aria-hidden="true"><span /><span /></div>)}
            </div>
          );
        })}
      </div>
      {m && <MatchSheet ev={ev} b={b} m={m} title={roundName(b, b.rounds.findIndex(r => r.matches.includes(m)), total)} onClose={() => setOpen(null)} />}
    </>
  );
}

function MatchCard({ b, m, onOpen }: { b: Bracket; m: Match; onOpen: () => void }) {
  const { players } = useApp();
  const playable = !m.winners && !m.bye;
  return (
    <button className={'tn-match' + (m.winners ? ' done' : '') + (m.bye ? ' bye' : '')} onClick={onOpen} disabled={m.bye} aria-label={m.players.map(id => playerOf(players, id).name).join(' gegen ')}>
      {m.players.map(id => {
        const p = playerOf(players, id), won = !!m.winners?.includes(id);
        return (
          <span key={id} className={'tn-p' + (won ? ' won' : m.winners ? ' out' : '')}>
            <Avatar p={p} /><span className="nm">{p.name}</span>
            {b.bestOf > 1 && m.players.length === 2 && <b className="num">{m.wins[id] ?? 0}</b>}
          </span>
        );
      })}
      {m.bye && <small className="tn-bye">Freilos</small>}
      {playable && <small className="tn-go">Spielen</small>}
    </button>
  );
}

/** Ein Tisch: Spiel wählen und starten, oder Sieger von Hand eintragen */
function MatchSheet({ ev, b, m, title, onClose }: { ev: GameEvent; b: Bracket; m: Match; title: string; onClose: () => void }) {
  const { players, templates } = useApp();
  const need = advanceOf(b, m);
  const [win, setWin] = useState<string[]>(m.winners ?? []);
  const games: Template[] = [...GAMES.filter(d => d.family).map(d => d.template), ...templates].filter(t => t.players.min <= m.players.length && t.players.max >= m.players.length);
  const tap = (id: string) => setWin(w => (w.includes(id) ? w.filter(x => x !== id) : [...w, id].slice(-need)));
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="bsheet" id="tn-match" role="dialog" aria-label={title}>
        <div className="grab" />
        <div className="sheet-body">
          <h3>{title}</h3>
          <div className="eyebrow">{nameList(m.players.map(id => playerOf(players, id).name))}{b.bestOf > 1 && m.players.length === 2 ? `, Best of ${b.bestOf}, ${winsNeeded(b)} Siege nötig` : ''}</div>
          {!m.winners && <div className="tn-games">
            {games.map(t => { const ic = iconFor(t.params?.base ?? t.key, t.name); return (
              <button key={t.key} className="tn-game" onClick={() => { onClose(); act().bracketPlay(ev.id, m.id, t); }}><GameIcon icon={ic.icon} tint={ic.tint} /><span>{t.name}</span></button>
            ); })}
          </div>}
          <div className="eyebrow">{need > 1 ? `Die ${need} Besten von Hand` : 'Sieger von Hand'}</div>
          <div className="chips">{m.players.map(id => <button key={id} className="chip" aria-pressed={win.includes(id)} onClick={() => tap(id)}>{playerOf(players, id).name}</button>)}</div>
          <div className="pad-actions"><button className="secondary" id="tn-set" disabled={win.length !== need} onClick={() => { act().bracketWinners(ev.id, m.id, win); onClose(); }}>Eintragen</button></div>
        </div>
      </div>
    </>
  );
}
