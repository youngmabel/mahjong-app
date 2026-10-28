/**
 * Print one computer-only game as a plain-English play-by-play, with every rack shown (an "open table").
 *   npm run sample               (seed "sample-1")
 *   npm run sample -- my-seed
 */

import { botIntent } from '../src/bots/bot';
import { describeTarget, loadCard } from '../src/engine/card';
import { PRACTICE_CARD_TEXT } from '../src/engine/cards/practice';
import { describeEvent, handLabel } from '../src/engine/describe';
import { apply, newGame, pendingSeats, windOf } from '../src/engine/engine';
import type { GameState } from '../src/engine/state';
import { kindCode, kindOfTile, sortTileIds } from '../src/engine/tiles';
import { seatView } from '../src/engine/view';
import { defaultBots } from '../src/sim/runner';

const seed = process.argv[2] ?? 'sample-1';
const card = loadCard(PRACTICE_CARD_TEXT);

const rack = (state: GameState, seat: number) => {
  const pl = state.players[seat] as GameState['players'][number];
  const hidden = sortTileIds(pl.hand).map((t) => kindCode(kindOfTile(t))).join(' ');
  const exposed = pl.exposures.map((e) => `[${e.tiles.map((t) => kindCode(kindOfTile(t))).join(' ')}]`).join(' ');
  return `${windOf(state, seat).padEnd(5)}: ${hidden}${exposed ? `   exposed ${exposed}` : ''}${pl.dead ? '   (dead)' : ''}`;
};
const racks = (state: GameState, title: string) => {
  console.log(`\n--- ${title} ---`);
  for (let s = 0; s < 4; s++) console.log(rack(state, s));
  console.log('');
};

let { state, events } = newGame({ seed, cardId: card.id });
const bots = defaultBots(seed);
const ctx = { dealer: state.dealer, cardId: card.id, revealAll: true };
console.log(`Sample game, seed "${seed}", ${card.name}. Tile codes: 5D = 5 Dot, 3B = 3 Bam, 7C = 7 Crak, N E W S = winds,`);
console.log(`RD GD = Red and Green Dragons, WD = Soap, F = Flower, J = Joker.`);
for (const e of events) console.log(describeEvent(e, ctx));
racks(state, 'Racks after the deal');
let shownPlay = false;
while (state.phase.name !== 'ended') {
  const seat = pendingSeats(state)[0] as number;
  const action = (bots[seat] as (typeof bots)[number]).decide(seatView(state, seat));
  const r = apply(state, seat, action);
  if (!r.ok) throw new Error(r.violation.message);
  state = r.state;
  for (const e of r.events) {
    if (e.type === 'playStarts' && !shownPlay) {
      racks(state, 'Racks after the Charleston');
      shownPlay = true;
    }
    const line = describeEvent(e, ctx);
    if (line) console.log(line);
  }
}
racks(state, 'Final racks');
for (let s = 0; s < 4; s++) {
  const view = seatView(state, s);
  const intent = botIntent(view);
  const r = state.phase.name === 'ended' ? state.phase.result : null;
  if (r && r.type === 'mahjong' && r.winner === s) {
    const t = card.targets[r.targetIndex];
    console.log(`${windOf(state, s)} won with ${handLabel(card.id, r.handId)}: ${t ? describeTarget(t) : ''}.`);
  } else if (intent.target) {
    console.log(`${windOf(state, s)} was going for ${handLabel(card.id, intent.target.handId)}, ${intent.away} tile${intent.away === 1 ? '' : 's'} away.`);
  }
}
console.log(`\nSession scores: ${state.scores.map((sc, s) => `${windOf(state, s)} ${sc}`).join(', ')}`);
