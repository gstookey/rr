import { isUsableWeights, remapWeights } from './layout/weights';

/**
 * Persists a group's size weights to localStorage.
 *
 * Created: 2026-09-25
 *
 * Carried over from TrAIdit's workstation resize, where each rule was paid for once:
 *  • writes SETTLE (default 200ms) instead of hitting storage on every pointermove, and a
 *    drag end flushes explicitly — so the last position is never lost to the debounce;
 *  • storage is best-effort: private mode, quota and disabled storage are silent no-ops;
 *  • a stored snapshot is validated before use — wrong length, zero, NaN or a foreign
 *    shape is discarded rather than rendered;
 *  • SSR-safe: no storage, no timers, nothing touched on the server.
 *
 * Weights are unitless, so a layout saved on one screen restores proportionally on another.
 *
 * Each weight is saved with the id of the item it belongs to, so a size follows its pane when
 * the order changes. That needs ids that are stable across reloads — give panes a `paneId`.
 * Generated ids are assigned in render order, so they degrade to exactly positional restore,
 * which is also what a snapshot saved without ids gets.
 */
interface StoredLayout {
  readonly v: 1;
  readonly weights: number[];
  readonly ids?: string[];
}

const hasStorage = (): boolean => {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null;
  } catch {
    return false;
  }
};

export class RrPaneSizeStore {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pending: StoredLayout | null = null;

  constructor(
    private readonly key: string,
    private readonly settleMs = 200,
  ) {}

  /** The stored weights in the order of `ids` (the group's items now), or null. */
  load(ids: readonly string[]): number[] | null {
    if (!hasStorage()) return null;
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<StoredLayout> | null;
      if (parsed?.v !== 1 || !isUsableWeights(parsed.weights, ids.length)) return null;
      const saved = Array.isArray(parsed.ids) ? parsed.ids : null;
      return (saved && remapWeights(saved, parsed.weights, ids)) ?? parsed.weights;
    } catch {
      return null;
    }
  }

  /** Schedule a write. Repeated calls inside the settle window coalesce into one. */
  save(weights: readonly number[], ids: readonly string[]): void {
    this.pending = { v: 1, weights: weights.map((w) => Math.round(w * 100) / 100), ids: [...ids] };
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), this.settleMs);
  }

  /** Write any pending layout now. Called at drag end and on destroy. */
  flush(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const layout = this.pending;
    this.pending = null;
    if (layout === null || !hasStorage()) return;
    try {
      localStorage.setItem(this.key, JSON.stringify(layout));
    } catch {
      // best effort — quota, private mode or disabled storage
    }
  }

  clear(): void {
    this.pending = null;
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    if (!hasStorage()) return;
    try {
      localStorage.removeItem(this.key);
    } catch {
      // best effort
    }
  }
}
