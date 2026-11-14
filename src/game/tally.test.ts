import { describe, expect, it } from 'vitest';
import type { Clock } from '../lib/id';
import { addMark, createTally, leadFor, liveMarks, noteLast, settle, tallyCount, undoMark } from './tally';

function clock(): Clock { let n = 0, t = Date.UTC(2026, 0, 1); return { uid: () => 'id' + (++n), now: () => new Date(t += 1000).toISOString() }; }

describe('Strichliste', () => {
  it('zählt Striche je Seite, Notiz am letzten, Rückgängig, Ausgleichen behält den Verlauf', () => {
    const c = clock();
    let t = createTally('a', 'b', ' Wetten ', c);
    expect(t.name).toBe('Wetten');
    t = addMark(t, 0, c); t = addMark(t, 0, c); t = addMark(t, 1, c);
    t = noteLast(t, 'Ben trifft nicht', c);
    expect(tallyCount(t)).toEqual([2, 1]);
    expect(liveMarks(t).slice(-1)[0].note).toBe('Ben trifft nicht');
    expect(leadFor(t, 'a')).toBe(1); expect(leadFor(t, 'b')).toBe(-1);
    t = undoMark(t, c);
    expect(tallyCount(t)).toEqual([2, 0]);
    t = settle(t, c);
    expect(tallyCount(t)).toEqual([0, 0]);
    expect(t.marks).toHaveLength(3);   // nichts geht verloren
    t = addMark(t, 1, c);
    expect(tallyCount(t)).toEqual([0, 1]);
  });
});
