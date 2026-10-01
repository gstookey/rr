import type { CellCoordinate, ComponentId, UnitComponent, UnitGrid } from './models';
import type { GridPosition } from './read-models';
import { COUNTED_STATUSES, emptyCounts, worstOf, type StatusCounts, type ValidationStatus } from './status';
import type { TimeAxis } from './time-axis';

/**
 * From a unit's raw samples to what the grid draws. Pure — no Angular, no clock.
 *
 * Created: 2026-10-01
 */

export interface GridRow {
  readonly component: UnitComponent;
  /** One status per axis column, in column order. */
  readonly cells: readonly ValidationStatus[];
  /** Worst status among the row's ELAPSED cells. */
  readonly rollup: ValidationStatus;
}

/**
 * Decide every cell. This is the ONLY place a status is decided. In order:
 *   1. a real sample always wins — DATA BEATS THE CLOCK: a unit reporting slightly ahead of this
 *      app's clock must still show its genuine results, not hyphens;
 *   2. an elapsed cell of a component whose retrieval failed → ERROR;
 *   3. a cell in the future → NO_DATA (a failed fetch does not make future samples exist);
 *   4. otherwise → PENDING (due, not arrived).
 */
export function buildGridRows(axis: TimeAxis, grid: UnitGrid | null, elapsedCount: number): GridRow[] {
  if (grid === null) return [];
  const failed = new Set<ComponentId>(grid.failedComponentIds);
  const byKey = new Map<string, ValidationStatus>();
  for (const sample of grid.samples) byKey.set(`${sample.componentId}|${sample.timestamp}`, sample.status);

  return grid.components.map((component) => {
    const cells = axis.columns.map((column): ValidationStatus => {
      const sampled = byKey.get(`${component.id}|${column.timestamp}`);
      if (sampled !== undefined) return sampled;
      if (column.index >= elapsedCount) return 'NO_DATA';
      return failed.has(component.id) ? 'ERROR' : 'PENDING';
    });
    return { component, cells, rollup: worstOf(cells.slice(0, elapsedCount)) };
  });
}

/** Counts over ELAPSED cells only: a half-finished day is not half-failing. NO_DATA is never counted. */
export function countElapsed(rows: readonly GridRow[], elapsedCount: number): StatusCounts {
  const counts = emptyCounts();
  for (const row of rows) {
    for (let i = 0; i < elapsedCount && i < row.cells.length; i++) counts[row.cells[i]]++;
  }
  counts.NO_DATA = 0;
  return counts;
}

/** Total of the counted (verdict-bearing) statuses. */
export function countedTotal(counts: StatusCounts): number {
  return COUNTED_STATUSES.reduce((sum, status) => sum + counts[status], 0);
}

/** The worst elapsed status in each hour group — what the DayRibbon draws. */
export function worstByHour(axis: TimeAxis, rows: readonly GridRow[], elapsedCount: number): ValidationStatus[] {
  return axis.hourGroups.map((group) => {
    const statuses: ValidationStatus[] = [];
    const end = Math.min(group.startIndex + group.span, elapsedCount);
    for (const row of rows) {
      for (let i = group.startIndex; i < end; i++) statuses.push(row.cells[i]);
    }
    return worstOf(statuses);
  });
}

/** A cell's place in the drawn grid, or null if the coordinate is not on it. */
export function locate(
  coordinate: CellCoordinate | null,
  axis: TimeAxis,
  rows: readonly GridRow[],
): GridPosition | null {
  if (coordinate === null) return null;
  const column = axis.indexByTimestamp.get(coordinate.timestamp);
  const row = rows.findIndex((r) => r.component.id === coordinate.componentId);
  return column === undefined || row < 0 ? null : { row, column };
}
