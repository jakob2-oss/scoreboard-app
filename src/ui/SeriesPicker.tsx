import { useState } from 'react';
import { act, useApp } from '../store';
import { recentEvents } from './lookup';

/** Auswahl einer Serie: keine, vorhandene oder neu anlegen */
export function SeriesPicker({ value, onChange }: { value: string | null; onChange: (id: string | null) => void }) {
  const { events, history } = useApp();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const ev = act().createEvent(name);
    if (ev) { onChange(ev.id); setName(''); setAdding(false); }
  };
  return (
    <div className="ser-pick">
      <div className="ser-chips">
        <button className="fchip" aria-pressed={value === null} onClick={() => onChange(null)}>Keine</button>
        {recentEvents(events, history).map(e => (
          <button key={e.id} className="fchip" aria-pressed={value === e.id} onClick={() => onChange(e.id)}>{e.name}</button>
        ))}
        {!adding && <button className="fchip add" id="series-new" onClick={() => setAdding(true)}>Neue Serie</button>}
      </div>
      {adding && (
        <form className="ser-add" onSubmit={add}>
          <input id="series-name" value={name} autoFocus maxLength={32} autoComplete="off" placeholder="Name der Serie" onChange={e => setName(e.target.value)} />
          <button className="primary" type="submit" disabled={!name.trim()}>Anlegen</button>
        </form>
      )}
    </div>
  );
}
