import type { RrPaneBasis } from '../panes.types';

/**
 * Size weights — the whole resizing model, as pure functions.
 *
 * Created: 2026-09-25
 *
 * THE MODEL. Every item in a group owns a WEIGHT. An expanded item renders as the grid
 * track `minmax(<min>px, <weight>fr)`, so CSS Grid hands out the shared space in proportion
 * to the weights. The browser does the arithmetic; this file only decides the weights.
 *
 * Consequences worth knowing:
 *  • Weights are unitless, so a layout saved on a large monitor restores proportionally on
 *    a small one, and a window resize (including PiP) rescales with no JavaScript at all.
 *  • A collapsed item keeps its weight but renders `0fr`, so its space flows to its
 *    siblings in proportion — and returns when it expands. No redistribution math.
 *  • A drag moves weight between exactly two neighbours and keeps their SUM constant, so
 *    the fr unit — and therefore every other item's size — is untouched.
 */

/**
 * Convert declared bases into weights, measured against `sharedPx` — the space the
 * expanded items share (group axis minus handle tracks minus collapsed items).
 *
 * The returned weights are, deliberately, the px each item would occupy right now. So the
 * first `fr` layout is pixel-identical to the declared bases — switching from declared
 * tracks to weight tracks is invisible.
 */
export function weightsFromBases(bases: readonly RrPaneBasis[], sharedPx: number): number[] {
  const shared = Math.max(0, sharedPx);
  let fixedPx = 0;
  let frTotal = 0;
  for (const basis of bases) {
    if (basis.unit === 'px') fixedPx += basis.value;
    else if (basis.unit === '%') fixedPx += (basis.value / 100) * shared;
    else frTotal += basis.value;
  }
  const remainder = shared - fixedPx;

  return bases.map((basis) => {
    if (basis.unit === 'px') return basis.value;
    if (basis.unit === '%') return (basis.value / 100) * shared;
    // fr: split what the fixed items left. If they over-committed the space, give fr items
    // a token weight so they render at their `min` rather than vanishing.
    return remainder > 0 && frTotal > 0 ? (remainder * basis.value) / frTotal : basis.value;
  });
}

export interface PairResizeInput {
  readonly weights: readonly number[];
  /** Index of the item BEFORE the handle. The item after it is `index + 1`. */
  readonly index: number;
  /** Current rendered size of both items along the axis, in px. */
  readonly pxBefore: number;
  readonly pxAfter: number;
  /** Proposed movement of the boundary, in px. Positive grows the item before it. */
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
 * Move the boundary between two neighbours. Pure.
 *
 * The pair's combined px and combined weight are both conserved; the delta is clamped so
 * that NEITHER item leaves its own [min, max]. If the two items' constraints cannot both be
 * met, the weights are returned unchanged rather than violating either one.
 */
export function resizePair(input: PairResizeInput): PairResizeResult {
  const { weights, index, pxBefore, pxAfter, delta } = input;
  const unchanged: PairResizeResult = { weights: [...weights], pxBefore };
  const after = index + 1;
  if (index < 0 || after >= weights.length) return unchanged;

  const pairPx = pxBefore + pxAfter;
  const pairWeight = weights[index] + weights[after];
  if (!(pairPx > 0) || !(pairWeight > 0)) return unchanged;

  // The item before may take the range that keeps BOTH items inside their bounds.
  const lo = Math.max(input.minBefore, pairPx - (input.maxAfter ?? Infinity));
  const hi = Math.min(input.maxBefore ?? Infinity, pairPx - input.minAfter);
  if (lo > hi) return unchanged;

  const nextBefore = Math.min(hi, Math.max(lo, pxBefore + delta));
  const next = [...weights];
  next[index] = (pairWeight * nextBefore) / pairPx;
  next[after] = pairWeight - next[index];
  return { weights: next, pxBefore: nextBefore };
}

/**
 * Restore a pair to its declared proportions WITHOUT disturbing any other item: the pair's
 * combined weight is kept, and only the split between them returns to the original ratio.
 * This is the double-click / Enter "reset" on a handle.
 */
export function resetPair(
  weights: readonly number[],
  initial: readonly number[],
  index: number,
): number[] {
  const after = index + 1;
  if (index < 0 || after >= weights.length || after >= initial.length) return [...weights];
  const pairWeight = weights[index] + weights[after];
  const initialPair = initial[index] + initial[after];
  if (!(initialPair > 0)) return [...weights];
  const next = [...weights];
  next[index] = (pairWeight * initial[index]) / initialPair;
  next[after] = pairWeight - next[index];
  return next;
}

/** A stored layout is only trusted if it has the right shape and every weight is usable. */
export function isUsableWeights(value: unknown, expectedLength: number): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === expectedLength &&
    value.every((w) => typeof w === 'number' && Number.isFinite(w) && w > 0)
  );
}
