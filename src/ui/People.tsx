import { act, useApp } from '../store';
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
        </div>
      </div>
      <TabBar active="people" />
    </section>
  );
}
