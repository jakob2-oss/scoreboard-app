import { useEffect } from 'react';
import { act, useApp } from './store';
import { Home } from './ui/Home';
import { PlayerSelect } from './ui/PlayerSelect';
import { Setup } from './ui/Setup';
import { GameInfo } from './ui/GameInfo';
import { History } from './ui/History';
import { People } from './ui/People';
import { Profile } from './ui/Profile';
import { Series } from './ui/Series';
import { GameScreen } from './ui/Game';
import { Toast } from './ui/Toast';
import { registerFormer, registerLooks } from './ui/lookup';

export default function App() {
  const s = useApp();
  useEffect(() => {
    act().init();
    // Daten dauerhaft behalten (Safari löscht sonst nach längerer Nichtnutzung)
    navigator.storage?.persist?.().catch(() => undefined);
  }, []);
  registerLooks(s.templates); registerFormer(s.formerPlayers);
  if (!s.ready) return <div className="screen" />;
  return (
    <>
      {s.screen === 'home' && <Home />}
      {s.screen === 'history' && <History />}
      {s.screen === 'people' && <People />}
      {s.screen === 'profile' && <Profile />}
      {s.screen === 'series' && <Series />}
      {s.screen === 'setup' && <Setup />}
      {s.screen === 'gamepage' && <GameInfo />}
      {s.screen === 'players' && <PlayerSelect />}
      {s.screen === 'game' && s.game && <GameScreen />}
      {s.confirmStart && s.game && (
        <>
          <div className="scrim" onClick={() => act().cancelStart()} />
          <div className="bsheet" role="dialog" aria-label="Laufende Partie">
            <div className="grab" />
            <div className="sheet-body">
              <h3>{s.game.game.rules.name} läuft noch</h3>
              <div className="menu-list">
                <button id="start-save" onClick={() => act().start('save')}>Speichern und neu starten</button>
                <button id="start-discard" className="warn" onClick={() => act().start('discard')}>Verwerfen und neu starten</button>
                <button onClick={() => act().cancelStart()}>Abbrechen</button>
              </div>
            </div>
          </div>
        </>
      )}
      <Toast />
    </>
  );
}
