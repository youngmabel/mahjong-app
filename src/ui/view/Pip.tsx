/**
 * Pip, the coach, on screen: the bird itself (original art), words you can tap for their meaning, the
 * speech bubble that sits right above your rack, and hands drawn as tiles. Putting the coach's words beside
 * the tiles they're about, and marking those tiles, follows the spatial-contiguity and signaling principles
 * (Mayer); Pip points at what it talks about, since a picture alone adds little (the image principle).
 */

import { Fragment, createContext, h } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { getCard, type Target } from '../../engine/card';
import { arrangeTiles } from '../../engine/matcher';
import type { GameState } from '../../engine/state';
import { kindFromCode, type Kind, type TileId } from '../../engine/tiles';
import { seatView } from '../../engine/view';
import { lineInfo, rankLines, readRack, type LineInfo } from '../../coach';
import { bubbleFor, COACH_NAME } from '../coachview';
import { splitTerms, type Term } from '../glossary';
import { cheatLine } from '../layout';
import { HUMAN, type Session } from '../session';
import { KindSvg, PatternSvg, TileSvg } from './Tile';

// --- Pip -----------------------------------------------------------------------------------------------------

/** Pip: a small, round, original bird (a nod to the bird on the 1 Bam). "point" raises a wing toward the words. */
export function PipSvg({ pose = 'idle', cls }: { pose?: 'idle' | 'point'; cls?: string }) {
  return (
    <svg class={`pip${cls ? ` ${cls}` : ''}`} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M12 41 L2 35 L5 45 L1 52 L14 47 Z" fill="#b9822a" />
      <ellipse cx="29" cy="39" rx="20" ry="17" fill="#e2ae4e" />
      <circle cx="41" cy="23" r="13.5" fill="#e2ae4e" />
      <ellipse cx="34" cy="45" rx="12.5" ry="9" fill="#f7e2b0" />
      {pose === 'point' ? (
        <path d="M24 37 Q40 25 60 27 Q48 40 30 45 Z" fill="#c98f2c" />
      ) : (
        <path d="M15 37 Q27 28 38 38 Q30 51 16 45 Z" fill="#c98f2c" />
      )}
      <path d="M53.5 21 L62 24.5 L53.5 28 Z" fill="#e8743b" />
      <circle cx="45.5" cy="20" r="3.4" fill="#1c2b25" />
      <circle cx="46.7" cy="18.8" r="1.1" fill="#ffffff" />
      <circle cx="43.5" cy="28" r="2.6" fill="#f0977c" opacity="0.75" />
      <path d="M25 55 v6 M33 55 v6" stroke="#e8743b" stroke-width="2.6" stroke-linecap="round" />
    </svg>
  );
}

// --- Words you can tap -----------------------------------------------------------------------------------------

/** Opens the meaning of a tapped word (provided by the table screen). */
export const TermContext = createContext<(t: Term) => void>(() => {});

/** Text whose glossary words (first mention of each) can be tapped for their meaning. */
export function Words({ text }: { text: string }) {
  const open = useContext(TermContext);
  return (
    <Fragment>
      {splitTerms(text).map((s, i) =>
        'term' in s ? (
          <button
            class="term"
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              open(s.term);
            }}
          >
            {s.text}
          </button>
        ) : (
          s.text
        ),
      )}
    </Fragment>
  );
}

/** The meaning of a tapped word, with a small picture when one helps. */
export function TermCard({ term, onClose }: { term: Term; onClose: () => void }) {
  const kinds: Kind[] = term.example ? term.example.split(' ').map(kindFromCode) : [];
  return (
    <div class="term-card" role="dialog" aria-label={`What "${term.term}" means`}>
      <PipSvg cls="pip-small" />
      <div class="term-body">
        <p class="term-title">{term.term}</p>
        <p class="term-meaning">{term.meaning}</p>
        {kinds.length > 0 && (
          <span class="term-tiles">
            {kinds.map((k, i) => (
              <KindSvg kind={k} cls="t-term" key={i} />
            ))}
          </span>
        )}
      </div>
      <button class="btn small" onClick={onClose}>
        Close
      </button>
    </div>
  );
}

// --- Hands drawn as tiles ----------------------------------------------------------------------------------------

export interface LineGroups {
  line: LineInfo | null;
  /** Groups in card order: tiles you hold (or have exposed), plus how many are still missing. */
  groups: { kind: Kind; tiles: TileId[]; missing: number; exposed: boolean }[];
  /** Your hidden tiles this version of the line uses. */
  fits: Set<TileId>;
}

/** The closest version of one card line for your tiles, laid out group by group. */
export function lineGroups(state: GameState, handId: string): LineGroups {
  const rack = readRack(seatView(state, HUMAN));
  const hi = rack.card.hands.findIndex((x) => x.id === handId);
  const line = hi >= 0 ? lineInfo(rack, hi) : null;
  if (!line) return { line: null, groups: [], fits: new Set() };
  const me = state.players[HUMAN] as GameState['players'][number];
  const placed = arrangeTiles(line.target as Target, me.hand, me.exposures);
  const fits = new Set<TileId>();
  for (const p of placed) if (!p.exposed) for (const t of p.tiles) fits.add(t);
  return {
    line,
    groups: placed.map((p) => ({ kind: p.group.kind, tiles: p.tiles, missing: Math.max(0, p.group.size - p.tiles.length), exposed: p.exposed })),
    fits,
  };
}

/** A line drawn as tiles: the ones you hold in full color, the ones still needed faded. */
export function LineTiles({ groups, cls }: { groups: LineGroups['groups']; cls: string }) {
  return (
    <span class="line-tiles">
      {groups.map((g, gi) => (
        <span class={`exp-group${g.exposed ? ' is-exposed' : ''}`} key={gi}>
          {g.tiles.map((t) => (
            <TileSvg tile={t} cls={cls} key={t} />
          ))}
          {Array.from({ length: g.missing }, (_, i) => (
            <span class="ghost" key={`m${i}`} title="Still needed">
              <KindSvg kind={g.kind} cls={cls} />
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

/** A card line drawn as the card shows it (suit letters, not your tiles), for when counts would give hints away. */
export function PatternTiles({ handId, cardId }: { handId: string; cardId: string }) {
  const card = getCard(cardId);
  const i = card.hands.findIndex((x) => x.id === handId);
  if (i < 0) return null;
  const line = cheatLine(card, card.hands[i] as (typeof card.hands)[number], i);
  return (
    <span class="line-tiles pattern-tiles">
      {(line.layouts[0] ?? []).map((word, wi) => (
        <span class="exp-group" key={wi}>
          {word.map((slot, si) => (
            <PatternSvg slot={slot} key={si} />
          ))}
        </span>
      ))}
    </span>
  );
}

// --- Pip's bubble, right above your rack ------------------------------------------------------------------------

export function CoachBubble(props: { session: Session; selected: TileId[]; onPin: (id: string) => void }) {
  const { session, selected } = props;
  // Pip says one short sentence; "Why?" shows the reasoning, and stays open (until hidden) once you've asked
  const [whyOpen, setWhyOpen] = useState(false);
  if (!session.coachOn) return null;
  const state = session.state;
  if (state.phase.name === 'ended' || (state.players[HUMAN] as GameState['players'][number]).dead) return null;
  const settings = session.settings;
  const note = session.note();
  const undo = session.canUndo ? (
    <button class="btn small" onClick={() => session.undo()}>
      Undo
    </button>
  ) : null;

  if (settings.coach === 'proactive') {
    const p = state.phase;
    const pre = p.name === 'charleston' ? (settings.preselect[p.pass] ?? 0) : 0;
    const b = note ? bubbleFor(note, state, HUMAN, pre) : null;
    const fb = session.feedback(selected);
    const suggestPins = session.pins.length === 0;
    const closest = suggestPins ? rankLines(readRack(seatView(state, HUMAN)), session.coachOptions()).filter((l) => !l.blocked).slice(0, 3) : [];
    return (
      <section class="coach" aria-live="polite" aria-label={`${COACH_NAME}, your coach`}>
        <PipSvg pose={b ? 'point' : 'idle'} />
        <div class="bubble">
          {closest.length > 0 && (
            <div class="coach-pins">
              <p class="bubble-say">
                <Words text="Pick a hand to aim for." /> <span class="muted">Lit tiles are ones you hold.</span>
              </p>
              <div class="chip-row">
                {closest.map((l) => (
                  <button class="btn chip" key={l.handId} onClick={() => props.onPin(l.handId)}>
                    <span class="chip-head">
                      <b>{l.title}</b> <span class="muted">{l.away} to go</span>
                    </span>
                    <LineTiles groups={lineGroups(state, l.handId).groups} cls="t-chip" />
                  </button>
                ))}
              </div>
            </div>
          )}
          {b && (
            <Fragment>
              <p class="bubble-say">
                <Words text={b.say} />
              </p>
              {(b.why || b.extra) && whyOpen && (
                <Fragment>
                  {b.why && (
                    <p class="bubble-why">
                      <Words text={b.why} />
                    </p>
                  )}
                  {b.extra && <p class="bubble-extra">{b.extra}</p>}
                </Fragment>
              )}
              {(b.why || b.extra) && (
                <button class="linkish" aria-expanded={whyOpen} onClick={() => setWhyOpen(!whyOpen)}>
                  {whyOpen ? 'Hide why' : 'Why?'}
                </button>
              )}
            </Fragment>
          )}
          {fb && <p class="coach-feedback">{fb}</p>}
          {undo && <div class="coach-tools">{undo}</div>}
        </div>
      </section>
    );
  }

  // matches 2 and 3, and free play with hints on: hints when you ask
  const shown = session.hintsShown;
  const left = session.hintsLeft;
  const pending = note !== null;
  if (!pending && shown.length === 0) return null;
  return (
    <section class="coach is-quiet" aria-live="polite" aria-label={`${COACH_NAME}, your coach`}>
      <PipSvg pose={shown.length > 0 ? 'point' : 'idle'} />
      <div class="bubble">
        {shown.length === 0 && <p class="bubble-why">Stuck? Ask me for a hint. Each tap tells you a little more.</p>}
        {shown.map((t, i) => (
          <p class="coach-note" key={i}>
            <b>Hint {i + 1}:</b> <Words text={t} />
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
      </div>
    </section>
  );
}

/** Tiles Pip is pointing at on your rack: always in match 1; in other modes once the answer hint is shown. */
export function pipMarks(session: Session): Set<TileId> {
  if (!session.coachOn) return new Set();
  const note = session.note();
  if (!note || note.tiles.length === 0) return new Set();
  if (session.settings.coach !== 'proactive' && session.hintsShown.length < 4) return new Set();
  return new Set(note.tiles);
}

/** The screen button Pip suggests (match 1 only), by its key in src/ui/moves.ts. */
export function pipButton(session: Session): string | null {
  if (!session.coachOn || session.settings.coach !== 'proactive') return null;
  return session.note()?.choiceKey ?? null;
}
