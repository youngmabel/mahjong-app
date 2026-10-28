/**
 * Large computer-only simulation with statistics.
 *   npm run sim                 (2,000 games)
 *   npm run sim -- 5000 myseed  (5,000 games with a different seed prefix)
 * Every action of every game is checked: all 152 tiles accounted for, legal hand sizes, sound exposures.
 */

import { loadCard } from '../src/engine/card';
import { PRACTICE_CARD_TEXT } from '../src/engine/cards/practice';
import { handLabel } from '../src/engine/describe';
import { playBotGame } from '../src/sim/runner';

const games = Number(process.argv[2] ?? 2000);
const prefix = process.argv[3] ?? 'sim';
const card = loadCard(PRACTICE_CARD_TEXT);

const t0 = Date.now();
let actions = 0;
let discards = 0;
let problems = 0;
let violations = 0;
let wins = 0;
let walls = 0;
let threeDead = 0;
let selfPick = 0;
let jokerless = 0;
let exposures = 0;
let exchanges = 0;
let dead = 0;
let blind = 0;
let iou = 0;
let secondPlayed = 0;
let courtesyTiles = 0;
let eastWins = 0;
const byHand = new Map<string, number>();
const byHow = new Map<string, number>();
const firstProblems: string[] = [];

for (let i = 0; i < games; i++) {
  const run = playBotGame({ seed: `${prefix}-${i}`, cardId: card.id, dealer: i % 4 });
  actions += run.actions.length;
  if (run.problems.length > 0) {
    problems++;
    if (firstProblems.length < 5) firstProblems.push(`${prefix}-${i}: ${run.problems[0]}`);
  }
  violations += run.violations.length;
  for (const e of run.events) {
    if (e.type === 'discard') discards++;
    if (e.type === 'expose') exposures++;
    if (e.type === 'jokerExchange') exchanges++;
    if (e.type === 'dead') dead++;
    if (e.type === 'charlestonPassed') {
      blind += e.blind.filter((b) => b > 0).length;
      if (e.iou) iou++;
    }
    if (e.type === 'secondCharleston' && e.played) secondPlayed++;
    if (e.type === 'courtesyAgreed') courtesyTiles += e.count * 2;
  }
  const p = run.state.phase;
  if (p.name !== 'ended') continue;
  const r = p.result;
  if (r.type === 'wall') walls++;
  else if (r.type === 'threeDead') threeDead++;
  else {
    wins++;
    if (r.selfPick) selfPick++;
    if (r.jokerless) jokerless++;
    if (r.winner === run.state.dealer) eastWins++;
    byHand.set(r.handId, (byHand.get(r.handId) ?? 0) + 1);
    byHow.set(r.how, (byHow.get(r.how) ?? 0) + 1);
  }
}

const secs = (Date.now() - t0) / 1000;
const pct = (n: number, d: number) => `${((100 * n) / Math.max(1, d)).toFixed(1)}%`;
const lines = [
  `Computer-only simulation: ${games} games on the ${card.name} (level 2 "Steady" opponents), seed prefix "${prefix}"`,
  ``,
  `Integrity`,
  `  Actions checked: ${actions.toLocaleString()} (each one: all 152 tiles accounted for, hand sizes, exposures)`,
  `  Games with any problem: ${problems}`,
  `  Moves the referee rejected from a computer opponent: ${violations}`,
  ...firstProblems.map((p) => `  ! ${p}`),
  ``,
  `Outcomes`,
  `  Mah Jongg: ${wins} (${pct(wins, games)})   Wall games: ${walls} (${pct(walls, games)})   Three dead: ${threeDead}`,
  `  Self-picked wins: ${pct(selfPick, wins)} of wins   Discard wins: ${pct(wins - selfPick, wins)}   Jokerless: ${pct(jokerless, wins)}`,
  `  East (dealer) won ${pct(eastWins, wins)} of wins (a fair share is 25%)`,
  `  How: ${[...byHow].map(([k, v]) => `${k} ${v}`).join(', ')}`,
  ``,
  `Per game (averages)`,
  `  Discards: ${(discards / games).toFixed(1)}   Exposures: ${(exposures / games).toFixed(2)}   Joker exchanges: ${(exchanges / games).toFixed(2)}`,
  `  Dead hands: ${(dead / games).toFixed(3)}   Blind passes: ${(blind / games).toFixed(2)}   IOU blind resolutions: ${iou} in all`,
  `  Second Charleston played: ${pct(secondPlayed, games)}   Courtesy tiles traded: ${(courtesyTiles / games).toFixed(2)}`,
  ``,
  `Wins by hand`,
  ...card.hands.map((h) => `  ${handLabel(card.id, h.id).padEnd(34)} ${String(byHand.get(h.id) ?? 0).padStart(5)}  ${pct(byHand.get(h.id) ?? 0, wins)}`),
  ``,
  `Time: ${secs.toFixed(1)} s (${((1000 * secs) / games).toFixed(1)} ms per game)`,
  `Note: the practice card has only 12 invented lines, so these statistics will not resemble the real 2026`,
  `card's (about 11% wall games, two thirds of wins on discards, about 67 discards per game in Gilligan's run).`,
];
console.log(lines.join('\n'));
if (problems > 0 || violations > 0) process.exitCode = 1;
