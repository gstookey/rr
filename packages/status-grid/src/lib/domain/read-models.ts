import type { CellCoordinate, Unit, UnitPhase } from './models';
import type { ValidationStatus } from './status';

/**
 * Read models — the shapes the store computes and the panes draw. They live in the domain so both
 * the store (data-access) and the components (ui) can name them without either importing the other.
 *
 * Created: 2026-10-01
 */

/** A unit as the list shows it. */
export interface UnitListItem {
  readonly unit: Unit;
  readonly phase: UnitPhase;
}

/** The selected sample, resolved against the grid. */
export interface SelectedSample {
  readonly coordinate: CellCoordinate;
  readonly componentName: string;
  readonly epochMs: number;
  readonly status: ValidationStatus;
}

/** What the deck can say about the selected sample:
 *  idle (nothing selected) · future (NO_DATA) · pending · error · empty (judged, no detail) · ready. */
export type DeckState = 'idle' | 'future' | 'pending' | 'error' | 'empty' | 'ready';

/** Where a cell sits in the drawn grid. */
export interface GridPosition {
  readonly row: number;
  readonly column: number;
}
