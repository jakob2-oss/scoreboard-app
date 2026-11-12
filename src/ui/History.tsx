import { act, useApp } from '../store';
import { fmt } from '../lib/color';
import { Avatar } from './Avatar';
import { GameIcon } from './GamePage';
import { Crown } from './icons';
import { TabBar } from './TabBar';
import { useState } from 'react';
import { dateLong, dateShort, iconFor, monthOf, playerOf, recentEvents, spanOf } from './lookup';
import { SeriesPicker } from './SeriesPicker';
import { DEFAULT_POINTS, seriesTable } from '../game/stats';
import { Chevron } from './icons';

/** Verlauf: alle abgeschlossenen Partien, nach Monat gruppiert */
export function History() {
  const { history, players, detail, histTab } = useApp();
  const groups: { month: string; items: typeof history }[] = [];
  for (const h of history) {
    const m = monthOf(h.finishedAt);
    const last = groups[groups.length - 1];
    if (last && last.month === m) last.items.push(h); else groups.push({ month: m, items: [h] });
  }
  const open = history.find(h => h.id === detail);
  return (
    <section className="screen" id="s-history">
      <div className="scroll">
        <div className="gutter page-body">
          <h1 className="page-title">Verlauf</h1>
          <div className="seg hist-seg">
            <button id="hist-games" aria-pressed={histTab === 'games'} onClick={() => act().setHistTab('games')}>Partien</button>
            <button id="hist-series" aria-pressed={histTab === 'series'} onClick={() => act().setHistTab('series')}>Serien</button>
          </div>
          {histTab === 'series' && <SeriesList />}
          {histTab === 'games' && !history.length && <div className="card empty"><p>Noch keine Partien</p></div>}
          {histTab === 'games' && groups.map(gr => (
            <div className="group" key={gr.month}>
              <div className="eyebrow">{gr.month}</div>
              <div className="list">
                {gr.items.map(h => {
                  const ic = iconFor(h.key, h.name), winners = h.results.filter(r => r.place === 1);
                  return (
                    <button key={h.id} className="row hist-row" onClick={() => act().openDetail(h.id)}>
                      <GameIcon icon={ic.icon} tint={ic.tint} />
                      <span className="t"><b>{h.name}</b><small>{dateShort(h.finishedAt)}{h.occasion ? `, ${h.occasion}` : ''}</small></span>
                      <span className="win-stack">{winners.slice(0, 2).map(w => <Avatar key={w.playerId} p={playerOf(players, w.playerId)} />)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <TabBar active="history" />
      {open && (
        <>
          <div className="scrim" onClick={() => act().openDetail(null)} />
          <div className="bsheet" role="dialog" aria-label="Partie">
            <div className="grab" />
            <div className="sheet-body">
              <div className="eyebrow">{dateLong(open.finishedAt)}{open.occasion ? `, ${open.occasion}` : ''}</div>
              <h3>{open.name}</h3>
              <div className="field"><label>Serie</label>
                <SeriesPicker value={open.eventId ?? null} onChange={id => act().setGameEvent(open.id, id)} />
              </div>
              <DeleteGame id={open.id} />
              <div className="podium">
                {open.results.map(r => {
                  const p = playerOf(players, r.playerId);
                  return (
                    <button key={r.playerId} className={'prow' + (r.place === 1 ? ' win' : '')} onClick={() => act().openProfile(r.playerId)}>
                      <span className="place">{r.place}</span><Avatar p={p} /><span className="nm">{p.name}</span>
                      {r.place === 1 && <Crown />}<span className="pts">{fmt(r.total)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

/** Liste der Serien mit Zeitraum und Spitzenreiter */
function SeriesList() {
  const { events, history, players } = useApp();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const ev = act().createEvent(name);
    if (ev) act().openSeries(ev.id);
  };
  return (
    <>
      {!events.length && <div className="card empty"><p>Noch keine Serien</p></div>}
      {events.length > 0 && (
        <div className="list">
          {recentEvents(events, history).map(e => {
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
      )}
      {!adding
        ? <button className="secondary ser-new" id="series-create" onClick={() => setAdding(true)}>Neue Serie</button>
        : <form className="ser-add" onSubmit={add}>
          <input id="series-name" value={name} autoFocus maxLength={32} autoComplete="off" placeholder="Name der Serie" onChange={e => setName(e.target.value)} />
          <button className="primary" type="submit" disabled={!name.trim()}>Anlegen</button>
        </form>}
    </>
  );
}

function DeleteGame({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="menu-list hist-del">
      {!confirm
        ? <button className="warn" id="hist-delete" onClick={() => setConfirm(true)}>Partie löschen</button>
        : <div className="confirm-row"><button className="no" onClick={() => setConfirm(false)}>Abbrechen</button><button className="yes" id="hist-delete-yes" onClick={() => act().deleteHistoryGame(id)}>Wirklich löschen</button></div>}
    </div>
  );
}
