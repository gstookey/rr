import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RrPane } from './pane';
import { RrPaneGroup } from './pane-group';

const cols = (el: HTMLElement): string => el.style.gridTemplateColumns;
const rows = (el: HTMLElement): string => el.style.gridTemplateRows;

@Component({
  standalone: true,
  imports: [RrPane, RrPaneGroup],
  template: `
    <rr-pane-group #g="rrPaneGroup" class="outer" orientation="inline" [resizable]="true" [stateKey]="stateKey">
      <rr-pane label="Units" paneId="units" basis="30%" [(collapsed)]="unitsCollapsed" />
      <rr-pane-group class="inner" orientation="block">
        <rr-pane label="Grid" paneId="grid" />
        <rr-pane label="Details" paneId="deck" />
      </rr-pane-group>
    </rr-pane-group>`,
})
class Host {
  stateKey: string | null = null;
  readonly unitsCollapsed = signal(false);
}

const outer = (root: HTMLElement) => root.querySelector('.outer') as HTMLElement;
const inner = (root: HTMLElement) => root.querySelector('.inner') as HTMLElement;
const panes = (root: HTMLElement) => [...root.querySelectorAll('rr-pane')] as HTMLElement[];
const groupOf = (f: ReturnType<typeof TestBed.createComponent<Host>>) =>
  f.debugElement.query((d) => d.nativeElement.classList?.contains('outer')).componentInstance as RrPaneGroup;

/** jsdom has no layout. Stub the sizes a real browser would report. */
function stubSizes(root: HTMLElement, widths: Record<string, number>): void {
  for (const [selector, width] of Object.entries(widths)) {
    const el = root.querySelector(selector) as HTMLElement;
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ width, height: 600 } as DOMRect);
  }
}

describe('RrPaneGroup', () => {
  beforeEach(() => localStorage.clear());

  // WHY: the whole point — declared bases become tracks with NO measurement, so the very
  // first render is the final layout.
  it('turns declared bases into grid tracks on the first render', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    expect(cols(outer(f.nativeElement))).toBe('minmax(80px, 30fr) 8px minmax(80px, 70fr)');
    expect(rows(inner(f.nativeElement))).toBe('minmax(80px, 50fr) 8px minmax(80px, 50fr)');
  });

  it('sees only its DIRECT items — a nested group is one item, not its panes', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    // outer: Units + inner group = 2 items → one gap; inner: 2 panes → one gap.
    expect(cols(outer(f.nativeElement)).split(' 8px ')).toHaveLength(2);
  });

  it('places each item on its own grid line and gives panes the group orientation', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const [units, grid, deck] = panes(f.nativeElement);
    expect(units.style.gridColumn).toBe('1');
    expect(inner(f.nativeElement).style.gridColumn).toBe('3');
    expect(grid.style.gridRow).toBe('1');
    expect(deck.style.gridRow).toBe('3');
    expect(units.getAttribute('data-orientation')).toBe('inline');
    expect(grid.getAttribute('data-orientation')).toBe('block');
  });

  // WHY: collapse needs no redistribution math — the collapsed track becomes 0fr and CSS
  // Grid hands its space to the siblings.
  it('renders a collapsed pane as its collapsed-size track', async () => {
    const f = TestBed.createComponent(Host);
    f.componentInstance.unitsCollapsed.set(true);
    await f.whenStable();
    expect(cols(outer(f.nativeElement))).toBe('minmax(26px, 0fr) 8px minmax(80px, 70fr)');
  });

  it('renders one accessible splitter per boundary, inert beside a collapsed pane', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const handle = () => outer(f.nativeElement).querySelector(':scope > [role="separator"]') as HTMLElement;
    expect(handle().getAttribute('aria-orientation')).toBe('vertical');
    expect(handle().getAttribute('aria-label')).toBe('Resize Units');
    expect(handle().style.gridColumn).toBe('2');
    expect(handle().getAttribute('aria-disabled')).toBeNull();

    f.componentInstance.unitsCollapsed.set(true);
    await f.whenStable();
    expect(handle().getAttribute('aria-disabled')).toBe('true');
    expect(handle().getAttribute('tabindex')).toBe('-1');
  });

  it('renders no splitters when not resizable', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    expect(inner(f.nativeElement).querySelectorAll('[role="separator"]')).toHaveLength(0);
  });

  it('exposes an imperative API through exportAs', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const g = groupOf(f);

    g.collapse('units');
    await f.whenStable();
    expect(f.componentInstance.unitsCollapsed()).toBe(true); // writes intent, so the binding follows

    g.expandAll();
    await f.whenStable();
    expect(f.componentInstance.unitsCollapsed()).toBe(false);

    g.toggle('units');
    await f.whenStable();
    expect(f.componentInstance.unitsCollapsed()).toBe(true);
  });

  it('moves the boundary by the keyboard step, conserving the pair', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    stubSizes(f.nativeElement, { 'rr-pane': 300, '.inner': 700 });
    const handle = outer(f.nativeElement).querySelector(':scope > [role="separator"]') as HTMLElement;

    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await f.whenStable();
    expect(cols(outer(f.nativeElement))).toBe('minmax(80px, 316fr) 8px minmax(80px, 684fr)');
    expect(handle.getAttribute('aria-valuenow')).toBe('316');

    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', shiftKey: true, bubbles: true }));
    await f.whenStable();
    expect(cols(outer(f.nativeElement))).toBe('minmax(80px, 252fr) 8px minmax(80px, 748fr)');
  });

  it('Home sends the pane to its minimum; Enter restores the declared split', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    stubSizes(f.nativeElement, { 'rr-pane': 300, '.inner': 700 });
    const handle = outer(f.nativeElement).querySelector(':scope > [role="separator"]') as HTMLElement;

    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    await f.whenStable();
    expect(cols(outer(f.nativeElement))).toBe('minmax(80px, 80fr) 8px minmax(80px, 920fr)');

    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await f.whenStable();
    expect(cols(outer(f.nativeElement))).toBe('minmax(80px, 300fr) 8px minmax(80px, 700fr)');
  });

  // WHY: a hidden or detached group reports zero sizes. Resizing then must do nothing,
  // not normalise every pane down to its minimum.
  it('ignores a resize when the group is not laid out', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const before = cols(outer(f.nativeElement));
    const handle = outer(f.nativeElement).querySelector(':scope > [role="separator"]') as HTMLElement;
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await f.whenStable();
    expect(cols(outer(f.nativeElement))).toBe(before);
  });

  it('persists a resize under its stateKey and restores it on the FIRST render', async () => {
    const first = TestBed.createComponent(Host);
    first.componentInstance.stateKey = 'demo';
    await first.whenStable();
    stubSizes(first.nativeElement, { 'rr-pane': 300, '.inner': 700 });
    const handle = outer(first.nativeElement).querySelector(':scope > [role="separator"]') as HTMLElement;
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); // reset = flush
    first.destroy();
    expect(JSON.parse(localStorage.getItem('rr-panes:demo') ?? 'null')).toEqual({ v: 1, weights: [300, 700] });

    localStorage.setItem('rr-panes:demo', JSON.stringify({ v: 1, weights: [420, 580] }));
    const second = TestBed.createComponent(Host);
    second.componentInstance.stateKey = 'demo';
    await second.whenStable();
    expect(cols(outer(second.nativeElement))).toBe('minmax(80px, 420fr) 8px minmax(80px, 580fr)');
  });

  it('forgets persisted sizes on resetSizes()', async () => {
    localStorage.setItem('rr-panes:demo', JSON.stringify({ v: 1, weights: [420, 580] }));
    const f = TestBed.createComponent(Host);
    f.componentInstance.stateKey = 'demo';
    await f.whenStable();
    groupOf(f).resetSizes();
    await f.whenStable();
    expect(localStorage.getItem('rr-panes:demo')).toBeNull();
  });

  // WHY: "one or many panes" includes a list rendered with @for — the content query must see
  // panes produced by control flow, and the layout must follow as the list changes.
  it('arranges panes rendered by @for and follows the list as it changes', async () => {
    @Component({
      standalone: true,
      imports: [RrPane, RrPaneGroup],
      template: `
        <rr-pane-group orientation="inline">
          @for (name of names(); track name) { <rr-pane [label]="name" /> }
        </rr-pane-group>`,
    })
    class ListHost {
      readonly names = signal(['a', 'b']);
    }
    const f = TestBed.createComponent(ListHost);
    await f.whenStable();
    const group = f.nativeElement.querySelector('rr-pane-group') as HTMLElement;
    expect(cols(group)).toBe('minmax(80px, 50fr) 8px minmax(80px, 50fr)');

    f.componentInstance.names.set(['a', 'b', 'c', 'd']);
    await f.whenStable();
    expect(cols(group).split(' 8px ')).toHaveLength(4);
  });
});
