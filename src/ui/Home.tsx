import { act, useApp } from '../store';
import { FREE_TEMPLATES, describeTemplate } from '../game/templates';
import { currentRoundIndex, seated } from '../game/engine';
import { PLAYER_COLORS } from '../lib/color';
import { toggleTheme, useTheme } from '../useTheme';
import { Chevron, IconMoon, IconSun } from './icons';

const SOON = [['Wizard', '#7a5cc9'], ['Rommé', '#e8684f'], ['Kniffel', '#2f8f86'], ['Skyjo', '#4aa3d8'], ['Phase 10', '#f2a33a']];

export function Home() {
  const { game } = useApp();
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
            <img className="app-logo" src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width="168" height="168" />
            <h1 className="wordmark" aria-label="Punktezettel"><span className="w1">PUNKTE</span><span className="w2">ZETTEL</span></h1>
            <p>Vorlage wählen, Spieler, los.</p>
          </div>
          <div className="home-body">
            {game && (
              <div className="group">
                <div className="eyebrow">Laufende Partie</div>
                <button className="resume" onClick={() => act().resume()}>
                  <span className="t">
                    <b>{game.game.rules.name}</b>
                    <small>{seated(game).map(p => p.name).join(', ')} · Runde {currentRoundIndex(game) + 1}</small>
                  </span>
                  <span className="go-pill">Weiter</span>
                </button>
              </div>
            )}
            <div className="group">
              <div className="eyebrow">Freie Zettel</div>
              <div className="list">
                {FREE_TEMPLATES.map((t, k) => (
                  <button key={t.key} className="row tpl" onClick={() => act().pickTemplate(t)}>
                    <span className="tdot" style={{ ['--c' as string]: PLAYER_COLORS[k] }} />
                    <span className="t"><b>{t.name}</b><small>{describeTemplate(t)}</small></span>
                    <Chevron />
                  </button>
                ))}
              </div>
            </div>
            <div className="group">
              <div className="eyebrow">Bald dabei</div>
              <div className="soon">{SOON.map(([n, c]) => <span key={n}><i style={{ ['--c' as string]: c }} />{n}</span>)}</div>
            </div>
            <p className="version">Version {__APP_VERSION__}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
