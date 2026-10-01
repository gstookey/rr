import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { ComponentElement, DeckState, ElementAttribute, ElementId, SelectedSample } from '../../domain';
import { DetailsDeck } from './details-deck';

const SAMPLE: SelectedSample = {
  coordinate: { componentId: 'gearbox', timestamp: '2026-10-01T04:15:00Z' },
  componentName: 'Gearbox',
  epochMs: Date.parse('2026-10-01T04:15:00Z'),
  status: 'PARTIAL',
};

function attribute(id: string, match: ElementAttribute['match'] = 'MATCH'): ElementAttribute {
  return { id, name: id, expected: '1', actual: match === 'MISSING' ? null : '1', match };
}

const ELEMENTS: readonly ComponentElement[] = [
  { id: 'oil', name: 'Oil Temp Probe', status: 'VALID', attributes: [attribute('Units'), attribute('Range')] },
  {
    id: 'vib-a',
    name: 'Vibration Sensor A',
    status: 'PARTIAL',
    attributes: [attribute('Units'), attribute('Calibration Offset', 'MISMATCH'), attribute('Scaling Factor', 'MISSING')],
  },
  { id: 'shaft', name: 'Shaft Speed', status: 'VALID', attributes: [attribute('Units')] },
];

describe('DetailsDeck', () => {
  let fixture: ComponentFixture<DetailsDeck>;
  let host: HTMLElement;
  let emitted: ElementId[];

  function render(inputs: {
    state?: DeckState;
    sample?: SelectedSample | null;
    elements?: readonly ComponentElement[];
    activeElement?: ComponentElement | null;
  }) {
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
  }

  const ready = (activeElement: ComponentElement | null = ELEMENTS[0]) =>
    render({ state: 'ready', sample: SAMPLE, elements: ELEMENTS, activeElement });
  const message = () => host.querySelector('[role="status"]');
  const tabs = () => Array.from(host.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panel = () => host.querySelector('[role="tabpanel"]');
  const cardNames = () => Array.from(host.querySelectorAll('rr-sg-attribute-card .name')).map((n) => n.textContent);

  function press(tab: HTMLElement, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
    tab.dispatchEvent(event);
    return event;
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailsDeck);
    host = fixture.nativeElement;
    emitted = [];
    fixture.componentInstance.elementSelect.subscribe((id) => emitted.push(id));
  });

  describe('states other than ready', () => {
    it('starts idle, asking for a cell, with the keyboard hint', () => {
      fixture.detectChanges();
      expect(message()?.querySelector('.message__title')?.textContent).toBe('Select a cell in the grid');
      expect(message()?.querySelector('.message__hint')?.textContent).toBe('Arrow keys move through the grid · Enter selects');
      expect(host.querySelector('[role="tablist"]')).toBeNull();
    });

    it.each([
      ['future', 'Not sampled yet — 04:15Z is in the future'],
      ['pending', 'Awaiting validation'],
      ['error', 'Retrieval failed — no verdict for this sample'],
      ['empty', 'No element detail for this sample'],
    ] as const)('says one thing for %s, and draws no tabs or cards', (state, text) => {
      render({ state, sample: SAMPLE, elements: ELEMENTS, activeElement: ELEMENTS[0] });
      expect(host.querySelectorAll('[role="status"]')).toHaveLength(1);
      expect(message()?.textContent?.trim()).toBe(text);
      expect(host.querySelector('[role="tablist"]')).toBeNull();
      expect(host.querySelector('rr-sg-attribute-card')).toBeNull();
    });

    it('still reads when a future sample arrives without its sample', () => {
      render({ state: 'future', sample: null });
      expect(message()?.textContent?.trim()).toBe('Not sampled yet');
    });

    it('offers no retry on error — the data source has no refetch', () => {
      render({ state: 'error', sample: SAMPLE });
      expect(host.querySelector('button')).toBeNull();
    });

    it('keeps one live region across state changes, so the new message is announced', () => {
      render({ state: 'pending', sample: SAMPLE });
      const region = message();
      render({ state: 'future' });
      expect(message()).toBe(region);
      expect(region?.textContent).toContain('Not sampled yet');
    });
  });

  describe('ready', () => {
    it('labels the tablist with the sample, and draws one tab per element', () => {
      ready();
      expect(host.querySelector('[role="tablist"]')?.getAttribute('aria-label')).toBe('Elements of Gearbox at 04:15Z');
      expect(tabs().map((tab) => tab.querySelector('span')?.textContent)).toEqual([
        'Oil Temp Probe',
        'Vibration Sensor A',
        'Shaft Speed',
      ]);
      expect(message()).toBeNull();
    });

    it('carries each tab status in text as well as in its dot', () => {
      ready();
      const tab = tabs()[1];
      expect(tab.querySelector('rr-sg-status-dot')?.getAttribute('data-status')).toBe('PARTIAL');
      expect(tab.querySelector('.sr-only')?.textContent).toBe(', Partial');
    });

    it('marks the active tab selected and makes only it tabbable', () => {
      ready(ELEMENTS[1]);
      expect(tabs().map((tab) => tab.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false']);
      expect(tabs().map((tab) => tab.getAttribute('tabindex'))).toEqual(['-1', '0', '-1']);
    });

    it('wires tabs and panel to each other by id', () => {
      ready(ELEMENTS[1]);
      const ids = tabs().map((tab) => tab.id);
      expect(new Set(ids).size).toBe(3);
      expect(tabs().every((tab) => tab.getAttribute('aria-controls') === panel()?.id)).toBe(true);
      expect(panel()?.getAttribute('aria-labelledby')).toBe(ids[1]);
    });

    it('draws one card per attribute of the active element, in attribute order', () => {
      ready(ELEMENTS[1]);
      expect(host.querySelector('[role="tabpanel"] [role="list"]')).not.toBeNull();
      expect(cardNames()).toEqual(['Units', 'Calibration Offset', 'Scaling Factor']);
    });

    it('finds the active element by id, not by reference', () => {
      ready({ ...ELEMENTS[2] });
      expect(tabs()[2].getAttribute('aria-selected')).toBe('true');
      expect(cardNames()).toEqual(['Units']);
    });

    it('falls back to the first tab when there is no active element, or it is not in the list', () => {
      ready(null);
      expect(tabs()[0].getAttribute('aria-selected')).toBe('true');
      expect(cardNames()).toEqual(['Units', 'Range']);

      ready({ ...ELEMENTS[1], id: 'gone' });
      expect(tabs()[0].getAttribute('aria-selected')).toBe('true');
      expect(panel()?.getAttribute('aria-labelledby')).toBe(tabs()[0].id);
    });

    it('names the tablist plainly when no sample is given', () => {
      render({ state: 'ready', sample: null, elements: ELEMENTS, activeElement: ELEMENTS[0] });
      expect(host.querySelector('[role="tablist"]')?.getAttribute('aria-label')).toBe('Elements');
    });

    it('gives each deck its own ids', () => {
      ready();
      const other = TestBed.createComponent(DetailsDeck);
      other.componentRef.setInput('state', 'ready');
      other.componentRef.setInput('elements', ELEMENTS);
      other.detectChanges();
      const otherPanel = (other.nativeElement as HTMLElement).querySelector('[role="tabpanel"]');
      expect(otherPanel?.id).not.toBe(panel()?.id);
    });
  });

  describe('choosing a tab', () => {
    it('emits the element id on click — the active tab too, which is harmless', () => {
      ready();
      tabs()[2].click();
      tabs()[0].click();
      expect(emitted).toEqual(['shaft', 'oil']);
    });

    it.each([
      ['ArrowRight', 0, 1],
      ['ArrowRight', 2, 0],
      ['ArrowLeft', 1, 0],
      ['ArrowLeft', 0, 2],
      ['Home', 2, 0],
      ['End', 0, 2],
    ])('%s from tab %i activates and focuses tab %i', (key, from, to) => {
      ready(ELEMENTS[from]);
      const event = press(tabs()[from], key);
      expect(event.defaultPrevented).toBe(true);
      expect(emitted).toEqual([ELEMENTS[to].id]);
      expect(document.activeElement).toBe(tabs()[to]);
    });

    it('moves from the tab the key was pressed on, before the new selection comes back', () => {
      ready(ELEMENTS[0]);
      press(tabs()[0], 'ArrowRight');
      // The store has not answered yet: tab 0 is still active, but focus is on tab 1.
      press(tabs()[1], 'ArrowRight');
      expect(emitted).toEqual(['vib-a', 'shaft']);
      expect(document.activeElement).toBe(tabs()[2]);
    });

    it('leaves every other key, and modified keys, alone', () => {
      ready();
      const event = press(tabs()[0], 'Enter');
      expect(event.defaultPrevented).toBe(false);
      expect(press(tabs()[0], 'ArrowLeft', { altKey: true }).defaultPrevented).toBe(false);
      expect(press(tabs()[0], 'Home', { ctrlKey: true }).defaultPrevented).toBe(false);
      expect(press(tabs()[0], 'ArrowRight', { metaKey: true }).defaultPrevented).toBe(false);
      expect(emitted).toEqual([]);
    });
  });
});
