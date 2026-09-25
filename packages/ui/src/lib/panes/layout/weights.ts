import type { RrPaneBasis } from '../panes.types';

/**
 * Size weights — the whole sizing model, as pure functions.
 *
 * Created: 2026-09-25
 *
 * TWO KINDS OF ITEM, chosen by the unit the consumer writes:
 *
 *   FIXED  (`basis="280px"`)        renders as `minmax(<min>px, <weight>px)`.
 *                                   Holds its width when the container resizes.
 *   FLEX   (`basis="30%"`, `"1fr"`) renders as `minmax(<min>px, <weight>fr)`.
 *                                   Shares whatever the fixed items leave.
 *
 * That is the ordinary desktop layout — a fixed sidebar beside a flexible main area — and
 * CSS Grid does all of its arithmetic. A container resize, including a PiP relocation,
 * needs no JavaScript and no ResizeObserver.
 *
 * UNITS. A fixed item's weight is always px. A flex item's weight is relative: initially
 * "percent of the flex space"; after any interaction the group normalises every weight to
 * px, which is still a valid relative weight for an `fr` track and makes pairwise
 * resizing uniform across both kinds.
 */

export const isFixed = (basis: RrPaneBasis): boolean => basis.unit === 'px';

/** A flex item that has lost all of its space still gets a token weight, so it renders at
 *  its `min` instead of vanishing. */
const TOKEN_WEIGHT = 0.001;

/**
 * Initial weights, straight from the declared bases — NO measurement required, so the very
 * first render (and server rendering) is already the final layout.
 *
 *   [30%, 1fr]      → [30, 70]         the fr item takes what the % items leave
 *   [1fr, 3fr]      → [25, 75]
 *   [280px, 1fr]    → [280, 100]       fixed px; the lone flex item takes all flex space
 */
export function initialWeights(bases: readonly RrPaneBasis[]): number[] {
  let pctTotal = 0;
  let frTotal = 0;
  for (const b of bases) {
    if (b.unit === '%') pctTotal += b.value;
    else if (b.unit === 'fr') frTotal += b.value;
  }
  const frShare = Math.max(0, 100 - pctTotal);

  return bases.map((b) => {
    if (b.unit === 'px') return b.value;
    if (b.unit === '%') return Math.max(b.value, TOKEN_WEIGHT);
    return frTotal > 0 && frShare > 0 ? (frShare * b.value) / frTotal : TOKEN_WEIGHT;
  });
}

/**
 * Re-express every weight in px, using the sizes the items are rendered at right now.
 * Visually a no-op — it is how an interaction gets a common unit to work in.
 *
 * `measuredPx[i]` must be the rendered size of item i along the axis. Collapsed items are
 * not measured (they are at their rail size); a collapsed flex item's remembered weight is
 * rescaled by the same factor as the expanded flex items, so it returns at the right size.
 */
export function normalizeToPx(
  weights: readonly number[],
  bases: readonly RrPaneBasis[],
  collapsed: readonly boolean[],
  measuredPx: readonly number[],
): number[] {
  let oldFlex = 0;
  let pxFlex = 0;
  for (let i = 0; i < weights.length; i++) {
    if (!collapsed[i] && !isFixed(bases[i])) {
      oldFlex += weights[i];
      pxFlex += measuredPx[i];
    }
  }
  const scale = oldFlex > 0 && pxFlex > 0 ? pxFlex / oldFlex : 1;

  return weights.map((w, i) => {
    if (!collapsed[i]) return Math.max(measuredPx[i], TOKEN_WEIGHT);
    return isFixed(bases[i]) ? w : Math.max(w * scale, TOKEN_WEIGHT);
  });
}

export interface PairResizeInput {
  /** Must already be px — see normalizeToPx. */
  readonly weights: readonly number[];
  /** Index of the item BEFORE the handle. The item after it is `index + 1`. */
  readonly index: number;
  /** Proposed movement of the boundary, px. Positive grows the item before it. */
  readonly delta: number;
  readonly minBefore: number;
  readonly maxBefore: number | null;
  readonly minAfter: number;
  readonly maxAfter: number | null;
}

export interface PairResizeResult {
  readonly weights: number[];
  /** Size of the item before the handle after the move — for aria-valuenow. */
  readonly pxBefore: number;
}

/**
 * Move the boundary between two neighbours. Pure, px-based.
 *
 * The pair's combined size is conserved, so NO other item moves. The delta is clamped so
 * that neither item leaves its own [min, max]; if both sets of constraints cannot be met,
 * the weights are returned unchanged rather than violating either one.
 */
export function resizePair(input: PairResizeInput): PairResizeResult {
  const { weights, index, delta } = input;
  const after = index + 1;
  const pxBefore = weights[index] ?? 0;
  const unchanged: PairResizeResult = { weights: [...weights], pxBefore };
  if (index < 0 || after >= weights.length) return unchanged;

  const pair = weights[index] + weights[after];
  if (!(pair > 0)) return unchanged;

  // The item before may take any size that keeps BOTH items inside their bounds.
  const lo = Math.max(input.minBefore, pair - (input.maxAfter ?? Infinity));
  const hi = Math.min(input.maxBefore ?? Infinity, pair - input.minAfter);
  if (lo > hi) return unchanged;

  const nextBefore = Math.min(hi, Math.max(lo, pxBefore + delta));
  const next = [...weights];
  next[index] = nextBefore;
  next[after] = pair - nextBefore;
  return { weights: next, pxBefore: nextBefore };
}

/**
 * Restore one pair to its declared proportions, conserving the pair's combined size so no
 * other item moves. This is the double-click / Enter "reset" on a handle. `weights` must be px.
 *
 *   flex + flex   → split by the ratio of their declared weights
 *   fixed + any   → the fixed item returns to its declared px (clamped); the other takes the rest
 */
export function resetPair(
  weights: readonly number[],
  bases: readonly RrPaneBasis[],
  index: number,
  bounds: { minBefore: number; maxBefore: number | null; minAfter: number; maxAfter: number | null },
): number[] {
  const after = index + 1;
  if (index < 0 || after >= weights.length) return [...weights];
  const pair = weights[index] + weights[after];
  const initial = initialWeights(bases);
  const a = bases[index];
  const b = bases[after];

  let target: number;
  if (isFixed(a)) target = a.value;
  else if (isFixed(b)) target = pair - b.value;
  else {
    const ratio = initial[index] + initial[after];
    target = ratio > 0 ? (pair * initial[index]) / ratio : pair / 2;
  }

  return resizePair({ weights, index, delta: target - weights[index], ...bounds }).weights;
}

/** A stored layout is only trusted if it has the right shape and every weight is usable. */
export function isUsableWeights(value: unknown, expectedLength: number): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === expectedLength &&
    value.every((w) => typeof w === 'number' && Number.isFinite(w) && w > 0)
  );
}
