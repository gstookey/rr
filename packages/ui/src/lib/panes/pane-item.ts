import { InjectionToken, type Signal } from '@angular/core';
import type { RrPaneBasis, RrPaneOrientation } from './panes.types';

/**
 * The two contracts that let a group arrange panes AND nested groups without either
 * importing the other.
 *
 * Created: 2026-09-25
 *
 * A group finds its children with `contentChildren(RR_PANE_ITEM)`; both `<rr-pane>` and a
 * nested `<rr-pane-group>` provide themselves under that token. A child finds its parent
 * with `inject(RR_PANE_CONTAINER)`. Tokens, not classes — so there is no import cycle
 * between pane.ts and pane-group.ts, and nesting to any depth needs no new API.
 */
export interface RrPaneItem {
  readonly itemId: Signal<string>;
  /** Parsed `basis`. Named `basisSpec` so it cannot collide with a `basis` input. */
  readonly basisSpec: Signal<RrPaneBasis>;
  readonly minSize: Signal<number>;
  readonly maxSize: Signal<number | null>;
  readonly isCollapsed: Signal<boolean>;
  /** Track size when collapsed. Derived by the pane from the same config value that sizes
   *  its header — so the track and the header can never disagree. */
  readonly collapsedSize: Signal<number>;
  readonly element: HTMLElement;
  /** Panes implement this; a nested group does not (a group cannot collapse). */
  setCollapsed?(collapsed: boolean): void;
}

export const RR_PANE_ITEM = new InjectionToken<RrPaneItem>('RR_PANE_ITEM');

/** Where a container has placed one of its items. */
export interface RrPanePlacement {
  readonly column: string | null;
  readonly row: string | null;
}

export interface RrPaneContainer {
  readonly orientation: Signal<RrPaneOrientation>;
  /** Null when `item` is not one of this container's direct items. Reads container
   *  signals, so calling it inside a `computed` makes placement reactive. */
  placementOf(item: RrPaneItem): RrPanePlacement | null;
}

export const RR_PANE_CONTAINER = new InjectionToken<RrPaneContainer>('RR_PANE_CONTAINER');
