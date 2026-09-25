/**
 * Public API of `@rr/ui` panes.
 *
 * Created: 2026-09-25
 *
 * Everything a consumer needs is exported here and nowhere else — no deep imports. v1's
 * public API exported one array while its own examples deep-imported past it, which breaks
 * the moment a package is built.
 */
import { RrPane } from './pane';
import { RrPaneGroup } from './pane-group';

/** Both components in one go: `imports: [RR_PANES]`. */
export const RR_PANES = [RrPane, RrPaneGroup] as const;

export { RrPane } from './pane';
export { RrPaneGroup } from './pane-group';
export { RrPaneResizeHandle } from './pane-resize-handle';
export {
  RR_PANES_CONFIG,
  RR_PANES_DEFAULTS,
  provideRrPanes,
  type RrPanesConfig,
} from './panes.config';
export {
  RR_PANE_CONTAINER,
  RR_PANE_ITEM,
  type RrPaneContainer,
  type RrPaneItem,
  type RrPanePlacement,
} from './pane-item';
export type {
  RrChevronPosition,
  RrPaneBasis,
  RrPaneBasisInput,
  RrPaneOrientation,
} from './panes.types';
export { parseBasis } from './layout/basis';
export { buildTrackList } from './layout/tracks';
export { initialWeights, normalizeToPx, resetPair, resizePair } from './layout/weights';
export { RrPaneSizeStore } from './pane-size-store';
