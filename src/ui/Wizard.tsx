import { useState } from 'react';
import { act, useApp } from '../store';
import { bidTurn, forbiddenBid, fieldOf, inputOrder, liveRounds, seated, type GameState } from '../game/engine';
import { wizardScore } from '../rules/wizard';
import { fmt } from '../lib/color';
import { Avatar } from './Avatar';
import { IconUndo } from './icons';

/** Kartenzahl der Runde (Runde n = n Karten) */
const cardsOf = (g: GameState, ref: string) => liveRounds(g).findIndex(r => r.id === ref) + 1;

/** Kleines Symbol in der Ecke des Blocks: eine Karte mit der Kartenzahl der laufenden Runde, dahinter angedeutet weitere */
export function MiniHand({ cards }: { cards: number }) {
  return (
    <span className="wz-mini" aria-label={`${cards} ${cards === 1 ? 'Karte' : 'Karten'}`}>
      {cards > 1 && <i className="wz-mini-back" />}<b>{cards}</b>
    </span>
  );
}

/** Leiste unten: wer ansagt, Zahlen 0 bis Kartenzahl; die Zahl erscheint sofort im Block */
export function BidBar({ g, roundId: ref }: { g: GameState; roundId: string }) {
  const s = useApp();
  const players = seated(g), cards = cardsOf(g, ref), who = bidTurn(g, ref);
  const p = players.find(x => x.id === who);
  const sum = players.reduce((a, x) => a + (fieldOf(g, ref, x.id, 'bid') ?? 0), 0);
  const order = inputOrder(g, ref).map(k => players[k].id);
  const prev = players.find(x => x.id === order[order.indexOf(who ?? '') - 1]);
  if (!p) return null;
  // Hausregel: der Letzte darf die Summe nicht genau aufgehen lassen
  const no = forbiddenBid(g, ref, p.id);
  return (
    <div className="wz-bar">
      <div className="wz-who"><Avatar p={p} /><b>{p.name} sagt an</b><small>angesagt {sum} von {cards}</small></div>
      <div className="wz-pick" style={{ gridTemplateColumns: `repeat(${Math.min(cards + 1, 7)}, 1fr)` }}>
        {Array.from({ length: cards + 1 }, (_, k) => <button key={k} id={`bid-${k}`} disabled={k === no} onClick={() => act().bidPick(k)}>{k}</button>)}
      </div>
      <div className="wz-nav">
        <button className="secondary" aria-label="Rückgängig" disabled={!s.undo.length} onClick={() => act().undo()}><IconUndo /></button>
        <button className="secondary wide" onClick={() => (prev ? act().bidBack() : act().closeBidBar())}>{prev ? `Zurück zu ${prev.name}` : 'Schließen'}</button>
        <button className="secondary" id="bid-manual" onClick={() => act().switchEntry(g.game.rules.key)}>Manuell</button>
      </div>
    </div>
  );
}

/** Stiche aller auf einem Blatt: Ansage als Rahmen, Ergebnis sofort, Karten der Runde in Spielerfarben */
export function TricksSheet({ g, roundId: ref }: { g: GameState; roundId: string }) {
  const players = seated(g), cards = cardsOf(g, ref);
  const [t, setT] = useState<Record<string, number>>(() => Object.fromEntries(players.map(p => [p.id, fieldOf(g, ref, p.id, 'tricks')]).filter(([, v]) => v !== null)));
  const sum = Object.values(t).reduce((a, v) => a + v, 0), all = players.every(p => t[p.id] !== undefined);
  const ok = all && sum === cards;
  const dealt = players.flatMap(p => Array.from({ length: t[p.id] ?? 0 }, () => p.color));
  const no = liveRounds(g).findIndex(r => r.id === ref) + 1;
  return (
    <>
      <div className="scrim" onClick={() => act().closeSheet()} />
      <div className="bsheet" role="dialog" aria-label="Stiche">
        <div className="grab" />
        <div className="sheet-body">
          <h3>Stiche</h3>
          <div className="wz-sub">Runde {no}, {cards} {cards === 1 ? 'Karte' : 'Karten'}</div>
          <div className="wz-tricks">{Array.from({ length: cards }, (_, k) => <i key={k} style={dealt[k] ? { background: dealt[k] } : undefined} />)}</div>
          {inputOrder(g, ref).map(k => players[k]).map(p => {
            const bid = fieldOf(g, ref, p.id, 'bid') ?? 0, v = t[p.id];
            const sc = v === undefined ? null : wizardScore(bid, v);
            return (
              <div key={p.id} className="wz-row">
                <div className="wz-nm"><Avatar p={p} /><b>{p.name}</b><small>sagte {bid}</small>
                  {sc !== null && <span className={'wz-res' + (sc < 0 ? ' neg' : '')}>{sc > 0 ? '+' : ''}{fmt(sc)}</span>}</div>
                <div className="wz-pick" style={{ gridTemplateColumns: `repeat(${Math.min(cards + 1, 7)}, 1fr)` }}>
                  {Array.from({ length: cards + 1 }, (_, n) => (
                    <button key={n} className={(v === n ? 'on' : '') + (bid === n ? ' bid' : '')} onClick={() => setT({ ...t, [p.id]: n })}>{n}</button>
                  ))}
                </div>
              </div>
            );
          })}
          <div className="wz-sum"><span>Stiche verteilt</span><b className={ok ? 'ok' : 'warn'}>{sum} von {cards}</b></div>
          <div className="pad-actions">
            <button className="secondary" id="tricks-manual" onClick={() => act().switchEntry(g.game.rules.key)}>Manuell</button>
            <button className="primary" id="tricks-go" disabled={!ok} onClick={() => act().tricksCommit(ref, t)}>Runde {no} eintragen</button>
          </div>
        </div>
      </div>
    </>
  );
}
