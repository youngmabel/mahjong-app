/**
 * After a guided match: the coach's review of the player's decisions and the readiness report
 * (docs/05-teaching-plan.md sections 5 and 6). The readiness checks are a synthesis, not a published
 * rubric, so their thresholds are starting values to tune. [M]
 */

import type { Topic } from './note';

export type MatchNumber = 1 | 2 | 3;

/** One of the player's decisions, compared with the coach's suggestion at that moment. */
export interface DecisionRecord {
  topic: Topic;
  /** Tiles left in the wall at the time. */
  wall: number;
  /** What the player did, as a sentence ("You discarded the 5 Dot."). */
  did: string;
  /** What the coach suggested ("Suggestion: discard the North wind."). */
  coach: string;
  /** How much worse the player's choice was, as a share of the hand's value (0 = as good). */
  loss: number;
  /** A specific lesson about this decision, when there is one. */
  note: string | null;
  followed: boolean;
}

/** Refused moves that break a real rule (not Safety blocks, not taps with nothing chosen). */
export const RULE_SLIP_CODES: readonly string[] = [
  'jokerPass',
  'blindNotAllowed',
  'claimTooSmall',
  'exposureMix',
  'exposureSize',
  'exposureLocked',
  'keepClaimed',
  'exchangeWrongTile',
  'exchangeJoker',
  'redeemedJoker',
];

export interface GuidedStats {
  slips: { code: string; message: string }[];
  /** The player's hand went dead this game. */
  dead: boolean;
  /** The direction the player had pinned when play began, judged by the coach then. */
  direction: { titles: string[]; viable: boolean; detail: string } | null;
  /** Milliseconds each Charleston decision took. */
  charlestonMs: number[];
  hintsUsed: number;
  decisions: DecisionRecord[];
}

export function emptyStats(): GuidedStats {
  return { slips: [], dead: false, direction: null, charlestonMs: [], hintsUsed: 0, decisions: [] };
}

export interface CheckResult {
  pass: boolean | null;
  text: string;
}

export interface ReadinessReport {
  match: MatchNumber;
  rules: CheckResult;
  hand: CheckResult;
  card: CheckResult;
  /** Advice only; never blocks graduation. */
  pace: CheckResult;
  allPass: boolean;
}

function median(xs: readonly number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? (s[m] as number) : ((s[m - 1] as number) + (s[m] as number)) / 2;
}

export function readiness(match: MatchNumber, stats: GuidedStats): ReadinessReport {
  const slips = stats.slips.length;
  const rules: CheckResult =
    slips === 0 && !stats.dead
      ? { pass: true, text: 'No rule was broken, and your hand stayed alive.' }
      : {
          pass: false,
          text: [
            slips > 0 ? `The referee stopped ${slips === 1 ? 'one move' : `${slips} moves`} that break a rule (${stats.slips.map((s) => s.message.split('.')[0]).slice(0, 2).join('; ')}).` : '',
            stats.dead ? 'Your hand went dead.' : '',
          ]
            .filter((x) => x)
            .join(' '),
        };
  const hand: CheckResult = stats.direction
    ? { pass: stats.direction.viable, text: stats.direction.detail }
    : { pass: false, text: 'No hand was pinned by the end of the Charleston, so there was no direction to check.' };
  const card: CheckResult = { pass: null, text: "Card-reading questions come with the tutorial, so this check isn't counted yet." };
  const m = median(stats.charlestonMs);
  const pace: CheckResult =
    m === null
      ? { pass: null, text: 'No Charleston decisions were timed.' }
      : { pass: m <= 15000, text: `Your Charleston passes took ${m < 1500 ? 'about a second' : `about ${Math.round(m / 1000)} seconds`} each (15 or less is typical at a table). This is advice only.` };
  return { match, rules, hand, card, pace, allPass: rules.pass === true && hand.pass === true };
}

/** Losses below this are close calls, not worth a review line. */
const REVIEW_MIN_LOSS = 0.15;

export interface Review {
  /** Sentences for the review, most important first. */
  lines: string[];
  followed: number;
  total: number;
}

/** The coach's review: how often the player matched the coach, and the costliest differences. */
export function buildReview(stats: GuidedStats, max = 4): Review {
  const ds = stats.decisions;
  const followed = ds.filter((d) => d.followed).length;
  const costly = ds
    .filter((d) => !d.followed && (d.loss >= REVIEW_MIN_LOSS || d.note))
    .sort((a, b) => Number(Boolean(b.note)) - Number(Boolean(a.note)) || b.loss - a.loss)
    .slice(0, max);
  const lines = costly.map((d) => `${d.did} ${d.note ?? d.coach}`);
  return { lines, followed, total: ds.length };
}
