import { ApplicationRef, PLATFORM_ID } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import {
  buildGridRows,
  buildTimeAxis,
  countElapsed,
  worstByHour,
  type CellCoordinate,
  type GridPosition,
  type Unit,
  type UnitGrid,
  type ValidationStatus,
} from '../../domain';
import { SG_TOOLTIP_DELAY_MS, StatusGrid } from './status-grid';

/*
 * Six columns over two hours; two components, one of whose retrieval failed. With four columns
 * elapsed the grid reads:
 *
 *              00:00   00:15    00:30    00:45    01:00    01:15
 *   Gearbox    VALID   INVALID  PARTIAL  PENDING  NO_DATA  NO_DATA
 *   Converter  ERROR   ERROR    ERROR    ERROR    NO_DATA  NO_DATA
 */
const at = (hhmm: string) => `2026-10-01T${hhmm}:00Z`;
const TIMES = ['00:00', '00:15', '00:30', '00:45', '01:00', '01:15'].map(at);
const GRID: UnitGrid = {
  unitId: 'WTG-01',
  components: [
    { id: 'gearbox', name: 'Gearbox' },
    { id: 'converter', name: 'Converter' },
  ],
  timestamps: TIMES,
  samples: [
    { componentId: 'gearbox', timestamp: TIMES[0], status: 'VALID' },
    { componentId: 'gearbox', timestamp: TIMES[1], status: 'INVALID' },
    { componentId: 'gearbox', timestamp: TIMES[2], status: 'PARTIAL' },
  ],
  failedComponentIds: ['converter'],
};
const UNIT: Unit = { id: 'WTG-01', name: 'WTG-01', status: 'INVALID', startedAt: at('00:00'), stoppedAt: null };
const AXIS = buildTimeAxis(TIMES);

interface Inputs {
  unit?: Unit | null;
  elapsedCount?: number;
  rows?: 'none';
  hourWorst?: readonly ValidationStatus[];
  selected?: GridPosition | null;
}

describe('StatusGrid', () => {
  let fixture: ComponentFixture<StatusGrid>;
  let el: HTMLElement;
  let emitted: CellCoordinate[];

  function render(inputs: Inputs = {}): void {
    const elapsed = inputs.elapsedCount ?? 4;
    const rows = inputs.rows === 'none' ? [] : buildGridRows(AXIS, GRID, elapsed);
    fixture = TestBed.createComponent(StatusGrid);
    fixture.componentRef.setInput('unit', inputs.unit === undefined ? UNIT : inputs.unit);
    fixture.componentRef.setInput('axis', AXIS);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('elapsedCount', elapsed);
    fixture.componentRef.setInput('counts', countElapsed(rows, elapsed));
    fixture.componentRef.setInput('hourWorst', inputs.hourWorst ?? worstByHour(AXIS, rows, elapsed));
    fixture.componentRef.setInput('selected', inputs.selected ?? null);
    fixture.componentRef.setInput('nowMs', Date.parse(at('00:50')));
    emitted = [];
    fixture.componentInstance.cellSelect.subscribe((c) => emitted.push(c));
    update();
    el = fixture.nativeElement;
  }

  /** Change detection plus the after-render hooks. */
  function update(): void {
    fixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();
  }

  const q = <T extends HTMLElement = HTMLElement>(selector: string) => el.querySelector<T>(selector);
  const grid = () => q('.grid')!;
  const cell = (r: number, c: number) => q(`.cell[data-r="${r}"][data-c="${c}"]`)!;
  const coordinate = (componentId: string, column: number): CellCoordinate => ({ componentId, timestamp: TIMES[column] });

  function key(name: string): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true });
    grid().dispatchEvent(event);
    update();
    return event;
  }

  function pointerOver(target: Element): void {
    target.dispatchEvent(new Event('pointerover', { bubbles: true }));
    update();
  }

  /**
   * Holds the tooltip's timers and runs them by hand, so the spec behaves the same under real or
   * fake timers (an app may enable fake timers globally). Only the tooltip's own delay is held;
   * every other timer goes through untouched.
   */
  function holdTooltipTimers() {
    const held = new Map<unknown, () => void>();
    let started = 0;
    const realSetTimeout = globalThis.setTimeout;
    const realClearTimeout = globalThis.clearTimeout;
    jest.spyOn(globalThis, 'setTimeout').mockImplementation(((callback: () => void, ms?: number) => {
      if (ms !== SG_TOOLTIP_DELAY_MS) return realSetTimeout(callback, ms);
      // A negative id: never a real timer's, and harmless if the real clearTimeout sees it after
      // the spies are restored (the fixture is torn down after this file's afterEach).
      const id = -++started;
      held.set(id, callback);
      return id;
    }) as unknown as typeof setTimeout);
    jest.spyOn(globalThis, 'clearTimeout').mockImplementation(((id: unknown) => {
      if (!held.delete(id)) realClearTimeout(id as Parameters<typeof clearTimeout>[0]);
    }) as typeof clearTimeout);
    return {
      pending: () => held.size,
      started: () => started,
      fire: () => {
        const callbacks = [...held.values()];
        held.clear();
        callbacks.forEach((callback) => callback());
        update();
      },
    };
  }

  describe('header', () => {
    it('names the unit, its open window, now, and the elapsed counts', () => {
      render();
      expect(q('.meta__name')!.textContent).toBe('WTG-01');
      expect(q('.meta__window')!.textContent).toBe('10-01 00:00Z → running');
      expect(q('.meta__now')!.textContent).toBe('now 00:50Z');
      const counts = [...el.querySelectorAll('.meta__count')].map(
        (li) => `${li.querySelector('.meta__count-label')!.textContent} ${li.querySelector('.meta__count-value')!.textContent}`,
      );
      expect(counts).toEqual(['Valid 1', 'Partial 1', 'Invalid 1', 'Error 4', 'Pending 1']);
    });

    it('shows a closed window with both ends', () => {
      render({ unit: { ...UNIT, stoppedAt: at('23:55') } });
      expect(q('.meta__window')!.textContent).toBe('10-01 00:00Z → 10-01 23:55Z');
    });

    it('says so when no unit is selected', () => {
      render({ unit: null, rows: 'none' });
      expect(q('.meta__name')!.textContent).toBe('No unit selected');
      expect(q('.meta__window')!.textContent).toBe('');
      expect(q('.empty')!.textContent).toBe('Select a unit to see its status grid.');
      expect(q('.grid')).toBeNull();
    });

    it('explains a unit with no components', () => {
      render({ rows: 'none' });
      expect(q('.empty')!.textContent).toBe('This unit has no components to show.');
    });

    it('shows the retrieval banner only while elapsed samples are ERROR', () => {
      render();
      expect(q('.banner')!.textContent).toContain('Retrieval failed for 4 samples');
      render({ elapsedCount: 0 });
      expect(q('.banner')).toBeNull();
    });
  });

  describe('cells', () => {
    it('draws one cell per component and column, decided by the projection', () => {
      render();
      expect(el.querySelectorAll('.cell')).toHaveLength(12);
      expect([0, 1, 2, 3, 4].map((c) => cell(0, c).dataset['status'])).toEqual(['VALID', 'INVALID', 'PARTIAL', 'PENDING', 'NO_DATA']);
      expect(cell(1, 0).dataset['status']).toBe('ERROR');
      expect(cell(0, 1).getAttribute('aria-label')).toBe('Gearbox, 00:15Z, Invalid');
      expect(grid().getAttribute('aria-rowcount')).toBe('2');
      expect(grid().getAttribute('aria-colcount')).toBe('6');
    });

    it('rings and marks the selected cell', () => {
      render({ selected: { row: 1, column: 2 } });
      expect(cell(1, 2).getAttribute('aria-selected')).toBe('true');
      expect(el.querySelectorAll('[aria-selected="true"]')).toHaveLength(1);
      expect(q('.ring')!.style.gridArea).toBe('4 / 4 / span 1 / span 1');
    });

    it('places the now-marker at the first future column, only when now is inside the axis', () => {
      render();
      expect(q('.now')!.style.gridColumn).toBe('6');
      render({ elapsedCount: 0 });
      expect(q('.now')).toBeNull();
      render({ elapsedCount: 6 });
      expect(q('.now')).toBeNull();
    });

    it('draws one rule per hour, brighter on the six-hour anchors', () => {
      render();
      const rules = [...el.querySelectorAll<HTMLElement>('.hour-rule')];
      expect(rules.map((r) => [r.style.gridColumn, r.classList.contains('hour-rule--anchor')])).toEqual([
        ['2', true],
        ['6', false],
      ]);
    });
  });

  describe('day ribbon', () => {
    it("colours each hour by its worst elapsed status, and falls back to NO_DATA past the data", () => {
      render({ hourWorst: ['INVALID'] });
      const hours = [...el.querySelectorAll<HTMLElement>('.ribbon__hour')];
      expect(hours.map((h) => h.dataset['status'])).toEqual(['INVALID', 'NO_DATA']);
      expect(hours.map((h) => h.style.flexGrow)).toEqual(['4', '2']);
      expect(hours[1].getAttribute('aria-label')).toBe('01:00, No data yet');
    });

    it('scrolls the grid to an hour when it is chosen', () => {
      render();
      const scrollTo = jest.fn();
      grid().scrollTo = scrollTo;
      el.querySelectorAll<HTMLElement>('.ribbon__hour')[1].click();
      expect(scrollTo).toHaveBeenCalledWith({ left: 4 * 19, behavior: 'smooth' });
    });

    it('does nothing when there is no grid to scroll', () => {
      render({ rows: 'none' });
      expect(() => q('.ribbon__hour')!.click()).not.toThrow();
    });

    it('brackets the share of the day the grid is scrolled to', () => {
      render();
      const scroller = grid();
      // 6 columns × 19px = 114px of cells; a 197px viewport shows the 140px gutter + 57px = half.
      Object.defineProperty(scroller, 'clientWidth', { configurable: true, value: 197 });
      scroller.scrollLeft = 57;
      scroller.dispatchEvent(new Event('scroll'));
      update();
      const bracket = q('.ribbon__bracket')!;
      expect([bracket.style.left, bracket.style.width]).toEqual(['50%', '50%']);
    });
  });

  describe('pointer', () => {
    let tooltipTimers: ReturnType<typeof holdTooltipTimers>;
    beforeEach(() => (tooltipTimers = holdTooltipTimers()));
    afterEach(() => jest.restoreAllMocks());

    it('selects the clicked cell', () => {
      render();
      cell(0, 2).click();
      expect(emitted).toEqual([coordinate('gearbox', 2)]);
    });

    it('ignores clicks that miss the cells', () => {
      render();
      q('.label')!.click();
      expect(emitted).toEqual([]);
    });

    it('tints the hovered cell, then shows its tooltip after the delay', () => {
      render();
      pointerOver(cell(0, 1));
      expect(q('.hover')!.style.gridArea).toBe('3 / 3 / span 1 / span 1');
      expect(q('.tooltip')).toBeNull();
      tooltipTimers.fire();
      expect(q('.tooltip')!.textContent).toBe('Gearbox · 00:15Z · Invalid');
    });

    it('puts the tooltip below a cell near the top, and above one further down', () => {
      render();
      pointerOver(cell(0, 0));
      tooltipTimers.fire();
      expect(q('.tooltip')!.classList).toContain('tooltip--below');

      const lower = cell(1, 0);
      lower.getBoundingClientRect = () => ({ top: 200, bottom: 218, left: 160, width: 18 }) as DOMRect;
      pointerOver(lower);
      tooltipTimers.fire();
      const tip = q('.tooltip')!;
      expect(tip.classList).not.toContain('tooltip--below');
      expect([tip.style.left, tip.style.top]).toEqual(['169px', '196px']);
    });

    it('does not restart the delay while the pointer stays on one cell', () => {
      render();
      pointerOver(cell(0, 0));
      pointerOver(cell(0, 0));
      expect(tooltipTimers.started()).toBe(1);
      expect(tooltipTimers.pending()).toBe(1);
    });

    it('clears the hover and the pending tooltip when the pointer moves off the cells or leaves', () => {
      render();
      pointerOver(cell(0, 0));
      pointerOver(q('.label')!);
      expect(q('.hover')).toBeNull();
      expect(tooltipTimers.pending()).toBe(0);

      pointerOver(cell(0, 0));
      grid().dispatchEvent(new Event('pointerleave'));
      update();
      expect(q('.hover')).toBeNull();
      expect(tooltipTimers.pending()).toBe(0);
    });

    it('hides the tooltip on scroll', () => {
      render();
      pointerOver(cell(0, 0));
      tooltipTimers.fire();
      grid().dispatchEvent(new Event('scroll'));
      update();
      expect(q('.tooltip')).toBeNull();
    });

    it('drops a pending tooltip when destroyed', () => {
      render();
      pointerOver(cell(0, 0));
      fixture.destroy();
      expect(tooltipTimers.pending()).toBe(0);
    });
  });

  describe('keyboard', () => {
    const activeId = () => grid().getAttribute('aria-activedescendant');
    const active = () => el.querySelector(`#${activeId()}`) as HTMLElement;
    const position = () => [Number(active().dataset['r']), Number(active().dataset['c'])];

    it('ignores keys until the grid has an active cell', () => {
      render();
      const event = key('Enter');
      expect(event.defaultPrevented).toBe(false);
      expect(emitted).toEqual([]);
      expect(activeId()).toBeNull();
    });

    it('starts on the latest elapsed cell of the first row', () => {
      render();
      grid().dispatchEvent(new Event('focus'));
      update();
      expect(position()).toEqual([0, 3]);
      expect(q('.focus-ring')!.style.gridArea).toBe('3 / 5 / span 1 / span 1');
    });

    it('starts on the selected cell when there is one', () => {
      render({ selected: { row: 1, column: 1 } });
      grid().dispatchEvent(new Event('focus'));
      update();
      expect(position()).toEqual([1, 1]);
    });

    it('starts on the first column when nothing has elapsed', () => {
      render({ elapsedCount: 0 });
      grid().dispatchEvent(new Event('focus'));
      update();
      expect(position()).toEqual([0, 0]);
    });

    it('keeps its place when focus returns', () => {
      render();
      cell(1, 4).click();
      grid().dispatchEvent(new Event('focus'));
      update();
      expect(position()).toEqual([1, 4]);
    });

    it('moves with the arrows, Home/End and PageUp/PageDown, clamped to the grid', () => {
      render();
      grid().dispatchEvent(new Event('focus'));
      const moves: [string, number[]][] = [
        ['ArrowRight', [0, 4]],
        ['ArrowRight', [0, 5]],
        ['ArrowRight', [0, 5]],
        ['ArrowDown', [1, 5]],
        ['ArrowDown', [1, 5]],
        ['ArrowLeft', [1, 4]],
        ['ArrowUp', [0, 4]],
        ['ArrowUp', [0, 4]],
        ['Home', [0, 0]],
        ['ArrowLeft', [0, 0]],
        ['End', [0, 5]],
        ['PageUp', [0, 0]],
        ['PageDown', [0, 5]],
      ];
      for (const [name, expected] of moves) {
        expect(key(name).defaultPrevented).toBe(true);
        expect([name, position()]).toEqual([name, expected]);
      }
      expect(emitted).toEqual([]);
    });

    it('scrolls the active cell into view where the browser supports it', () => {
      render();
      grid().dispatchEvent(new Event('focus'));
      const scrollIntoView = jest.fn();
      cell(0, 4).scrollIntoView = scrollIntoView;
      key('ArrowRight');
      expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
    });

    it('selects the active cell with Enter or Space', () => {
      render();
      grid().dispatchEvent(new Event('focus'));
      expect(key('Enter').defaultPrevented).toBe(true);
      key('ArrowDown');
      expect(key(' ').defaultPrevented).toBe(true);
      expect(emitted).toEqual([coordinate('gearbox', 3), coordinate('converter', 3)]);
    });

    it('leaves other keys to the browser', () => {
      render();
      grid().dispatchEvent(new Event('focus'));
      expect(key('Tab').defaultPrevented).toBe(false);
      expect(position()).toEqual([0, 3]);
    });
  });

  describe('a different unit', () => {
    afterEach(() => jest.restoreAllMocks());

    it('drops the keyboard, hover and tooltip positions of the last one', () => {
      const tooltipTimers = holdTooltipTimers();
      render();
      grid().dispatchEvent(new Event('focus'));
      pointerOver(cell(1, 1));
      fixture.componentRef.setInput('unit', { ...UNIT, id: 'WTG-02', name: 'WTG-02' });
      update();
      expect(tooltipTimers.pending()).toBe(0);
      expect(grid().getAttribute('aria-activedescendant')).toBeNull();
      expect(q('.hover')).toBeNull();
    });

    it('keeps them when other inputs change', () => {
      render();
      grid().dispatchEvent(new Event('focus'));
      fixture.componentRef.setInput('nowMs', Date.parse(at('00:51')));
      update();
      expect(grid().getAttribute('aria-activedescendant')).not.toBeNull();
    });
  });

  describe('resize observation', () => {
    const original = globalThis.ResizeObserver;
    let instances: { callback: () => void; observe: ReturnType<typeof jest.fn>; disconnect: ReturnType<typeof jest.fn> }[];

    beforeEach(() => {
      instances = [];
      globalThis.ResizeObserver = class {
        observe = jest.fn();
        disconnect = jest.fn();
        constructor(public callback: () => void) {
          instances.push(this);
        }
      } as unknown as typeof ResizeObserver;
    });
    afterEach(() => {
      globalThis.ResizeObserver = original;
    });

    it('observes the host, re-measures on resize, and disconnects on destroy', () => {
      render();
      expect(instances).toHaveLength(1);
      expect(instances[0].observe).toHaveBeenCalledWith(el);
      Object.defineProperty(grid(), 'clientWidth', { configurable: true, value: 254 });
      instances[0].callback();
      update();
      expect(q('.ribbon__bracket')!.style.width).toBe('100%');
      fixture.destroy();
      expect(instances[0].disconnect).toHaveBeenCalled();
    });

    it('does not observe on the server', () => {
      TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
      render();
      expect(instances).toHaveLength(0);
    });
  });

  it('runs without ResizeObserver', () => {
    const original = globalThis.ResizeObserver;
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = undefined;
    render();
    expect(() => fixture.destroy()).not.toThrow();
    globalThis.ResizeObserver = original;
  });
});
