import { act, useApp } from '../store';
import { bidHits, byGame, filterGames, headToHead, occasions, resultOf, summary, type TimeFilter } from '../game/stats';
import { fmt, onColor } from '../lib/color';
import { Avatar } from './Avatar';
import { GameIcon } from './GamePage';
import { Crown, IconBack } from './icons';
import { dateShort, iconFor, playerOf } from './lookup';

const css = (v: Record<string, string>) => v as React.CSSProperties;
const same = (a: TimeFilter, b: TimeFilter) => JSON.stringify(a) === JSON.stringify(b);

/** Spielerprofil: Siege, Bilanz, Stärken je Spiel, Direktvergleich, letzte Partien */
export function Profile() {
  const { profile, players, history } = useApp();
  if (!profile) return null;
  const me = playerOf(players, profile.id), a = act();
  const mine = filterGames(history, profile.id, 'all', null);
  const list = filterGames(history, profile.id, profile.time, profile.key);
  const s = summary(list, profile.id);
  const keys = [...new Map(mine.map(g => [g.key, g.name])).entries()];
  const others = players.filter(p => p.id !== profile.id && mine.some(g => resultOf(g, p.id)));
  const chip = (label: string, pressed: boolean, on: () => void, icon?: string) => (
    <button className="fchip" aria-pressed={pressed} onClick={on}>{icon && <span className="gi xs" style={css({ '--tc': iconFor(icon).tint })} dangerouslySetInnerHTML={{ __html: iconFor(icon).icon }} />}{label}</button>
  );
  const vs = profile.vs.length ? headToHead(list, [profile.id, ...profile.vs]) : null;
  const maxAhead = vs ? Math.max(1, ...Object.values(vs.ahead)) : 1;
  const hits = profile.key === 'wizard' ? bidHits(list, profile.id) : null;
  const best = list.length ? list.map(g => resultOf(g, profile.id)!.total) : [];
  return (
    <section className="screen" id="s-profile">
      <div className="top gutter">
        <button className="icon-btn" onClick={() => a.openTab('people')} aria-label="Zurück"><IconBack /></button>
        <div className="grow"><h2>Profil</h2></div>
      </div>
      <div className="scroll">
        <div className="gutter pf-body">
          <div className="pf-hero"><Avatar p={me} big /><div><h1>{me.name}</h1><small>{mine.length ? `${mine.length} ${mine.length === 1 ? 'Partie' : 'Partien'}` : 'Noch keine Partie'}</small></div></div>
          {mine.length > 0 && <>
            <div className="fchips">
              {chip('Immer', same(profile.time, 'all'), () => a.setProfile({ time: 'all' }))}
              {chip('30 Tage', same(profile.time, '30'), () => a.setProfile({ time: '30' }))}
              {chip('Dieses Jahr', same(profile.time, 'year'), () => a.setProfile({ time: 'year' }))}
              {occasions(mine).map(o => chip(o, same(profile.time, { occasion: o }), () => a.setProfile({ time: { occasion: o } })))}
            </div>
            <div className="fchips">
              {chip('Alle Spiele', profile.key === null, () => a.setProfile({ key: null }))}
              {keys.map(([k, n]) => chip(n, profile.key === k, () => a.setProfile({ key: k }), k))}
            </div>
            <div className="tiles">
              <div className="tile accent" style={css({ '--c': me.color, '--on': onColor(me.color) })}><small>Siege</small><b>{s.wins}</b><span>von {s.played}</span></div>
              <div className="tile"><small>Siegquote</small><b>{s.rate}%</b><span>&nbsp;</span></div>
              <div className="tile"><small>Partien</small><b>{s.played}</b><span>&nbsp;</span></div>
            </div>
            <div className="wl">
              <div className="wl-bar"><i style={{ flex: s.wins || 0.0001, background: me.color }} /><i style={{ flex: s.losses || 0.0001 }} /></div>
              <div className="wl-lbl"><span><b>{s.wins}</b> {s.wins === 1 ? 'Sieg' : 'Siege'}</span><span><b>{s.losses}</b> {s.losses === 1 ? 'Niederlage' : 'Niederlagen'}</span></div>
            </div>
            {profile.key === null && byGame(list, profile.id).length > 0 && (
              <div className="group"><div className="eyebrow">Stärken</div>
                <div className="list">
                  {byGame(list, profile.id).map(x => {
                    const ic = iconFor(x.key), rate = Math.round(x.wins / x.played * 100);
                    return (
                      <button key={x.key} className="row" onClick={() => a.setProfile({ key: x.key })}>
                        <GameIcon icon={ic.icon} tint={ic.tint} />
                        <span className="t"><b>{x.name}</b><small>{x.wins} von {x.played} gewonnen</small></span>
                        <span className="mini-bar"><i style={{ width: rate + '%', background: me.color }} /></span><span className="mini-pct">{rate}%</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {profile.key !== null && list.length > 0 && (
              <div className="tiles two">
                {hits && hits.rounds > 0
                  ? <div className="tile"><small>Ansagen getroffen</small><b>{hits.rate}%</b><span>{hits.hits} von {hits.rounds}</span></div>
                  : <div className="tile"><small>Durchschnitt</small><b>{fmt(Math.round(best.reduce((x, y) => x + y, 0) / best.length))}</b><span>Punkte</span></div>}
                <div className="tile"><small>Bestwert</small><b>{fmt(Math.max(...best))}</b><span>Punkte</span></div>
              </div>
            )}
            {others.length > 0 && (
              <div className="group"><div className="eyebrow">Direktvergleich</div>
                <div className="card">
                  <div className="vs-pick">
                    {others.map(o => (
                      <button key={o.id} className="vs-p" aria-pressed={profile.vs.includes(o.id)}
                        onClick={() => a.setProfile({ vs: profile.vs.includes(o.id) ? profile.vs.filter(x => x !== o.id) : [...profile.vs, o.id] })}>
                        <Avatar p={o} /><span>{o.name}</span>
                      </button>
                    ))}
                  </div>
                  {vs && (vs.shared
                    ? <>
                      <p className="vs-sum">{vs.shared} gemeinsame {vs.shared === 1 ? 'Partie' : 'Partien'}</p>
                      <div className="vs-bars">
                        {[profile.id, ...profile.vs].sort((x, y) => vs.ahead[y] - vs.ahead[x]).map(id => {
                          const p = playerOf(players, id);
                          return <div key={id} className="vs-row"><Avatar p={p} /><span className="vs-n">{p.name}</span><span className="vs-bar"><i style={{ width: vs.ahead[id] / maxAhead * 100 + '%', background: p.color }} /></span><b>{vs.ahead[id]}×</b></div>;
                        })}
                      </div>
                    </>
                    : <p className="vs-sum">Keine gemeinsamen Partien</p>)}
                </div>
              </div>
            )}
            <div className="group"><div className="eyebrow">Letzte Partien</div>
              <div className="list">
                {list.slice(0, 8).map(g => {
                  const r = resultOf(g, profile.id)!, ic = iconFor(g.key);
                  return (
                    <div key={g.id} className="row">
                      <GameIcon icon={ic.icon} tint={ic.tint} />
                      <span className="t"><b>{g.name}</b><small>{dateShort(g.finishedAt)}{g.occasion ? `, ${g.occasion}` : ''}</small></span>
                      <span className={'place-badge' + (r.place === 1 ? ' win' : '')} style={css({ '--c': me.color, '--on': onColor(me.color) })}>{r.place === 1 && <Crown />}{r.place}.</span>
                      <span className="pts-sm">{fmt(r.total)}</span>
                    </div>
                  );
                })}
                {!list.length && <div className="row"><span className="t"><small>Keine Partien in diesem Zeitraum</small></span></div>}
              </div>
            </div>
          </>}
        </div>
      </div>
    </section>
  );
}
