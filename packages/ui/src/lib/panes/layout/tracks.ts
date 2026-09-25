import type { RrPaneBasis } from '../panes.types';
import { isFixed } from './weights';

/**
 * Turn items into a `grid-template-*` track list. Pure.
 *
 * Created: 2026-09-25
 *
 * Every item and every gap is its own track — `item gap item gap item` — because a resize
 * handle has to be PLACED in the gap, and a grid item cannot be placed inside the CSS
 * `gap` property.
 *
 * WHY THE SHAPES NEVER CHANGE TYPE. A grid track list only animates when both sides have the
 * same number of tracks AND each corresponding pair is interpolable. Change a track's type —
 * `minmax(px, fr)` to a plain `px` — and it SNAPS, silently, with no error (browser-verified).
 * So a flex item is `minmax(px, fr)` whether collapsed or not, and a fixed item is
 * `minmax(px, px)` whether collapsed or not. Collapse animates for both.
 */
export interface TrackItem {
  readonly basis: RrPaneBasis;
  readonly weight: number;
  readonly collapsed: boolean;
  /** Track size when collapsed, px. */
  readonly collapsedSize: number;
  /** Floor when expanded, px. */
  readonly min: number;
}

const round = (n: number): number => Math.round(n * 1000) / 1000;

export function itemTrack(item: TrackItem): string {
  const fixed = isFixed(item.basis);
  if (item.collapsed) {
    // max below min resolves to the min — i.e. exactly the collapsed size.
    return `minmax(${round(item.collapsedSize)}px, ${fixed ? '0px' : '0fr'})`;
  }
  const weight = round(Math.max(item.weight, 0.001));
  return `minmax(${round(item.min)}px, ${weight}${fixed ? 'px' : 'fr'})`;
}

export function buildTrackList(items: readonly TrackItem[], gapPx: number): string {
  const gap = `${round(Math.max(0, gapPx))}px`;
  return items.map(itemTrack).join(` ${gap} `);
}

/** 1-based grid line of item `i`, and of the gap (handle) after item `i`. */
export const itemLine = (i: number): number => 2 * i + 1;
export const gapLine = (i: number): number => 2 * i + 2;
