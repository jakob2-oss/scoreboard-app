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

export default function App() {
  const s = useApp();
  useEffect(() => { act().init(); }, []);
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
      <Toast />
    </>
  );
}
