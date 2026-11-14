import { useState } from 'react';
import type { End } from '../model/types';

/** Spielende: offen, nach Runden oder bei Punkten; das Limit ist frei eintragbar */
export function EndPicker({ end, onChange, rounds = 10, points = 100, pointsOk = true }: { end: End; onChange: (e: End) => void; rounds?: number; points?: number; pointsOk?: boolean }) {
  const kind = end.type === 'rounds' || end.type === 'target' ? end.type : 'none';
  const value = end.type === 'rounds' || end.type === 'target' ? end.value : 0;
  const [text, setText] = useState(value ? String(value) : '');
  const pick = (k: 'none' | 'rounds' | 'target') => {
    if (k === 'none') { onChange({ type: 'none' }); return; }
    const v = k === kind && value ? value : k === 'rounds' ? rounds : points;
    setText(String(v)); onChange({ type: k, value: v });
  };
  const type = (raw: string) => {
    const t = raw.replace(/\D/g, '').slice(0, 5); setText(t);
    const v = parseInt(t, 10);
    if (v > 0 && kind !== 'none') onChange({ type: kind, value: v });
  };
  return (
    <div className="field end-pick">
      <label>Spielende</label>
      <div className="seg">
        <button id="end-none" aria-pressed={kind === 'none'} onClick={() => pick('none')}>Offen</button>
        <button id="end-rounds" aria-pressed={kind === 'rounds'} onClick={() => pick('rounds')}>Runden</button>
        {pointsOk && <button id="end-target" aria-pressed={kind === 'target'} onClick={() => pick('target')}>Punkte</button>}
      </div>
      {kind !== 'none' && <label className="end-limit">
        <span>{kind === 'rounds' ? 'Nach' : 'Bei'}</span>
        <input id="end-value" inputMode="numeric" pattern="[0-9]*" aria-label={kind === 'rounds' ? 'Anzahl Runden' : 'Punkte'} value={text}
          onChange={e => type(e.target.value)} onBlur={() => { if (!(parseInt(text, 10) > 0)) setText(String(value || (kind === 'rounds' ? rounds : points))); }} />
        <span>{kind === 'rounds' ? 'Runden' : 'Punkten'}</span>
      </label>}
    </div>
  );
}
