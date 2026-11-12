import { act, useApp } from '../store';
import { useState } from 'react';
import { bidHits, byGame, duel, performance, filterGames, headToHead, eventIds, resultOf, summary, type HistGame, type TimeFilter } from '../game/stats';
import { gameDef } from '../game/games';
import type { Player } from '../model/types';
import { fmt, onColor } from '../lib/color';
import { Avatar } from './Avatar';
import { GameIcon } from './GamePage';
import { Crown, IconBack } from './icons';
import { dateShort, fmtPerf, iconFor, playerOf } from './lookup';

const css = (v: Record<string, string>) => v as React.CSSProperties;
const same = (a: TimeFilter, b: TimeFilter) => JSON.stringify(a) === JSON.stringify(b);

/** Spielerprofil: Siege, Bilanz, Stärken je Spiel, Direktvergleich, letzte Partien */
export function Profile() {
  const { profile, players, history, events, templates } = useApp();
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
              {eventIds(mine).map(id => events.find(e => e.id === id)).filter(e => !!e).map(e => chip(e!.name, same(profile.time, { event: e!.id }), () => a.setProfile({ time: { event: e!.id } })))}
            </div>
            <div className="fchips">
              {chip('Alle Spiele', profile.key === null, () => a.setProfile({ key: null }))}
              {keys.map(([k, n]) => chip(n, profile.key === k, () => a.setProfile({ key: k }), k))}
            </div>
            <div className="tiles">
              <div className="tile accent" id="perf-tile" style={css({ '--c': me.color, '--on': onColor(me.color) })}><small>Leistung</small><b>{fmtPerf(performance(list, profile.id).score)}</b><span>der Erwartung</span></div>
              <div className="tile"><small>Siege</small><b>{s.wins}</b><span>von {s.played}</span></div>
              <div className="tile"><small>Siegquote</small><b>{s.rate}%</b><span>&nbsp;</span></div>
            </div>
            <div className="wl">
              <div className="wl-bar"><i style={{ flex: s.wins || 0.0001, background: me.color }} /><i style={{ flex: s.losses || 0.0001 }} /></div>
              <div className="wl-lbl"><span><b>{s.wins}</b> {s.wins === 1 ? 'Sieg' : 'Siege'}</span><span><b>{s.losses}</b> {s.losses === 1 ? 'Niederlage' : 'Niederlagen'}</span></div>
            </div>
            {profile.key === null && byGame(list, profile.id).length > 0 && (
              <div className="group"><div className="eyebrow">Stärken</div>
                <div className="list">
                  {byGame(list, profile.id).sort((x, y) => performance(list.filter(g => g.key === y.key), profile.id).score - performance(list.filter(g => g.key === x.key), profile.id).score).map(x => {
                    const ic = iconFor(x.key), pf = performance(list.filter(g => g.key === x.key), profile.id).score;
                    return (
                      <button key={x.key} className="row" onClick={() => a.setProfile({ key: x.key })}>
                        <GameIcon icon={ic.icon} tint={ic.tint} />
                        <span className="t"><b>{x.name}</b><small>{x.wins} von {x.played} gewonnen</small></span>
                        <span className="mini-bar"><i style={{ width: Math.min(pf / 2, 1) * 100 + '%', background: me.color }} /></span><span className="mini-pct">{fmtPerf(pf)}</span>
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
                  {profile.vs.length === 1 && <DuelView list={list} me={me as Player} other={playerOf(players, profile.vs[0]) as Player} low={!!profile.key && (gameDef(profile.key)?.template ?? templates.find(t => t.key === profile.key))?.win === 'low'} />}
                  {profile.vs.length > 1 && vs && (vs.shared
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

/** Direktvergleich zweier Spieler: gespiegelte Balken in den Spielerfarben */
function DuelView({ list, me, other, low }: { list: HistGame[]; me: Player; other: Player; low: boolean }) {
  const d = duel(list, me.id, other.id, low);
  const [rate, setRate] = useState(false);
  if (!d.shared) return <p className="vs-sum">Keine gemeinsamen Partien</p>;
  const pct = (x: number, n: number) => (n ? Math.round(x / n * 100) : 0);
  const cnt = (a: number, b: number, n: number) => (rate ? [pct(a, n), pct(b, n)] : [a, b]) as [number, number];
  const unit = (n: number) => dec(n) + (rate ? ' %' : '');
  const dec = (n: number) => n.toLocaleString('de-DE', { maximumFractionDigits: 1 });
  const row = (label: string, a: number, b: number, better: 'high' | 'low' = 'high', show: (n: number) => string = dec, small = false) => {
    const wa = better === 'high' ? a : b, wb = better === 'high' ? b : a;
    const lead = a === b ? 0 : (better === 'high' ? a > b : a < b) ? 1 : 2;
    return (
      <div className={'duel-row' + (small ? ' small' : '')} key={label}>
        <div className="eyebrow">{label}</div>
        <div className="duel-line">
          <b className={lead === 2 ? 'dim' : ''}>{show(a)}</b>
          <span className="duel-bar">
            <i style={{ flex: Math.max(wa, 0) || (wa === wb ? 1 : 0.0001), background: me.color }} />
            <i style={{ flex: Math.max(wb, 0) || (wa === wb ? 1 : 0.0001), background: other.color }} />
          </span>
          <b className={lead === 1 ? 'dim' : ''}>{show(b)}</b>
        </div>
      </div>
    );
  };
  return (
    <div className="duel">
      <div className="duel-head">
        <div><Avatar p={me} big /><span>{me.name}</span></div>
        <small>{d.shared} gemeinsame {d.shared === 1 ? 'Partie' : 'Partien'}</small>
        <div><Avatar p={other} big /><span>{other.name}</span></div>
      </div>
      <div className="seg duel-seg">
        <button id="duel-count" aria-pressed={!rate} onClick={() => setRate(false)}>Anzahl</button>
        <button id="duel-rate" aria-pressed={rate} onClick={() => setRate(true)}>Quote</button>
      </div>
      {row('Leistung', d.a.perf, d.b.perf, 'high', fmtPerf)}
      {row(rate ? 'Siegquote' : 'Siege', ...cnt(d.a.wins, d.b.wins, d.shared), 'high', unit)}
      {(d.a.ahead !== d.a.wins || d.b.ahead !== d.b.wins) && row('Besser platziert', ...cnt(d.a.ahead, d.b.ahead, d.shared), 'high', unit)}
      {row('Durchschnittsplatz', d.a.avgPlace, d.b.avgPlace, 'low')}
      {d.a.avgPts !== null && d.b.avgPts !== null && row('Durchschnitt', d.a.avgPts, d.b.avgPts, low ? 'low' : 'high', fmt)}
      {d.a.best !== null && d.b.best !== null && row('Bestwert', d.a.best, d.b.best, low ? 'low' : 'high', fmt)}
      {d.extras.map(x => row(x.label, x.a, x.b, 'high', n => dec(n) + (x.unit ? ' ' + x.unit : '')))}
      {d.perGame.length > 1 && <><div className="eyebrow duel-last">Siege je Spiel</div>{d.perGame.map(x => row(x.name + (rate ? '' : `, ${x.n} ${x.n === 1 ? 'Partie' : 'Partien'}`), ...cnt(x.a, x.b, x.n), 'high', unit, true))}</>}
      <div className="eyebrow duel-last">Gemeinsame Partien</div>
      <div className="duel-games">
        {d.games.slice(0, 5).map(g => {
          const ra = resultOf(g, me.id)!, rb = resultOf(g, other.id)!, ic = iconFor(g.key);
          return (
            <div key={g.id} className="duel-game">
              <GameIcon icon={ic.icon} tint={ic.tint} />
              <span className="t">
                <small>{g.name}, {dateShort(g.finishedAt)}</small>
                <span className={ra.place < rb.place ? 'w' : ''}>{me.name} {fmt(ra.total)}{ra.place < rb.place && <Crown />}</span>
                <span className={rb.place < ra.place ? 'w' : ''}>{other.name} {fmt(rb.total)}{rb.place < ra.place && <Crown />}</span>
              </span>
              <button className="rematch" onClick={() => act().rematch(g.id)} aria-label={`Revanche ${g.name}`}>Revanche</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
