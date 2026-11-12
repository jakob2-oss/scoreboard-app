import { useState } from 'react';
import { act, useApp } from '../store';
import { MAX_KEYS, MAX_STEPS, STEP_CHOICES, TABLE_START, fallbackName, isTableKind, stepsOf } from '../game/templates';
import type { End, Template } from '../model/types';
import { GamePage } from './GamePage';
import { FREE_ICON, FREE_SCENE, LOOK_COLORS, LOOK_PATTERNS, ownArt, lookOf } from './art';
import { names } from './Home';
import { gameDef } from '../game/games';

export const FREE_TINT = '#e7e4f7';

const PATTERN_NAMES: Record<string, string> = {
  dots: 'Punkte', checker: 'Raster', waves: 'Wellen', stripes: 'Streifen', lozenge: 'Rauten', hex: 'Waben', rays: 'Strahlen', blocks: 'Blöcke'
};

/** Regeln eines eigenen Spiels als Stichpunkte */
function pointsOf(t: Template): [string, string][] {
  // Kopie eines festen Spiels: dessen Regeln, dazu eigene Notizfelder
  const base = t.params?.base ? gameDef(t.params.base) : undefined;
  if (base?.points) return [...base.points, ...(t.params?.notes?.length ? [['Notizfelder', names(t.params.notes)] as [string, string]] : [])];
  if (t.params?.resultOnly) {
    const place = t.params.unit === 'Platz';
    const p: [string, string][] = [['Am Ende', place ? 'Platz je Spieler' : 'Punkte je Spieler'], ['Gewinner', place ? 'Platz 1' : t.win === 'high' ? 'höchste Punktzahl' : 'niedrigste Punktzahl']];
    if (t.params.notes?.length) p.push(['Zusatzfelder', names(t.params.notes)]);
    return p;
  }
  const end = t.end.type === 'target' ? `bei ${t.end.value} Punkten` : t.end.type === 'rounds' ? `nach ${t.end.value} Runden` : 'offen';
  const p: [string, string][] = [
    ['Gewinner', t.win === 'high' ? 'höchste Punktzahl' : 'niedrigste Punktzahl'],
    ['Spielende', end],
    ['Zählschritte', names(stepsOf(t).map(String))]
  ];
  if (t.scoring === 'rank') p.splice(0, 1, ['Wertung', 'Rang je Runde, Präsident bis Arschloch']);
  if (t.scoring === 'lives') return [['Am Tisch', `${t.params?.lives ?? 3} Leben je Spieler, dann schwimmen`], ['Gewinner', 'wer als Letzter übrig bleibt']];
  if (t.scoring === 'tokens') return [['Am Tisch', `${t.params?.tokens ?? 13} Deckel in der Mitte`], ['Hälfte', 'wer alle Deckel hat, verliert sie'], ['Verlierer', 'wer zwei Hälften verliert']];
  if (t.params?.split?.length === 2) p.push(['Je Runde', `${t.params.split[0].label} und ${t.params.split[1].label}`]);
  if (t.params?.zeroSum) p.push(['Nullsumme', 'jede Runde ergibt 0']);
  if (t.params?.keys?.length) p.push(['Tasten', names(t.params.keys.map(k => k.label))]);
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
  const editing = useApp().setupEditing, setEditing = (on: boolean) => act().setSetupEditing(on);
  const [confirm, setConfirm] = useState(false);
  const [ownStep, setOwnStep] = useState('');
  const [note, setNote] = useState('');
  const [keyName, setKeyName] = useState('');
  const [keyOp, setKeyOp] = useState<'add' | 'set' | 'mul'>('add');
  const [keyVal, setKeyVal] = useState('');
  const addKey = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseInt(keyVal, 10), label = keyName.trim();
    if (!label || Number.isNaN(v) || setup.keys.some(k => k.label === label)) return;
    a.updateSetup({ keys: [...setup.keys, { label, op: keyOp, v }] });
    setKeyName(''); setKeyVal('');
  };
  const endKind = setup.end.type;
  const endValue = setup.end.type === 'target' || setup.end.type === 'rounds' ? setup.end.value : 0;
  const valid = (setup.mode !== 'result' && isTableKind(setup.kind)) || endKind === 'none' || endValue > 0;

  // Aussehen: eigene Spiele und neue Vorlagen bekommen Szene und Icon aus Name, Farbe und Muster
  const art = setupTemplate ? ownArt(own?.key ?? 'neu', setup.name || own?.name || 'Eigenes Spiel', { ...own?.params, look: setup.look ?? own?.params?.look }) : null;
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
  // Neue Vorlage: das Aussehen der Vorschau mitspeichern, damit es nach dem Speichern gleich bleibt
  const keepLook = () => { if (setupTemplate && !own && !setup.look) a.updateSetup({ look: { color: look.color, pattern: look.pattern } }); };
  const preview = [...setup.steps].sort((x, y) => y - x).map(n => -n).concat([...setup.steps].sort((x, y) => x - y));
  const result = setup.mode === 'result';
  const tableKind = !result && isTableKind(setup.kind);
  // Rang und Tisch-Modus: kein Gewinner-, Ende- oder Tastenfeld
  const rank = !result && (setup.kind === 'rank' || tableKind);
  // Wertung nur bei normalen Rundenspielen umstellbar (Kopien von Wizard, Kniffel, Phase 10 bleiben, wie sie sind)
  const kindEditable = !own || (['rounds', 'rank', 'lives', 'tokens'].includes(own.scoring) && !own.params?.phases);
  const title = own ? own.name : setupTemplate ? (setup.name.trim() || (result ? 'Eigene Endwertung' : 'Eigene Vorlage')) : 'Freies Spiel';
  return (
    <GamePage id="s-setup" scene={scene} icon={icon} tint={tint} title={title} onBack={() => (own ? setEditing(false) : a.goHome())}
      dock={<>
        {own && <button className="secondary" id="setup-save" disabled={!valid} onClick={() => { a.saveSetupHome(); setEditing(false); }}>Speichern</button>}
        {!own && setupTemplate && <button className="secondary" id="setup-save" disabled={!valid || !setup.name.trim()} onClick={() => { keepLook(); a.saveNewTemplate(); }}>Speichern</button>}
        <button className="primary" id="setup-next" disabled={!valid || (setupTemplate && !own && !setup.name.trim())} onClick={() => { keepLook(); a.setupNext(); }}>Spieler wählen</button>
      </>}>
        <div className="setup-body">
          <div className="field">
            <label htmlFor="setup-name">Name</label>
            <input id="setup-name" value={setup.name} maxLength={28} autoComplete="off" placeholder={setupTemplate ? 'Name des Spiels' : fallbackName()}
              onChange={e => a.updateSetup({ name: e.target.value })} />
          </div>
          {result && (
            <div className="field">
              <label>Gewertet wird</label>
              <div className="seg">
                <button id="unit-points" aria-pressed={setup.unit === 'Punkte'} onClick={() => a.updateSetup({ unit: 'Punkte' })}>Punkte</button>
                <button id="unit-place" aria-pressed={setup.unit === 'Platz'} onClick={() => a.updateSetup({ unit: 'Platz' })}>Platz</button>
              </div>
            </div>
          )}
          {!result && kindEditable && (
            <div className="field">
              <label>Wertung</label>
              <div className="seg">
                <button id="kind-points" aria-pressed={setup.kind === 'points'} onClick={() => a.updateSetup({ kind: 'points' })}>Punkte</button>
                <button id="kind-split" aria-pressed={setup.kind === 'split'} onClick={() => a.updateSetup({ kind: 'split' })}>Zwei Werte</button>
                <button id="kind-rank" aria-pressed={setup.kind === 'rank'} onClick={() => a.updateSetup({ kind: 'rank' })}>Rang</button>
              </div>
              <div className="seg seg-2">
                <button id="kind-lives" aria-pressed={setup.kind === 'lives'} onClick={() => a.updateSetup({ kind: 'lives', start: 0 })}>Leben verlieren</button>
                <button id="kind-tokens" aria-pressed={setup.kind === 'tokens'} onClick={() => a.updateSetup({ kind: 'tokens', start: 0 })}>Deckel verteilen</button>
              </div>

              {setup.kind === 'split' && <div className="split-names">
                <input id="split-a" value={setup.splitNames[0]} maxLength={14} placeholder="Erster Wert" aria-label="Name des ersten Werts" onChange={e => a.updateSetup({ splitNames: [e.target.value, setup.splitNames[1]] })} />
                <input id="split-b" value={setup.splitNames[1]} maxLength={14} placeholder="Zweiter Wert" aria-label="Name des zweiten Werts" onChange={e => a.updateSetup({ splitNames: [setup.splitNames[0], e.target.value] })} />
              </div>}
            </div>
          )}
          {tableKind && <div className="field">
            <label htmlFor="table-start">{setup.kind === 'lives' ? 'Leben je Spieler' : 'Deckel in der Mitte'}</label>
            <input id="table-start" inputMode="numeric" pattern="[0-9]*" value={setup.start || TABLE_START[setup.kind as 'lives' | 'tokens']}
              onChange={e => a.updateSetup({ start: Math.min(99, parseInt(e.target.value.replace(/\D/g, ''), 10) || 0) })} />
          </div>}
          {!(result && setup.unit === 'Platz') && !rank && <div className="field">
            <label>Wer gewinnt?</label>
            <div className="seg">
              <button aria-pressed={setup.win === 'high'} onClick={() => a.updateSetup({ win: 'high' })}>Höchste Punktzahl</button>
              <button aria-pressed={setup.win === 'low'} onClick={() => a.updateSetup({ win: 'low' })}>Niedrigste Punktzahl</button>
            </div>
          </div>}
          {!result && !tableKind && <><div className="field">
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
          {!rank && <div className="field">
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
          </div>}
          {setup.kind === 'points' && kindEditable && <label className="switch-row">
            <input type="checkbox" id="zero-sum" checked={setup.zeroSum} onChange={e => a.updateSetup({ zeroSum: e.target.checked })} />
            <span className="t"><b>Nullsumme</b></span>
          </label>}
          {!rank && <div className="field">
            <label>Eigene Tasten</label>
            {setup.keys.length > 0 && <div className="chips note-chips">
              {setup.keys.map(k => <button key={k.label} className="chip on" aria-label={`${k.label} entfernen`} onClick={() => a.updateSetup({ keys: setup.keys.filter(x => x !== k) })}>{k.label} ✕</button>)}
            </div>}
            {setup.keys.length < MAX_KEYS && <form className="key-add" onSubmit={addKey}>
              <input id="key-name" value={keyName} maxLength={10} autoComplete="off" placeholder="Name" aria-label="Name der Taste" onChange={e => setKeyName(e.target.value)} />
              <div className="seg key-op">
                {([['add', '+'], ['set', '='], ['mul', '×']] as const).map(([op, l]) => <button type="button" key={op} aria-pressed={keyOp === op} onClick={() => setKeyOp(op)}>{l}</button>)}
              </div>
              <input id="key-value" value={keyVal} inputMode="numeric" placeholder="Wert" aria-label="Wert der Taste" onChange={e => setKeyVal(e.target.value.replace(/[^0-9-]/g, '').slice(0, 5))} />
              <button type="submit" disabled={!keyName.trim() || keyVal === '' || keyVal === '-'}>Hinzufügen</button>
            </form>}
          </div>}</>}
          {!rank && <div className="field">
            <label>{result ? 'Zusatzfelder' : 'Notizfelder'}</label>
            {setup.notes.length > 0 && <div className="chips note-chips">
              {setup.notes.map(n => <button key={n} className="chip on" aria-label={`${n} entfernen`} onClick={() => a.updateSetup({ notes: setup.notes.filter(x => x !== n) })}>{n} ✕</button>)}
            </div>}
            <form className="add-row" onSubmit={addNote}>
              <input id="note-name" value={note} maxLength={18} autoComplete="off" placeholder="Neues Feld" aria-label="Neues Notizfeld" onChange={e => setNote(e.target.value)} />
              <button type="submit" disabled={!note.trim() || setup.notes.length >= 4}>Hinzufügen</button>
            </form>
          </div>}
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
