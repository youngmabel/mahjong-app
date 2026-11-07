/**
 * Start-up: load the practice card, find where to save, restore your game (or deal a new one), and show
 * the table. Inside Claude, an update to the page while it is open keeps your game (the viewer's hot hook).
 */

import { h, render } from 'preact';
import { loadCard } from '../engine/card';
import { PRACTICE_CARD_TEXT } from '../engine/cards/practice';
import { readPrefs } from './prefs';
import { readProgress } from './progress';
import type { SavedGame } from './session';
import { NO_STORE, openStore, type Store } from './storage';
import { App } from './view/App';

interface HotHook {
  ready?: (start: (data: unknown) => void) => void;
  snapshot?: (fn: () => unknown) => void;
  data?: unknown;
}

const hot = (globalThis as { claude?: { hot?: HotHook } }).claude?.hot;

loadCard(PRACTICE_CARD_TEXT);

let snapshotFn: (() => unknown) | null = null;
if (hot && typeof hot.snapshot === 'function') hot.snapshot(() => (snapshotFn ? snapshotFn() : null));

let reportSaveProblem: ((m: string) => void) | null = null;
let lastProblem = 0;
function onSaveError(): void {
  const now = Date.now();
  if (now - lastProblem < 60_000) return;
  lastProblem = now;
  reportSaveProblem?.("Your progress couldn't be saved just now. The game goes on, and the next save will try again.");
}

async function start(data: unknown): Promise<void> {
  const root = document.getElementById('app');
  if (!root) return;
  const carried = (data && typeof data === 'object' ? data : {}) as { game?: SavedGame | null; guided?: SavedGame | null; prefs?: unknown; progress?: unknown };
  let store: Store;
  try {
    store = await openStore(onSaveError);
  } catch {
    store = NO_STORE;
  }
  // the viewer may hand back a frozen copy of the game kept across a page update: work on a fresh one
  const fresh = <T,>(v: T | null | undefined): T | null => (v ? (JSON.parse(JSON.stringify(v)) as T) : null);
  let saved = fresh(carried.game);
  let guided = fresh(carried.guided);
  let prefsRaw: unknown = fresh(carried.prefs);
  let progressRaw: unknown = fresh(carried.progress);
  if (!saved) saved = await store.loadGame().catch(() => null);
  if (!guided) guided = await store.loadGuided().catch(() => null);
  if (!prefsRaw) prefsRaw = await store.loadPrefs().catch(() => null);
  if (!progressRaw) progressRaw = await store.loadProgress().catch(() => null);
  root.textContent = '';
  render(
    <App
      store={store}
      prefs={readPrefs(prefsRaw)}
      progress={readProgress(progressRaw)}
      saved={saved}
      guided={guided}
      registerSnapshot={(fn) => {
        snapshotFn = fn;
      }}
      onSaveProblem={(fn) => {
        reportSaveProblem = fn;
      }}
    />,
    root,
  );
}

if (hot && typeof hot.ready === 'function') hot.ready((d) => void start(d));
else void start(hot?.data ?? {});
