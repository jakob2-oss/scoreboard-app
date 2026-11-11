import { useState } from 'react';
import { act, useApp } from '../store';
import { IconBack } from './icons';

export function PlayerSelect() {
  const { template, players, selected } = useApp();
  const [name, setName] = useState('');
  if (!template) return null;
  const chosen = selected.map(id => players.find(p => p.id === id)).filter(p => !!p);
  const n = chosen.length, { min, max } = template.players;
  const label = n < min ? 'Mindestens 1 Spieler' : n > max ? `Höchstens ${max} Spieler` : `Los · ${n} Spieler`;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    act().addPlayer(name); setName('');
    (document.activeElement as HTMLElement | null)?.blur();
  };
  return (
    <section className="screen" id="s-players">
      <div className="top gutter">
        <button className="icon-btn" onClick={() => act().goHome()} aria-label="Zurück"><IconBack /></button>
        <div className="grow"><h2>Wer spielt mit?</h2><div className="sub">{template.name}</div></div>
      </div>
      <div className="scroll">
        <div className="gutter players-body">
          <div className="group">
            <div className="eyebrow">Reihenfolge am Tisch</div>
            <div className="list order">
              {chosen.length ? chosen.map((p, i) => (
                <div key={p.id} className="row order-row">
                  <span className="pos">{i + 1}</span><span className="dot" style={{ ['--c' as string]: p.color }} />
                  <span className="nm">{p.name}</span>
                  <button className="rm" onClick={() => act().toggleSelect(p.id)} aria-label={`${p.name} entfernen`}>✕</button>
                </div>
              )) : <div className="empty-order">{players.length ? 'Tippe unten auf Namen, um Spieler hinzuzufügen.' : 'Lege unten die ersten Spieler an.'}</div>}
            </div>
          </div>
          {players.length > 0 && (
            <div className="group">
              <div className="eyebrow">Spieler</div>
              <div className="chips">
                {players.map(p => (
                  <button key={p.id} className="chip" aria-pressed={selected.includes(p.id)} onClick={() => act().toggleSelect(p.id)}>{p.name}</button>
                ))}
              </div>
            </div>
          )}
          <form className="add-row" onSubmit={submit}>
            <input id="add-name" value={name} onChange={e => setName(e.target.value)} placeholder="Neuer Name" autoComplete="off" maxLength={18} aria-label="Neuer Spielername" />
            <button type="submit">Hinzufügen</button>
          </form>
        </div>
      </div>
      <div className="dock gutter">
        <button className="primary" id="start-btn" disabled={n < min || n > max} onClick={() => act().start()}>{label}</button>
      </div>
    </section>
  );
}
