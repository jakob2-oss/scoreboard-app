import { heroSvg } from './components/heroSvg';
import { useTheme } from './useTheme';

const STEPS = [
  { done: true, c: '#3fb39b', t: 'Grundgerüst', s: 'Installierbare App, offline, automatisch aktualisiert' },
  { done: false, c: '#ef7a5c', t: 'Punktezettel', s: 'Überblick, Spielerseiten, Vorlagen aus dem Prototyp' },
  { done: false, c: '#f0b13e', t: 'Historie & Statistik', s: 'Partien speichern, Profile, Direktvergleich' },
  { done: false, c: '#9a7ad6', t: 'Gruppen & Sync', s: 'Gemeinsam auf mehreren Handys' }
];

export default function App() {
  const { theme, toggle } = useTheme();
  return (
    <main className="app">
      <div className="home-top">
        <button className="icon-btn" onClick={toggle} aria-label={theme === 'dark' ? 'Helles Design' : 'Dunkles Design'}>
          {theme === 'dark'
            ? <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" /></svg>
            : <svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></svg>}
        </button>
      </div>
      <header className="brand">
        <div className="hero-ill" dangerouslySetInnerHTML={{ __html: heroSvg }} />
        <h1 className="wordmark" aria-label="Punktezettel"><span className="w1">PUNKTE</span><span>ZETTEL</span></h1>
        <p>Der digitale Block für eure Spieleabende.</p>
      </header>

      <section>
        <div className="eyebrow">Stand</div>
        <div className="card">
          <p>Das <b>Grundgerüst</b> steht: Die App lässt sich über <b>Teilen → Zum Home-Bildschirm</b> installieren, funktioniert <b>offline</b> und aktualisiert sich bei jeder neuen Version von selbst.</p>
        </div>
      </section>

      <section>
        <div className="eyebrow">Fahrplan</div>
        <div className="card">
          <ul className="steps">
            {STEPS.map(x => (
              <li key={x.t} className={x.done ? '' : 'todo'} style={{ ['--c' as string]: x.c }}>
                <i /><span><b>{x.t}</b><small>{x.s}</small></span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <p className="foot">Version {__APP_VERSION__}</p>
    </main>
  );
}
