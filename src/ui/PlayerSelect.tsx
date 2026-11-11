import { useRef, useState } from 'react';
import { act, useApp } from '../store';
import { IconBack } from './icons';

/** Ziehen am Griff verschiebt den Spieler; die Liste ordnet sich beim Überqueren einer halben Zeile neu. */
function useReorder(count: number) {
  const drag = useRef<{ index: number; startY: number; rowH: number } | null>(null);
  const [state, setState] = useState<{ index: number; offset: number } | null>(null);
  const onDown = (index: number) => (e: React.PointerEvent<HTMLElement>) => {
    const row = e.currentTarget.closest('.order-row') as HTMLElement | null;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { index, startY: e.clientY, rowH: row?.offsetHeight || 52 };
    setState({ index, offset: 0 });
  };
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    const d = drag.current; if (!d) return;
    let dy = e.clientY - d.startY;
    if (dy > d.rowH / 2 && d.index < count - 1) { act().moveSelected(d.index, d.index + 1); d.index++; d.startY += d.rowH; dy -= d.rowH; }
    else if (dy < -d.rowH / 2 && d.index > 0) { act().moveSelected(d.index, d.index - 1); d.index--; d.startY -= d.rowH; dy += d.rowH; }
    setState({ index: d.index, offset: dy });
  };
  const onUp = () => { drag.current = null; setState(null); };
  return { state, onDown, onMove, onUp };
}

export function PlayerSelect() {
  const { template, players, selected } = useApp();
  const [name, setName] = useState('');
  const chosen = selected.map(id => players.find(p => p.id === id)).filter(p => !!p);
  const dnd = useReorder(chosen.length);
  if (!template) return null;
  const n = chosen.length, { min, max } = template.players;
  const label = n < min ? 'Spieler wählen' : n > max ? `Höchstens ${max} Spieler` : `Los mit ${n} ${n === 1 ? 'Spieler' : 'Spielern'}`;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    act().addPlayer(name); setName('');
    (document.activeElement as HTMLElement | null)?.blur();
  };
  return (
    <section className="screen" id="s-players">
      <div className="top gutter">
        <button className="icon-btn" onClick={() => act().playersBack()} aria-label="Zurück"><IconBack /></button>
        <div className="grow"><h2>Wer spielt mit?</h2><div className="sub">{template.name}</div></div>
      </div>
      <div className="scroll">
        <div className="gutter players-body">
          <div className="group">
            <div className="eyebrow">Reihenfolge am Tisch</div>
            <div className="list order">
              {chosen.length ? chosen.map((p, i) => {
                const dragging = dnd.state?.index === i;
                return (
                  <div key={p.id} className={'row order-row' + (dragging ? ' dragging' : '')}
                    style={dragging ? { transform: `translateY(${dnd.state!.offset}px)` } : undefined}>
                    <span className="grip" aria-label={`${p.name} verschieben`} role="button"
                      onPointerDown={dnd.onDown(i)} onPointerMove={dnd.onMove} onPointerUp={dnd.onUp} onPointerCancel={dnd.onUp}>
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14M5 12h14M5 16h14" /></svg>
                    </span>
                    <span className="dot" style={{ ['--c' as string]: p.color }} />
                    <span className="nm">{p.name}</span>
                    <button className="rm" onClick={() => act().toggleSelect(p.id)} aria-label={`${p.name} entfernen`}>✕</button>
                  </div>
                );
              }) : <div className="empty-order">{players.length ? 'Tippe unten auf Namen, um Spieler hinzuzufügen.' : 'Lege unten die ersten Spieler an.'}</div>}
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
