import { useState } from 'react';
import { act, useApp } from '../store';
import { MAX_STEPS, STEP_CHOICES, fallbackName, stepsOf } from '../game/templates';
import type { End, Template } from '../model/types';
import { GamePage } from './GamePage';
import { FREE_ICON, FREE_SCENE, LOOK_COLORS, LOOK_PATTERNS, customArt, lookOf } from './art';
import { names } from './Home';

export const FREE_TINT = '#e7e4f7';

const PATTERN_NAMES: Record<string, string> = {
  dots: 'Punkte', checker: 'Raster', waves: 'Wellen', stripes: 'Streifen', lozenge: 'Rauten', hex: 'Waben', rays: 'Strahlen', blocks: 'Blöcke'
};

/** Regeln eines eigenen Spiels als Stichpunkte */
function pointsOf(t: Template): [string, string][] {
  const end = t.end.type === 'target' ? `bei ${t.end.value} Punkten` : t.end.type === 'rounds' ? `nach ${t.end.value} Runden` : 'offen';
  const p: [string, string][] = [
    ['Gewinner', t.win === 'high' ? 'höchste Punktzahl' : 'niedrigste Punktzahl'],
    ['Spielende', end],
    ['Zählschritte', names(stepsOf(t).map(String))]
  ];
  if (t.params?.notes?.length) p.push(['Notizfelder', names(t.params.notes)]);
  return p;
}

/**
 * Freies Spiel (Einmal-Partie), eigene Vorlage erstellen, oder Seite eines eigenen Spiels
 * (Ansicht mit Regeln, Bearbeiten, Löschen).
 */
export function Setup() {
  const { setup, editKey, templates, setupTemplate, selected, players } = useApp();
  const a = act();
  const own = editKey ? templates.find(t => t.key === editKey) : undefined;
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [ownStep, setOwnStep] = useState('');
  const [note, setNote] = useState('');
  const endKind = setup.end.type;
  const endValue = setup.end.type === 'target' || setup.end.type === 'rounds' ? setup.end.value : 0;
  const valid = endKind === 'none' || endValue > 0;

  // Aussehen: eigene Spiele und neue Vorlagen bekommen Szene und Icon aus Name, Farbe und Muster
  const art = setupTemplate ? customArt(own?.key ?? 'neu', setup.name || own?.name || 'Eigenes Spiel', setup.look ?? own?.params?.look) : null;
  const scene = art ? art.scene : FREE_SCENE, icon = art ? art.icon : FREE_ICON, tint = art ? art.tint : FREE_TINT;

  // Ansicht eines eigenen Spiels
  if (own && !editing) {
    const n = selected.filter(id => players.some(p => p.id === id)).length;
    const ready = n >= own.players.min && n <= own.players.max;
    return (
      <GamePage id="s-setup" scene={scene} icon={icon} tint={tint} title={own.name} onBack={() => a.goHome()}
        dock={ready
          ? <><button className="secondary" onClick={() => a.toPlayers()}>Spieler</button><button className="primary" id="quick-start" onClick={() => a.start()}>Los mit {n} Spielern</button></>
          : <button className="primary" id="setup-next" onClick={() => a.toPlayers()}>Spieler wählen</button>}>
        <div className="rule-card" style={{ ['--acc' as string]: lookOf(own.key, own.params?.look).color }}>
          <ul className="rule-points">{pointsOf(own).map(([k, t]) => <li key={k}><b>{k}</b><span>{t}</span></li>)}</ul>
        </div>
        <div className="menu-list own-actions">
          <button id="tpl-edit" onClick={() => setEditing(true)}>Bearbeiten</button>
          {!confirm
            ? <button className="warn" id="tpl-delete" onClick={() => setConfirm(true)}>Spiel löschen</button>
            : <div className="confirm-row"><button className="no" onClick={() => setConfirm(false)}>Abbrechen</button><button className="yes" id="tpl-delete-yes" onClick={() => a.deleteTemplate(own.key)}>Wirklich löschen</button></div>}
        </div>
      </GamePage>
    );
  }

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
  const addOwn = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(ownStep, 10);
    if (n > 0 && !setup.steps.includes(n) && setup.steps.length < MAX_STEPS) a.updateSetup({ steps: [...setup.steps, n].sort((x, y) => x - y) });
    setOwnStep('');
  };
  const addNote = (e: React.FormEvent) => {
    e.preventDefault();
    const n = note.trim();
    if (n && !setup.notes.includes(n) && setup.notes.length < 4) a.updateSetup({ notes: [...setup.notes, n] });
    setNote('');
  };
  const look = lookOf(own?.key ?? 'neu', setup.look ?? own?.params?.look);
  const preview = [...setup.steps].sort((x, y) => y - x).map(n => -n).concat([...setup.steps].sort((x, y) => x - y));
  const title = own ? own.name : setupTemplate ? (setup.name.trim() || 'Eigene Vorlage') : 'Freies Spiel';
  return (
    <GamePage id="s-setup" scene={scene} icon={icon} tint={tint} title={title} onBack={() => (own ? setEditing(false) : a.goHome())}
      dock={<>
        {own && <button className="secondary" id="setup-save" disabled={!valid} onClick={() => { a.saveSetupHome(); setEditing(false); }}>Speichern</button>}
        {!own && setupTemplate && <button className="secondary" id="setup-save" disabled={!valid || !setup.name.trim()} onClick={() => a.saveNewTemplate()}>Speichern</button>}
        <button className="primary" id="setup-next" disabled={!valid || (setupTemplate && !own && !setup.name.trim())} onClick={() => a.setupNext()}>Spieler wählen</button>
      </>}>
        <div className="setup-body">
          <div className="field">
            <label htmlFor="setup-name">Name</label>
            <input id="setup-name" value={setup.name} maxLength={28} autoComplete="off" placeholder={setupTemplate ? 'Name des Spiels' : fallbackName()}
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
          <div className="field">
            <label>Notizfelder</label>
            {setup.notes.length > 0 && <div className="chips note-chips">
              {setup.notes.map(n => <button key={n} className="chip on" aria-label={`${n} entfernen`} onClick={() => a.updateSetup({ notes: setup.notes.filter(x => x !== n) })}>{n} ✕</button>)}
            </div>}
            <form className="add-row" onSubmit={addNote}>
              <input id="note-name" value={note} maxLength={18} autoComplete="off" placeholder="Neues Feld" aria-label="Neues Notizfeld" onChange={e => setNote(e.target.value)} />
              <button type="submit" disabled={!note.trim() || setup.notes.length >= 4}>Hinzufügen</button>
            </form>
          </div>
          {setupTemplate && (
            <div className="field">
              <label>Aussehen</label>
              <div className="look-colors">
                {LOOK_COLORS.map(c => <button key={c} className="look-c" style={{ background: c }} aria-label="Farbe" aria-pressed={look.color === c} onClick={() => a.updateSetup({ look: { color: c, pattern: look.pattern } })} />)}
              </div>
              <div className="chips">
                {LOOK_PATTERNS.map(p => <button key={p} className="chip" aria-pressed={look.pattern === p} onClick={() => a.updateSetup({ look: { color: look.color, pattern: p } })}>{PATTERN_NAMES[p]}</button>)}
              </div>
            </div>
          )}
          {!setupTemplate && <label className="switch-row">
            <input type="checkbox" checked={setup.save} onChange={e => a.updateSetup({ save: e.target.checked })} />
            <span className="t"><b>Als Vorlage speichern</b></span>
          </label>}
        </div>
    </GamePage>
  );
}
