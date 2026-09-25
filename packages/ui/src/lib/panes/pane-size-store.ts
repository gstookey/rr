import { isUsableWeights } from './layout/weights';

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
 */
interface StoredLayout {
  readonly v: 1;
  readonly weights: number[];
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
  private pending: number[] | null = null;

  constructor(
    private readonly key: string,
    private readonly settleMs = 200,
  ) {}

  load(expectedLength: number): number[] | null {
    if (!hasStorage()) return null;
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<StoredLayout> | null;
      return parsed?.v === 1 && isUsableWeights(parsed.weights, expectedLength) ? parsed.weights : null;
    } catch {
      return null;
    }
  }

  /** Schedule a write. Repeated calls inside the settle window coalesce into one. */
  save(weights: readonly number[]): void {
    this.pending = weights.map((w) => Math.round(w * 100) / 100);
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), this.settleMs);
  }

  /** Write any pending layout now. Called at drag end and on destroy. */
  flush(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const weights = this.pending;
    this.pending = null;
    if (weights === null || !hasStorage()) return;
    try {
      const layout: StoredLayout = { v: 1, weights };
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
