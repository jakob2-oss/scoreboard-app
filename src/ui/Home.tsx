import { useState } from 'react';
import { act, useApp } from '../store';
import { describeTemplate } from '../game/templates';
import type { Template } from '../model/types';
import { currentRoundIndex, seated, isCats, isResultOnly } from '../game/engine';
import { heroSvg } from '../components/heroSvg';
import { toggleTheme, useTheme } from '../useTheme';
import { Chevron, IconMoon, IconSun } from './icons';
import { TabBar } from './TabBar';
import { GameIcon } from './GamePage';
import { FREE_ICON, GAME_ART, ownArt } from './art';
import { GAMES } from '../game/games';
import { FREE_TINT } from './Setup';

/** „Anna, Ben und Clara“ */
export function names(list: string[]): string {
  return list.length < 2 ? list.join('') : list.slice(0, -1).join(', ') + ' und ' + list[list.length - 1];
}

export function Home() {
  const { game, parked, templates } = useApp();
  const running = [game, ...parked].filter((x): x is NonNullable<typeof game> => !!x).sort((a, b) => b.game.updatedAt.localeCompare(a.game.updatedAt));
  const [q, setQ] = useState('');
  const norm = (x: string) => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const hit = (name: string) => norm(name).includes(norm(q.trim()));
  const theme = useTheme();
  return (
    <section className="screen" id="s-home">
      <div className="scroll">
        <div className="gutter">
          <div className="home-top">
            <button className="icon-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Helles Design' : 'Dunkles Design'}>
              {theme === 'dark' ? <IconSun /> : <IconMoon />}
            </button>
          </div>
          <div className="brand">
            <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: heroSvg }} />
            <h1 className="wordmark" aria-label="Punktezettel"><span className="w1">PUNKTE</span><span className="w2">ZETTEL</span></h1>
          </div>
          <div className="home-body">
            {running.length > 0 && (
              <div className="group">
                <div className="eyebrow">{running.length > 1 ? 'Laufende Partien' : 'Laufende Partie'}</div>
                <div className="resume-list">
                  {running.map(g => (
                    <button key={g.game.id} className="resume" onClick={() => act().resume(g.game.id)}>
                      <span className="t">
                        <b>{g.game.rules.name}</b>
                        <small>{isCats(g) || isResultOnly(g) ? 'Mit' : `Runde ${currentRoundIndex(g) + 1} mit`} {names(seated(g).map(p => p.name))}</small>
                      </span>
                      <span className="go-pill">Weiter</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <input className="game-search" id="game-search" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Spiel suchen" aria-label="Spiel suchen" autoComplete="off" />
            {q.trim() ? (
              <div className="group">
                <div className="list" id="search-results">
                  {GAMES.filter(d => hit(d.template.name)).map(d => (
                    <button key={d.template.key} className="row tpl" data-game={d.template.key} onClick={() => act().openGame(d.template)}>
                      <GameIcon icon={GAME_ART[d.template.key].icon} tint={d.tint} />
                      <span className="t"><b>{d.template.name}</b></span>
                      <Chevron />
                    </button>
                  ))}
                  {templates.filter(t => hit(t.name)).map(t => <OwnRow key={t.key} t={t} />)}
                  {!GAMES.some(d => hit(d.template.name)) && !templates.some(t => hit(t.name)) && <div className="row"><span className="t"><small>Keine Treffer</small></span></div>}
                </div>
              </div>
            ) : <>
            <div className="group">
              <div className="eyebrow">Neues Spiel</div>
              <div className="list">
                {GAMES.filter(d => !d.group).map(d => (
                  <button key={d.template.key} className="row tpl" data-game={d.template.key} onClick={() => act().openGame(d.template)}>
                    <GameIcon icon={GAME_ART[d.template.key].icon} tint={d.tint} />
                    <span className="t"><b>{d.template.name}</b></span>
                    <Chevron />
                  </button>
                ))}
                <button className="row tpl" id="new-free" onClick={() => act().openSetup()}>
                  <GameIcon icon={FREE_ICON} tint={FREE_TINT} />
                  <span className="t"><b>Freies Spiel</b></span>
                  <Chevron />
                </button>
              </div>
            </div>
            <div className="group">
              <div className="eyebrow">Endwertung</div>
              <div className="list">
                {GAMES.filter(d => d.group === 'result').map(d => (
                  <button key={d.template.key} className="row tpl" data-game={d.template.key} onClick={() => act().openGame(d.template)}>
                    <GameIcon icon={GAME_ART[d.template.key].icon} tint={d.tint} />
                    <span className="t"><b>{d.template.name}</b></span>
                    <Chevron />
                  </button>
                ))}
                {templates.filter(t => t.params?.resultOnly).map(t => <OwnRow key={t.key} t={t} />)}
                <button className="row tpl new-own" id="new-result" onClick={() => act().openSetup(true, 'result')}>
                  <span className="plus-ic" aria-hidden="true">+</span>
                  <span className="t"><b>Eigene Endwertung erstellen</b></span>
                </button>
              </div>
            </div>
            <div className="group">
              <div className="eyebrow">Meine Spiele</div>
              <div className="list" id="my-games">
                {templates.filter(t => !t.params?.resultOnly).map(t => <OwnRow key={t.key} t={t} />)}
                <button className="row tpl new-own" id="new-own" onClick={() => act().openSetup(true)}>
                  <span className="plus-ic" aria-hidden="true">+</span>
                  <span className="t"><b>Eigene Vorlage erstellen</b></span>
                </button>
              </div>
            </div>
            </>}
            <Feedback />
            <p className="version">Version {__APP_VERSION__}</p>
          </div>
        </div>
      </div>
      <TabBar active="home" />
    </section>
  );
}

/** Feedback: kurzer Text, dann das Teilen-Menü des Geräts (Nachricht, Mail …). Version und Gerät hängen an. */
function Feedback() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const send = async () => {
    const body = `${text.trim()}\n\nPunktezettel ${__APP_VERSION__}\n${navigator.userAgent}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Feedback zum Punktezettel', text: body });
      else { await navigator.clipboard.writeText(body); act().notify('Text kopiert'); }
      setText(''); setOpen(false);
    } catch { /* Teilen abgebrochen */ }
  };
  return (
    <>
      <button className="row feedback-row" id="feedback" onClick={() => setOpen(true)}>
        <span className="t"><b>Feedback geben</b></span><Chevron />
      </button>
      {open && (
        <>
          <div className="scrim" onClick={() => setOpen(false)} />
          <div className="bsheet" role="dialog" aria-label="Feedback">
            <div className="grab" />
            <div className="sheet-body">
              <h3>Feedback</h3>
              <textarea id="feedback-text" className="fb-text" value={text} rows={5} maxLength={2000} placeholder="Was ist dir aufgefallen?" onChange={e => setText(e.target.value)} />
              <div className="pad-actions">
                <button className="secondary" onClick={() => setOpen(false)}>Abbrechen</button>
                <button className="primary" id="feedback-send" disabled={!text.trim()} onClick={send}>Senden</button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function OwnRow({ t }: { t: Template }) {
  const ic = ownArt(t.key, t.name, t.params);
  return (
    <button className="row tpl" data-own={t.key} onClick={() => act().editTemplate(t)}>
      <GameIcon icon={ic.icon} tint={ic.tint} />
      <span className="t"><b>{t.name}</b><small>{t.params?.resultOnly ? (t.params.unit === 'Platz' ? 'Platz am Ende' : 'Punkte am Ende') : describeTemplate(t)}</small></span>
      <Chevron />
    </button>
  );
}
