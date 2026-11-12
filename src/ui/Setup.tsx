import { useState } from 'react';
import { act, useApp } from '../store';
import { MAX_STEPS, STEP_CHOICES, fallbackName } from '../game/templates';
import type { End } from '../model/types';
import { GamePage } from './GamePage';
import { FREE_ICON, FREE_SCENE } from './art';

export const FREE_TINT = '#e7e4f7';

/** Freies Spiel: Gewinner, Ende und Zählschritte festlegen */
export function Setup() {
  const { setup, editKey, templates } = useApp();
  const a = act();
  const own = editKey ? templates.find(t => t.key === editKey) : undefined;
  const [confirm, setConfirm] = useState(false);
  const endKind = setup.end.type;
  const endValue = setup.end.type === 'target' || setup.end.type === 'rounds' ? setup.end.value : 0;
  const setEnd = (type: End['type'], value?: number) => {
    if (type === 'target') a.updateSetup({ end: { type, value: value ?? (endKind === 'target' ? endValue : 500) } });
    else if (type === 'rounds') a.updateSetup({ end: { type, value: value ?? (endKind === 'rounds' ? endValue : 10) } });
    else a.updateSetup({ end: { type: 'none' } });
  };
  const toggleStep = (n: number) => {
    const has = setup.steps.includes(n);
    if (!has && setup.steps.length >= MAX_STEPS) return;
    a.updateSetup({ steps: has ? setup.steps.filter(x => x !== n) : [...setup.steps, n].sort((x, y) => x - y) });
  };
  const [ownStep, setOwnStep] = useState('');
  const addOwn = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(ownStep, 10);
    if (n > 0 && !setup.steps.includes(n) && setup.steps.length < MAX_STEPS) a.updateSetup({ steps: [...setup.steps, n].sort((x, y) => x - y) });
    setOwnStep('');
  };
  const valid = endKind === 'none' || endValue > 0;
  const preview = [...setup.steps].sort((x, y) => y - x).map(n => -n).concat([...setup.steps].sort((x, y) => x - y));
  return (
    <GamePage id="s-setup" scene={FREE_SCENE} icon={FREE_ICON} tint={FREE_TINT} title={own ? own.name : 'Freies Spiel'} onBack={() => a.goHome()}
      dock={<>
        {own && <button className="secondary" id="setup-save" disabled={!valid} onClick={() => a.saveSetupHome()}>Speichern</button>}
        <button className="primary" id="setup-next" disabled={!valid} onClick={() => a.setupNext()}>Spieler wählen</button>
      </>}>
        <div className="setup-body">
          <div className="field">
            <label htmlFor="setup-name">Name</label>
            <input id="setup-name" value={setup.name} maxLength={28} autoComplete="off" placeholder={fallbackName()}
              onChange={e => a.updateSetup({ name: e.target.value })} />
          </div>
          <div className="field">
            <label>Wer gewinnt?</label>
            <div className="seg">
              <button aria-pressed={setup.win === 'high'} onClick={() => a.updateSetup({ win: 'high' })}>Höchste Punktzahl</button>
              <button aria-pressed={setup.win === 'low'} onClick={() => a.updateSetup({ win: 'low' })}>Niedrigste Punktzahl</button>
            </div>
          </div>
          <div className="field">
            <label>Spielende</label>
            <div className="seg">
              <button aria-pressed={endKind === 'none'} onClick={() => setEnd('none')}>Offen</button>
              <button aria-pressed={endKind === 'target'} onClick={() => setEnd('target')}>Zielpunkte</button>
              <button aria-pressed={endKind === 'rounds'} onClick={() => setEnd('rounds')}>Runden</button>
            </div>
            {endKind !== 'none' && (
              <input id="setup-end" inputMode="numeric" pattern="[0-9]*" aria-label={endKind === 'target' ? 'Zielpunkte' : 'Anzahl Runden'}
                value={endValue || ''} onChange={e => setEnd(endKind, parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)} />
            )}
          </div>
          <div className="field">
            <label>Zählschritte (bis zu {MAX_STEPS})</label>
            <div className="chips step-chips">
              {[...new Set([...STEP_CHOICES, ...setup.steps])].sort((x, y) => x - y).map(n => (
                <button key={n} className="chip" aria-pressed={setup.steps.includes(n)} onClick={() => toggleStep(n)}>{n}</button>
              ))}
            </div>
            <form className="add-row own-step" onSubmit={addOwn}>
              <input id="own-step" inputMode="numeric" pattern="[0-9]*" placeholder="Eigener Wert" aria-label="Eigener Zählschritt"
                value={ownStep} onChange={e => setOwnStep(e.target.value.replace(/\D/g, '').slice(0, 4))} />
              <button type="submit" disabled={!ownStep || setup.steps.length >= MAX_STEPS}>Hinzufügen</button>
            </form>
            <div className="quick step-preview" aria-hidden="true">
              {preview.map(n => <span key={n}>{n > 0 ? '+' + n : '−' + -n}</span>)}
            </div>
          </div>
          {!own && <label className="switch-row">
            <input type="checkbox" checked={setup.save} onChange={e => a.updateSetup({ save: e.target.checked })} />
            <span className="t"><b>Als Vorlage speichern</b></span>
          </label>}
          {own && <div className="menu-list tpl-del">
            {!confirm
              ? <button className="warn" id="tpl-delete" onClick={() => setConfirm(true)}>Spiel löschen</button>
              : <div className="confirm-row"><button className="no" onClick={() => setConfirm(false)}>Abbrechen</button><button className="yes" id="tpl-delete-yes" onClick={() => a.deleteTemplate(own.key)}>Wirklich löschen</button></div>}
          </div>}
        </div>
    </GamePage>
  );
}
