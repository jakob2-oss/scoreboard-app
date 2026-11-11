import type { Player } from '../model/types';
import { onColor } from '../lib/color';

export function Avatar({ p, big }: { p: Pick<Player, 'name' | 'color'>; big?: boolean }) {
  return (
    <span className={'av' + (big ? ' big' : '')} aria-hidden="true"
      style={{ ['--c' as string]: p.color, ['--on' as string]: onColor(p.color) }}>
      {(p.name.trim()[0] || '?').toUpperCase()}
    </span>
  );
}
