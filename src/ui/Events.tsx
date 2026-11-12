import { useState } from 'react';
import { act, useApp } from '../store';
import { DEFAULT_POINTS, seriesTable } from '../game/stats';
import type { GameEvent } from '../model/types';
import { Avatar } from './Avatar';
import { Chevron } from './icons';
import { playerOf, recentEvents, spanOf } from './lookup';
import { TabBar } from './TabBar';

/** Laufende Serie als Karte: Name, Partien und wer führt (Startseite und Reiter Serien) */
export function LiveSeries({ ev }: { ev: GameEvent }) {
  const { history, players } = useApp();
  const games = history.filter(h => h.eventId === ev.id);
  const top = seriesTable(games, ev.points ?? DEFAULT_POINTS)[0];
  const lead = top ? playerOf(players, top.playerId) : null;
  return (
    <button className="ser-live" id="series-live" onClick={() => act().openSeries(ev.id)}>
      <span className="ser-live-dot" aria-hidden="true" />
      <span className="t"><small>Läuft</small><b>{ev.name}</b>
        <span className="sub">{games.length ? `${games.length} ${games.length === 1 ? 'Partie' : 'Partien'}${lead ? `, ${lead.name} führt` : ''}` : 'Noch keine Partien'}</span></span>
      {lead && <Avatar p={lead} />}
      <Chevron />
    </button>
  );
}

/** Reiter Serien: Spieleabende, Urlaube, Turniere. Eine läuft, die anderen sind Geschichte. */
export function Events() {
  const { events, history, players } = useApp();
  const live = events.find(e => e.active);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const start = (e: React.FormEvent) => {
    e.preventDefault();
    if (act().startEvent(name)) { setName(''); setAdding(false); }
  };
  const others = recentEvents(events, history).filter(e => !e.active);
  return (
    <section className="screen" id="s-events">
      <div className="scroll">
        <div className="gutter page-body">
          <h1 className="page-title">Serien</h1>
          {live && <LiveSeries ev={live} />}
          {!live || adding
            ? <form className="ser-start" onSubmit={start}>
              <input id="series-name" value={name} maxLength={32} autoComplete="off" placeholder="Name der Serie" onChange={e => setName(e.target.value)} />
              <button className="primary" id="series-start" type="submit" disabled={!name.trim()}>Starten</button>
            </form>
            : <button className="secondary ser-new" id="series-create" onClick={() => setAdding(true)}>Neue Serie</button>}
          {others.length > 0 && <div className="group">
            <div className="eyebrow">Frühere</div>
            <div className="list">
              {others.map(e => {
                const games = history.filter(h => h.eventId === e.id);
                const top = seriesTable(games, e.points ?? DEFAULT_POINTS)[0];
                return (
                  <button key={e.id} className="row series-row" onClick={() => act().openSeries(e.id)}>
                    <span className="ser-count"><b>{games.length}</b></span>
                    <span className="t"><b>{e.name}</b><small>{games.length ? `${games.length} ${games.length === 1 ? 'Partie' : 'Partien'}, ${spanOf(games.map(g => g.finishedAt))}` : 'Noch keine Partien'}</small></span>
                    {top && <Avatar p={playerOf(players, top.playerId)} />}
                    <Chevron />
                  </button>
                );
              })}
            </div>
          </div>}
          {!events.length && <div className="card empty"><p>Noch keine Serien</p></div>}
        </div>
      </div>
      <TabBar active="events" />
    </section>
  );
}
