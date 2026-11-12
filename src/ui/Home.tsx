import { act, useApp } from '../store';
import { describeTemplate } from '../game/templates';
import { currentRoundIndex, seated, isCats, isResultOnly } from '../game/engine';
import { PLAYER_COLORS } from '../lib/color';
import { heroSvg } from '../components/heroSvg';
import { toggleTheme, useTheme } from '../useTheme';
import { Chevron, IconMoon, IconSun } from './icons';
import { TabBar } from './TabBar';
import { GameIcon } from './GamePage';
import { FREE_ICON, GAME_ART } from './art';
import { GAMES } from '../game/games';
import { FREE_TINT } from './Setup';

/** „Anna, Ben und Clara“ */
export function names(list: string[]): string {
  return list.length < 2 ? list.join('') : list.slice(0, -1).join(', ') + ' und ' + list[list.length - 1];
}

export function Home() {
  const { game, templates } = useApp();
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
            {game && (
              <div className="group">
                <div className="eyebrow">Laufende Partie</div>
                <button className="resume" onClick={() => act().resume()}>
                  <span className="t">
                    <b>{game.game.rules.name}</b>
                    <small>{isCats(game) || isResultOnly(game) ? 'Mit' : `Runde ${currentRoundIndex(game) + 1} mit`} {names(seated(game).map(p => p.name))}</small>
                  </span>
                  <span className="go-pill">Weiter</span>
                </button>
              </div>
            )}
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
              <div className="eyebrow">Nur das Ergebnis</div>
              <div className="list">
                {GAMES.filter(d => d.group === 'result').map(d => (
                  <button key={d.template.key} className="row tpl" data-game={d.template.key} onClick={() => act().openGame(d.template)}>
                    <GameIcon icon={GAME_ART[d.template.key].icon} tint={d.tint} />
                    <span className="t"><b>{d.template.name}</b></span>
                    <Chevron />
                  </button>
                ))}
              </div>
            </div>
            {templates.length > 0 && (
              <div className="group">
                <div className="eyebrow">Meine Spiele</div>
                <div className="list" id="my-games">
                  {templates.map((t, k) => (
                    <button key={t.key} className="row tpl" onClick={() => act().editTemplate(t)}>
                      <span className="tdot" style={{ ['--c' as string]: PLAYER_COLORS[k % PLAYER_COLORS.length] }} />
                      <span className="t"><b>{t.name}</b><small>{describeTemplate(t)}</small></span>
                      <Chevron />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="version">Version {__APP_VERSION__}</p>
          </div>
        </div>
      </div>
      <TabBar active="home" />
    </section>
  );
}
