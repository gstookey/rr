import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import {
  buildGridRows,
  buildTimeAxis,
  countElapsed,
  elapsedColumnCount,
  locate,
  sameCoordinate,
  unitPhase,
  worstByHour,
  type CellCoordinate,
  type ComponentElement,
  type DeckState,
  type ElementId,
  type SelectedSample,
  type Unit,
  type UnitGrid,
  type UnitId,
  type UnitListItem,
  type ValidationStatus,
} from '../domain';
import { STATUS_GRID_DATA_SOURCE } from './status-grid.data-source';
import { TimeSource } from './time-source';

/**
 * The Status Grid store — the one place the feature's state lives.
 *
 * Created: 2026-10-01
 *
 * Written to the API both @ngrx/signals 17.2 and 22 share: signalStore · withState ·
 * withComputed · withMethods · withHooks · patchState. (No withProps / withLinkedState /
 * linkedSignal — those are 19+.)
 *
 * State holds only what cannot be derived — the raw data and the operator's choices. Everything
 * the panes draw is a computed over it, so nothing can disagree with anything else.
 *
 * Provided in root, so the app can pick a unit (`selectUnit`) before or while the window is open,
 * and the window's surface reads the same instance. The surface takes NO inputs: a utility window
 * binds a surface's inputs once, at mount, so a selection passed that way would silently go stale
 * the next time the window was re-opened.
 */
export interface StatusGridState {
  readonly units: readonly Unit[];
  readonly selectedUnitId: UnitId | null;
  readonly grid: UnitGrid | null;
  readonly selectedCell: CellCoordinate | null;
  readonly elements: readonly ComponentElement[];
  /** The tab the operator chose. null = no choice: the first tab. Never written by default —
   *  see `activeElement`. */
  readonly activeElementId: ElementId | null;
}

/** The statuses that carry a verdict, and so have element detail behind them. */
const VERDICTS: ReadonlySet<ValidationStatus> = new Set<ValidationStatus>(['VALID', 'PARTIAL', 'INVALID']);

/** Unit list items are equal when every unit is the same object in the same phase. */
function sameItems(a: readonly UnitListItem[], b: readonly UnitListItem[]): boolean {
  return a.length === b.length && a.every((item, i) => item.unit === b[i].unit && item.phase === b[i].phase);
}

const initialState: StatusGridState = {
  units: [],
  selectedUnitId: null,
  grid: null,
  selectedCell: null,
  elements: [],
  activeElementId: null,
};

export const StatusGridStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => {
    const time = inject(TimeSource);

    const axis = computed(() => buildTimeAxis(store.grid()?.timestamps ?? []));
    // The integer boundary: everything time-dependent keys off THIS, not off now().
    const elapsedCount = computed(() => elapsedColumnCount(axis(), time.now()));
    const rows = computed(() => buildGridRows(axis(), store.grid(), elapsedCount()));
    const selectedPosition = computed(() => locate(store.selectedCell(), axis(), rows()));

    const selectedSample = computed((): SelectedSample | null => {
      const position = selectedPosition();
      const coordinate = store.selectedCell();
      if (position === null || coordinate === null) return null;
      const row = rows()[position.row];
      return {
        coordinate,
        componentName: row.component.name,
        epochMs: axis().columns[position.column].epochMs,
        status: row.cells[position.column],
      };
    });

    return {
      axis,
      elapsedCount,
      rows,
      selectedPosition,
      selectedSample,
      counts: computed(() => countElapsed(rows(), elapsedCount())),
      hourWorst: computed(() => worstByHour(axis(), rows(), elapsedCount())),
      selectedUnit: computed(() => store.units().find((u) => u.id === store.selectedUnitId()) ?? null),
      // Reads the clock, so it re-runs every tick — but only EMITS when a unit changes phase, so
      // the list re-renders a few times a day rather than every 30s.
      unitItems: computed(
        (): UnitListItem[] => {
          const now = time.now();
          return store.units().map((unit) => ({ unit, phase: unitPhase(unit, now) }));
        },
        { equal: sameItems },
      ),
      deckState: computed((): DeckState => {
        const sample = selectedSample();
        if (sample === null) return 'idle';
        if (sample.status === 'NO_DATA') return 'future';
        if (sample.status === 'PENDING') return 'pending';
        if (sample.status === 'ERROR') return 'error';
        return store.elements().length === 0 ? 'empty' : 'ready';
      }),
      /** The operator's tab if this sample has it, else the first — derived, so it heals itself
       *  when the element list changes (what linkedSignal would do at 19+). */
      activeElement: computed((): ComponentElement | null => {
        const elements = store.elements();
        return elements.find((e) => e.id === store.activeElementId()) ?? elements[0] ?? null;
      }),
    };
  }),
  withMethods((store) => {
    const source = inject(STATUS_GRID_DATA_SOURCE);

    function selectUnit(unitId: UnitId | null): void {
      if (unitId === store.selectedUnitId()) return;
      patchState(store, {
        selectedUnitId: unitId,
        grid: unitId === null ? null : source.unitGrid(unitId),
        selectedCell: null,
        elements: [],
      });
    }

    return {
      /** Read the unit list, keep the selection if it still exists, else select the first unit. */
      loadUnits(): void {
        const units = source.units();
        patchState(store, { units });
        const kept = units.some((u) => u.id === store.selectedUnitId());
        if (!kept) selectUnit(units[0]?.id ?? null);
      },

      selectUnit,

      /** Select a sample. Re-selecting the same cell is a no-op (no toggle-off: the deck would
       *  be left with nothing to say). Detail is fetched only for a VERDICT — a NO_DATA, PENDING
       *  or ERROR sample has none to fetch. The tab choice carries over when the element exists. */
      selectCell(coordinate: CellCoordinate): void {
        const unitId = store.selectedUnitId();
        if (unitId === null || sameCoordinate(coordinate, store.selectedCell())) return;
        const position = locate(coordinate, store.axis(), store.rows());
        const status = position === null ? 'NO_DATA' : store.rows()[position.row].cells[position.column];
        const elements = VERDICTS.has(status) ? source.sampleDetail(unitId, coordinate) : [];
        patchState(store, { selectedCell: coordinate, elements });
      },

      selectElement(elementId: ElementId): void {
        patchState(store, { activeElementId: elementId });
      },
    };
  }),
  withHooks({
    onInit(store) {
      store.loadUnits();
    },
  }),
);

export type StatusGridStore = InstanceType<typeof StatusGridStore>;
