/**
 * The table screen: your rack, everyone's exposures, the discard chart, the message line, the coach, and
 * a button for every move the referee allows right now. All game logic lives in session.ts and moves.ts.
 * Free play and the guided match each have their own game; the Menu switches between them.
 */

import { Fragment, h, type ComponentChildren } from 'preact';
import { useEffect, useReducer, useRef, useState } from 'preact/hooks';
import { getCard } from '../../engine/card';
import { windOf } from '../../engine/engine';
import type { GameState } from '../../engine/state';
import { kindName, kindOfTile, sortTileIds, type TileId } from '../../engine/tiles';
import { seatView } from '../../engine/view';
import { rankLines, readRack, type MatchNumber } from '../../coach';
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
import { graduate, matchUnlocked, recordMatch, type MatchOutcome, type Progress } from '../progress';
import { FREE_PLAY, HUMAN, MATCH_LABELS, Session, sameMode, type Mode, type SavedGame, type SessionHost } from '../session';
import type { Store } from '../storage';
import { cleanSprite } from '../tiles/clean';
import { CoachBar, DirectionPanel, MatchReport, MenuPanel, OpenRack, PinnedStrip, pinnedDisplay } from './Coach';
import { ChoicesPanel, CheatSheetPanel, EndPanel, LogPanel, SettingsPanel, Sheet } from './Sheets';
import { BackSvg, TileSvg, shortName } from './Tile';

const SPRITE = cleanSprite();

type SheetName = null | 'card' | 'settings' | 'log' | 'end' | 'exchange' | 'amend' | 'menu' | 'direction';
type Player = GameState['players'][number];

export interface AppProps {
  store: Store;
  prefs: Prefs;
  progress: Progress;
  /** Your free-play game, if saved. */
  saved: SavedGame | null;
  /** Your guided match in progress, if saved. */
  guided: SavedGame | null;
  /** Lets the viewer keep your games when the page is updated while open. */
  registerSnapshot: (fn: () => unknown) => void;
  /** Called with a message when saving fails. */
  onSaveProblem: (fn: (message: string) => void) => void;
}

function article(name: string): string {
  return /^[AEIOU8]|^1[18]\b/.test(name) ? 'an' : 'a';
}

const POSITION_LABEL: Record<string, string> = { right: 'on your right', across: 'across', left: 'on your left' };

function inProgress(g: SavedGame | null): MatchNumber | null {
  return g && g.mode?.kind === 'guided' && g.state.phase.name !== 'ended' ? g.mode.match : null;
}

export function App(props: AppProps) {
  const [, force] = useReducer((n: number) => n + 1, 0);
  const [prefs, setPrefs] = useState(props.prefs);
  const [progress, setProgress] = useState(props.progress);
  const [sheet, setSheet] = useState<SheetName>(null);
  const [sel, setSel] = useState<{ key: string; tiles: TileId[]; blind: number }>({ key: '', tiles: [], blind: 0 });
  const [endShownFor, setEndShownFor] = useState('');
  const [pinView, setPinView] = useState(0);
  const [outcome, setOutcome] = useState<{ key: string; o: MatchOutcome } | null>(null);
  const prefsRef = useRef(props.prefs);
  const progressRef = useRef(props.progress);
  const saves = useRef<{ free: SavedGame | null; guided: SavedGame | null }>({ free: props.saved, guided: props.guided });
  const sessions = useRef<{ free: Session | null; guided: Session | null }>({ free: null, guided: null });
  const [mode, setMode] = useState<Mode>(() => (props.prefs.lastMode === 'guided' && inProgress(props.guided) !== null ? (props.guided?.mode as Mode) : FREE_PLAY));

  function saveProgress(p: Progress) {
    progressRef.current = p;
    setProgress(p);
    props.store.saveProgress(p);
    sessions.current.free?.setProgress(p);
    sessions.current.guided?.setProgress(p);
  }

  const host: SessionHost = {
    schedule: (fn, ms) => {
      const t = window.setTimeout(fn, ms);
      return () => window.clearTimeout(t);
    },
    changed: () => force(0),
    save: (g) => {
      if (g.mode?.kind === 'guided') {
        saves.current.guided = g;
        props.store.saveGuided(g);
      } else {
        saves.current.free = g;
        props.store.saveGame(g);
      }
    },
    saveProgress,
    now: () => Date.now(),
  };

  function sessionFor(m: Mode): Session {
    const slot = m.kind === 'guided' ? 'guided' : 'free';
    let s = sessions.current[slot];
    if (!s || !sameMode(s.mode, m)) {
      s?.stop();
      s = new Session(host, prefsRef.current, slot === 'guided' ? saves.current.guided : saves.current.free, { mode: m, progress: progressRef.current });
      sessions.current[slot] = s;
    }
    return s;
  }
  const session = sessionFor(mode);

  useEffect(() => {
    props.registerSnapshot(() => ({
      game: sessions.current.free?.serialize() ?? saves.current.free,
      guided: sessions.current.guided?.serialize() ?? saves.current.guided,
      prefs: prefsRef.current,
      progress: progressRef.current,
    }));
    props.onSaveProblem((m) => (sessions.current.guided ?? sessions.current.free)?.explain(m, 'info'));
  }, []);

  useEffect(() => {
    session.setPrefs(prefsRef.current); // also lets the computer players move
    // a pointer to what's new, until you start your first guided match
    if (session.mode.kind === 'free' && progressRef.current.completed.length === 0 && !saves.current.guided && !sessions.current.guided)
      session.explain('New: guided practice with a coach. Open the Menu to start match 1, the open table.', 'info');
    return () => session.stop();
  }, [session]);

  const state = session.state;
  const p = state.phase;
  const me = state.players[HUMAN] as Player;
  const ended = p.name === 'ended';
  const endKey = `${session.sessionId}:${state.gameNumber}`;
  const result = session.matchResult();

  useEffect(() => {
    if (ended && endShownFor !== endKey) {
      setEndShownFor(endKey);
      setSheet('end');
    }
    if (ended && result && outcome?.key !== endKey) {
      const o = recordMatch(progressRef.current, result.report, result.stats.slips, session.sessionId);
      if (o.progress !== progressRef.current) saveProgress(o.progress);
      if (o.graduatedNow) unlockClassic();
      setOutcome({ key: endKey, o });
    }
  }, [ended, endKey]);

  useEffect(() => {
    if (session.needsDirection && sheet === null) setSheet('direction');
  });

  // Selections belong to one decision: any accepted move starts a fresh one (match 1 starts with the coach's picks).
  const decisionKey = `${endKey}:${state.actionCount}`;
  const pre = sel.key === decisionKey ? null : session.preselect();
  const cur = sel.key === decisionKey ? sel : { key: decisionKey, tiles: pre?.tiles ?? ([] as TileId[]), blind: pre?.blind ?? 0 };
  const selected = cur.tiles.filter((t) => me.hand.includes(t));
  const blind = cur.blind;
  const pending = isPending(state, HUMAN);
  const limit = selectionLimit(state, HUMAN, blind);
  const w = (s: number) => (s === HUMAN ? 'You' : windOf(state, s));

  function updatePrefs(next: Prefs) {
    prefsRef.current = next;
    setPrefs(next);
    session.setPrefs(next);
    props.store.savePrefs(next);
  }

  function unlockClassic() {
    const next = { ...prefsRef.current, progress: { ...prefsRef.current.progress, graduated: true } };
    updatePrefs(next);
  }

  function switchTo(m: Mode, fresh = false) {
    session.stop();
    if (fresh) {
      const slot = m.kind === 'guided' ? 'guided' : 'free';
      sessions.current[slot]?.stop();
      sessions.current[slot] = null;
      if (slot === 'guided') saves.current.guided = null;
    }
    const next = { ...prefsRef.current, lastMode: m.kind };
    prefsRef.current = next;
    setPrefs(next);
    props.store.savePrefs(next);
    setSel({ key: '', tiles: [], blind: 0 });
    setPinView(0);
    setSheet(null);
    setMode(m);
  }

  function guidedInProgress(): MatchNumber | null {
    const g = sessions.current.guided;
    if (g && g.mode.kind === 'guided') return g.state.phase.name !== 'ended' ? g.mode.match : null;
    return inProgress(saves.current.guided);
  }

  function pickMatch(m: MatchNumber) {
    if (!matchUnlocked(progressRef.current, m)) {
      setSheet(null);
      session.explain(`Match ${m} opens after you finish match ${m - 1}.`, 'info');
      return;
    }
    switchTo({ kind: 'guided', match: m }, guidedInProgress() !== m);
  }

  function doGraduate() {
    saveProgress(graduate(progressRef.current));
    unlockClassic();
    if (outcome) setOutcome({ ...outcome, o: { ...outcome.o, graduatedNow: true, mayGraduateEarly: false } });
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
      if (c.screenOnly) session.explain(c.reason ?? "That move isn't allowed right now.");
      else session.refused(c.reason ?? "That move isn't allowed right now.", c.code);
      return;
    }
    if (session.act(c.action) === null) {
      setSel({ key: '', tiles: [], blind: 0 });
      if (sheet === 'exchange' || sheet === 'amend') setSheet(null);
    }
  }

  function pin(id: string) {
    if (session.pins.includes(id)) {
      session.unpin(id);
      setPinView(0);
      return;
    }
    if (!session.pin(id)) session.explain('You can pin up to two hands. Unpin one first.', 'info');
    else setPinView(session.pins.indexOf(id));
  }

  const tc = turnChoices(state, HUMAN, selected);
  const card = getCard(state.cardId);
  const settings = session.settings;
  const shownPin = session.coachOn ? pinnedDisplay(session, Math.min(pinView, Math.max(0, session.pins.length - 1))) : null;
  const openRacks = settings.openRacks && prefs.openRacks;
  const away = settings.coach === 'proactive' ? new Map(rankLines(readRack(seatView(state, HUMAN)), { hideConcealed: prefs.hideConcealed }).map((l) => [l.handId, l.away])) : undefined;
  const match = session.match;

  return (
    <div class={`app${prefs.tileNames ? ' with-names' : ''}`} data-phase={p.name} data-mode={match ? `match-${match}` : 'free'} data-waiting-for-you={pending ? 'yes' : 'no'} data-step={`${state.gameNumber}:${state.actionCount}`}>
      <svg class="sprite" aria-hidden="true" dangerouslySetInnerHTML={{ __html: SPRITE }} />
      <TopBar state={state} label={match ? `Match ${match}` : null} onOpen={setSheet} />
      <Opponents state={state} open={openRacks} />
      <Discards state={state} session={session} />
      <Messages state={state} session={session} blind={blind} />
      <CoachBar session={session} selected={selected} onPin={pin} />
      <MyExposures me={me} canChange={(tc?.amends.length ?? 0) > 0} onChange={() => setSheet('amend')} />
      {/* your rack and your buttons stay together at the bottom, so the buttons never cover your tiles */}
      <div class="dock">
        <Rack
          hand={me.hand}
          order={prefs.rackOrder}
          selected={selected}
          lastDrawn={session.lastDrawn}
          names={prefs.tileNames}
          dead={me.dead !== null}
          fits={shownPin?.fits ?? null}
          onTap={tapTile}
          onOrder={(o) => updatePrefs({ ...prefs, rackOrder: o })}
          onCard={() => setSheet('card')}
        >
          {shownPin && <PinnedStrip session={session} index={Math.min(pinView, session.pins.length - 1)} onSwitch={() => setPinView((pinView + 1) % session.pins.length)} onUnpin={pin} />}
        </Rack>
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
      </div>
      {sheet === 'card' && (
        <Sheet title={card.name} onClose={() => setSheet(null)}>
          <CheatSheetPanel card={card} prefs={prefs} onPrefs={updatePrefs} pinning={session.coachOn ? { pins: session.pins, onToggle: pin, away } : undefined} />
        </Sheet>
      )}
      {sheet === 'menu' && (
        <Sheet title="Menu" onClose={() => setSheet(null)}>
          <MenuPanel
            info={{ progress, mode, guidedInProgress: guidedInProgress(), freeGameNumber: (sessions.current.free?.state ?? saves.current.free?.state)?.gameNumber ?? null }}
            onMatch={pickMatch}
            onFree={() => switchTo(FREE_PLAY)}
            onOpen={(s) => setSheet(s)}
          />
        </Sheet>
      )}
      {sheet === 'direction' && (
        <Sheet
          title="Which hand are you going for?"
          onClose={() => {
            session.dismissDirection();
            setSheet(null);
          }}
        >
          <DirectionPanel
            session={session}
            showCounts={settings.coach === 'proactive'}
            onPin={(id) => {
              pin(id);
              setSheet(null);
            }}
            onSkip={() => {
              session.dismissDirection();
              setSheet(null);
            }}
          />
        </Sheet>
      )}
      {sheet === 'settings' && (
        <Sheet title="Settings" onClose={() => setSheet(null)}>
          <SettingsPanel
            prefs={prefs}
            onPrefs={updatePrefs}
            storeKind={props.store.kind}
            seed={state.seed}
            guided={match}
            safetyNow={session.safety}
            onNewSession={() => {
              session.newSession();
              setSel({ key: '', tiles: [], blind: 0 });
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
        <Sheet title={match ? `${MATCH_LABELS[match]}: results` : `Game ${state.gameNumber} results`} onClose={() => setSheet(null)}>
          <EndPanel
            state={state}
            onNext={() => {
              setSheet(null);
              session.nextGame();
            }}
            onClose={() => setSheet(null)}
            guided={
              match && result ? (
                <GuidedEnd
                  match={match}
                  result={result}
                  outcome={outcome?.key === endKey ? outcome.o : null}
                  onNextMatch={(m) => pickMatch(m)}
                  onAgain={() => switchTo({ kind: 'guided', match }, true)}
                  onFree={() => switchTo(FREE_PLAY)}
                  onGraduate={doGraduate}
                  graduated={progress.graduated}
                />
              ) : undefined
            }
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

function GuidedEnd(props: {
  match: MatchNumber;
  result: NonNullable<ReturnType<Session['matchResult']>>;
  outcome: MatchOutcome | null;
  graduated: boolean;
  onNextMatch: (m: MatchNumber) => void;
  onAgain: () => void;
  onFree: () => void;
  onGraduate: () => void;
}) {
  const { match, result, outcome } = props;
  return (
    <div class="guided-end">
      <MatchReport report={result.report} review={result.review} />
      {outcome?.graduatedNow ? (
        <p class="grad">You graduated! Classic tiles are unlocked (their art arrives with the tile-art step), and free play is all yours. Every match stays open to replay.</p>
      ) : outcome?.mayGraduateEarly ? (
        <p class="grad">Every check passed, so you can graduate now, or play match 3 first.</p>
      ) : null}
      <div class="end-actions">
        {outcome?.mayGraduateEarly && (
          <button class="btn primary" onClick={props.onGraduate}>
            Graduate now
          </button>
        )}
        {match < 3 && !outcome?.graduatedNow && (
          <button class={`btn${outcome?.mayGraduateEarly ? '' : ' primary'}`} onClick={() => props.onNextMatch((match + 1) as MatchNumber)}>
            Next: match {match + 1}
          </button>
        )}
        <button class="btn" onClick={props.onAgain}>
          Play match {match} again
        </button>
        <button class={`btn${outcome?.graduatedNow ? ' primary' : ''}`} onClick={props.onFree}>
          Free play
        </button>
      </div>
    </div>
  );
}

function TopBar({ state, label, onOpen }: { state: GameState; label: string | null; onOpen: (s: SheetName) => void }) {
  const dealer = state.dealer === HUMAN;
  return (
    <header class="topbar">
      <div class="tb-who">
        <span class="tb-game">
          {label ?? `Game ${state.gameNumber}`}
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
        <button class="btn small" onClick={() => onOpen('menu')}>
          Menu
        </button>
      </nav>
    </header>
  );
}

function Opponents({ state, open }: { state: GameState; open: boolean }) {
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
            {open && <OpenRack tiles={sortTileIds(pl.hand)} />}
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
  /** Tiles your pinned hand uses (marked on the rack), or null. */
  fits: Set<TileId> | null;
  onTap: (t: TileId) => void;
  onOrder: (o: Prefs['rackOrder']) => void;
  /** Open the card (cheat sheet) from right beside your tiles. */
  onCard: () => void;
  children?: ComponentChildren;
}) {
  const groups = rackGroups(props.hand, props.order);
  return (
    <section class="rack-area" aria-label="Your rack">
      <div class="rack-head">
        <span class="rack-title">
          <span class="rack-word">Your rack · </span>
          <span class="muted">{props.hand.length} tiles</span>
        </span>
        <div class="rack-tools">
          <div class="seg" role="group" aria-label="Sort your rack">
            <button class="seg-btn" aria-pressed={props.order === 'suit'} onClick={() => props.onOrder('suit')}>
              By suit
            </button>
            <button class="seg-btn" aria-pressed={props.order === 'number'} onClick={() => props.onOrder('number')}>
              By number
            </button>
          </div>
          <button class="btn small rack-card" onClick={props.onCard}>
            Card
          </button>
        </div>
      </div>
      {props.children}
      <div class={`rack${props.dead ? ' is-dead' : ''}`}>
        {groups.map((g, gi) =>
          g.tiles.map((t, ti) => {
            const isSel = props.selected.includes(t);
            const k = kindOfTile(t);
            const start = gi > 0 && ti === 0;
            const fits = props.fits?.has(t) ?? false;
            return (
              <button
                class={`rack-tile${start ? ' group-start' : ''}${isSel ? ' is-selected' : ''}${t === props.lastDrawn ? ' is-new' : ''}${fits ? ' fits' : ''}`}
                key={t}
                aria-pressed={isSel}
                aria-label={`${kindName(k)}${t === props.lastDrawn ? ', just drawn' : ''}${fits ? ', fits your pinned hand' : ''}`}
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
    return session.match ? (
      <Fragment>
        <button class="btn primary" onClick={() => props.onOpen('end')}>
          See your report
        </button>
        <button class="btn" onClick={() => props.onOpen('menu')}>
          Menu
        </button>
      </Fragment>
    ) : (
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
