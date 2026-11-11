import { useEffect } from 'react';
import { act, useApp } from './store';
import { Home } from './ui/Home';
import { PlayerSelect } from './ui/PlayerSelect';
import { Setup } from './ui/Setup';
import { GameScreen } from './ui/Game';
import { Toast } from './ui/Toast';

export default function App() {
  const s = useApp();
  useEffect(() => { act().init(); }, []);
  if (!s.ready) return <div className="screen" />;
  return (
    <>
      {s.screen === 'home' && <Home />}
      {s.screen === 'setup' && <Setup />}
      {s.screen === 'players' && <PlayerSelect />}
      {s.screen === 'game' && s.game && <GameScreen />}
      <Toast />
    </>
  );
}
