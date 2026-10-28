/**
 * Difficulty settings for computer opponents (docs/07-app-spec.md section 7). Milestone 1 builds and
 * tests level 2 ("Steady"). Levels 1 and 3 reuse the same code with different settings (build step 9).
 * The numbers are starting values to tune, not rules. [M]
 */

export interface BotConfig {
  level: 1 | 2 | 3;
  name: string;
  /** How many of the closest targets count toward a position's value. */
  topK: number;
  /** Each tile away divides a target's weight by this. */
  distanceBase: number;
  /** Extra cost per missing single or pair tile (jokers can't help those). */
  plainWeight: number;
  /** Extra cost per joker a target needs beyond the jokers already held. */
  jokerDeficitWeight: number;
  /** Chance of picking among the top 4 choices instead of the best (deliberate imperfection). */
  noise: number;
  /** Ignore targets this player can't finish given what it can see (privately blocked). */
  avoidBlocked: boolean;
  /** Weight targets by how many live copies of the missing tiles remain (level 3). */
  liveOuts: boolean;
  /** How much to avoid feeding opponents with exposures (0 = off). Grows as the wall shrinks. */
  defense: number;
  /** When to claim discards for exposures. */
  calls: 'never' | 'closer' | 'margin';
  /** Only expose when the hand would then be this close (tiles away) or closer. */
  callMaxAway: number;
  jokerExchanges: 'never' | 'whenHelps';
  charleston: 'greedy' | 'exhaustive';
  /** For the first guided match: the bot never declares Mah Jongg, so the learner can always finish. */
  neverDeclare: boolean;
}

export const LEVEL_2: BotConfig = {
  level: 2,
  name: 'Steady',
  topK: 12,
  distanceBase: 3,
  plainWeight: 0.5,
  jokerDeficitWeight: 1,
  noise: 0.05,
  avoidBlocked: true,
  liveOuts: false,
  defense: 0.3,
  calls: 'closer',
  callMaxAway: 6,
  jokerExchanges: 'whenHelps',
  charleston: 'greedy',
  neverDeclare: false,
};

export function botConfig(level: 1 | 2 | 3 = 2, overrides: Partial<BotConfig> = {}): BotConfig {
  // Levels 1 and 3 are placeholders until build step 9; they start from level 2's settings.
  const base: BotConfig =
    level === 2
      ? LEVEL_2
      : level === 1
        ? { ...LEVEL_2, level: 1, name: 'Gentle', topK: 4, noise: 0.35, defense: 0, calls: 'never', jokerExchanges: 'never' }
        : { ...LEVEL_2, level: 3, name: 'Sharp', noise: 0, liveOuts: true, defense: 1, charleston: 'exhaustive' };
  return { ...base, ...overrides };
}
