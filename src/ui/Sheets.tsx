import { forwardRef, useState } from 'react';
import { act, useApp, type Edit } from '../store';
import { SeriesPicker } from './SeriesPicker';
import { GAME_ART, ownArt } from './art';
import { highlights } from '../game/highlights';
import { loserRoom, trophyRoom } from './trophy';
import { names } from './Home';
import { anyScore, ranking, roundNumber, scoreOf, seated, totals, type GameState, membersOf, isLives, isTokens, tokenState } from '../game/engine';
import { fmt, onColor } from '../lib/color';
import { stepsOf } from '../game/templates';
import { toggleTheme, useTheme } from '../useTheme';
import { Avatar } from './Avatar';
import { IconBackspace, IconClose } from './icons';

const numOf = (buf: string) => (buf === '' || buf === '-' ? null : parseInt(buf, 10));

function Sheet({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <div className="scrim" onClick={() => act().closeSheet()} />
      <div className="bsheet" role="dialog" aria-label={label}><div className="grab" /><div className="sheet-body">{children}</div></div>
    </>
  );
}

// ---------------------------------------------------------------- Ziffernblock im Überblick (Bearbeiten einer Zelle)

export const PadSheet = forwardRef<HTMLDivElement, { g: GameState; edit: Edit }>(function PadSheet({ g, edit }, ref) {
  const players = seated(g), i = players.findIndex(p => p.id === edit.playerId), p = players[i];
  const v = numOf(edit.buf), cur = edit.ref === 'new' ? null : scoreOf(g, edit.ref, p.id);
  const after = totals(g)[p.id] - (cur ?? 0) + (v ?? 0);
  const a = act();
  const d = (n: number) => <button key={n} className="key" onClick={() => a.digit(n)}>{n}</button>;
  const q = (n: number) => <button className="key q" onClick={() => a.add(n)}>{n > 0 ? '+' + n : '−' + -n}</button>;
  // Die zwei größten Zählschritte der Vorlage
  const st = [...stepsOf(g.game.rules)].sort((x, y) => x - y);
  const [s1, s2] = st.length >= 2 ? st.slice(-2) : [st[0], st[0] * 5];
  return (
    <div className="bsheet" id="pad" role="dialog" aria-label="Punkte eingeben" ref={ref}>
      <div className="grab" />
      <div className="sheet-body">
        <div className="pad-head">
          <span className="dot" style={{ ['--c' as string]: p.color, width: 14, height: 14 }} />
          <div className="who"><b>{p.name}</b><small>Runde {roundNumber(g, edit.ref)}</small></div>
          <button className="icon-btn" onClick={a.closePad} aria-label="Ziffernblock schließen"><IconClose /></button>
        </div>
        <div className="pad-display">
          <span className={'val' + (v === null ? ' ph' : '') + (v !== null && v < 0 ? ' neg' : '')}>{v === null ? '0' : fmt(v)}</span>
          <span className="after">Summe danach<b>{fmt(after)}</b></span>
        </div>
        <div className="keys">
          {d(1)}{d(2)}{d(3)}{q(s1)}
          {d(4)}{d(5)}{d(6)}{q(s2)}
          {d(7)}{d(8)}{d(9)}{q(-s1)}
          <button className="key fn" onClick={a.sign} aria-label="Vorzeichen">±</button>{d(0)}
          <button className="key fn" onClick={a.back} aria-label="Löschen"><IconBackspace /></button>{q(-s2)}
        </div>
        <div className="pad-actions">
          <button className="secondary" onClick={a.clear}>Leeren</button>
          <button className="primary" onClick={a.next}>{i < players.length - 1 ? `Weiter zu ${players[i + 1].name}` : 'Eintragen'}</button>
        </div>
      </div>
    </div>
  );
});

// ---------------------------------------------------------------- Menü

export function MenuSheet({ g }: { g: GameState }) {
  const theme = useTheme();
  const [confirm, setConfirm] = useState(false);
  const win = g.game.rules.win;
  return (
    <Sheet label="Spielmenü">
      <h3>{g.game.rules.name}</h3>
      <div className="field"><label>Gewinner</label>
        <div className="seg">
          <button aria-pressed={win === 'high'} onClick={() => act().setWin('high')}>Höchste Summe</button>
          <button aria-pressed={win === 'low'} onClick={() => act().setWin('low')}>Niedrigste Summe</button>
        </div>
      </div>
      <div className="menu-list">
        <button onClick={toggleTheme}>Design <small>{theme === 'dark' ? 'Dunkel' : 'Hell'}</small></button>
        {g.game.rules.scoring === 'categories' && <button id="open-cats" onClick={() => act().openSheet('cats')}>Kategorien</button>}
        {g.game.rules.scoring === 'rounds' && !g.game.rules.params?.split && <button id="open-notes" onClick={() => act().openSheet('notes')}>Notizfelder <small>{g.game.rules.params?.notes?.length || ''}</small></button>}
        <button onClick={() => act().openSheet('result')}>Beenden und speichern</button>
        {!confirm
          ? <button className="warn" onClick={() => setConfirm(true)}>Partie verwerfen</button>
          : <div className="confirm-row"><button className="no" onClick={() => setConfirm(false)}>Abbrechen</button><button className="yes" onClick={() => act().discardGame()}>Wirklich verwerfen</button></div>}
      </div>
    </Sheet>
  );
}

// ---------------------------------------------------------------- Ergebnis

export function ResultSheet({ g }: { g: GameState }) {
  const { events } = useApp();
  const [eventId, setEventId] = useState<string | null>(() => {
    try { const id = localStorage.getItem('pz:lastEvent'); return id && events.some(e => e.id === id) ? id : null; } catch { return null; }
  });
  const rk = ranking(g), started = anyScore(g), rules = g.game.rules;
  const winners = rk.filter(x => x.place === 1);
  const icon = GAME_ART[rules.key]?.icon ?? ownArt(rules.key, rules.name, rules.params).icon;
  // Deckel-Spiele (Schocken, Chic): es zählt, wer verliert, also der traurige Otter mit dem Deckelstapel
  const scene = isTokens(g) && tokenState(g).loser ? loserRoom(icon, 'deckel') : trophyRoom(icon);
  const stats = started ? highlights(g) : [];
  // Treppchen: Zweiter, Erster, Dritter
  const podium = [rk[1], rk[0], rk[2]].filter((x): x is typeof rk[number] => !!x);
  // Tisch-Modus: Leben bzw. verlorene Hälften statt Punkte; bei Schocken zählt, wer verliert
  const ts = isTokens(g) ? tokenState(g) : null;
  const pts = (v: number, id: string) => (isLives(g) ? `${v} Leben` : ts ? (v ? `${v} ${v === 1 ? 'Hälfte' : 'Hälften'}` : `${ts.taken[id]} Deckel`) : fmt(v));
  const loser = ts ? seated(g).find(p => p.id === ts.loser) : undefined;
  return (
    <>
      <div className="scrim" onClick={() => act().closeSheet()} />
      <div className="bsheet victory" role="dialog" aria-label="Ergebnis">
        <div className="v-hero">
          <div className="v-scene" dangerouslySetInnerHTML={{ __html: scene }} />
        </div>
        <div className="sheet-body">
          <div className="eyebrow v-meta">{rules.name}, {new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <h3 className="v-title">{loser ? `${loser.name} verliert` : started ? names(winners.map(x => x.player.name)) + (winners.length > 1 || membersOf(g, winners[0].player.id).length > 1 ? ' gewinnen' : ' gewinnt') : 'Noch keine Punkte'}</h3>
          {started && (
            <div className="v-podium">
              {podium.map(x => (
                <div key={x.player.id} className={'v-step p' + Math.min(x.place, 3)}>
                  <Avatar p={x.player} /><span className="v-nm">{x.player.name}</span><span className="v-pts">{pts(x.total, x.player.id)}</span>
                  <div className="v-block" style={{ background: x.player.color, color: onColor(x.player.color) }}>{x.place}</div>
                </div>
              ))}
            </div>
          )}
          <div className="podium">
            {rk.slice(started ? 3 : 0).map(x => (
              <div key={x.player.id} className="prow">
                <span className="place">{x.place}</span><Avatar p={x.player} /><span className="nm">{x.player.name}</span><span className="pts">{pts(x.total, x.player.id)}</span>
              </div>
            ))}
          </div>
          {stats.length > 0 && (
            <div className="v-stats">
              {stats.map(h => <div key={h.label} className="v-stat"><small>{h.label}</small><b>{h.value}</b>{h.who && <span>{h.who}</span>}</div>)}
            </div>
          )}
          <div className="field"><label>Serie</label><SeriesPicker value={eventId} onChange={setEventId} /></div>
          <div className="pad-actions">
            <button className="secondary" onClick={() => act().closeSheet()}>Weiterspielen</button>
            <button className="primary" onClick={() => act().finishGame(eventId)}>Speichern</button>
          </div>
          {started && <button className="again" id="oina-no" onClick={() => act().oinaNo(eventId)}>
            <svg viewBox="0 0 100 100" aria-hidden="true"><g transform="rotate(-14 50 52)"><rect x="25" y="28" width="50" height="50" rx="13" fill="#c9bda5"/><rect x="25" y="23" width="50" height="50" rx="13" fill="#f3ead6"/><circle cx="50" cy="48" r="8" fill="#ef7a5c"/></g></svg>
            Oina no?</button>}
        </div>
      </div>
    </>
  );
}
