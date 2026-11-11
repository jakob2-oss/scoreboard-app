import { IconBack } from './icons';

/**
 * Layout einer Spielseite: illustrierte Szene oben, rundes Spiel-Icon, Titel, Inhalt, Aktion unten.
 * Gemeinsam für das freie Spiel und alle Spiele aus Paket 2 (Wizard, Rommé, …).
 */
export function GamePage({ id, scene, icon, tint, title, onBack, children, dock }: {
  id: string; scene: string; icon: string; tint: string; title: string;
  onBack: () => void; children: React.ReactNode; dock: React.ReactNode;
}) {
  return (
    <section className="screen" id={id}>
      <div className="scroll">
        <div className="tpl-hero">
          <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: scene }} />
          <button className="tpl-back" onClick={onBack} aria-label="Zurück"><IconBack /></button>
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
