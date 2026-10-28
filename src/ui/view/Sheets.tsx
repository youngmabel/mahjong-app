/** Panels that slide over the table: the cheat sheet, settings, the log, game results, and move lists. */

import { h, type ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { botIntent } from '../../bots/bot';
import { getCard, type Card } from '../../engine/card';
import { describeResult, handLabel } from '../../engine/describe';
import { windOf } from '../../engine/engine';
import { arrangeTiles } from '../../engine/matcher';
import type { GameState } from '../../engine/state';
import { sortTileIds, type TileId } from '../../engine/tiles';
import { seatView } from '../../engine/view';
import { cheatSheet } from '../layout';
import type { Choice } from '../moves';
import { tileStyles, type Prefs, type Speed } from '../prefs';
import { HUMAN, type LogLine } from '../session';
import { KindSvg, PatternSvg, TileSvg } from './Tile';

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ComponentChildren }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div
      class="backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div class="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <header class="sheet-head">
          <h2>{title}</h2>
          <button class="btn small" onClick={onClose}>
            Close
          </button>
        </header>
        <div class="sheet-body">{children}</div>
      </div>
    </div>
  );
}

// --- Cheat sheet ------------------------------------------------------------------------------------------

export function CheatSheetPanel({ card, prefs, onPrefs }: { card: Card; prefs: Prefs; onPrefs: (p: Prefs) => void }) {
  const sections = cheatSheet(card, prefs.hideConcealed);
  const hidden = prefs.hideConcealed ? card.hands.filter((h) => h.concealed).length : 0;
  return (
    <div class="cheat">
      <div class="cheat-tools">
        <label class="switch">
          <input
            type="checkbox"
            id="hide-concealed"
            checked={prefs.hideConcealed}
            onChange={(e) => onPrefs({ ...prefs, hideConcealed: (e.currentTarget as HTMLInputElement).checked })}
          />
          <span>Hide concealed hands</span>
        </label>
        {hidden > 0 && (
          <span class="muted">
            {hidden} concealed hand{hidden === 1 ? '' : 's'} hidden
          </span>
        )}
      </div>
      <p class="legend">
        Each line is drawn as tiles. Letters in shapes mark suits: tiles with the same letter share one suit, and different
        letters mean different suits. Any suit can stand in for any letter. A "D" is the dragon of that letter's suit (Red with
        Craks, Green with Bams, Soap with Dots). These are invented practice hands, not NMJL hands.
      </p>
      {sections.map((s) => (
        <section class="cheat-section" key={s.name}>
          <h3>{s.name}</h3>
          {s.lines.map((l) => (
            <article class="cheat-line" key={l.id}>
              <header class="cl-head">
                <span class="cl-title">{l.title}</span>
                <span class={`tag ${l.concealed ? 'tag-c' : 'tag-x'}`}>{l.concealed ? 'Concealed' : 'Open'}</span>
                <span class="cl-value">{l.value} points</span>
              </header>
              {l.layouts.map((lay, i) => (
                <div class="cl-pattern" key={i}>
                  {i > 0 && <span class="or">or</span>}
                  {lay.map((word, wi) => (
                    <span class="cl-word" key={wi}>
                      {word.map((slot, si) => (
                        <PatternSvg slot={slot} key={si} />
                      ))}
                    </span>
                  ))}
                </div>
              ))}
              {l.note && <p class="cl-note">{l.note}</p>}
              <div class="cl-example">
                <span class="cl-ex-label">For example</span>
                <span class="cl-ex-tiles">
                  {l.example.map((word, wi) => (
                    <span class="cl-word" key={wi}>
                      {word.map((k, ki) => (
                        <KindSvg kind={k} cls="t-cheat" key={ki} />
                      ))}
                    </span>
                  ))}
                </span>
              </div>
              {!l.jokerlessBonus && <p class="cl-small">No jokerless bonus for this section.</p>}
            </article>
          ))}
        </section>
      ))}
      <section class="cheat-section payments">
        <h3>Who pays</h3>
        <ul>
          <li>Mah Jongg on a discard: the player who threw it pays double the hand's value; the other two pay the value.</li>
          <li>
            Self-picked from the wall: all three pay double. This app also pays these as self-picked: a hand completed by a joker
            exchange, East declaring before the first discard, and a hand dealt complete (rule choices a and b in STATUS.md).
          </li>
          <li>Jokerless: the payments double again, except for Singles and Pairs and Quints.</li>
          <li>A dead hand still pays the winner. A wall game, or three dead hands, means nobody pays.</li>
        </ul>
      </section>
    </div>
  );
}

// --- Settings ---------------------------------------------------------------------------------------------

function Toggle(props: { id: string; label: string; help: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div class="setting">
      <label class="switch" for={props.id}>
        <input type="checkbox" id={props.id} checked={props.checked} onChange={(e) => props.onChange((e.currentTarget as HTMLInputElement).checked)} />
        <span>{props.label}</span>
      </label>
      <p class="help">{props.help}</p>
    </div>
  );
}

export function SettingsPanel(props: {
  prefs: Prefs;
  onPrefs: (p: Prefs) => void;
  storeKind: 'claude' | 'browser' | 'none';
  seed: string;
  onNewSession: () => void;
}) {
  const { prefs, onPrefs } = props;
  const [confirming, setConfirming] = useState(false);
  const speeds: [Speed, string][] = [
    ['slow', 'Slow'],
    ['normal', 'Normal'],
    ['fast', 'Fast'],
  ];
  const saveText =
    props.storeKind === 'claude'
      ? 'Your game and settings save automatically to your private storage in Claude, so they follow you between your Mac and iPhone.'
      : props.storeKind === 'browser'
        ? 'Your game and settings save in this browser only.'
        : "Saving isn't available here, so a reload starts a new game.";
  return (
    <div class="settings">
      <Toggle
        id="safety"
        label="Safety"
        checked={prefs.safety}
        onChange={(v) => onPrefs({ ...prefs, safety: v })}
        help="On: a legal move that would make your own hand dead is blocked, with the reason. Off: you can make it, as at a real table, and your hand goes dead. Illegal moves are always blocked."
      />
      <Toggle
        id="stop-every"
        label="Stop after every discard"
        checked={prefs.stopEveryDiscard}
        onChange={(v) => onPrefs({ ...prefs, stopEveryDiscard: v })}
        help="Off: play stops only when you can call Mah Jongg or make an exposure that fits a hand on the card."
      />
      <div class="setting">
        <span class="setting-label">Computer speed</span>
        <div class="seg" role="group" aria-label="Computer speed">
          {speeds.map(([v, label]) => (
            <button class="seg-btn" key={v} aria-pressed={prefs.speed === v} onClick={() => onPrefs({ ...prefs, speed: v })}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <Toggle
        id="tile-names"
        label="Tile names under your tiles"
        checked={prefs.tileNames}
        onChange={(v) => onPrefs({ ...prefs, tileNames: v })}
        help="Tap any tile on the table to see its name, too."
      />
      <Toggle
        id="hide-concealed-setting"
        label="Hide concealed hands on the cheat sheet"
        checked={prefs.hideConcealed}
        onChange={(v) => onPrefs({ ...prefs, hideConcealed: v })}
        help="The other players still play every hand, and you can still declare a concealed hand you complete."
      />
      <div class="setting">
        <span class="setting-label">Tile style</span>
        <div class="styles">
          {tileStyles(prefs).map((s) => (
            <label class={`style-opt${s.locked ? ' is-locked' : ''}`} key={s.id}>
              <input
                type="radio"
                name="tile-style"
                id={`style-${s.id}`}
                checked={prefs.tileStyle === s.id}
                disabled={!!s.locked || !s.drawn}
                onChange={() => onPrefs({ ...prefs, tileStyle: s.id })}
              />
              <span class="style-name">{s.name}</span>
              <span class="help">{s.locked ?? (s.drawn ? 'Available' : 'Coming with the tile art milestone.')}</span>
            </label>
          ))}
        </div>
      </div>
      <div class="setting">
        <span class="setting-label">Sound</span>
        <p class="help">Off. There are no sounds yet.</p>
      </div>
      <div class="setting">
        <span class="setting-label">Saving</span>
        <p class="help">{saveText}</p>
      </div>
      <div class="setting">
        <span class="setting-label">Session</span>
        {confirming ? (
          <div class="confirm">
            <p class="help">Start over with every score at zero? The current game ends.</p>
            <div class="row">
              <button class="btn danger" onClick={props.onNewSession}>
                Start over
              </button>
              <button class="btn" onClick={() => setConfirming(false)}>
                Keep playing
              </button>
            </div>
          </div>
        ) : (
          <button class="btn" onClick={() => setConfirming(true)}>
            New session
          </button>
        )}
      </div>
      <p class="fineprint">
        Practice card (invented hands) · level 2 computer players · game seed {props.seed}
      </p>
    </div>
  );
}

// --- Log --------------------------------------------------------------------------------------------------

export function LogPanel({ lines }: { lines: LogLine[] }) {
  useEffect(() => {
    const el = document.querySelector('.sheet-body');
    if (el) el.scrollTop = el.scrollHeight;
  }, []);
  return (
    <ol class="log">
      {lines.map((l) => (
        <li class={`line tone-${l.tone}`} key={l.n}>
          {l.text}
        </li>
      ))}
    </ol>
  );
}

// --- Results ----------------------------------------------------------------------------------------------

function Rackline({ state, seat }: { state: GameState; seat: number }) {
  const pl = state.players[seat] as GameState['players'][number];
  return (
    <div class="reveal-tiles">
      {pl.exposures.map((e, i) => (
        <span class="exp-group is-exposed" key={`e${i}`}>
          {e.tiles.map((t) => (
            <TileSvg tile={t} cls="t-reveal" key={t} />
          ))}
        </span>
      ))}
      <span class="exp-group">
        {sortTileIds(pl.hand).map((t) => (
          <TileSvg tile={t} cls="t-reveal" key={t} />
        ))}
      </span>
    </div>
  );
}

export function EndPanel({ state, onNext, onClose }: { state: GameState; onNext: () => void; onClose: () => void }) {
  const p = state.phase;
  if (p.name !== 'ended') return null;
  const r = p.result;
  const ctx = { dealer: state.dealer, cardId: state.cardId };
  const w = (s: number) => (s === HUMAN ? `You (${windOf(state, s)})` : windOf(state, s));
  const title = r.type === 'mahjong' ? (r.winner === HUMAN ? 'You won!' : `${windOf(state, r.winner)} wins`) : r.type === 'wall' ? 'Wall game' : 'Three dead hands';
  let winning: { tiles: TileId[]; exposed: boolean }[] = [];
  if (r.type === 'mahjong') {
    const winner = state.players[r.winner] as GameState['players'][number];
    const t = getCard(state.cardId).targets[r.targetIndex];
    if (t) winning = arrangeTiles(t, winner.hand, winner.exposures).map((g) => ({ tiles: g.tiles, exposed: g.exposed }));
  }
  return (
    <div class="end">
      <p class="end-title">{title}</p>
      <p class="end-sentence">{describeResult(ctx, r)}</p>
      {winning.length > 0 && (
        <div class="winning" aria-label="The winning hand, in card order">
          {winning.map((g, i) => (
            <span class={`exp-group${g.exposed ? ' is-exposed' : ''}`} key={i}>
              {g.tiles.map((t) => (
                <TileSvg tile={t} cls="t-win" key={t} />
              ))}
            </span>
          ))}
        </div>
      )}
      <table class="scores">
        <thead>
          <tr>
            <th>Player</th>
            <th>This game</th>
            <th>Session</th>
          </tr>
        </thead>
        <tbody>
          {[0, 1, 2, 3].map((s) => (
            <tr key={s} class={s === HUMAN ? 'is-you' : ''}>
              <td>{w(s)}</td>
              <td class="num">{fmt(r.payments[s] as number)}</td>
              <td class="num">{fmt(state.scores[s] as number)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Every hand</h3>
      {[0, 1, 2, 3].map((s) => (
        <div class="reveal" key={s}>
          <p class="reveal-who">
            <b>{w(s)}</b> <span class="muted">{intentLine(state, s)}</span>
          </p>
          <Rackline state={state} seat={s} />
        </div>
      ))}
      <div class="end-actions">
        <button class="btn primary" onClick={onNext}>
          Next game
        </button>
        <button class="btn" onClick={onClose}>
          Look at the table
        </button>
      </div>
    </div>
  );
}

function fmt(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

function intentLine(state: GameState, seat: number): string {
  const p = state.phase;
  const pl = state.players[seat] as GameState['players'][number];
  if (p.name === 'ended' && p.result.type === 'mahjong' && p.result.winner === seat) return `won with ${handLabel(state.cardId, p.result.handId)}`;
  if (pl.dead) return 'hand was dead';
  try {
    const intent = botIntent(seatView(state, seat));
    if (!intent.target) return '';
    const away = intent.away;
    const who = seat === HUMAN ? 'were' : 'was';
    return `${who} ${away} tile${away === 1 ? '' : 's'} away from ${handLabel(state.cardId, intent.target.handId)}`;
  } catch {
    return '';
  }
}

// --- Lists of moves (joker exchanges, exposure changes) ----------------------------------------------------

export function ChoicesPanel({ intro, choices, onAct }: { intro: string; choices: Choice[]; onAct: (c: Choice) => void }) {
  return (
    <div class="choices">
      <p class="help">{intro}</p>
      {choices.length === 0 ? (
        <p class="help">Nothing available right now.</p>
      ) : (
        <ul class="choice-list">
          {choices.map((c) => (
            <li key={c.key}>
              <button class="btn wide" onClick={() => onAct(c)}>
                {c.tiles && (
                  <span class="btn-tiles">
                    {c.tiles.map((t) => (
                      <TileSvg tile={t} cls="t-btn" key={t} />
                    ))}
                  </span>
                )}
                <span class="btn-text">
                  {c.label}
                  {c.detail && <small>{c.detail}</small>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

