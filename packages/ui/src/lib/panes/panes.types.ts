/**
 * @rr/ui panes — shared types.
 *
 * Created: 2026-09-25
 *
 * ORIENTATION names the axis that COLLAPSES, in logical-property vocabulary:
 *   'inline' → items sit side by side; a pane collapses horizontally to a VERTICAL rail.
 *   'block'  → items stack;             a pane collapses vertically to its HEADER BAR.
 * "horizontal pane" was rejected as a name because it is ambiguous about which thing is
 * horizontal — the pane, the direction it collapses, or the rail it leaves behind.
 */
export type RrPaneOrientation = 'inline' | 'block';

/** Which end of the header bar the collapse toggle sits at. There is deliberately no
 *  'center': a collapse affordance belongs at the edge the pane collapses toward. */
export type RrChevronPosition = 'start' | 'end';

/** What a consumer may write for `basis`: `240` · `'240px'` · `'30%'` · `'1fr'` · `'2fr'`. */
export type RrPaneBasisInput = string | number;

/** A parsed basis. `%` is relative to the space shared by the group's expanded items. */
export interface RrPaneBasis {
  readonly unit: 'px' | '%' | 'fr';
  readonly value: number;
}
