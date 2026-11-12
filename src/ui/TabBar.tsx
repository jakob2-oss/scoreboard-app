import { act } from '../store';

const I = {
  play: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="9" cy="9" r="1.3" /><circle cx="15" cy="15" r="1.3" /><circle cx="15" cy="9" r="1.3" /><circle cx="9" cy="15" r="1.3" /></svg>,
  events: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 6H5.5a2.5 2.5 0 0 0 2.6 3.4M16 6h2.5a2.5 2.5 0 0 1-2.6 3.4" /><path d="M12 13v3M8.5 20h7M10 16.5h4l.5 3.5h-5z" /></svg>,
  history: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg>,
  people: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="9" r="3.2" /><path d="M3.5 19c.8-3.2 3-5 5.5-5s4.7 1.8 5.5 5" /><circle cx="16.5" cy="8" r="2.6" /><path d="M15.5 13.2c2.3.2 4.2 2 4.9 4.8" /></svg>
};

/** Untere Leiste für die Bereiche der App */
export function TabBar({ active }: { active: 'home' | 'events' | 'history' | 'people' }) {
  const tab = (id: 'home' | 'events' | 'history' | 'people', label: string, icon: JSX.Element) => (
    <button className="tab" aria-current={active === id ? 'page' : undefined} onClick={() => act().openTab(id)} id={'tab-' + id}>
      {icon}<span>{label}</span>
    </button>
  );
  return (
    <nav className="tabbar gutter" aria-label="Bereiche">
      <div className="tabbar-in">{tab('home', 'Spielen', I.play)}{tab('events', 'Serien', I.events)}{tab('history', 'Verlauf', I.history)}{tab('people', 'Spieler', I.people)}</div>
    </nav>
  );
}
