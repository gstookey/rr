import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { CellCoordinate } from '../domain';
import { STATUS_GRID_DATA_SOURCE, type StatusGridDataSource } from './status-grid.data-source';
import { StatusGridStore } from './status-grid.store';
import { TimeSource } from './time-source';
import { createTurbineFixtures } from './turbine-fixtures';

const NOW = Date.parse('2026-10-01T14:05:00Z');

describe('StatusGridStore', () => {
  let now: ReturnType<typeof signal<number>>;
  let source: StatusGridDataSource;

  function setup(dataSource: StatusGridDataSource = createTurbineFixtures({ now: NOW })) {
    now = signal(NOW);
    source = dataSource;
    TestBed.configureTestingModule({
      providers: [
        { provide: TimeSource, useValue: { now } },
        { provide: STATUS_GRID_DATA_SOURCE, useValue: source },
      ],
    });
    return TestBed.inject(StatusGridStore);
  }

  /** A cell of the selected unit, by component and column. */
  function cell(store: ReturnType<typeof setup>, componentId: string, column: number): CellCoordinate {
    return { componentId, timestamp: store.axis().columns[column].timestamp };
  }

  describe('units', () => {
    it('loads the units on start and selects the first', () => {
      const store = setup();
      expect(store.units()).toHaveLength(14);
      expect(store.selectedUnitId()).toBe('WTG-01');
      expect(store.selectedUnit()?.id).toBe('WTG-01');
      expect(store.rows()).toHaveLength(7);
    });

    it('keeps the selection when the units are reloaded, if the unit still exists', () => {
      const store = setup();
      store.selectUnit('WTG-05');
      store.loadUnits();
      expect(store.selectedUnitId()).toBe('WTG-05');
    });

    it('selects nothing when there are no units', () => {
      const store = setup({ units: () => [], unitGrid: () => null, sampleDetail: () => [] });
      expect(store.selectedUnitId()).toBeNull();
      expect(store.selectedUnit()).toBeNull();
      expect(store.rows()).toEqual([]);
    });

    // WHY: the clock ticks every 30s; the list should only re-render when a unit changes phase.
    it('re-emits the unit items only when a unit changes phase', () => {
      const store = setup();
      const first = store.unitItems();
      now.set(NOW + 30_000);
      expect(store.unitItems()).toBe(first);
      now.set(Date.parse('2026-10-02T07:00:00Z')); // WTG-13 starts at 06:00Z tomorrow
      expect(store.unitItems()).not.toBe(first);
    });

    it('labels each unit with its phase relative to now', () => {
      const store = setup();
      const phase = (id: string) => store.unitItems().find((item) => item.unit.id === id)?.phase;
      expect([phase('WTG-01'), phase('WTG-11'), phase('WTG-13')]).toEqual(['running', 'complete', 'scheduled']);
    });

    it('clears the grid and selection when the unit changes, and ignores re-selecting the same unit', () => {
      const store = setup();
      store.selectCell(cell(store, 'gearbox', 3));
      store.selectUnit('WTG-01');
      expect(store.selectedCell()).not.toBeNull();

      store.selectUnit('WTG-07');
      expect(store.rows()).toHaveLength(20);
      expect(store.selectedCell()).toBeNull();
      expect(store.elements()).toEqual([]);

      store.selectUnit(null);
      expect(store.grid()).toBeNull();
    });
  });

  describe('the grid', () => {
    // WHY: everything time-dependent keys off the elapsed-column INTEGER — it only moves when
    // the boundary crosses a column, however often the clock ticks.
    it('moves the future boundary with the clock', () => {
      const store = setup();
      const before = store.elapsedCount();
      now.set(NOW + 10_000);
      expect(store.elapsedCount()).toBe(before);
      now.set(NOW + 60 * 60_000);
      expect(store.elapsedCount()).toBeGreaterThan(before);
    });

    it('counts elapsed cells and finds each hour’s worst status', () => {
      const store = setup();
      const counts = store.counts();
      expect(counts.NO_DATA).toBe(0);
      expect(counts.VALID).toBeGreaterThan(0);
      expect(store.hourWorst()).toHaveLength(store.axis().hourGroups.length);
      expect(store.hourWorst().at(-1)).toBe('NO_DATA');
    });
  });

  describe('selecting a cell', () => {
    it('loads the sample’s detail and resolves what was selected', () => {
      const store = setup();
      store.selectCell(cell(store, 'gearbox', 0));
      expect(store.elements()).toHaveLength(7);
      expect(store.selectedPosition()).toEqual({ row: 0, column: 0 });
      expect(store.selectedSample()).toMatchObject({ componentName: 'Gearbox', epochMs: Date.parse('2026-10-01T00:00:00Z') });
      expect(store.deckState()).toBe('ready');
    });

    it('does nothing when the same cell is selected again, or no unit is selected', () => {
      const store = setup();
      const spy = jest.spyOn(source, 'sampleDetail');
      store.selectCell(cell(store, 'gearbox', 0));
      store.selectCell(cell(store, 'gearbox', 0));
      expect(spy).toHaveBeenCalledTimes(1);

      store.selectUnit(null);
      store.selectCell({ componentId: 'gearbox', timestamp: '2026-10-01T00:00:00Z' });
      expect(store.selectedCell()).toBeNull();
    });

    it('tells the deck what it can say about the sample', () => {
      const store = setup();
      expect(store.deckState()).toBe('idle');

      store.selectCell(cell(store, 'gearbox', store.axis().columns.length - 1));
      expect(store.deckState()).toBe('future');

      store.selectCell(cell(store, 'gearbox', store.elapsedCount() - 1));
      expect(store.deckState()).toBe('pending');

      store.selectUnit('WTG-04');
      store.selectCell(cell(store, 'converter', 0));
      expect(store.deckState()).toBe('error');
    });

    // WHY: a NO_DATA, PENDING or ERROR sample has no verdict, so there is no detail behind it to
    // fetch — a real backend would answer with an error or nothing.
    it('fetches detail only for a sample with a verdict', () => {
      const store = setup();
      const spy = jest.spyOn(source, 'sampleDetail');
      store.selectCell(cell(store, 'gearbox', store.axis().columns.length - 1)); // NO_DATA
      store.selectCell(cell(store, 'gearbox', store.elapsedCount() - 1)); // PENDING
      store.selectUnit('WTG-04');
      store.selectCell(cell(store, 'converter', 0)); // ERROR
      expect(spy).not.toHaveBeenCalled();
      expect(store.elements()).toEqual([]);
      store.selectCell(cell(store, 'gearbox', 0));
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('lets a selected future sample become due as the clock passes it', () => {
      const store = setup();
      store.selectCell(cell(store, 'gearbox', store.elapsedCount()));
      expect(store.deckState()).toBe('future');
      now.set(NOW + 60 * 60_000);
      expect(store.deckState()).toBe('pending');
    });

    it('says "empty" when a judged sample has no detail to show', () => {
      const fixtures = createTurbineFixtures({ now: NOW });
      const store = setup({ ...fixtures, sampleDetail: () => [] });
      store.selectCell(cell(store, 'gearbox', 0));
      expect(store.deckState()).toBe('empty');
    });

    it('is idle for a coordinate that is not on the grid', () => {
      const store = setup();
      store.selectCell({ componentId: 'not-a-component', timestamp: '2026-10-01T00:00:00Z' });
      expect(store.selectedSample()).toBeNull();
      expect(store.deckState()).toBe('idle');
    });
  });

  describe('the active tab', () => {
    it('is the first element until the operator picks one', () => {
      const store = setup();
      expect(store.activeElement()).toBeNull();
      store.selectCell(cell(store, 'gearbox', 0));
      expect(store.activeElement()?.name).toBe('Oil Temp Probe');
    });

    // WHY: the choice persists while it still means something, and falls back by itself when it
    // does not — nothing ever writes the default into state.
    it('keeps the operator’s choice across samples of the same component, and falls back when it is gone', () => {
      const store = setup();
      store.selectCell(cell(store, 'gearbox', 0));
      store.selectElement('gearbox:bearing-temp');
      store.selectCell(cell(store, 'gearbox', 1));
      expect(store.activeElement()?.name).toBe('Bearing Temp');

      store.selectCell(cell(store, 'generator', 1));
      expect(store.activeElement()?.name).toBe('Oil Temp Probe');
    });
  });
});
