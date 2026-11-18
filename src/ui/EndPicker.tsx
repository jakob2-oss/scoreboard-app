import { useState } from 'react';
import type { End, Template } from '../model/types';

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

/** Spielende frei wählbar: normale Runden- und Rangspiele, nicht Kniffel, Wizard oder Phase 10 */
export const endEditable = (t: Template) => (t.scoring === 'rounds' || t.scoring === 'rank') && !t.params?.phases && !t.params?.resultOnly;

/** Zahl mit Minus und Plus, z. B. Deckel in der Mitte */
export function Stepper({ id, label, value, min = 1, max = 99, onChange }: { id: string; label: string; value: number; min?: number; max?: number; onChange: (v: number) => void }) {
  return (
    <div className="card ser-points stepper">
      <div className="pt-row">
        <span className="pt-place">{label}</span>
        <button className="pt-btn" aria-label={`${label} weniger`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>−</button>
        <b className="pt-val" id={id}>{value}</b>
        <button className="pt-btn" aria-label={`${label} mehr`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>+</button>
      </div>
    </div>
  );
}

/** Was je Partie einstellbar ist: Spielende, Leben oder Deckel. Gilt für diese Partie, eigene Spiele merken sich den Wert. */
export function PlayOptions({ t, rounds, points, onEnd, onParam }: { t: Template; rounds?: number; points?: number; onEnd: (e: End) => void; onParam: (k: string, v: unknown) => void }) {
  if (endEditable(t)) return <EndPicker key={t.key} end={t.end} onChange={onEnd} pointsOk={t.scoring !== 'rank'} rounds={rounds} points={points ?? 500} />;
  if (t.scoring === 'lives') return <Stepper id="play-lives" label="Leben je Spieler" value={t.params?.lives ?? 3} max={20} onChange={v => onParam('lives', v)} />;
  if (t.scoring === 'tokens') return <Stepper id="play-tokens" label="Deckel in der Mitte" value={t.params?.tokens ?? 13} min={2} max={40} onChange={v => onParam('tokens', v)} />;
  return null;
}
