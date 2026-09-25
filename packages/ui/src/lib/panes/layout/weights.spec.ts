import {
  initialWeights, isFixed, isUsableWeights, normalizeToPx, resetPair, resizePair,
} from './weights';
import type { RrPaneBasis } from '../panes.types';

const px = (value: number): RrPaneBasis => ({ unit: 'px', value });
const pct = (value: number): RrPaneBasis => ({ unit: '%', value });
const fr = (value: number): RrPaneBasis => ({ unit: 'fr', value });

describe('initialWeights', () => {
  // WHY: initial weights need no measurement, so the first render — and server rendering —
  // is already the final layout. No post-render swap, no flash.
  it('derives weights from declared bases alone', () => {
    expect(initialWeights([pct(30), fr(1)])).toEqual([30, 70]);
    expect(initialWeights([fr(1), fr(3)])).toEqual([25, 75]);
    expect(initialWeights([fr(1), fr(1)])).toEqual([50, 50]);
  });

  it('keeps a fixed item at its px and lets flex items share the rest', () => {
    expect(initialWeights([px(280), fr(1)])).toEqual([280, 100]);
    expect(initialWeights([px(280), pct(30), fr(1)])).toEqual([280, 30, 70]);
  });

  // WHY: over-committed percentages must not make an fr item vanish — it falls to its min.
  it('gives fr items a positive token weight when percentages claim everything', () => {
    const w = initialWeights([pct(100), fr(1)]);
    expect(w[1]).toBeGreaterThan(0);
  });

  it('classifies px as fixed and % / fr as flex', () => {
    expect([isFixed(px(1)), isFixed(pct(1)), isFixed(fr(1))]).toEqual([true, false, false]);
  });
});

describe('normalizeToPx', () => {
  it('re-expresses expanded items as their rendered px', () => {
    expect(normalizeToPx([30, 70], [pct(30), fr(1)], [false, false], [300, 700])).toEqual([300, 700]);
  });

  // WHY: a collapsed flex pane must come back at the size it left at. Its remembered weight
  // is in the OLD unit, so it has to be rescaled with its siblings, not copied.
  it('rescales a collapsed flex item by the same factor as the expanded flex items', () => {
    // three flex items 25/25/50 of a 1000px flex space; the first is collapsed
    const w = normalizeToPx([25, 25, 50], [fr(1), fr(1), fr(2)], [true, false, false], [0, 250, 500]);
    expect(w).toEqual([250, 250, 500]);
  });

  it('leaves a collapsed fixed item at its px', () => {
    expect(normalizeToPx([280, 100], [px(280), fr(1)], [true, false], [0, 900])).toEqual([280, 900]);
  });
});

describe('resizePair', () => {
  const base = {
    weights: [300, 700, 500],
    index: 0,
    minBefore: 100,
    maxBefore: null,
    minAfter: 100,
    maxAfter: null,
  } as const;

  it('moves the boundary by the pointer delta', () => {
    const r = resizePair({ ...base, delta: 50 });
    expect(r.pxBefore).toBe(350);
    expect(r.weights).toEqual([350, 650, 500]);
  });

  // WHY: this is the guarantee that dragging between two panes never moves a THIRD pane.
  it('conserves the pair and leaves every other item untouched', () => {
    const r = resizePair({ ...base, delta: -120 });
    expect(r.weights[0] + r.weights[1]).toBe(1000);
    expect(r.weights[2]).toBe(500);
  });

  it('clamps so the item before the handle never leaves its bounds', () => {
    expect(resizePair({ ...base, delta: -1000 }).pxBefore).toBe(100);
    expect(resizePair({ ...base, delta: 50, maxBefore: 320 }).pxBefore).toBe(320);
  });

  it('clamps so the item AFTER the handle never leaves its bounds either', () => {
    expect(resizePair({ ...base, delta: 1000 }).pxBefore).toBe(900);
    expect(resizePair({ ...base, delta: -250, maxAfter: 800 }).pxBefore).toBe(200);
  });

  it('refuses to move rather than violate an unsatisfiable pair of constraints', () => {
    expect(resizePair({ ...base, delta: 10, minBefore: 600, minAfter: 600 }).weights).toEqual(base.weights);
  });

  it('ignores an index with no neighbour, and an empty pair', () => {
    expect(resizePair({ ...base, index: 2, delta: 10 }).weights).toEqual(base.weights);
    expect(resizePair({ ...base, weights: [0, 0], delta: 10 }).weights).toEqual([0, 0]);
  });
});

describe('resetPair', () => {
  const open = { minBefore: 50, maxBefore: null, minAfter: 50, maxAfter: null };

  it('restores two flex items to their declared ratio, conserving the pair', () => {
    const r = resetPair([100, 900, 500], [pct(30), fr(1), fr(1)], 0, open);
    expect(r[0] + r[1]).toBe(1000);
    expect(r[0] / 1000).toBeCloseTo(30 / (30 + 35), 5); // declared 30 vs the fr share
    expect(r[2]).toBe(500);
  });

  it('returns a fixed item to its declared px', () => {
    expect(resetPair([400, 600], [px(280), fr(1)], 0, open)).toEqual([280, 720]);
    expect(resetPair([600, 400], [fr(1), px(280)], 0, open)).toEqual([720, 280]);
  });
});

describe('isUsableWeights', () => {
  // WHY: storage outlives deployments. Stale or hand-edited values must be rejected.
  it('accepts only a right-length array of positive finite numbers', () => {
    expect(isUsableWeights([1, 2, 3], 3)).toBe(true);
    expect(isUsableWeights([1, 2], 3)).toBe(false);
    expect(isUsableWeights([1, 0, 3], 3)).toBe(false);
    expect(isUsableWeights([1, NaN, 3], 3)).toBe(false);
    expect(isUsableWeights('1,2,3', 3)).toBe(false);
    expect(isUsableWeights(null, 3)).toBe(false);
  });
});
