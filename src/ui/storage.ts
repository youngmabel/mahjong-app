/**
 * Saving progress. Inside Claude, your games, settings and progress go to the artifact's private
 * per-person storage (the `db` capability, under data/users/<your id>/, which only you can read), so they
 * follow you between your Mac and iPhone. Opened anywhere else (a local copy of the page), the browser's
 * own storage is used. Free play and the guided match each keep their own saved game.
 *
 * Writes go one at a time per document; a newer save waiting behind a slow one replaces it.
 */

import type { SavedGame } from './session';
import type { Prefs } from './prefs';
import type { Progress } from './progress';

export interface Store {
  /** 'claude': per-person storage that follows you; 'browser': this browser only; 'none': nothing is saved. */
  kind: 'claude' | 'browser' | 'none';
  /** Your free-play game. */
  loadGame(): Promise<SavedGame | null>;
  saveGame(game: SavedGame): void;
  /** Your guided match in progress. */
  loadGuided(): Promise<SavedGame | null>;
  saveGuided(game: SavedGame): void;
  loadPrefs(): Promise<unknown>;
  savePrefs(prefs: Prefs): void;
  loadProgress(): Promise<unknown>;
  saveProgress(progress: Progress): void;
}

/** A store that saves nothing (when no storage is available at all). */
export const NO_STORE: Store = {
  kind: 'none',
  loadGame: async () => null,
  saveGame: () => {},
  loadGuided: async () => null,
  saveGuided: () => {},
  loadPrefs: async () => null,
  savePrefs: () => {},
  loadProgress: async () => null,
  saveProgress: () => {},
};

interface DocRef {
  get(): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }>;
  set(data: Record<string, unknown>): Promise<void>;
}
interface Db {
  doc(path: string): DocRef;
}
interface UserCap {
  id(): Promise<string | null>;
}
interface ClaudeGlobal {
  use?: (name: string) => Promise<unknown>;
}

/** One writer per document: keeps only the newest pending value. */
function serialWriter(write: (data: Record<string, unknown>) => Promise<void>, onError: (e: unknown) => void) {
  let busy = false;
  let pending: Record<string, unknown> | null = null;
  const pump = async () => {
    if (busy || !pending) return;
    busy = true;
    const data = pending;
    pending = null;
    try {
      await write(data);
    } catch (e) {
      // one retry after a short pause for a passing hiccup
      try {
        await new Promise((r) => setTimeout(r, 400 + Math.random() * 400));
        await write(data);
      } catch (e2) {
        onError(e2 ?? e);
      }
    } finally {
      busy = false;
      if (pending) void pump();
    }
  };
  return (data: Record<string, unknown>) => {
    pending = data;
    void pump();
  };
}

/** Documents read from Claude's storage arrive frozen; the game needs its own copy it can change. */
function thaw<T>(v: T): T {
  return v == null ? v : (JSON.parse(JSON.stringify(v)) as T);
}

function claudeStore(db: Db, uid: string, onError: (e: unknown) => void): Store {
  const gameRef = db.doc(`data/users/${uid}/game`);
  const guidedRef = db.doc(`data/users/${uid}/guided`);
  const prefsRef = db.doc(`data/users/${uid}/prefs`);
  const progressRef = db.doc(`data/users/${uid}/progress`);
  const writeGame = serialWriter((d) => gameRef.set(d), onError);
  const writeGuided = serialWriter((d) => guidedRef.set(d), onError);
  const writePrefs = serialWriter((d) => prefsRef.set(d), onError);
  const writeProgress = serialWriter((d) => progressRef.set(d), onError);
  const loadSaved = async (ref: DocRef) => {
    const snap = await ref.get();
    const data = snap.exists ? snap.data() : undefined;
    return data && data.game ? thaw(data.game as SavedGame) : null;
  };
  return {
    kind: 'claude',
    loadGame: () => loadSaved(gameRef),
    saveGame(game) {
      writeGame({ game: game as unknown as Record<string, unknown>, savedAt: Date.now() });
    },
    loadGuided: () => loadSaved(guidedRef),
    saveGuided(game) {
      writeGuided({ game: game as unknown as Record<string, unknown>, savedAt: Date.now() });
    },
    async loadProgress() {
      const snap = await progressRef.get();
      return snap.exists ? thaw(snap.data()?.progress ?? null) : null;
    },
    saveProgress(progress) {
      writeProgress({ progress: progress as unknown as Record<string, unknown>, savedAt: Date.now() });
    },
    async loadPrefs() {
      const snap = await prefsRef.get();
      return snap.exists ? thaw(snap.data()?.prefs ?? null) : null;
    },
    savePrefs(prefs) {
      writePrefs({ prefs: prefs as unknown as Record<string, unknown>, savedAt: Date.now() });
    },
  };
}

const LOCAL_GAME = 'mahjong-practice:game';
const LOCAL_GUIDED = 'mahjong-practice:guided';
const LOCAL_PREFS = 'mahjong-practice:prefs';
const LOCAL_PROGRESS = 'mahjong-practice:progress';

function browserStore(): Store {
  let ok = false;
  try {
    const k = 'mahjong-practice:probe';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    ok = true;
  } catch {
    ok = false;
  }
  const read = (key: string): unknown => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  const write = (key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or blocked: keep playing without saving */
    }
  };
  return {
    kind: ok ? 'browser' : 'none',
    async loadGame() {
      return (read(LOCAL_GAME) as SavedGame | null) ?? null;
    },
    saveGame(game) {
      if (ok) write(LOCAL_GAME, game);
    },
    async loadGuided() {
      return (read(LOCAL_GUIDED) as SavedGame | null) ?? null;
    },
    saveGuided(game) {
      if (ok) write(LOCAL_GUIDED, game);
    },
    async loadProgress() {
      return read(LOCAL_PROGRESS);
    },
    saveProgress(progress) {
      if (ok) write(LOCAL_PROGRESS, progress);
    },
    async loadPrefs() {
      return read(LOCAL_PREFS);
    },
    savePrefs(prefs) {
      if (ok) write(LOCAL_PREFS, prefs);
    },
  };
}

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(fallback), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      () => {
        clearTimeout(t);
        resolve(fallback);
      },
    );
  });
}

/** Find the best place to save: Claude's per-person storage when available, else this browser. */
export async function openStore(onError: (e: unknown) => void): Promise<Store> {
  const claude = (globalThis as { claude?: ClaudeGlobal }).claude;
  if (claude && typeof claude.use === 'function') {
    try {
      const [db, user] = (await withTimeout(Promise.all([claude.use('db'), claude.use('user')]), 8000, [null, null])) as [
        Db | null,
        UserCap | null,
      ];
      const uid = user ? await withTimeout(user.id(), 5000, null) : null;
      if (db && uid) return claudeStore(db, uid, onError);
    } catch {
      /* fall through to browser storage */
    }
  }
  return browserStore();
}
