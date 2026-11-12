import { useRef, useState } from 'react';
import { act, useApp } from '../store';
import { dateLong } from './lookup';
import { summary, filterGames, performance } from '../game/stats';
import { fmtPerf } from './lookup';
import { Avatar } from './Avatar';
import { Chevron } from './icons';
import { TabBar } from './TabBar';

/** Alle gespeicherten Spieler mit Partien und Siegen */
export function People() {
  const { players, history } = useApp();
  const rows = players.map(p => ({ p, s: summary(filterGames(history, p.id, 'all', null), p.id) }))
    .sort((a, b) => b.s.played - a.s.played || a.p.name.localeCompare(b.p.name));
  return (
    <section className="screen" id="s-people">
      <div className="scroll">
        <div className="gutter page-body">
          <h1 className="page-title">Spieler</h1>
          {!players.length && <div className="card empty"><p>Noch keine Spieler</p></div>}
          {players.length > 0 && (
            <div className="list">
              {rows.map(({ p, s }) => (
                <button key={p.id} className="row person-row" onClick={() => act().openProfile(p.id)}>
                  <Avatar p={p} big />
                  <span className="t"><b>{p.name}</b><small>{s.played ? `${s.played} ${s.played === 1 ? 'Partie' : 'Partien'}, ${s.wins} ${s.wins === 1 ? 'Sieg' : 'Siege'}` : 'Noch keine Partie'}</small></span>
                  {s.played > 0 && <span className="perf-badge">{fmtPerf(performance(history, p.id).score)}</span>}
                  <Chevron />
                </button>
              ))}
            </div>
          )}
          <Backup />
        </div>
      </div>
      <TabBar active="people" />
    </section>
  );
}

const LAST = 'pz:lastBackup';
/** Sicherung als Datei speichern oder einlesen */
function Backup() {
  const file = useRef<HTMLInputElement>(null);
  const [last, setLast] = useState(() => { try { return localStorage.getItem(LAST); } catch { return null; } });
  const save = async () => {
    const text = await act().exportData();
    const name = `punktezettel-${new Date().toISOString().slice(0, 10)}.json`;
    const f = new File([text], name, { type: 'application/json' });
    try {
      if (navigator.canShare?.({ files: [f] })) await navigator.share({ files: [f], title: 'Punktezettel' });
      else { const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
      const t = new Date().toISOString();
      try { localStorage.setItem(LAST, t); } catch { /* egal */ }
      setLast(t);
    } catch { /* Teilen abgebrochen */ }
  };
  const load = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    await act().importData(await f.text());
    e.target.value = '';
  };
  return (
    <div className="group">
      <div className="eyebrow">Daten</div>
      <div className="list">
        <button className="row" id="backup-save" onClick={save}>
          <span className="t"><b>Sicherung speichern</b><small>{last ? `Zuletzt am ${dateLong(last)}` : 'Noch nie gesichert'}</small></span>
        </button>
        <button className="row" id="backup-load" onClick={() => file.current?.click()}>
          <span className="t"><b>Sicherung einlesen</b></span>
        </button>
      </div>
      <input ref={file} id="backup-file" type="file" accept="application/json,.json" hidden onChange={load} />
    </div>
  );
}
