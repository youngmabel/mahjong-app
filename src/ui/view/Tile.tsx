/** Tile pictures. Faces come from one hidden SVG sprite, so each tile on screen is tiny markup. */

import { h } from 'preact';
import { JOKER, kindName, kindOfTile, type Kind, type TileId } from '../../engine/tiles';
import type { Badge, PatternSlot } from '../layout';
import { BACK_ID, TILE_H, TILE_W, kindSymbolId, symbolId } from '../tiles/clean';

const VIEWBOX = `0 0 ${TILE_W} ${TILE_H}`;

/** Short names for the labels under your tiles. */
export function shortName(k: Kind): string {
  const n = kindName(k);
  if (n === 'Red Dragon') return 'Red';
  if (n === 'Green Dragon') return 'Green';
  return n;
}

export function TileSvg({ tile, cls, style }: { tile: TileId; cls?: string; style?: string }) {
  const k = kindOfTile(tile);
  return (
    <svg class={`tile${k === JOKER ? ' is-joker' : ''}${cls ? ` ${cls}` : ''}`} style={style} viewBox={VIEWBOX} role="img" aria-label={kindName(k)}>
      <use href={`#${symbolId(tile)}`} />
    </svg>
  );
}

export function KindSvg({ kind, cls }: { kind: Kind; cls?: string }) {
  return (
    <svg class={`tile${cls ? ` ${cls}` : ''}`} viewBox={VIEWBOX} role="img" aria-label={kindName(kind)}>
      <use href={`#${kindSymbolId(kind)}`} />
    </svg>
  );
}

export function BackSvg({ cls }: { cls?: string }) {
  return (
    <svg class={`tile${cls ? ` ${cls}` : ''}`} viewBox={VIEWBOX} aria-hidden="true">
      <use href={`#${BACK_ID}`} />
    </svg>
  );
}

function BadgeShape({ which }: { which: Badge }) {
  const common = { fill: '#FFFFFF', stroke: '#4E5C6A', 'stroke-width': 2.2 };
  const shape =
    which === 'A' ? (
      <circle cx="32" cy="67" r="11" {...common} />
    ) : which === 'B' ? (
      <path d="M32 54 L45 78 L19 78Z" {...common} stroke-linejoin="round" />
    ) : (
      <rect x="21" y="56" width="22" height="22" rx="2" {...common} />
    );
  return (
    <g>
      {shape}
      <text x="32" y={which === 'B' ? 75 : 71.5} text-anchor="middle" font-size="12" font-weight="700" fill="#2C3742" class="tile-font">
        {which}
      </text>
    </g>
  );
}

/** A cheat-sheet slot: a real tile where the card names one, else a neutral tile with a suit badge. */
export function PatternSvg({ slot }: { slot: PatternSlot }) {
  if (slot.type === 'tile') return <KindSvg kind={slot.kind} cls={slot.zero ? 'is-zero' : ''} />;
  const text = slot.type === 'number' ? slot.text : slot.type === 'dragon' ? 'D' : 'W';
  const badge = slot.type === 'number' || slot.type === 'dragon' ? slot.badge : null;
  const label =
    slot.type === 'number'
      ? `${slot.text} in suit ${slot.badge}`
      : slot.type === 'dragon'
        ? slot.badge
          ? `dragon of suit ${slot.badge}`
          : 'any dragon'
        : 'any wind';
  return (
    <svg class="tile pattern" viewBox={VIEWBOX} role="img" aria-label={label}>
      <rect x="0.5" y="3.5" width="63" height="87" rx="5" fill="#C3CAD3" />
      <rect x="0.5" y="0.5" width="63" height="87" rx="5" fill="#F2F4F7" stroke="#AEB4BE" />
      <text x="32" y={badge ? 44 : 52} text-anchor="middle" font-size={text.length > 2 ? 20 : 32} font-weight="700" fill="#1E2532" class="tile-font">
        {text}
      </text>
      {badge ? (
        <BadgeShape which={badge} />
      ) : (
        <text x="32" y="72" text-anchor="middle" font-size="12" font-weight="600" fill="#4E5C6A" class="tile-font">
          any
        </text>
      )}
    </svg>
  );
}
