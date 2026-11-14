import { describe, expect, it } from 'vitest';
import { eveningOf, evenings, frontPage, gen, ordWord } from './frontpage';
import { rivalNews, rivalries, rivalry } from './rivals';
import type { HistGame } from './stats';

let n = 0;
/** Partie mit Platzierungen in Reihenfolge der ids (erster gewinnt) */
function g(at: string, order: string[], extra: Partial<HistGame> = {}): HistGame {
  return { id: 'g' + n++, key: 'romme', name: 'Rommé', finishedAt: at, results: order.map((p, i) => ({ playerId: p, total: 0, place: i + 1 })), ...extra };
}
const names = { a: 'Anna', b: 'Ben', c: 'Clara', d: 'Dora' };
const at = (day: number, h: number) => new Date(2026, 10, day, h).toISOString();

describe('Abende', () => {
  it('nach Mitternacht zählt zum Vortag', () => {
    expect(eveningOf(at(14, 23))).toBe('2026-11-14');
    expect(eveningOf(at(15, 2))).toBe('2026-11-14');
    expect(eveningOf(at(15, 9))).toBe('2026-11-15');
    expect(evenings([g(at(15, 1), ['a', 'b']), g(at(14, 20), ['a', 'b']), g(at(16, 20), ['a', 'b'])]).map(e => e.games.length)).toEqual([2, 1]);
  });
  it('Wörter', () => {
    expect(ordWord(4)).toBe('vierten'); expect(ordWord(14)).toBe('14.');
    expect(gen('Ben')).toBe('Bens'); expect(gen('Max')).toBe('Max’');
  });
});

describe('Rivalitäten', () => {
  const list = [g(at(1, 20), ['a', 'b', 'c']), g(at(2, 20), ['b', 'a']), g(at(3, 20), ['b', 'c', 'a']), g(at(4, 20), ['b', 'a']), g(at(5, 20), ['b', 'a'])];
  it('zählt Duelle und Serien', () => {
    const r = rivalry(list, 'a', 'b');
    expect(r).toMatchObject({ shared: 5, winsA: 1, winsB: 4, streak: { who: 'b', n: 4 } });
  });
  it('erst ab fünf gemeinsamen Partien', () => {
    expect(rivalries(list).map(r => [r.a, r.b].sort().join(''))).toEqual(['ab']);
    expect(rivalries(list, 2, 'c')).toHaveLength(2);
  });
  it('Nachrichten: Serie, Revanche, Führung', () => {
    expect(rivalNews(list.slice(0, 4), list.slice(4))[0]).toMatchObject({ kind: 'streak', who: 'b', n: 4 });
    const rev = rivalNews(list, [g(at(6, 20), ['a', 'b'])])[0];
    expect(rev).toMatchObject({ kind: 'revenge', who: 'a', other: 'b', n: 4 });
    const even = [g(at(1, 20), ['a', 'b']), g(at(2, 20), ['b', 'a']), g(at(3, 20), ['a', 'b']), g(at(4, 20), ['b', 'a'])];
    expect(rivalNews(even, [g(at(5, 20), ['a', 'b'])])[0]).toMatchObject({ kind: 'lead', who: 'a' });
  });
});

describe('Titelseite', () => {
  it('Dauerduell wird Schlagzeile, Sieger und Rote Laterne', () => {
    const hist = [g(at(1, 20), ['b', 'a', 'c']), g(at(2, 20), ['b', 'a', 'c']), g(at(3, 20), ['b', 'a', 'c']), g(at(14, 20), ['b', 'c', 'a']), g(at(14, 22), ['c', 'b', 'a'])];
    const fp = frontPage(hist, '2026-11-14', { level: 'frech', names })!;
    expect(fp.number).toBe(4);
    expect(fp.games).toBe(2);
    // Clara beendet Serien gegen Anna und Ben: wiegt mehr als Bens fünften Sieg in Folge gegen Anna
    expect(fp.lead.kind).toBe('revenge');
    expect(fp.lead.headline).toMatch(/Clara/);
    expect([fp.lead, ...fp.briefs].map(s => s.text)).toContain('Ben schlägt Anna zum fünften Mal in Folge.');
    expect(fp.laterne).toBe('a');
    expect(fp.variant).toBe('zeitung');
    expect(fp.duel?.a).toBe('c');
    expect(fp.summary).toBe('Zwei Partien, ein Sieg für Ben, die Rote Laterne für Anna.');
  });
  it('alle Partien gewonnen, atzig wird Poster', () => {
    const hist = [g(at(14, 20), ['d', 'a']), g(at(14, 21), ['d', 'b']), g(at(14, 22), ['d', 'a', 'b'])];
    const fp = frontPage(hist, '2026-11-14', { level: 'atzig', names })!;
    expect(fp.lead.kind).toBe('sweep');
    expect(fp.lead.poster).toEqual(['ALLES', 'Dora.']);
    expect(fp.variant).toBe('poster');
  });
  it('Liga wird Sportseite mit Spieltag und Spitze', () => {
    const ev = { id: 'L', name: 'Hüttenliga', kind: 'liga' };
    const hist = [g(at(1, 20), ['a', 'b'], { eventId: 'L' }), g(at(1, 21), ['a', 'b'], { eventId: 'L' }), g(at(14, 20), ['b', 'a'], { eventId: 'L' }), g(at(14, 21), ['b', 'a'], { eventId: 'L' }), g(at(14, 22), ['b', 'a'], { eventId: 'L' })];
    const fp = frontPage(hist, '2026-11-14', { level: 'brav', names, events: [ev] })!;
    expect(fp.variant).toBe('sport');
    expect(fp.liga).toMatchObject({ name: 'Hüttenliga', matchday: 2 });
    expect(fp.lead.kind).toBe('leader');
    expect(fp.lead.headline).toBe('Ben übernimmt die *Tabellenspitze*');
  });
  it('Durststrecke beendet', () => {
    const hist = [...Array.from({ length: 6 }, (_, i) => g(at(i + 1, 20), ['a', 'c'])), g(at(14, 20), ['c', 'a'])];
    const fp = frontPage(hist, '2026-11-14', { level: 'brav', names })!;
    expect([fp.lead, ...fp.briefs].some(s => s.kind === 'drought' || s.kind === 'revenge')).toBe(true);
  });
  it('unbekannter Abend', () => { expect(frontPage([], '2026-11-14', { level: 'brav', names })).toBeNull(); });

  /** Partie mit Punkten (erster gewinnt) */
  const pg = (when: string, scores: [string, number][], name = 'Rommé') => ({ ...g(when, scores.map(x => x[0])), name, results: scores.map(([p, t], i) => ({ playerId: p, total: t, place: i + 1 })) });
  it('neue Geschichten ohne Vorgeschichte', () => {
    const kinds = (h: HistGame[], day = '2026-11-14') => { const fp = frontPage(h, day, { level: 'frech', names })!; return [fp.lead, ...fp.briefs].map(s => s.kind); };
    // Premiere und Krimi: erster Abend, eine knappe Partie
    expect(kinds([pg(at(14, 20), [['a', 101], ['b', 100]])])).toContain('close');
    expect(kinds([pg(at(14, 20), [['a', 50], ['b', 10]]), pg(at(14, 21), [['a', 60], ['b', 40]])])).toContain('premiere');
    // Jeder gewinnt einmal
    expect(kinds([g(at(14, 20), ['a', 'b', 'c']), g(at(14, 21), ['b', 'c', 'a']), g(at(14, 22), ['c', 'a', 'b'])])).toContain('everyone');
    // Neu dabei und gewonnen, erster Sieg überhaupt
    const old = [g(at(1, 20), ['a', 'b']), g(at(2, 20), ['a', 'b'])];
    expect(kinds([...old, g(at(14, 20), ['d', 'a', 'b'])])[0]).toBe('debut');
    expect(kinds([...old, g(at(14, 20), ['b', 'a'])])[0]).toBe('firstWin');
    // Lauf: drei Siege hintereinander, aber nicht alle
    expect(kinds([g(at(14, 19), ['b', 'a']), g(at(14, 20), ['a', 'b']), g(at(14, 21), ['a', 'b']), g(at(14, 22), ['a', 'b'])])).toContain('hattrick');
  });
  it('frühe Abende: viele verschiedene Schlagzeilen', () => {
    const heads = new Set<string>();
    for (let d = 1; d <= 20; d++) {
      const day = `2026-11-${String(d).padStart(2, '0')}`;
      const fp = frontPage([g(at(d, 20), ['a', 'b', 'c']), g(at(d, 21), ['a', 'c', 'b'])], day, { level: 'frech', names })!;
      heads.add(fp.lead.headline);
    }
    expect(heads.size).toBeGreaterThanOrEqual(3);
  });
});
