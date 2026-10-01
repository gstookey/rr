import { ApplicationRef, reflectComponentType, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { StatusGridStore, TimeSource, createTurbineFixtures, provideStatusGridData } from '../data-access';
import { StatusGridSurface } from './status-grid-surface';

const NOW = Date.parse('2026-10-01T14:05:00Z');

/**
 * The surface is wiring: store signals in, store methods out. These tests drive each pane's output
 * through the DOM and check the store moved, and that the other panes followed.
 */
describe('StatusGridSurface', () => {
  let fixture: ComponentFixture<StatusGridSurface>;
  let el: HTMLElement;
  let store: InstanceType<typeof StatusGridStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideStatusGridData(createTurbineFixtures({ now: NOW })),
        { provide: TimeSource, useValue: { now: signal(NOW) } },
      ],
    });
    fixture = TestBed.createComponent(StatusGridSurface);
    update();
    el = fixture.nativeElement;
    store = TestBed.inject(StatusGridStore);
  });

  function update(): void {
    fixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();
  }

  const q = <T extends HTMLElement = HTMLElement>(selector: string) => el.querySelector<T>(selector);

  it('takes no inputs: a utility window binds inputs once, so everything comes from the store', () => {
    expect(reflectComponentType(StatusGridSurface)!.inputs).toEqual([]);
  });

  it('lays out the three panes, with the first unit selected and nothing sampled yet', () => {
    expect([...el.querySelectorAll('rr-pane')].map((pane) => pane.getAttribute('label'))).toEqual(['Units', 'Status grid', 'Details']);
    expect(q('rr-sg-status-grid .meta__name')!.textContent).toBe('WTG-01');
    expect(q('rr-sg-sample-context')!.textContent).toContain('No sample selected');
    expect(q('rr-sg-details-deck [role=status]')!.textContent).toContain('Select a cell in the grid');
  });

  it('selects a unit from the list, and the grid follows', () => {
    const option = [...el.querySelectorAll<HTMLElement>('rr-sg-unit-list [role=option]')].find((o) => o.textContent!.includes('WTG-04'))!;
    option.click();
    update();
    expect(store.selectedUnitId()).toBe('WTG-04');
    expect(q('rr-sg-status-grid .meta__name')!.textContent).toBe('WTG-04');
    expect(q('rr-sg-status-grid .banner')).not.toBeNull();
  });

  it('selects a sample from the grid, and the deck and its header follow', () => {
    q('rr-sg-status-grid .cell[data-r="0"][data-c="4"]')!.click();
    update();
    expect(store.selectedCell()?.componentId).toBe(store.rows()[0].component.id);
    expect(q('rr-sg-sample-context')!.textContent).toContain('Gearbox');
    expect(el.querySelectorAll('rr-sg-details-deck [role=tab]')).toHaveLength(7);
  });

  it('selects an element from the deck', () => {
    q('rr-sg-status-grid .cell[data-r="0"][data-c="4"]')!.click();
    update();
    el.querySelectorAll<HTMLElement>('rr-sg-details-deck [role=tab]')[2].click();
    update();
    expect(store.activeElement()?.id).toBe(store.elements()[2].id);
    expect(q('rr-sg-details-deck [role=tab][aria-selected=true]')!.textContent).toContain(store.elements()[2].name);
  });
});
