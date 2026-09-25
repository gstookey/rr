import { isUsableWeights, resetPair, resizePair, weightsFromBases } from './weights';
import type { RrPaneBasis } from '../panes.types';

const px = (value: number): RrPaneBasis => ({ unit: 'px', value });
const pct = (value: number): RrPaneBasis => ({ unit: '%', value });
const fr = (value: number): RrPaneBasis => ({ unit: 'fr', value });
const sum = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0);

describe('weightsFromBases', () => {
  // WHY: weights equal to the px each item occupies make the switch from declared tracks
  // to weight tracks invisible — no layout jump on first interaction.
  it('produces weights equal to the px each item would occupy', () => {
    expect(weightsFromBases([pct(30), fr(1)], 1000)).toEqual([300, 700]);
    expect(weightsFromBases([px(240), fr(1), fr(1)], 1000)).toEqual([240, 380, 380]);
    expect(weightsFromBases([fr(1), fr(3)], 800)).toEqual([200, 600]);
  });

  it('the weights of a fully-shared layout sum to the shared space', () => {
    expect(sum(weightsFromBases([pct(25), px(100), fr(2), fr(1)], 1200))).toBeCloseTo(1200);
  });

  // WHY: over-committed fixed items must not make fr items disappear — they fall to `min`.
  it('gives fr items a positive token weight when fixed items over-commit the space', () => {
    const w = weightsFromBases([px(900), fr(1)], 600);
    expect(w[0]).toBe(900);
    expect(w[1]).toBeGreaterThan(0);
  });
});

describe('resizePair', () => {
  const base = {
    weights: [300, 700, 500],
    index: 0,
    pxBefore: 300,
    pxAfter: 700,
    minBefore: 100,
    maxBefore: null,
    minAfter: 100,
    maxAfter: null,
  } as const;

  it('moves the boundary by the pointer delta', () => {
    const r = resizePair({ ...base, delta: 50 });
    expect(r.pxBefore).toBe(350);
    expect(r.weights[0] / (r.weights[0] + r.weights[1])).toBeCloseTo(350 / 1000);
  });

  // WHY: this is what guarantees a drag between two panes never moves a THIRD pane — the
  // pair's combined weight is conserved, so the fr unit is unchanged.
  it('conserves the pair weight and leaves every other item untouched', () => {
    const r = resizePair({ ...base, delta: -120 });
    expect(r.weights[0] + r.weights[1]).toBeCloseTo(1000);
    expect(r.weights[2]).toBe(500);
  });

  it('clamps so the item before the handle never leaves its bounds', () => {
    expect(resizePair({ ...base, delta: -1000 }).pxBefore).toBe(100);
    expect(resizePair({ ...base, delta: 50, maxBefore: 320 }).pxBefore).toBe(320);
  });

  it('clamps so the item AFTER the handle never leaves its bounds either', () => {
    expect(resizePair({ ...base, delta: 1000 }).pxBefore).toBe(900); // after stops at min 100
    expect(resizePair({ ...base, delta: -250, maxAfter: 800 }).pxBefore).toBe(200); // after capped at 800
  });

  it('refuses to move rather than violate an unsatisfiable pair of constraints', () => {
    const r = resizePair({ ...base, delta: 10, minBefore: 600, minAfter: 600 });
    expect(r.weights).toEqual(base.weights);
  });

  it('ignores an index with no neighbour, and a zero-size pair', () => {
    expect(resizePair({ ...base, index: 2, delta: 10 }).weights).toEqual(base.weights);
    expect(resizePair({ ...base, pxBefore: 0, pxAfter: 0, delta: 10 }).weights).toEqual(base.weights);
  });
});

describe('resetPair', () => {
  it('restores the declared ratio without disturbing the rest', () => {
    const r = resetPair([100, 900, 500], [300, 700, 500], 0);
    expect(r[0] / (r[0] + r[1])).toBeCloseTo(0.3);
    expect(r[0] + r[1]).toBeCloseTo(1000);
    expect(r[2]).toBe(500);
  });
});

describe('isUsableWeights', () => {
  // WHY: localStorage is shared, user-editable and outlives deployments. A stale or corrupt
  // snapshot must be rejected, not rendered.
  it('accepts only a right-length array of positive finite numbers', () => {
    expect(isUsableWeights([1, 2, 3], 3)).toBe(true);
    expect(isUsableWeights([1, 2], 3)).toBe(false);
    expect(isUsableWeights([1, 0, 3], 3)).toBe(false);
    expect(isUsableWeights([1, NaN, 3], 3)).toBe(false);
    expect(isUsableWeights('1,2,3', 3)).toBe(false);
    expect(isUsableWeights(null, 3)).toBe(false);
  });
});
