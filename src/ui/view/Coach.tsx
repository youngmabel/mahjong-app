/**
 * The coach on screen: the coach bar (rule cards, suggestions, hints, undo), the pinned hand drawn just
 * above your rack with the tiles you hold marked, the menu of guided matches and free play, the
 * "which hand?" picker, and the report after a guided match.
 */

import { Fragment, h } from 'preact';
import { getCard, type Target } from '../../engine/card';
import { arrangeTiles } from '../../engine/matcher';
import type { GameState } from '../../engine/state';
import type { TileId, Kind } from '../../engine/tiles';
import { seatView } from '../../engine/view';
import { lineInfo, rankLines, readRack, type LineInfo } from '../../coach';
import type { ReadinessReport, Review, MatchNumber, CheckResult } from '../../coach';
import { MATCH_LABELS, HUMAN, type Session, type Mode } from '../session';
import { matchUnlocked, type Progress } from '../progress';
import { KindSvg, TileSvg } from './Tile';

type Player = GameState['players'][number];

// --- The pinned hand -----------------------------------------------------------------------------------

export interface PinnedDisplay {
  /** The pinned line's closest version, or null when it no longer fits your exposures. */
  line: LineInfo | null;
  title: string;
  handId: string;
  /** Groups in card order: tiles you hold (or have exposed), plus how many are still missing. */
  groups: { kind: Kind; tiles: TileId[]; missing: number; exposed: boolean }[];
  /** Your hidden tiles this version of the line uses. */
  fits: Set<TileId>;
}

export function pinnedDisplay(session: Session, index: number): PinnedDisplay | null {
  const id = session.pins[index];
  if (!id) return null;
  const state = session.state;
  const rack = readRack(seatView(state, HUMAN));
  const hi = rack.card.hands.findIndex((x) => x.id === id);
  if (hi < 0) return null;
  const hand = rack.card.hands[hi] as { section: string; line: number };
  const title = `${hand.section} #${hand.line}`;
  const line = lineInfo(rack, hi);
  if (!line) return { line: null, title, handId: id, groups: [], fits: new Set() };
  const me = state.players[HUMAN] as Player;
  const placed = arrangeTiles(line.target as Target, me.hand, me.exposures);
  const fits = new Set<TileId>();
  for (const p of placed) if (!p.exposed) for (const t of p.tiles) fits.add(t);
  return {
    line,
    title,
    handId: id,
    groups: placed.map((p) => ({ kind: p.group.kind, tiles: p.tiles, missing: Math.max(0, p.group.size - p.tiles.length), exposed: p.exposed })),
    fits,
  };
}

export function PinnedStrip(props: { session: Session; index: number; onSwitch: () => void; onUnpin: (id: string) => void }) {
  const d = pinnedDisplay(props.session, props.index);
  if (!d) return null;
  const count = props.session.pins.length;
  const away = d.line?.away ?? 0;
  return (
    <div class="pinned" aria-label={`Your pinned hand: ${d.title}`}>
      <div class="pinned-head">
        <span class="pinned-title">
          Going for <b>{d.title}</b>
          {d.line ? <span class="muted"> · {away === 0 ? 'complete' : `${away} away`}</span> : <span class="muted"> · it doesn't fit your exposures any more, so unpin it</span>}
          {d.line?.blocked && <span class="pill pill-dead">Can't be finished</span>}
        </span>
        <span class="pinned-tools">
          {count > 1 && (
            <button class="btn small" onClick={props.onSwitch}>
              Other hand
            </button>
          )}
          <button class="btn small" onClick={() => props.onUnpin(d.handId)} aria-label={`Unpin ${d.title}`}>
            Unpin
          </button>
        </span>
      </div>
      <div class="pinned-tiles">
        {d.groups.map((g, gi) => (
          <span class={`exp-group${g.exposed ? ' is-exposed' : ''}`} key={gi}>
            {g.tiles.map((t) => (
              <TileSvg tile={t} cls="t-pin" key={t} />
            ))}
            {Array.from({ length: g.missing }, (_, i) => (
              <span class="ghost" key={`m${i}`} title="Still needed">
                <KindSvg kind={g.kind} cls="t-pin" />
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

// --- The coach bar --------------------------------------------------------------------------------------

export function CoachBar(props: {
  session: Session;
  selected: TileId[];
  onPin: (id: string) => void;
}) {
  const { session, selected } = props;
  if (!session.coachOn) return <section class="coach is-empty" />;
  const rule = session.ruleCard();
  const settings = session.settings;
  const pending = session.state.phase.name !== 'ended' && session.note() !== null;
  const undo = session.canUndo ? (
    <button class="btn small" onClick={() => session.undo()}>
      Undo
    </button>
  ) : null;
  const ruleBox = rule ? (
    <div class="rule-row">
      <p class="rule-card">
        <b>Rule: {rule.title}.</b> {rule.text}
      </p>
      <button class="btn small primary" onClick={() => session.dismissRule(rule.key)}>
        Got it
      </button>
    </div>
  ) : null;
  const note = session.note();
  const p = session.state.phase;
  // match 1, before you've pinned anything: the coach's closest hands, to pin one or two
  const suggestPins = settings.coach === 'proactive' && session.pins.length === 0 && p.name !== 'ended';
  const closest = suggestPins ? rankLines(readRack(seatView(session.state, HUMAN)), session.coachOptions()).filter((l) => !l.blocked).slice(0, 3) : [];
  if (settings.coach === 'proactive') {
    const fb = session.feedback(selected);
    const pre = p.name === 'charleston' ? (settings.preselect[p.pass] ?? 0) : 0;
    const lead = pre === 3 ? 'The coach chose these 3 tiles for you: tap Pass, or swap any of them. ' : pre === 2 ? 'The coach chose 2 tiles; pick the third yourself. ' : '';
    return (
      <section class="coach" aria-live="polite">
        {ruleBox}
        {closest.length > 0 && (
          <div class="coach-pins">
            <span class="coach-label">Your closest hands (tap one or two to pin):</span>
            {closest.map((l) => (
              <button class="btn small" key={l.handId} onClick={() => props.onPin(l.handId)}>
                {l.title} · {l.away} away
              </button>
            ))}
          </div>
        )}
        {pending && note && (
          <p class="coach-note">
            <b>Coach:</b> {lead}
            {note.text} {note.why}
            {note.extra && <span class="coach-extra"> {note.extra}</span>}
          </p>
        )}
        {fb && <p class="coach-feedback">{fb}</p>}
        {undo && <div class="coach-tools">{undo}</div>}
      </section>
    );
  }
  // matches 2 and 3, and free play with hints on: tiered hints on request
  const shown = session.hintsShown;
  const left = session.hintsLeft;
  return (
    <section class="coach" aria-live="polite">
      {ruleBox}
      {shown.map((t, i) => (
        <p class="coach-note" key={i}>
          <b>Hint {i + 1}:</b> {t}
        </p>
      ))}
      {pending && (
        <div class="coach-tools">
          <button class="btn small" onClick={() => session.hint(selected.length > 0)} disabled={left === 0 && shown.length < 4}>
            {shown.length === 0 ? 'Hint' : shown.length < 4 ? 'More help' : 'Hint shown'}
            {left !== null && <span class="muted"> · {left} left</span>}
          </button>
          {undo}
        </div>
      )}
    </section>
  );
}

// --- Choosing a direction ---------------------------------------------------------------------------------

/** Pick the hand you're going for: card lines in card order; match 1 also shows how far each is. */
export function DirectionPanel(props: { session: Session; showCounts: boolean; onPin: (id: string) => void; onSkip: () => void }) {
  const { session } = props;
  const rack = readRack(seatView(session.state, HUMAN));
  const card = getCard(session.state.cardId);
  const hide = session.prefs.hideConcealed;
  const ranked = props.showCounts ? new Map(rankLines(rack, { hideConcealed: hide }).map((l) => [l.handId, l])) : null;
  return (
    <div class="choices">
      <p class="help">
        Play has begun. Which hand on the card are you going for? Pin one (or two); the coach checks it as part of your
        readiness report, and it stays drawn above your rack.
      </p>
      <ul class="choice-list">
        {card.hands.map((hand) =>
          hide && hand.concealed ? null : (
            <li key={hand.id}>
              <button class="btn wide" onClick={() => props.onPin(hand.id)}>
                <span class="btn-text">
                  {hand.section} #{hand.line}
                  <small>
                    {hand.concealed ? 'Concealed · ' : ''}
                    {hand.value} points{ranked?.get(hand.id) ? ` · ${(ranked.get(hand.id) as LineInfo).away} away` : ''}
                    {hand.note ? ` · ${hand.note}` : ''}
                  </small>
                </span>
              </button>
            </li>
          ),
        )}
      </ul>
      <div class="end-actions">
        <button class="btn" onClick={props.onSkip}>
          Not sure yet
        </button>
      </div>
    </div>
  );
}

// --- The menu ----------------------------------------------------------------------------------------------

export interface MenuInfo {
  progress: Progress;
  mode: Mode;
  /** The match of the guided game in progress, if any. */
  guidedInProgress: MatchNumber | null;
  freeGameNumber: number | null;
}

export function MenuPanel(props: { info: MenuInfo; onMatch: (m: MatchNumber) => void; onFree: () => void; onOpen: (s: 'log' | 'settings') => void }) {
  const { progress, mode, guidedInProgress, freeGameNumber } = props.info;
  const status = (m: MatchNumber): string => {
    if (!matchUnlocked(progress, m)) return `Opens after match ${m - 1}`;
    if (guidedInProgress === m) return mode.kind === 'guided' && mode.match === m ? 'Playing now' : 'Resume';
    if (progress.completed.includes(m)) return 'Done · play again';
    return 'Start';
  };
  return (
    <div class="menu">
      <h3>Guided practice</h3>
      <p class="help">
        Three practice games with help that fades: an open table, a concealed table, then a dress rehearsal. Wins aren't
        needed; you graduate after match 3, or early if every check passes after match 2.
      </p>
      <ul class="choice-list">
        {([1, 2, 3] as const).map((m) => (
          <li key={m}>
            <button class={`btn wide${matchUnlocked(progress, m) ? '' : ' is-dim'}`} onClick={() => props.onMatch(m)}>
              <span class="btn-text">
                {MATCH_LABELS[m]}
                <small>
                  {status(m)}
                  {guidedInProgress !== null && guidedInProgress !== m && matchUnlocked(progress, m) ? ` (replaces your match ${guidedInProgress} game)` : ''}
                </small>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p class="help">{progress.graduated ? 'You have graduated: Classic tiles are unlocked, and every match stays open to replay.' : 'Not graduated yet.'}</p>
      <h3>Free play</h3>
      <ul class="choice-list">
        <li>
          <button class="btn wide" onClick={props.onFree}>
            <span class="btn-text">
              Free play
              <small>{mode.kind === 'free' ? 'Playing now' : freeGameNumber ? `Resume game ${freeGameNumber}` : 'Start'} · only the cheat sheet, unless you turn on coach hints in Settings</small>
            </span>
          </button>
        </li>
      </ul>
      <div class="end-actions">
        <button class="btn" onClick={() => props.onOpen('log')}>
          Table log
        </button>
        <button class="btn" onClick={() => props.onOpen('settings')}>
          Settings
        </button>
      </div>
    </div>
  );
}

// --- After a guided match --------------------------------------------------------------------------------

function CheckRow({ name, c }: { name: string; c: CheckResult }) {
  const mark = c.pass === true ? 'Passed' : c.pass === false ? 'Not yet' : 'Not counted';
  return (
    <li class={`check ${c.pass === true ? 'is-pass' : c.pass === false ? 'is-fail' : 'is-skip'}`}>
      <span class="check-mark">{mark}</span>
      <span>
        <b>{name}.</b> {c.text}
      </span>
    </li>
  );
}

export function MatchReport(props: { report: ReadinessReport; review: Review }) {
  const { report, review } = props;
  return (
    <Fragment>
      <h3>Readiness report</h3>
      <ul class="checks">
        <CheckRow name="Rules" c={report.rules} />
        <CheckRow name="Choosing a hand" c={report.hand} />
        <CheckRow name="Card reading" c={report.card} />
        <CheckRow name="Pace (advice only)" c={report.pace} />
      </ul>
      <h3>Coach's review</h3>
      <p class="help">
        You matched the coach's choice on {review.followed} of {review.total} decisions.
        {review.lines.length === 0 ? ' Nothing costly to point out: well played.' : ''}
      </p>
      {review.lines.length > 0 && (
        <ul class="review">
          {review.lines.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      )}
    </Fragment>
  );
}

/** Each opponent's hidden tiles, face up (match 1's open table). */
export function OpenRack({ tiles }: { tiles: TileId[] }) {
  return (
    <div class="opp-open" aria-label="Their hidden tiles, face up">
      {tiles.map((t) => (
        <TileSvg tile={t} cls="t-opp" key={t} />
      ))}
    </div>
  );
}
