import { forwardRef, useState } from 'react';
import { act, type Edit } from '../store';
import { anyScore, ranking, roundNumber, scoreOf, seated, totals, type GameState } from '../game/engine';
import { fmt } from '../lib/color';
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
  const lastOccasion = (() => { try { return localStorage.getItem('pz:lastOccasion') || ''; } catch { return ''; } })();
  const [occasion, setOccasion] = useState('');
  const rk = ranking(g), started = anyScore(g);
  return (
    <Sheet label="Ergebnis">
      <div className="eyebrow">{new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      <h3>{started ? rk.filter(x => x.place === 1).map(x => x.player.name).join(' & ') + ' gewinnt' : 'Noch keine Punkte'}</h3>
      <div className="podium">
        {rk.map(x => (
          <div key={x.player.id} className={'prow' + (x.place === 1 && started ? ' win' : '')}>
            <span className="place">{x.place}</span><Avatar p={x.player} /><span className="nm">{x.player.name}</span><span className="pts">{fmt(x.total)}</span>
          </div>
        ))}
      </div>
      <div className="field"><label htmlFor="occasion">Anlass oder Ort</label>
        <input id="occasion" value={occasion} maxLength={32} autoComplete="off" placeholder={lastOccasion || 'Optional'} onChange={e => setOccasion(e.target.value)} />
      </div>
      <div className="pad-actions">
        <button className="secondary" onClick={() => act().closeSheet()}>Weiterspielen</button>
        <button className="primary" onClick={() => act().finishGame(occasion)}>Speichern</button>
      </div>
    </Sheet>
  );
}
