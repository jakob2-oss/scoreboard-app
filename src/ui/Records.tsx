import { useApp } from '../store';
import { gameRecords, type GameRecord, type HistGame } from '../game/stats';
import type { Template } from '../model/types';
import { AWARD_ART } from './awardArt';
import { nameList, playerOf } from './lookup';

/** Wie Rekorde für ein Spiel gezählt werden: Punkte nur, wenn es Punkte gibt (nicht Leben, Deckel oder Platz) */
export const recordOpts = (t: Pick<Template, 'win' | 'scoring' | 'params'>) => ({
  win: t.win, points: t.scoring !== 'lives' && t.scoring !== 'tokens' && t.params?.unit !== 'Platz', zeroWins: !!t.params?.zeroWins
});

/** Karten mit Abbildung, Titel, Zahl und Name (wie die Auszeichnungen der Serien) */
export function RecordCards({ list, fresh }: { list: GameRecord[]; fresh?: boolean }) {
  const { players } = useApp();
  const names = (ids: string[]) => nameList(ids.map(id => playerOf(players, id).name));
  return (
    <div className="ser-awards">
      {list.map(x => (
        <div key={x.key} className={'award a-' + x.key + (fresh ? ' fresh' : '')}>
          <span className="award-ill" dangerouslySetInnerHTML={{ __html: AWARD_ART[x.key] }} />
          <small>{fresh ? 'Neuer Rekord' : x.label}</small>
          <b>{x.n.toLocaleString('de-DE')}<em>{x.unit}</em></b>
          <span className="award-who">{fresh ? x.label : names(x.who)}</span>
        </div>
      ))}
    </div>
  );
}

/** Rekorde eines Spiels auf seiner Seite; erst, wenn es Partien gibt */
export function GameRecords({ tpl }: { tpl: Template }) {
  const { history } = useApp();
  const games: HistGame[] = history.filter(h => h.key === tpl.key);
  const list = games.length ? gameRecords(games, recordOpts(tpl)) : [];
  if (!list.length) return null;
  return <div className="group records"><div className="eyebrow">Rekorde</div><RecordCards list={list} /></div>;
}
