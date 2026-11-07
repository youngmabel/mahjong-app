/**
 * One-sentence explanations of the computer players' moves, for the open table of guided match 1
 * (docs/05-teaching-plan.md section 5: worked examples). Each is worked out from that player's own view,
 * which match 1 shows face up anyway.
 */

import type { Action } from '../engine/state';
import { JOKER, countsOf, kindOfTile } from '../engine/tiles';
import type { SeatView } from '../engine/view';
import { exposureInfoFromView } from '../bots/evaluate';
import { needsKind, rankLines, readRack } from './lines';
import { SIZE_NAME, article, tileList, tileWord } from './words';

export function narrateBotMove(view: SeatView, action: Action): string | null {
  const me = view.players[view.seat] as SeatView['players'][number];
  const who = me.wind;
  const rack = readRack(view);
  const lines = rankLines(rack, { hideConcealed: false }).filter((l) => !l.blocked);
  const best = lines[0];
  switch (action.type) {
    case 'charlestonPass': {
      const kinds = action.tiles.map(kindOfTile);
      const blind = action.blind ?? 0;
      const what = kinds.length > 0 ? tileList(kinds) : '';
      const lead = blind > 0 ? (kinds.length > 0 ? `${who} passes ${what} and ${blind} blind` : `${who} passes all 3 blind`) : `${who} passes ${what}`;
      const unused = best && !kinds.some((k) => needsKind(best.target, rack, k));
      return `${lead}: ${unused ? `its closest hand, ${best.title}, doesn't use ${kinds.length === 1 ? 'it' : 'them'}` : 'they fit its hands least'}.`;
    }
    case 'discard': {
      const k = kindOfTile(action.tile);
      const tile = tileWord(k);
      if (k === JOKER) return `${who} discards a joker, which is dead the moment it's thrown.`;
      if (best && !needsKind(best.target, rack, k)) return `${who} lets go of the ${tile}: its closest hand, ${best.title}, doesn't use it.`;
      return `${who} discards the ${tile}, the tile its hands need least.`;
    }
    case 'claimExposure': {
      const p = view.phase;
      if (p.name !== 'callWindow') return null;
      const kind = kindOfTile(p.tile);
      const size = action.tiles.length + 1;
      const jokers = action.tiles.filter((t) => kindOfTile(t) === JOKER).length;
      const exp = [...me.exposures.map(exposureInfoFromView), { kind, size, jokers }];
      const counts = countsOf(view.hand);
      for (const t of action.tiles) counts[kindOfTile(t)]--;
      const after = rankLines(readRack(view, counts, exp), { hideConcealed: false }).filter((l) => !l.blocked)[0];
      const name = SIZE_NAME[size] as string;
      return `${who} calls the ${tileWord(kind)} for ${article(name)} ${name}${after ? `: it fits ${after.title}` : ''}.`;
    }
    case 'jokerExchange':
      return `${who} trades a ${tileWord(kindOfTile(action.tile))} for an exposed joker, which can fill any pung or kong.`;
    default:
      return null;
  }
}
