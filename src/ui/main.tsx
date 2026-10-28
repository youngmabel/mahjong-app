/**
 * Start-up: load the practice card, find where to save, restore your game (or deal a new one), and show
 * the table. Inside Claude, an update to the page while it is open keeps your game (the viewer's hot hook).
 */

import { h, render } from 'preact';
import { loadCard } from '../engine/card';
import { PRACTICE_CARD_TEXT } from '../engine/cards/practice';
import { readPrefs } from './prefs';
import type { SavedGame } from './session';
import { openStore, type Store } from './storage';
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
  const carried = (data && typeof data === 'object' ? data : {}) as { game?: SavedGame | null; prefs?: unknown };
  let store: Store;
  try {
    store = await openStore(onSaveError);
  } catch {
    store = { kind: 'none', loadGame: async () => null, saveGame: () => {}, loadPrefs: async () => null, savePrefs: () => {} };
  }
  // the viewer may hand back a frozen copy of the game kept across a page update: work on a fresh one
  let saved: SavedGame | null = carried.game ? (JSON.parse(JSON.stringify(carried.game)) as SavedGame) : null;
  let prefsRaw: unknown = carried.prefs ? JSON.parse(JSON.stringify(carried.prefs)) : null;
  if (!saved) saved = await store.loadGame().catch(() => null);
  if (!prefsRaw) prefsRaw = await store.loadPrefs().catch(() => null);
  root.textContent = '';
  render(
    <App
      store={store}
      prefs={readPrefs(prefsRaw)}
      saved={saved}
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
