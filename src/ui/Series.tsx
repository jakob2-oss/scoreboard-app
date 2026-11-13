import { act, useApp } from '../store';
import { DEFAULT_POINTS, seriesAwards, seriesGames, seriesPlaces, seriesTable, type SeriesRow, type SeriesSort } from '../game/stats';
import { trophyRoom } from './trophy';
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
  const awards = seriesAwards(games), names = (ids: string[]) => ids.map(id => playerOf(players, id).name).join(' und ');
  // Beendet: Abschlussseite mit Otter, Sieger und Auszeichnungen. Bild: das meistgespielte Spiel
  const done = !!ev.endedAt && !ev.active && games.length > 0;
  const champ = rows.filter((_, i) => places[i] === 1).map(r => r.playerId);
  const topGame = seriesGames(games)[0];
  const hero = done && topGame ? trophyRoom(iconFor(topGame.key, topGame.name).icon, 'GESAMTSIEG') : null;
  return (
    <section className="screen" id="s-series">
      <div className="top gutter">
        <button className="icon-btn" onClick={a.closeSeries} aria-label="Zurück"><IconBack /></button>
        <div className="grow"><h2>Serie</h2></div>
      </div>
      <div className="scroll">
        <div className="gutter pf-body">
          {hero && <div className="ser-trophy" dangerouslySetInnerHTML={{ __html: hero }} />}
          <div className="ser-hero">
            {ev.active && <span className="ser-badge">Läuft</span>}
            <h1>{ev.name}</h1>
            {done && champ.length > 0 && <div className="ser-champ">{names(champ)} {champ.length > 1 ? 'gewinnen' : 'gewinnt'} die Serie</div>}
            <small>{games.length ? `${games.length} ${games.length === 1 ? 'Partie' : 'Partien'} mit ${rows.length} ${rows.length === 1 ? 'Spieler' : 'Spielern'}, ${spanOf(games.map(g => g.finishedAt))}` : 'Noch keine Partien'}</small>
          </div>
          {ev.active
            ? <button className="secondary ser-end" id="series-end" onClick={() => a.endEvent(ev.id)}>Serie beenden</button>
            : <button className="secondary ser-end" id="series-resume" onClick={() => a.resumeEvent(ev.id)}>{ev.endedAt ? 'Fortsetzen' : 'Starten'}</button>}
          {awards.length > 0 && <div className="group"><div className="eyebrow">Auszeichnungen</div>
            <div className="ser-awards">
              {awards.map(x => (
                <div key={x.key} className={'award a-' + x.key}>
                  <span className="award-ill" dangerouslySetInnerHTML={{ __html: AWARD_ART[x.key] }} />
                  <small>{x.label}</small>
                  <b>{x.n}<em>{x.unit}</em></b>
                  <span className="award-who">{names(x.who)}</span>
                </div>
              ))}
            </div>
          </div>}
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
                  const ic = iconFor(x.key, x.name);
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
                  const ic = iconFor(h.key, h.name);
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

/** Kleine flache Abbildungen für die Auszeichnungen (64×64) */
const AWARD_ART: Record<string, string> = {
  // Pokal mit Stern
  siege: `<svg viewBox="0 0 64 64"><path d="M20 14h24v12a12 12 0 0 1-24 0z" fill="#f2cf86"/><path d="M20 18h-6a6 6 0 0 0 8 8M44 18h6a6 6 0 0 1-8 8" fill="none" stroke="#e0b45e" stroke-width="4" stroke-linecap="round"/>
    <rect x="29" y="37" width="6" height="8" fill="#e0b45e"/><rect x="22" y="45" width="20" height="6" rx="3" fill="#e0b45e"/><circle cx="32" cy="24" r="4.5" fill="#fffaf2"/></svg>`,
  // Flamme
  serie: `<svg viewBox="0 0 64 64"><path d="M32 8c4 10 16 16 16 30a16 16 0 0 1-32 0c0-8 4-12 8-16 0 6 3 9 6 10-2-10 0-18 2-24z" fill="#f3a98f"/>
    <path d="M32 30c3 5 8 8 8 14a8 8 0 0 1-16 0c0-5 4-8 8-14z" fill="#f2cf86"/></svg>`,
  // Karte, Würfel, Spielstein
  allround: `<svg viewBox="0 0 64 64"><g transform="rotate(-12 22 32)"><rect x="10" y="16" width="22" height="30" rx="4" fill="#fffaf2"/><circle cx="21" cy="31" r="5" fill="#eda7bf"/></g>
    <g transform="rotate(10 44 38)"><rect x="32" y="26" width="22" height="22" rx="5" fill="#86cbb8"/><circle cx="38" cy="32" r="2.2" fill="#fffaf2"/><circle cx="48" cy="42" r="2.2" fill="#fffaf2"/><circle cx="43" cy="37" r="2.2" fill="#fffaf2"/></g>
    <circle cx="44" cy="15" r="5" fill="#bba8e6"/><path d="M38 24l6-6 6 6z" fill="#bba8e6"/></svg>`,
  // Regenwolke
  pech: `<svg viewBox="0 0 64 64"><circle cx="24" cy="28" r="10" fill="#b7bfd6"/><circle cx="36" cy="22" r="12" fill="#c6cde1"/><circle cx="45" cy="30" r="8" fill="#b7bfd6"/><rect x="16" y="28" width="36" height="10" rx="5" fill="#c6cde1"/>
    ${[22, 32, 42].map((x, k) => `<path d="M${x} ${44 + (k % 2) * 4}c1.5 3 2.6 4.8 2.6 6.2a2.6 2.6 0 0 1-5.2 0c0-1.4 1.1-3.2 2.6-6.2z" fill="#97c4e3"/>`).join('')}</svg>`
};
