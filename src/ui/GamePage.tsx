import { IconBack } from './icons';

/**
 * Layout einer Spielseite: illustrierte Szene oben, rundes Spiel-Icon, Titel, Inhalt, Aktion unten.
 * Gemeinsam für das freie Spiel und alle Spiele aus Paket 2 (Wizard, Rommé, …).
 */
export function GamePage({ id, scene, icon, tint, title, onBack, children, dock, fav }: {
  id: string; scene: string; icon: string; tint: string; title: string;
  onBack: () => void; children: React.ReactNode; dock: React.ReactNode;
  /** Herz oben rechts: Spiel als Favorit markieren */
  fav?: { on: boolean; toggle: () => void };
}) {
  return (
    <section className="screen" id={id}>
      <div className="scroll">
        <div className="tpl-hero">
          <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: scene }} />
          <button className="tpl-back" onClick={onBack} aria-label="Zurück"><IconBack /></button>
          {fav && <button className="tpl-fav" id="fav-toggle" aria-pressed={fav.on} onClick={fav.toggle} aria-label={fav.on ? 'Aus den Favoriten entfernen' : 'Zu den Favoriten'}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg></button>}
        </div>
        <div className="gutter tpl-body">
          <div className="tpl-badge" style={{ ['--tc' as string]: tint }} dangerouslySetInnerHTML={{ __html: icon }} />
          <div className="tpl-title"><h1>{title}</h1></div>
          {children}
        </div>
      </div>
      <div className="dock gutter">{dock}</div>
    </section>
  );
}

/** Rundes Spiel-Icon für Listen */
export function GameIcon({ icon, tint }: { icon: string; tint: string }) {
  return <span className="ticon" style={{ ['--tc' as string]: tint }} dangerouslySetInnerHTML={{ __html: icon }} />;
}
