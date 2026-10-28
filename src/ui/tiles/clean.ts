/**
 * The Clean tile set (the default). Flat faces with big corner indices and simplified traditional art,
 * in the teaching palette from docs/08-design-ideas.md: Bams and the Green Dragon share green, Craks and
 * the Red Dragon share red, Dots and Soap share blue. Color is never the only cue: every tile also has
 * its own picture and a corner index (number plus suit letter, or N/E/W/S, R/G/0, F, J).
 *
 * The faces themselves (clean-faces.ts) are imported from the 3D tile project, so these 2D tiles match
 * the 3D renders (assets/tiles/clean). Each face is 64 x 88; a 3-unit darker edge underneath gives the
 * tile a little thickness, so a tile here is 64 x 91.
 *
 * Output: SVG <symbol> markup for one hidden sprite; each tile on screen is <svg><use href="#..."/></svg>.
 */

import { FLOWER, NUM_KINDS, kindCode, kindOfTile, type Kind, type TileId } from '../../engine/tiles';
import { CLEAN_FACES } from './clean-faces';

export const TILE_W = 64;
export const TILE_H = 91;

const EDGE = '#C3CAD3';
const BACK_EDGE = '#0E4447';
const JOKER_EDGE = '#211C52';

export const BACK_ID = 't-back';

/** The symbol id for a physical tile (each of the eight flowers has its own face). */
export function symbolId(tile: TileId): string {
  const k = kindOfTile(tile);
  if (k === FLOWER) return `t-F${(tile - 136) % 8}`;
  return `t-${kindCode(k)}`;
}

/** The symbol id for a kind of tile (flowers use the first face). */
export function kindSymbolId(k: Kind): string {
  return k === FLOWER ? 't-F0' : `t-${kindCode(k)}`;
}

/** Ids every sprite must define. */
export function allSymbolIds(): string[] {
  const ids: string[] = [];
  for (let k = 0; k < NUM_KINDS; k++) if (k !== FLOWER) ids.push(`t-${kindCode(k)}`);
  for (let v = 0; v < 8; v++) ids.push(`t-F${v}`);
  ids.push(BACK_ID);
  return ids;
}

/** Every face as <symbol> markup, for one hidden sprite on the page. */
export function cleanSprite(): string {
  return allSymbolIds()
    .map((id) => {
      const face = CLEAN_FACES[id];
      if (!face) throw new Error(`The Clean tile set has no face for ${id}.`);
      const edge = id === BACK_ID ? BACK_EDGE : id === 't-J' ? JOKER_EDGE : EDGE;
      return `<symbol id="${id}" viewBox="0 0 ${TILE_W} ${TILE_H}"><rect x="0.5" y="3.5" width="63" height="87" rx="5" fill="${edge}"/>${face}</symbol>`;
    })
    .join('');
}
