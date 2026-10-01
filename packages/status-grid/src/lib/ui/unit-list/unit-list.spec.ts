import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { UnitId, UnitListItem, UnitPhase, ValidationStatus } from '../../domain';
import { UnitList } from './unit-list';

function item(
  name: string,
  status: ValidationStatus,
  phase: UnitPhase,
  startedAt: string,
  stoppedAt: string | null = null,
): UnitListItem {
  return { unit: { id: `id-${name}`, name, status, startedAt, stoppedAt }, phase };
}

const ITEMS: readonly UnitListItem[] = [
  item('WTG-04', 'INVALID', 'complete', '2026-10-01T00:00:00Z', '2026-10-01T23:55:00Z'),
  item('WTG-07', 'VALID', 'running', '2026-10-01T06:00:00Z'),
  item('WTG-12', 'NO_DATA', 'scheduled', '2026-10-01T18:00:00Z'),
  item('Mast-3', 'PARTIAL', 'complete', '2026-09-30T22:00:00Z', '2026-10-01T04:00:00Z'),
];

describe('UnitList', () => {
  let fixture: ComponentFixture<UnitList>;
  let host: HTMLElement;
  let emitted: UnitId[];

  function render(items: readonly UnitListItem[] = ITEMS, selectedId: UnitId | null = null): void {
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('selectedId', selectedId);
    fixture.detectChanges();
  }

  const field = (): HTMLInputElement => host.querySelector('input[type=search]') as HTMLInputElement;
  const listbox = (): HTMLElement => host.querySelector('[role=listbox]') as HTMLElement;
  const options = (): HTMLElement[] => Array.from(host.querySelectorAll<HTMLElement>('[role=option]'));
  const count = (): string => (host.querySelector('[aria-live=polite]') as HTMLElement).textContent as string;
  const names = (): string[] => options().map((o) => (o.querySelector('.option__name') as HTMLElement).textContent as string);
  const activeName = (): string | null => {
    const id = listbox().getAttribute('aria-activedescendant');
    return id === null ? null : (host.querySelector(`#${id}`) as HTMLElement).getAttribute('aria-label');
  };

  function type(text: string): void {
    field().value = text;
    field().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function press(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, cancelable: true, ...init });
    listbox().dispatchEvent(event);
    fixture.detectChanges();
    return event;
  }

  function focusList(): void {
    listbox().focus();
    fixture.detectChanges();
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(UnitList);
    host = fixture.nativeElement;
    emitted = [];
    fixture.componentInstance.unitSelect.subscribe((id) => emitted.push(id));
  });

  describe('rows', () => {
    it('draws one option per unit, in the order given, with its dot, name and window', () => {
      render();
      expect(names()).toEqual(['WTG-04', 'WTG-07', 'WTG-12', 'Mast-3']);
      const [closed, running, scheduled, overnight] = options();
      expect(closed.querySelector('rr-sg-status-dot')?.getAttribute('data-status')).toBe('INVALID');
      expect(closed.querySelector('.option__window')?.textContent).toBe('00:00–23:55Z');
      expect(running.querySelector('.option__window')?.textContent).toBe('06:00Z · running');
      expect(running.querySelector('.option__running')?.textContent).toBe('running');
      expect(closed.querySelector('.option__running')).toBeNull();
      expect(scheduled.querySelector('.option__window')?.textContent).toBe('scheduled 18:00Z');
      expect(overnight.querySelector('.option__window')?.textContent).toBe('22:00–04:00Z +1d');
    });

    it('names each option for a screen reader and marks the selected one', () => {
      render(ITEMS, 'id-WTG-07');
      expect(options()[0].getAttribute('aria-label')).toBe('WTG-04, Invalid, 00:00 to 23:55 Zulu');
      expect(options().map((o) => o.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false', 'false']);
      expect(options()[1].classList).toContain('option--selected');
      expect(new Set(options().map((o) => o.id)).size).toBe(4);
    });

    it('counts the units', () => {
      render();
      expect(count()).toBe('4 units');
      render(ITEMS.slice(0, 1));
      expect(count()).toBe('1 unit');
    });

    it('says so when there are no units at all', () => {
      render([]);
      expect(listbox()).toBeNull();
      expect(host.querySelector('[role=status]')?.textContent).toContain('No units to show.');
      expect(host.querySelector('button')).toBeNull();
      expect(count()).toBe('0 units');
    });
  });

  describe('filter', () => {
    it('keeps the units whose name contains the text, ignoring case, and counts them against the total', () => {
      render();
      type('wtg-0');
      expect(names()).toEqual(['WTG-04', 'WTG-07']);
      expect(count()).toBe('2 of 4');
      expect(field().getAttribute('aria-controls')).toBe(listbox().id);
    });

    it('draws the matched run of each name as a mark', () => {
      render();
      type('ST');
      const [mast] = options();
      expect(mast.querySelector('mark')?.textContent).toBe('st');
      expect(mast.querySelector('.option__name')?.textContent).toBe('Mast-3');
      type('');
      expect(host.querySelector('mark')).toBeNull();
    });

    it('treats a filter of only spaces as no filter', () => {
      render();
      type('   ');
      expect(options()).toHaveLength(4);
      expect(count()).toBe('4 units');
    });

    it('says when nothing matches, outside the listbox, and Clear filter brings the list back to the field', () => {
      render();
      type(' xyz ');
      expect(listbox()).toBeNull();
      expect(field().hasAttribute('aria-controls')).toBe(false);
      expect(host.querySelector('[role=status]')?.textContent).toContain("No units match 'xyz'");
      expect(count()).toBe('0 of 4');

      (host.querySelector('button') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(field().value).toBe('');
      expect(document.activeElement).toBe(field());
      expect(options()).toHaveLength(4);
    });
  });

  describe('keyboard', () => {
    it('enters the list on the selected unit', () => {
      render(ITEMS, 'id-WTG-12');
      focusList();
      expect(activeName()).toMatch(/^WTG-12,/);
      expect(emitted).toEqual([]);
    });

    it('enters the list on the first unit when the selected one is filtered out', () => {
      render(ITEMS, 'id-WTG-04');
      type('7');
      focusList();
      expect(activeName()).toMatch(/^WTG-07,/);
    });

    it('moves the active option with the arrows, Home and End — selecting nothing — and scrolls it into view', () => {
      render();
      const scrolled = jest.fn();
      options().forEach((option) => (option.scrollIntoView = scrolled));
      focusList();
      expect(activeName()).toMatch(/^WTG-04,/);

      expect(press('ArrowUp').defaultPrevented).toBe(true);
      expect(activeName()).toMatch(/^WTG-04,/); // clamped at the top
      press('ArrowDown');
      expect(activeName()).toMatch(/^WTG-07,/);
      press('End');
      expect(activeName()).toMatch(/^Mast-3,/);
      press('ArrowDown');
      expect(activeName()).toMatch(/^Mast-3,/); // clamped at the bottom
      press('Home');
      expect(activeName()).toMatch(/^WTG-04,/);

      expect(emitted).toEqual([]);
      expect(scrolled).toHaveBeenLastCalledWith({ block: 'nearest' });
      expect(host.querySelector('.option--active')?.getAttribute('aria-label')).toMatch(/^WTG-04,/);
    });

    it('selects the active option with Enter or Space', () => {
      render(ITEMS, 'id-WTG-04');
      focusList();
      press('ArrowDown');
      expect(press('Enter').defaultPrevented).toBe(true);
      expect(emitted).toEqual(['id-WTG-07']);
      press('ArrowDown');
      expect(press(' ').defaultPrevented).toBe(true);
      expect(emitted).toEqual(['id-WTG-07', 'id-WTG-12']);
    });

    it('does not re-select the unit that is already selected', () => {
      render(ITEMS, 'id-WTG-04');
      focusList();
      press('Enter');
      expect(emitted).toEqual([]);
    });

    it('leaves other keys, and modified keys, to the browser', () => {
      render();
      focusList();
      expect(press('a').defaultPrevented).toBe(false);
      expect(press('ArrowDown', { altKey: true }).defaultPrevented).toBe(false);
      expect(press('End', { ctrlKey: true }).defaultPrevented).toBe(false);
      expect(press('ArrowDown', { metaKey: true }).defaultPrevented).toBe(false);
      expect(activeName()).toMatch(/^WTG-04,/);
    });

    it('drops the active option while the filter hides it, and has it back when the filter clears', () => {
      render();
      focusList();
      press('End');
      type('wtg');
      expect(listbox().hasAttribute('aria-activedescendant')).toBe(false);
      type('');
      expect(activeName()).toMatch(/^Mast-3,/);
    });

    it('with no active option, Enter does nothing and an arrow starts at the first unit', () => {
      render();
      focusList();
      press('End');
      render(ITEMS.slice(0, 2)); // the active unit leaves while the list has focus
      expect(press('Enter').defaultPrevented).toBe(false);
      expect(emitted).toEqual([]);
      press('ArrowUp');
      expect(activeName()).toMatch(/^WTG-04,/);
    });

    it('keeps the active option when the list is focused again', () => {
      render();
      focusList();
      press('ArrowDown');
      listbox().blur();
      focusList();
      expect(activeName()).toMatch(/^WTG-07,/);
    });
  });

  describe('pointer', () => {
    it('selects a clicked unit and puts the keyboard on it', () => {
      render(ITEMS, 'id-WTG-04');
      options()[2].click();
      fixture.detectChanges();
      expect(emitted).toEqual(['id-WTG-12']);
      expect(activeName()).toMatch(/^WTG-12,/);
    });

    it('does nothing more when the selected unit is clicked again — no toggle-off', () => {
      render(ITEMS, 'id-WTG-04');
      options()[0].click();
      expect(emitted).toEqual([]);
    });
  });
});
