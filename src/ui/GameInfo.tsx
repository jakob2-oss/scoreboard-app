import { Fragment } from 'react';
import { act, useApp } from '../store';
import { gameDef } from '../game/games';
import { GamePage } from './GamePage';
import { GameRecords } from './Records';
import { GAME_ART } from './art';

/** Spielseite eines festen Spiels: Szene, Regeln als Fließtext mit Beispiel, Optionen, Start */
export function GameInfo() {
  const { template, players, selected, favs } = useApp();
  const def = template && gameDef(template.key);
  if (!template || !def) return null;
  const art = GAME_ART[template.key];
  const a = act();
  const n = selected.filter(id => players.some(p => p.id === id)).length;
  const ready = n >= template.players.min && n <= template.players.max;
  return (
    <GamePage id="s-gamepage" scene={art.scene} icon={art.icon} tint={def.tint} title={template.name} onBack={() => a.goHome()} fav={{ on: favs.includes(template.key), toggle: () => a.toggleFav(template.key) }}
      dock={ready
        ? <><button className="secondary" onClick={() => a.toPlayers()}>Spieler</button><button className="primary" id="quick-start" onClick={() => a.start()}>Los mit {n} Spielern</button></>
        : <button className="primary" id="to-players" onClick={() => a.toPlayers()}>Spieler wählen</button>}>
      <div className="rule-card" style={{ ['--acc' as string]: def.acc }}>
        {def.points
          ? <ul className="rule-points">{def.points.map(([k, t]) => <li key={k}><b>{k}</b><span>{t}</span></li>)}</ul>
          : <p dangerouslySetInnerHTML={{ __html: def.text }} />}
        {def.example && <div className="rule-ex">
          {def.example.map(([v, l], i) => (
            <Fragment key={l}>
              {i > 0 && <span className="ex-op" aria-hidden="true" />}
              <div className="ex-t"><b>{v}</b><small>{l}</small></div>
            </Fragment>
          ))}
        </div>}
      </div>
      {def.endOptions && (
        <div className="field">
          <label>Spielende</label>
          <div className="seg">
            {def.endOptions.map(o => (
              <button key={o.label} aria-pressed={JSON.stringify(o.end) === JSON.stringify(template.end)} onClick={() => a.setTemplateEnd(o.end)}>{o.label}</button>
            ))}
          </div>
        </div>
      )}
      <GameRecords tpl={template} />
      <div className="menu-list own-actions">
        <button id="customize" onClick={() => a.customizeGame(def.template)}>Als eigenes Spiel anpassen</button>
      </div>
    </GamePage>
  );
}
