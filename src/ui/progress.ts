/**
 * Your progress through the guided matches, saved separately from games and settings: which matches you
 * have finished, each match's latest readiness report, the rule cards you've already seen, and graduation
 * (docs/05-teaching-plan.md sections 5 and 6). Decisions (STATUS.md, milestone 3): one match is one game;
 * you always graduate after match 3, and may graduate early when every check passes after match 2; the
 * card-reading check waits for the tutorial; free play stays open the whole time.
 */

import type { MatchNumber, ReadinessReport } from '../coach/review';

export interface Progress {
  v: 1;
  seenRules: string[];
  /** Matches finished at least once. */
  completed: MatchNumber[];
  /** The latest readiness report for each match. */
  reports: { 1?: ReadinessReport; 2?: ReadinessReport; 3?: ReadinessReport };
  graduated: boolean;
  /** Rule slips by referee code, across all matches (skill tracking, docs/05-teaching-plan.md section 7). */
  slips: Record<string, number>;
}

export function emptyProgress(): Progress {
  return { v: 1, seenRules: [], completed: [], reports: {}, graduated: false, slips: {} };
}

const MATCHES: readonly MatchNumber[] = [1, 2, 3];

/** Merge saved progress over an empty one, ignoring anything malformed. */
export function readProgress(raw: unknown): Progress {
  const p = emptyProgress();
  if (!raw || typeof raw !== 'object') return p;
  const r = raw as Record<string, unknown>;
  if (Array.isArray(r.seenRules)) p.seenRules = r.seenRules.filter((x): x is string => typeof x === 'string');
  if (Array.isArray(r.completed)) p.completed = MATCHES.filter((m) => (r.completed as unknown[]).includes(m));
  if (typeof r.graduated === 'boolean') p.graduated = r.graduated;
  if (r.reports && typeof r.reports === 'object') {
    const reps = r.reports as Record<string, unknown>;
    for (const m of MATCHES) {
      const rep = reps[String(m)];
      if (rep && typeof rep === 'object' && (rep as { match?: unknown }).match === m) p.reports[m] = rep as ReadinessReport;
    }
  }
  if (r.slips && typeof r.slips === 'object')
    for (const [k, v] of Object.entries(r.slips as Record<string, unknown>)) if (typeof v === 'number' && v >= 0) p.slips[k] = v;
  return p;
}

/** Match 1 is always open; each later match opens once the one before it is finished (all open after graduating). */
export function matchUnlocked(p: Progress, m: MatchNumber): boolean {
  return p.graduated || m === 1 || p.completed.includes((m - 1) as MatchNumber);
}

/** The match to suggest next: the first one not yet finished, or null once all three are done. */
export function nextMatch(p: Progress): MatchNumber | null {
  return MATCHES.find((m) => !p.completed.includes(m)) ?? null;
}

export interface MatchOutcome {
  progress: Progress;
  /** You graduated just now (after match 3). */
  graduatedNow: boolean;
  /** Every check passed after match 2, so you may graduate early. */
  mayGraduateEarly: boolean;
}

/** Record a finished match. Graduation is automatic after match 3. */
export function recordMatch(p: Progress, report: ReadinessReport, slips: readonly { code: string }[]): MatchOutcome {
  const next: Progress = { ...p, completed: [...p.completed], reports: { ...p.reports }, slips: { ...p.slips }, seenRules: [...p.seenRules] };
  if (!next.completed.includes(report.match)) next.completed.push(report.match);
  next.completed.sort();
  next.reports[report.match] = report;
  for (const s of slips) next.slips[s.code] = (next.slips[s.code] ?? 0) + 1;
  const graduatedNow = !p.graduated && report.match === 3;
  if (graduatedNow) next.graduated = true;
  return { progress: next, graduatedNow, mayGraduateEarly: !next.graduated && report.match === 2 && report.allPass };
}

export function graduate(p: Progress): Progress {
  return { ...p, graduated: true };
}
