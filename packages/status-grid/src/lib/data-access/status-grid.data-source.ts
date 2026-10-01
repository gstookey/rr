import { InjectionToken, type Provider } from '@angular/core';
import type { CellCoordinate, ComponentElement, Unit, UnitGrid, UnitId } from '../domain';

/**
 * Where the Status Grid's data comes from. SYNCHRONOUS in this release: every call returns its
 * answer immediately (fixtures, a pre-loaded cache, a test double).
 *
 * Created: 2026-10-01
 *
 * The next arc replaces this with a streaming source (WebSockets). The store is written so that
 * swap is contained: it calls the source in exactly three methods and puts what comes back into
 * state with one patch each — nothing downstream knows or cares where the data came from.
 */
export interface StatusGridDataSource {
  /** Every unit the operator may pick, with its rolled-up status. */
  units(): readonly Unit[];
  /** The grid for one unit, or null if the unit is unknown. */
  unitGrid(unitId: UnitId): UnitGrid | null;
  /** The element/attribute detail behind one sample. Empty when there is none to show. */
  sampleDetail(unitId: UnitId, coordinate: CellCoordinate): readonly ComponentElement[];
}

export const STATUS_GRID_DATA_SOURCE = new InjectionToken<StatusGridDataSource>('STATUS_GRID_DATA_SOURCE');

/**
 * Provide the data source — an instance, or a factory that runs in an injection context:
 *
 *   providers: [provideStatusGridData(() => inject(MyStatusApi))]
 */
export function provideStatusGridData(source: StatusGridDataSource | (() => StatusGridDataSource)): Provider {
  return typeof source === 'function'
    ? { provide: STATUS_GRID_DATA_SOURCE, useFactory: source }
    : { provide: STATUS_GRID_DATA_SOURCE, useValue: source };
}
