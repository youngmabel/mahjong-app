/**
 * The table screen: your rack, everyone's exposures, the discard chart, the message line, and a button
 * for every move the referee allows right now. All game logic lives in session.ts and moves.ts.
 */

import { Fragment, h } from 'preact';
import { useEffect, useReducer, useRef, useState } from 'preact/hooks';
import { getCard } from '../../engine/card';
import { windOf } from '../../engine/engine';
import type { GameState } from '../../engine/state';
import { kindName, kindOfTile, type TileId } from '../../engine/tiles';
import { describeCell, discardChart, rackGroups } from '../layout';
import {
  callChoices,
  charlestonInfo,
  charlestonPassChoice,
  courtesyOfferChoices,
  courtesyPassChoice,
  heavenlyChoice,
  isPending,
  promptFor,
  relativePosition,
  selectionLimit,
  turnChoices,
  voteChoices,
  type Choice,
} from '../moves';
import type { Prefs } from '../prefs';
import { HUMAN, Session, type SavedGame } from '../session';
import type { Store } from '../storage';
import { cleanSprite } from '../tiles/clean';
import { ChoicesPanel, CheatSheetPanel, EndPanel, LogPanel, SettingsPanel, Sheet } from './Sheets';
import { BackSvg, TileSvg, shortName } from './Tile';

const SPRITE = cleanSprite();

type SheetName = null | 'card' | 'settings' | 'log' | 'end' | 'exchange' | 'amend';
type Player = GameState['players'][number];

export interface AppProps {
  store: Store;
  prefs: Prefs;
  saved: SavedGame | null;
  /** Lets the viewer keep your game when the page is updated while open. */
  registerSnapshot: (fn: () => unknown) => void;
  /** Called with a message when saving fails. */
  onSaveProblem: (fn: (message: string) => void) => void;
}

function article(name: string): string {
  return /^[AEIOU8]|^1[18]\b/.test(name) ? 'an' : 'a';
}

const POSITION_LABEL: Record<string, string> = { right: 'on your right', across: 'across', left: 'on your left' };

export function App(props: AppProps) {
  const [, force] = useReducer((n: number) => n + 1, 0);
  const [prefs, setPrefs] = useState(props.prefs);
  const [sheet, setSheet] = useState<SheetName>(null);
  const [sel, setSel] = useState<{ key: string; tiles: TileId[]; blind: number }>({ key: '', tiles: [], blind: 0 });
  const [endShownFor, setEndShownFor] = useState('');
  const sessionRef = useRef<Session | null>(null);
  if (!sessionRef.current) {
    sessionRef.current = new Session(
      {
        schedule: (fn, ms) => {
          const t = window.setTimeout(fn, ms);
          return () => window.clearTimeout(t);
        },
        changed: () => force(0),
        save: (g) => props.store.saveGame(g),
      },
      props.prefs,
      props.saved,
    );
  }
  const session = sessionRef.current;

  useEffect(() => {
    props.registerSnapshot(() => ({ game: session.serialize(), prefs: session.prefs }));
    props.onSaveProblem((m) => session.explain(m, 'info'));
    session.advance();
    return () => session.stop();
  }, []);

  const state = session.state;
  const p = state.phase;
  const me = state.players[HUMAN] as Player;
  const ended = p.name === 'ended';
  const endKey = `${session.sessionId}:${state.gameNumber}`;

  useEffect(() => {
    if (ended && endShownFor !== endKey) {
      setEndShownFor(endKey);
      setSheet('end');
    }
  }, [ended, endKey]);

  // Selections belong to one decision: any accepted move starts a fresh one.
  const decisionKey = `${endKey}:${state.actionCount}`;
  const cur = sel.key === decisionKey ? sel : { key: decisionKey, tiles: [] as TileId[], blind: 0 };
  const selected = cur.tiles.filter((t) => me.hand.includes(t));
  const blind = cur.blind;
  const pending = isPending(state, HUMAN);
  const limit = selectionLimit(state, HUMAN, blind);
  const w = (s: number) => (s === HUMAN ? 'You' : windOf(state, s));

  function updatePrefs(next: Prefs) {
    setPrefs(next);
    session.setPrefs(next);
    props.store.savePrefs(next);
  }

  function tapTile(t: TileId) {
    const name = kindName(kindOfTile(t));
    if (limit === 0) {
      session.explain(`That's ${article(name)} ${name}.`, 'info');
      return;
    }
    if (selected.includes(t)) {
      setSel({ ...cur, tiles: selected.filter((x) => x !== t) });
      session.clearNotice();
      return;
    }
    if (limit === 1) {
      setSel({ ...cur, tiles: [t] });
      session.clearNotice();
      return;
    }
    if (selected.length >= limit) {
      session.explain(`You've chosen ${limit} tile${limit === 1 ? '' : 's'}. Tap a chosen tile to put it back first.`, 'info');
      return;
    }
    setSel({ ...cur, tiles: [...selected, t] });
    session.clearNotice();
  }

  function setBlind(b: number) {
    setSel({ ...cur, blind: b, tiles: selected.slice(0, 3 - b) });
  }

  function act(c: Choice) {
    if (!c.ok) {
      session.explain(c.reason ?? "That move isn't allowed right now.");
      return;
    }
    if (session.act(c.action) === null) {
      setSel({ key: '', tiles: [], blind: 0 });
      if (sheet === 'exchange' || sheet === 'amend') setSheet(null);
    }
  }

  const tc = turnChoices(state, HUMAN, selected);
  const card = getCard(state.cardId);

  return (
    <div class={`app${prefs.tileNames ? ' with-names' : ''}`} data-phase={p.name} data-waiting-for-you={pending ? 'yes' : 'no'} data-step={`${state.gameNumber}:${state.actionCount}`}>
      <svg class="sprite" aria-hidden="true" dangerouslySetInnerHTML={{ __html: SPRITE }} />
      <TopBar state={state} onOpen={setSheet} />
      <Opponents state={state} />
      <Discards state={state} session={session} />
      <Messages state={state} session={session} blind={blind} />
      <MyExposures me={me} canChange={(tc?.amends.length ?? 0) > 0} onChange={() => setSheet('amend')} />
      <Rack
        hand={me.hand}
        order={prefs.rackOrder}
        selected={selected}
        lastDrawn={session.lastDrawn}
        names={prefs.tileNames}
        dead={me.dead !== null}
        onTap={tapTile}
        onOrder={(o) => updatePrefs({ ...prefs, rackOrder: o })}
      />
      <section class="actions" aria-label="Your moves">
        <Actions
          state={state}
          session={session}
          pending={pending}
          selected={selected}
          blind={blind}
          tc={tc}
          onBlind={setBlind}
          onAct={act}
          onOpen={setSheet}
          w={w}
        />
      </section>
      {sheet === 'card' && (
        <Sheet title={card.name} onClose={() => setSheet(null)}>
          <CheatSheetPanel card={card} prefs={prefs} onPrefs={updatePrefs} />
        </Sheet>
      )}
      {sheet === 'settings' && (
        <Sheet title="Settings" onClose={() => setSheet(null)}>
          <SettingsPanel
            prefs={prefs}
            onPrefs={updatePrefs}
            storeKind={props.store.kind}
            seed={state.seed}
            onNewSession={() => {
              session.newSession();
              setSheet(null);
            }}
          />
        </Sheet>
      )}
      {sheet === 'log' && (
        <Sheet title="Table log" onClose={() => setSheet(null)}>
          <LogPanel lines={session.log} />
        </Sheet>
      )}
      {sheet === 'end' && ended && (
        <Sheet title={`Game ${state.gameNumber} results`} onClose={() => setSheet(null)}>
          <EndPanel
            state={state}
            onNext={() => {
              setSheet(null);
              session.nextGame();
            }}
            onClose={() => setSheet(null)}
          />
        </Sheet>
      )}
      {sheet === 'exchange' && tc && (
        <Sheet title="Joker exchange" onClose={() => setSheet(null)}>
          <ChoicesPanel
            intro="Trade a real tile from your rack for an exposed joker that stands for that tile. You can take one from any exposure, your own included, and more than one per turn."
            choices={tc.exchanges}
            onAct={act}
          />
        </Sheet>
      )}
      {sheet === 'amend' && tc && (
        <Sheet title="Change your exposure" onClose={() => setSheet(null)}>
          <ChoicesPanel
            intro="You can change the size of the exposure you just made, or how many jokers it uses, until you discard (or start a joker exchange)."
            choices={tc.amends}
            onAct={act}
          />
        </Sheet>
      )}
    </div>
  );
}

function TopBar({ state, onOpen }: { state: GameState; onOpen: (s: SheetName) => void }) {
  const dealer = state.dealer === HUMAN;
  return (
    <header class="topbar">
      <div class="tb-who">
        <span class="tb-game">
          Game {state.gameNumber}
          {dealer && <span class="tb-dealer"> · Dealer</span>}
        </span>
        <span class="tb-seat">
          You're <b>{windOf(state, HUMAN)}</b>
        </span>
      </div>
      <div class="tb-stats">
        <span class="stat">
          <span class="stat-label">Wall</span> <b>{state.wall.length}</b>
        </span>
        <span class="stat">
          <span class="stat-label">Score</span> <b>{state.scores[HUMAN]}</b>
        </span>
      </div>
      <nav class="tb-nav">
        <button class="btn small" onClick={() => onOpen('card')}>
          Card
        </button>
        <button class="btn small" onClick={() => onOpen('log')}>
          Log
        </button>
        <button class="btn small" onClick={() => onOpen('settings')}>
          Settings
        </button>
      </nav>
    </header>
  );
}

function Opponents({ state }: { state: GameState }) {
  const p = state.phase;
  return (
    <section class="opponents" aria-label="Other players">
      {[1, 2, 3].map((seat) => {
        const pl = state.players[seat] as Player;
        const pos = relativePosition(HUMAN, seat);
        const active = (p.name === 'turn' && p.seat === seat) || (p.name === 'callWindow' && p.discarder === seat && p.eligible.length > 0);
        return (
          <div class={`opp${active ? ' is-active' : ''}${pl.dead ? ' is-dead' : ''}`} key={seat}>
            <div class="opp-id">
              <b class="opp-wind">{windOf(state, seat)}</b>
              <span class="opp-pos">{POSITION_LABEL[pos]}</span>
            </div>
            <div class="opp-meta">
              <span class="opp-count" title="Hidden tiles">
                <BackSvg cls="t-back" />
                {pl.hand.length}
              </span>
              <span class="opp-score" title="Session score">
                {state.scores[seat]} pts
              </span>
              {pl.dead && <span class="pill pill-dead">Dead</span>}
              {state.dealer === seat && <span class="pill">Dealer</span>}
            </div>
            <div class="opp-exp">
              {pl.exposures.length === 0 ? (
                <span class="none">No exposures</span>
              ) : (
                pl.exposures.map((e, i) => (
                  <span class="exp-group" key={i}>
                    {e.tiles.map((t) => (
                      <TileSvg tile={t} cls="t-opp" key={t} />
                    ))}
                  </span>
                ))
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function newestOnTable(state: GameState, session: Session): { tile: TileId; seat: number } | null {
  const n = session.newestDiscard;
  const last = state.floor[state.floor.length - 1];
  return n && last && last.tile === n.tile ? n : null;
}

function Discards({ state, session }: { state: GameState; session: Session }) {
  const chart = discardChart(state.floor);
  const newest = newestOnTable(state, session);
  const newestKind = newest ? kindOfTile(newest.tile) : -1;
  const name = (s: number) => (s === HUMAN ? 'you' : windOf(state, s));
  return (
    <section class="discards" aria-label="Discards on the table, by suit">
      <div class="disc-head">
        <span>Discards</span>
        <span class="disc-total">{state.floor.length} on the table</span>
      </div>
      <div class="chart">
        {chart.map((row, ri) => (
          <div class="chart-row" key={ri}>
            {row.map((cell) => {
              const n = cell.copies.length;
              const copies = cell.copies.slice(-4);
              return (
                <button
                  class={`cell${n ? '' : ' is-empty'}${cell.kind === newestKind ? ' is-newest' : ''}`}
                  key={cell.kind}
                  onClick={() => session.explain(describeCell(cell, name), 'info')}
                  aria-label={describeCell(cell, name)}
                >
                  {n === 0 ? (
                    <span class="slot" />
                  ) : (
                    <span class="stack">
                      {copies.map((c, i) => (
                        <TileSvg tile={c.tile} cls="t-chart" key={c.tile} style={`--i:${i}`} />
                      ))}
                    </span>
                  )}
                  {n > 1 && <span class="count">{n}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

function Messages({ state, session, blind }: { state: GameState; session: Session; blind: number }) {
  const newest = newestOnTable(state, session);
  const recent = session.log.slice(-6);
  const prompt = promptFor(state, HUMAN, blind, session.lastDrawn);
  const notice = session.currentNotice;
  return (
    <section class="messages" aria-live="polite">
      {newest && (
        <div class="newest" title="The newest discard">
          <TileSvg tile={newest.tile} cls="t-newest" />
        </div>
      )}
      <div class="msg-lines">
        {recent.map((l, i) => (
          <p class={`line tone-${l.tone}${i < recent.length - 2 ? ' is-older' : ''}${i === recent.length - 1 ? ' is-latest' : ''}`} key={l.n}>
            {l.text}
          </p>
        ))}
        {notice && <p class={`notice notice-${notice.tone}`}>{notice.text}</p>}
        <p class="prompt">{prompt}</p>
      </div>
    </section>
  );
}

function MyExposures({ me, canChange, onChange }: { me: Player; canChange: boolean; onChange: () => void }) {
  if (me.exposures.length === 0 && !me.dead) return <section class="mine is-empty" />;
  return (
    <section class="mine" aria-label="Your exposures">
      {me.dead && <span class="pill pill-dead">Your hand is dead</span>}
      {me.exposures.length > 0 && <span class="mine-label">Your exposures</span>}
      {me.exposures.map((e, i) => (
        <span class={`exp-group${e.locked ? '' : ' is-open'}`} key={i}>
          {e.tiles.map((t) => (
            <TileSvg tile={t} cls="t-mine" key={t} />
          ))}
        </span>
      ))}
      {canChange && (
        <button class="btn small" onClick={onChange}>
          Change
        </button>
      )}
    </section>
  );
}

function Rack(props: {
  hand: TileId[];
  order: Prefs['rackOrder'];
  selected: TileId[];
  lastDrawn: TileId | null;
  names: boolean;
  dead: boolean;
  onTap: (t: TileId) => void;
  onOrder: (o: Prefs['rackOrder']) => void;
}) {
  const groups = rackGroups(props.hand, props.order);
  return (
    <section class="rack-area" aria-label="Your rack">
      <div class="rack-head">
        <span class="rack-title">
          Your rack <span class="muted">· {props.hand.length} tiles</span>
        </span>
        <div class="seg" role="group" aria-label="Sort your rack">
          <button class="seg-btn" aria-pressed={props.order === 'suit'} onClick={() => props.onOrder('suit')}>
            By suit
          </button>
          <button class="seg-btn" aria-pressed={props.order === 'number'} onClick={() => props.onOrder('number')}>
            By number
          </button>
        </div>
      </div>
      <div class={`rack${props.dead ? ' is-dead' : ''}`}>
        {groups.map((g, gi) =>
          g.tiles.map((t, ti) => {
            const isSel = props.selected.includes(t);
            const k = kindOfTile(t);
            const start = gi > 0 && ti === 0;
            return (
              <button
                class={`rack-tile${start ? ' group-start' : ''}${isSel ? ' is-selected' : ''}${t === props.lastDrawn ? ' is-new' : ''}`}
                key={t}
                aria-pressed={isSel}
                aria-label={`${kindName(k)}${t === props.lastDrawn ? ', just drawn' : ''}`}
                onClick={() => props.onTap(t)}
              >
                <TileSvg tile={t} cls="t-rack" />
                {props.names && <span class="tile-name">{shortName(k)}</span>}
              </button>
            );
          }),
        )}
      </div>
    </section>
  );
}

export function ChoiceButton({ c, primary, onAct }: { c: Choice; primary?: boolean; onAct: (c: Choice) => void }) {
  return (
    <button class={`btn${primary && c.ok ? ' primary' : ''}${c.ok ? '' : ' is-dim'}`} title={c.ok ? undefined : (c.reason ?? undefined)} onClick={() => onAct(c)}>
      {c.tiles && c.tiles.length > 0 && (
        <span class="btn-tiles">
          {c.tiles.map((t) => (
            <TileSvg tile={t} cls="t-btn" key={t} />
          ))}
        </span>
      )}
      <span class="btn-text">
        {c.label}
        {c.detail && <small>{c.detail}</small>}
        {!c.ok && <span class="sr-only">, not available right now</span>}
      </span>
    </button>
  );
}

function Actions(props: {
  state: GameState;
  session: Session;
  pending: boolean;
  selected: TileId[];
  blind: number;
  tc: ReturnType<typeof turnChoices>;
  onBlind: (b: number) => void;
  onAct: (c: Choice) => void;
  onOpen: (s: SheetName) => void;
  w: (s: number) => string;
}) {
  const { state, session, pending, selected, blind, tc, onAct } = props;
  const p = state.phase;
  const me = state.players[HUMAN] as Player;
  if (p.name === 'ended') {
    return (
      <Fragment>
        <button class="btn primary" onClick={() => session.nextGame()}>
          Next game
        </button>
        <button class="btn" onClick={() => props.onOpen('end')}>
          See results
        </button>
      </Fragment>
    );
  }
  if (me.dead) return <p class="status">Your hand is dead, so you sit out the rest of this game. You still pay the winner.</p>;
  switch (p.name) {
    case 'charleston': {
      if (!pending) return <p class="status">Waiting for the other players.</p>;
      const info = charlestonInfo(state, HUMAN);
      const heavenly = heavenlyChoice(state, HUMAN);
      return (
        <Fragment>
          {info?.blindAllowed && (
            <div class="seg blind" role="group" aria-label="Blind pass">
              <span class="seg-label">Blind</span>
              {[0, 1, 2, 3].map((b) => (
                <button class="seg-btn" aria-pressed={blind === b} key={b} onClick={() => props.onBlind(b)}>
                  {b}
                </button>
              ))}
            </div>
          )}
          <ChoiceButton c={charlestonPassChoice(state, HUMAN, selected, blind)} primary onAct={onAct} />
          {heavenly?.ok && <ChoiceButton c={heavenly} primary onAct={onAct} />}
        </Fragment>
      );
    }
    case 'vote':
      return (
        <Fragment>
          {voteChoices(state, HUMAN).map((c, i) => (
            <ChoiceButton c={c} primary={i === 0} onAct={onAct} key={c.key} />
          ))}
        </Fragment>
      );
    case 'courtesyOffer':
      return (
        <div class="seg offer" role="group" aria-label="Courtesy pass offer">
          <span class="seg-label">Trade with {windOf(state, 2)}</span>
          {courtesyOfferChoices(state, HUMAN).map((c) => (
            <button class="seg-btn" key={c.key} onClick={() => onAct(c)}>
              {c.label}
            </button>
          ))}
        </div>
      );
    case 'courtesyPass':
      return pending ? <ChoiceButton c={courtesyPassChoice(state, HUMAN, selected)} primary onAct={onAct} /> : <p class="status">Waiting for the courtesy pass.</p>;
    case 'turn': {
      if (p.seat !== HUMAN || !tc) return <p class="status">{props.w(p.seat)} is playing…</p>;
      const ex = tc.exchanges;
      return (
        <Fragment>
          <ChoiceButton c={tc.discard} primary onAct={onAct} />
          <ChoiceButton c={tc.mahjong} onAct={onAct} />
          <button
            class={`btn${ex.length ? '' : ' is-dim'}`}
            onClick={() =>
              ex.length
                ? props.onOpen('exchange')
                : session.explain('No joker exchange right now: none of the exposed jokers stands for a tile you hold.', 'info')
            }
          >
            <span class="btn-text">Joker exchange{ex.length ? ` (${ex.length})` : ''}</span>
          </button>
        </Fragment>
      );
    }
    case 'callWindow': {
      if (!pending) return <p class="status">{props.w(p.discarder)} discarded. Waiting…</p>;
      const choices = callChoices(state, HUMAN);
      return (
        <Fragment>
          {choices.map((c) => (
            <ChoiceButton c={c} primary={c.key === 'mahjong'} onAct={onAct} key={c.key} />
          ))}
        </Fragment>
      );
    }
  }
}
