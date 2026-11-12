import { act, useApp } from '../store';
import { DEFAULT_POINTS, seriesGames, seriesPlaces, seriesTable, type SeriesRow, type SeriesSort } from '../game/stats';
import { Avatar } from './Avatar';
import { GameIcon } from './GamePage';
import { Crown, IconBack } from './icons';
import { dateShort, fmtPerf, iconFor, playerOf, spanOf } from './lookup';

const dec = (n: number) => n.toLocaleString('de-DE', { maximumFractionDigits: 1 });
const VALUE: Record<SeriesSort, (r: SeriesRow) => string> = {
  perf: r => fmtPerf(r.perf), points: r => String(r.points), avg: r => dec(r.avg), rate: r => r.rate + ' %'
};

/** Statistikseite einer Serie: Tabelle, Spiele, Partien und die Platzpunkte */
export function Series() {
  const { series, events, history, players } = useApp();
  const ev = events.find(e => e.id === series?.id);
  if (!series || !ev) return null;
  const a = act(), pts = ev.points ?? DEFAULT_POINTS;
  const games = history.filter(h => h.eventId === ev.id);
  const rows = seriesTable(games, pts, series.sort), places = seriesPlaces(rows, series.sort);
  const size = Math.max(3, ...games.map(g => g.results.length));
  const setPt = (i: number, d: number) => {
    const next = Array.from({ length: size }, (_, k) => pts[k] ?? 0);
    next[i] = Math.max(0, Math.min(99, next[i] + d));
    while (next.length > 1 && next[next.length - 1] === 0) next.pop();
    a.updateEvent(ev.id, { points: next });
  };
  const isDefault = JSON.stringify(pts) === JSON.stringify(DEFAULT_POINTS);
  return (
    <section className="screen" id="s-series">
      <div className="top gutter">
        <button className="icon-btn" onClick={a.closeSeries} aria-label="Zurück"><IconBack /></button>
        <div className="grow"><h2>Serie</h2></div>
      </div>
      <div className="scroll">
        <div className="gutter pf-body">
          <div className="ser-hero">
            <h1>{ev.name}</h1>
            <small>{games.length ? `${games.length} ${games.length === 1 ? 'Partie' : 'Partien'} mit ${rows.length} Spielern, ${spanOf(games.map(g => g.finishedAt))}` : 'Noch keine Partien'}</small>
          </div>
          {rows.length > 0 && <>
            <div className="seg" role="group" aria-label="Wertung">
              <button id="sort-perf" aria-pressed={series.sort === 'perf'} onClick={() => a.setSeriesSort('perf')}>Leistung</button>
              <button id="sort-points" aria-pressed={series.sort === 'points'} onClick={() => a.setSeriesSort('points')}>Punkte</button>
              <button id="sort-avg" aria-pressed={series.sort === 'avg'} onClick={() => a.setSeriesSort('avg')}>Schnitt</button>
            </div>
            <div className="podium ser-table">
              {rows.map((r, i) => {
                const p = playerOf(players, r.playerId);
                return (
                  <button key={r.playerId} className={'prow' + (places[i] === 1 ? ' win' : '')} onClick={() => a.openProfile(r.playerId)}>
                    <span className="place">{places[i]}</span><Avatar p={p} />
                    <span className="nm">{p.name}<small>{r.played} {r.played === 1 ? 'Partie' : 'Partien'}, {r.wins} {r.wins === 1 ? 'Sieg' : 'Siege'}</small></span>
                    {places[i] === 1 && <Crown />}<span className="pts">{VALUE[series.sort](r)}</span>
                  </button>
                );
              })}
            </div>
            <div className="group"><div className="eyebrow">Spiele</div>
              <div className="list">
                {seriesGames(games).map(x => {
                  const ic = iconFor(x.key);
                  return (
                    <div key={x.key} className="row">
                      <GameIcon icon={ic.icon} tint={ic.tint} />
                      <span className="t"><b>{x.name}</b><small>{x.played} {x.played === 1 ? 'Partie' : 'Partien'}</small></span>
                      <span className="win-stack">{x.leaders.slice(0, 3).map(id => <Avatar key={id} p={playerOf(players, id)} />)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="group"><div className="eyebrow">Partien</div>
              <div className="list">
                {games.map(h => {
                  const ic = iconFor(h.key);
                  return (
                    <div key={h.id} className="row">
                      <GameIcon icon={ic.icon} tint={ic.tint} />
                      <span className="t"><b>{h.name}</b><small>{dateShort(h.finishedAt)}, {h.results.length} Spieler</small></span>
                      <span className="win-stack">{h.results.filter(r => r.place === 1).slice(0, 2).map(w => <Avatar key={w.playerId} p={playerOf(players, w.playerId)} />)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>}
          <div className="group"><div className="eyebrow">Platzpunkte</div>
            <div className="card ser-points">
              {Array.from({ length: size }, (_, i) => (
                <div key={i} className="pt-row">
                  <span className="pt-place">{i + 1}. Platz</span>
                  <button className="pt-btn" aria-label={`Platz ${i + 1} weniger`} onClick={() => setPt(i, -1)} disabled={!(pts[i] ?? 0)}>−</button>
                  <b className="pt-val" id={`pt-${i + 1}`}>{pts[i] ?? 0}</b>
                  <button className="pt-btn" aria-label={`Platz ${i + 1} mehr`} onClick={() => setPt(i, 1)}>+</button>
                </div>
              ))}
              {!isDefault && <button className="text-btn pt-reset" onClick={() => a.updateEvent(ev.id, { points: [...DEFAULT_POINTS] })}>Vorschlag 3, 2, 1</button>}
            </div>
          </div>
          <div className="group"><div className="eyebrow">Name</div>
            <input className="ser-rename" id="series-rename" defaultValue={ev.name} maxLength={32} autoComplete="off" aria-label="Name der Serie"
              onBlur={e => a.updateEvent(ev.id, { name: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
          </div>
        </div>
      </div>
    </section>
  );
}
