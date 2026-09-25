import type { RrPaneBasis } from '../panes.types';

/**
 * Turn items into a `grid-template-*` track list. Pure.
 *
 * Created: 2026-09-25
 *
 * Every item and every gap is its own track: `item gap item gap item`. Gaps are tracks
 * (not the CSS `gap` property) so a resize handle can be PLACED in one — you cannot put a
 * grid item inside a `gap`.
 *
 * WHY EVERY TRACK IS `minmax(<length>, <fr>)`. Grid track lists only animate when both sides
 * have the same number of tracks AND each track pair is interpolable. `44px ↔ 1fr` is NOT —
 * it snaps, silently, with no error. `minmax(26px, 0fr) ↔ minmax(80px, 480fr)` IS: length to
 * length, fr to fr. So collapsed and expanded tracks share one shape, and collapse animates.
 */
export interface TrackItem {
  readonly collapsed: boolean;
  /** Track size when collapsed, px. */
  readonly collapsedSize: number;
  /** Floor when expanded, px. */
  readonly min: number;
  /** Weight once the group has measured; null before that. */
  readonly weight: number | null;
  /** Declared basis — used, as real CSS, until weights exist. */
  readonly basis: RrPaneBasis;
}

const round = (n: number): number => Math.round(n * 1000) / 1000;

export function itemTrack(item: TrackItem): string {
  if (item.collapsed) {
    return `minmax(${round(item.collapsedSize)}px, 0fr)`;
  }
  const min = `${round(item.min)}px`;
  if (item.weight !== null) {
    return `minmax(${min}, ${round(Math.max(item.weight, 0.001))}fr)`;
  }
  // Before the first measurement: render the declared basis as native CSS, so the very
  // first paint (and server rendering) is already correct.
  const { unit, value } = item.basis;
  return `minmax(${min}, ${round(value)}${unit})`;
}

export function buildTrackList(items: readonly TrackItem[], gapPx: number): string {
  const gap = `${round(Math.max(0, gapPx))}px`;
  return items.map(itemTrack).join(` ${gap} `);
}

/** 1-based grid line of item `i` and of the gap (handle) after item `i`. */
export const itemLine = (i: number): number => 2 * i + 1;
export const gapLine = (i: number): number => 2 * i + 2;
