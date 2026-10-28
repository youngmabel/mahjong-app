/**
 * The player's settings and progress, saved with the game in the artifact's private per-person storage.
 * Defaults follow the decisions in STATUS.md: Safety OFF in free play, sound off (there is no sound yet),
 * Clean tiles. Playful tiles unlock when the tutorial is finished, Classic tiles on graduating to free play.
 */

export type Speed = 'slow' | 'normal' | 'fast';
export type RackOrder = 'suit' | 'number';
export type TileStyle = 'clean' | 'playful' | 'classic';

export interface Prefs {
  v: 1;
  /** Practice Safety switch: block legal moves that would make your own hand dead. OFF by default in free play. */
  safety: boolean;
  /** Stop for a decision after every discard, not only when a call fits a hand on the card. */
  stopEveryDiscard: boolean;
  /** How quickly the computer players move. */
  speed: Speed;
  /** Show each tile's name under the tiles on your rack. */
  tileNames: boolean;
  rackOrder: RackOrder;
  /** Leave concealed (C) hands off the cheat sheet (and, later, out of the coach's suggestions). */
  hideConcealed: boolean;
  tileStyle: TileStyle;
  /** Progress that unlocks rewards. Set by the tutorial and graduation (later milestones). */
  progress: { tutorialDone: boolean; graduated: boolean };
}

export const DEFAULT_PREFS: Prefs = {
  v: 1,
  safety: false,
  stopEveryDiscard: false,
  speed: 'normal',
  tileNames: true,
  rackOrder: 'suit',
  hideConcealed: false,
  tileStyle: 'clean',
  progress: { tutorialDone: false, graduated: false },
};

/** Milliseconds a computer player's move stays on screen before the next one. */
export const SPEED_MS: Record<Speed, number> = { slow: 1500, normal: 850, fast: 350 };

export interface TileStyleInfo {
  id: TileStyle;
  name: string;
  /** Why it is locked, or null when it can be chosen. */
  locked: string | null;
  /** True when this milestone has its art. */
  drawn: boolean;
}

/** The three tile sets and whether each can be chosen yet. */
export function tileStyles(p: Prefs): TileStyleInfo[] {
  return [
    { id: 'clean', name: 'Clean', locked: null, drawn: true },
    { id: 'playful', name: 'Playful', locked: p.progress.tutorialDone ? null : 'Unlocks when you finish the tutorial.', drawn: false },
    { id: 'classic', name: 'Classic', locked: p.progress.graduated ? null : 'Unlocks when you graduate to free play.', drawn: false },
  ];
}

/** Merge saved prefs over the defaults, ignoring anything malformed. */
export function readPrefs(raw: unknown): Prefs {
  const p: Prefs = { ...DEFAULT_PREFS, progress: { ...DEFAULT_PREFS.progress } };
  if (!raw || typeof raw !== 'object') return p;
  const r = raw as Record<string, unknown>;
  if (typeof r.safety === 'boolean') p.safety = r.safety;
  if (typeof r.stopEveryDiscard === 'boolean') p.stopEveryDiscard = r.stopEveryDiscard;
  if (r.speed === 'slow' || r.speed === 'normal' || r.speed === 'fast') p.speed = r.speed;
  if (typeof r.tileNames === 'boolean') p.tileNames = r.tileNames;
  if (r.rackOrder === 'suit' || r.rackOrder === 'number') p.rackOrder = r.rackOrder;
  if (typeof r.hideConcealed === 'boolean') p.hideConcealed = r.hideConcealed;
  const prog = r.progress as Record<string, unknown> | undefined;
  if (prog && typeof prog === 'object') {
    if (typeof prog.tutorialDone === 'boolean') p.progress.tutorialDone = prog.tutorialDone;
    if (typeof prog.graduated === 'boolean') p.progress.graduated = prog.graduated;
  }
  if (r.tileStyle === 'clean' || r.tileStyle === 'playful' || r.tileStyle === 'classic') {
    const info = tileStyles(p).find((s) => s.id === r.tileStyle);
    if (info && !info.locked && info.drawn) p.tileStyle = r.tileStyle;
  }
  return p;
}
