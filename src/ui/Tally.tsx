import { useState } from 'react';
import { act, useApp } from '../store';
import { liveMarks, tallyCount, leadFor } from '../game/tally';
import type { Tally } from '../model/types';
import { Avatar } from './Avatar';
import { Chevron, IconBack, IconUndo } from './icons';
import { playerOf } from './lookup';

/** Striche wie auf dem Bierdeckel: je vier senkrecht, der fünfte quer drüber */
export function TallyMarks({ n, small }: { n: number; small?: boolean }) {
  const groups = Math.ceil(n / 5);
  return (
    <span className={'tally-marks' + (small ? ' sm' : '')} aria-hidden="true">
      {Array.from({ length: groups }, (_, gi) => {
        const k = Math.min(5, n - gi * 5);
        return (
          <svg key={gi} viewBox="0 0 34 30">
            {Array.from({ length: Math.min(4, k) }, (_, i) => <rect key={i} x={4 + i * 6.5} y={3 + ((gi + i) % 3)} width="3" height="24" rx="1.5" transform={`rotate(${(i % 2 ? 3 : -2)} ${4 + i * 6.5} 15)`} />)}
            {k === 5 && <rect x="1" y="13.5" width="30" height="3" rx="1.5" transform="rotate(-24 16 15)" />}
          </svg>
        );
      })}
    </span>
  );
}

/** Karte auf der Startseite: offene Strichlisten, ein Tipp öffnet */
export function TallyCard() {
  const { tallies, players } = useApp();
  const [adding, setAdding] = useState(false);
  return (
    <div className="group">
      <div className="eyebrow">Strichlisten</div>
      {tallies.length > 0 && <div className="list">
        {tallies.map(t => {
          const [a, b] = tallyCount(t), pa = playerOf(players, t.a), pb = playerOf(players, t.b);
          return (
            <button key={t.id} className="row tally-row" onClick={() => act().openTally(t.id)}>
              <span className="tally-duo"><Avatar p={pa} /><Avatar p={pb} /></span>
              <span className="t"><b>{t.name || `${pa.name} und ${pb.name}`}</b><small className="num">{a} zu {b}</small></span>
              <Chevron />
            </button>
          );
        })}
      </div>}
      <button className="text-btn tally-new" id="tally-new" onClick={() => setAdding(true)}>Neue Strichliste</button>
      {adding && <NewTally onClose={() => setAdding(false)} />}
    </div>
  );
}

function NewTally({ onClose }: { onClose: () => void }) {
  const { players } = useApp();
  const [sel, setSel] = useState<string[]>([]);
  const [name, setName] = useState('');
  const tap = (id: string) => setSel(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id].slice(-2)));
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="bsheet" id="tally-sheet" role="dialog" aria-label="Neue Strichliste">
        <div className="grab" />
        <div className="sheet-body">
          <h3>Neue Strichliste</h3>
          <div className="chips">
            {players.map(p => <button key={p.id} className="chip" aria-pressed={sel.includes(p.id)} onClick={() => tap(p.id)}>{p.name}</button>)}
          </div>
          {!players.length && <p className="muted">Noch keine Spieler</p>}
          <input id="tally-name" value={name} maxLength={28} autoComplete="off" placeholder="Name, z. B. Wetten" onChange={e => setName(e.target.value)} />
          <div className="pad-actions"><button className="primary" id="tally-start" disabled={sel.length !== 2} onClick={() => { act().newTally(sel[0], sel[1], name); onClose(); }}>Anlegen</button></div>
        </div>
      </div>
    </>
  );
}

/** Eine Strichliste: zwei große Seiten zum Antippen, Notiz zum letzten Strich, Verlauf, Ausgleichen */
export function TallyScreen() {
  const { tallies, tally, players } = useApp();
  const t = tallies.find(x => x.id === tally);
  const [confirm, setConfirm] = useState<'settle' | 'delete' | null>(null);
  if (!t) return null;
  const a = act(), [na, nb] = tallyCount(t), pa = playerOf(players, t.a), pb = playerOf(players, t.b);
  const marks = liveMarks(t), last = marks[marks.length - 1];
  const lead = na === nb ? 'Gleichstand' : `${na > nb ? pa.name : pb.name} liegt ${Math.abs(na - nb)} vorn`;
  const side = (p: { name: string; color: string }, n: number, k: 0 | 1) => (
    <button className="tally-side" id={`tally-${k}`} style={{ ['--c' as string]: p.color }} onClick={() => a.tallyDo(k ? 'mark1' : 'mark0')} aria-label={`Strich für ${p.name}`}>
      <Avatar p={p} big /><b>{p.name}</b><span className="tally-n num">{n}</span><TallyMarks n={n} />
    </button>
  );
  return (
    <section className="screen" id="s-tally">
      <div className="top gutter">
        <button className="icon-btn" onClick={() => a.openTally(null)} aria-label="Zurück"><IconBack /></button>
        <div className="grow"><h2>{t.name || 'Strichliste'}</h2></div>
      </div>
      <div className="scroll">
        <div className="gutter tally-body">
          <div className="tally-lead" id="tally-lead">{lead}</div>
          <div className="tally-sides">{side(pa, na, 0)}{side(pb, nb, 1)}</div>
          {last && <label className="tally-note">
            <span>Notiz zum letzten Strich</span>
            <input key={last.id} id="tally-note" defaultValue={last.note ?? ''} maxLength={60} autoComplete="off" placeholder={`Strich für ${last.side ? pb.name : pa.name}`}
              onBlur={e => a.tallyNote(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
          </label>}
          {marks.some(m => m.note) && <div className="group"><div className="eyebrow">Notizen</div>
            <div className="list">
              {[...marks].reverse().filter(m => m.note).slice(0, 8).map(m => (
                <div key={m.id} className="row tally-hist"><Avatar p={m.side ? pb : pa} /><span className="t"><b>{m.note}</b></span></div>
              ))}
            </div>
          </div>}
          <div className="menu-list own-actions">
            {confirm === 'settle'
              ? <div className="confirm-row"><span>Auf null setzen?</span><button className="no" onClick={() => setConfirm(null)}>Nein</button><button className="yes" id="tally-settle-yes" onClick={() => { a.tallyDo('settle'); setConfirm(null); }}>Ausgleichen</button></div>
              : <button id="tally-settle" disabled={!marks.length} onClick={() => setConfirm('settle')}>Ausgleichen</button>}
            {confirm === 'delete'
              ? <div className="confirm-row"><span>Wirklich löschen?</span><button className="no" onClick={() => setConfirm(null)}>Nein</button><button className="yes" id="tally-delete-yes" onClick={() => a.tallyDo('delete')}>Löschen</button></div>
              : <button className="warn" id="tally-delete" onClick={() => setConfirm('delete')}>Strichliste löschen</button>}
          </div>
        </div>
      </div>
      <div className="dock gutter">
        <button className="secondary" disabled={!marks.length} onClick={() => a.tallyDo('undo')} aria-label="Letzten Strich zurücknehmen"><IconUndo /></button>
        <button className="secondary wide" onClick={() => a.openTally(null)}>Fertig</button>
      </div>
    </section>
  );
}

/** Profil: Bilanz in den Strichlisten dieser Person */
export function TallyBalance({ pid }: { pid: string }) {
  const { tallies, players } = useApp();
  const mine = tallies.filter((t: Tally) => t.a === pid || t.b === pid);
  if (!mine.length) return null;
  return (
    <div className="group"><div className="eyebrow">Strichlisten</div>
      <div className="list">
        {mine.map(t => {
          const other = playerOf(players, t.a === pid ? t.b : t.a), d = leadFor(t, pid);
          return (
            <button key={t.id} className="row tally-row" onClick={() => act().openTally(t.id)}>
              <Avatar p={other} />
              <span className="t"><b>{t.name || `Gegen ${other.name}`}</b><small>{d === 0 ? 'Gleichstand' : d > 0 ? `${d} vorn` : `${-d} hinten`}</small></span>
              <Chevron />
            </button>
          );
        })}
      </div>
    </div>
  );
}
