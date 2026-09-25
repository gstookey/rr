import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RrPane } from './pane';
import { provideRrPanes } from './panes.config';

const q = <T extends Element>(root: Element, sel: string): T => root.querySelector(sel) as T;

@Component({
  standalone: true,
  imports: [RrPane],
  template: `
    <rr-pane label="Units" [(collapsed)]="collapsed" [forceCollapsed]="forced()">
      <button class="inside">inside</button>
      <span rrPaneHeader class="action">act</span>
    </rr-pane>`,
})
class TwoWayHost {
  readonly collapsed = signal(false);
  readonly forced = signal(false);
}

@Component({
  standalone: true,
  imports: [RrPane],
  template: `<rr-pane label="Solo" [orientation]="orientation()" [chevronPosition]="chevron()" />`,
})
class StandaloneHost {
  readonly orientation = signal<'inline' | 'block'>('block');
  readonly chevron = signal<'start' | 'end' | null>(null);
}

describe('RrPane', () => {
  it('renders its label in the header and projects header actions and body content', async () => {
    const f = TestBed.createComponent(TwoWayHost);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    expect(q(el, '.rr-pane__title').textContent).toBe('Units');
    expect(q(el, '.rr-pane__actions .action')).not.toBeNull();
    expect(q(el, '.rr-pane__body .inside')).not.toBeNull();
  });

  // WHY: the uncontrolled / two-way model() is the core of "simple to instantiate" — the
  // parent's signal and the pane must stay one value whichever side writes.
  it('keeps a two-way bound signal and the pane in sync, in both directions', async () => {
    const f = TestBed.createComponent(TwoWayHost);
    await f.whenStable();
    const host = f.nativeElement.querySelector('rr-pane') as HTMLElement;

    q<HTMLButtonElement>(host, '.rr-pane__toggle').click();
    await f.whenStable();
    expect(f.componentInstance.collapsed()).toBe(true);
    expect(host.hasAttribute('data-collapsed')).toBe(true);

    f.componentInstance.collapsed.set(false);
    await f.whenStable();
    expect(host.hasAttribute('data-collapsed')).toBe(false);
  });

  it('marks the body inert and hidden, and reports state on the toggle, when collapsed', async () => {
    const f = TestBed.createComponent(TwoWayHost);
    f.componentInstance.collapsed.set(true);
    await f.whenStable();
    const body = q<HTMLElement>(f.nativeElement, '.rr-pane__body');
    expect(body.hasAttribute('inert')).toBe(true);
    expect(body.getAttribute('aria-hidden')).toBe('true');
    expect(q(f.nativeElement, '.rr-pane__toggle').getAttribute('aria-expanded')).toBe('false');
  });

  // WHY: forcing a pane shut (e.g. a narrow container) must not destroy the user's intent —
  // when the force lifts, the pane returns to exactly what the user last chose.
  it('treats forceCollapsed as an overlay that never writes user intent', async () => {
    const f = TestBed.createComponent(TwoWayHost);
    await f.whenStable();
    const host = f.nativeElement.querySelector('rr-pane') as HTMLElement;

    f.componentInstance.forced.set(true);
    await f.whenStable();
    expect(host.hasAttribute('data-collapsed')).toBe(true);
    expect(f.componentInstance.collapsed()).toBe(false);
    expect(q<HTMLButtonElement>(host, '.rr-pane__toggle').disabled).toBe(true);

    f.componentInstance.forced.set(false);
    await f.whenStable();
    expect(host.hasAttribute('data-collapsed')).toBe(false);
  });

  // WHY: collapsing while focus is inside the body would otherwise drop a keyboard user
  // to <body> once the body goes inert.
  it('moves focus from inside the body to the toggle when it collapses', async () => {
    const f = TestBed.createComponent(TwoWayHost);
    await f.whenStable();
    const inside = q<HTMLButtonElement>(f.nativeElement, '.inside');
    inside.focus();
    expect(document.activeElement).toBe(inside);

    f.componentInstance.collapsed.set(true);
    await f.whenStable();
    expect(document.activeElement).toBe(q(f.nativeElement, '.rr-pane__toggle'));
  });

  it('defaults the chevron to the start for block and the end for inline, and honours an override', async () => {
    const f = TestBed.createComponent(StandaloneHost);
    await f.whenStable();
    const host = f.nativeElement.querySelector('rr-pane') as HTMLElement;
    expect(host.getAttribute('data-chevron')).toBe('start');

    f.componentInstance.orientation.set('inline');
    await f.whenStable();
    expect(host.getAttribute('data-chevron')).toBe('end');

    f.componentInstance.chevron.set('start');
    await f.whenStable();
    expect(host.getAttribute('data-chevron')).toBe('start');
  });

  it('shows the rotated rail only when collapsed inline; a block pane keeps its title bar', async () => {
    const f = TestBed.createComponent(StandaloneHost);
    await f.whenStable();
    const pane = f.debugElement.children[0].componentInstance as RrPane;

    pane.collapse();
    await f.whenStable();
    expect(q(f.nativeElement, '.rr-pane__rail')).toBeNull();
    expect(q(f.nativeElement, '.rr-pane__title').textContent).toBe('Solo');

    f.componentInstance.orientation.set('inline');
    await f.whenStable();
    expect(q(f.nativeElement, '.rr-pane__rail-label').textContent?.trim()).toBe('Solo');
  });

  // WHY: this is the single-source guarantee — the collapsed track the group builds and the
  // header the pane draws come from ONE config value, so they cannot drift.
  it('derives its collapsed size from the same config value that sizes its header', async () => {
    TestBed.configureTestingModule({ providers: [provideRrPanes({ headerSize: 40, railSize: 30 })] });
    const f = TestBed.createComponent(StandaloneHost);
    await f.whenStable();
    const host = f.nativeElement.querySelector('rr-pane') as HTMLElement;
    const pane = f.debugElement.children[0].componentInstance as RrPane;

    expect(pane.collapsedSize()).toBe(42);
    expect(host.style.getPropertyValue('--rr-pane-header-size')).toBe('40px');

    f.componentInstance.orientation.set('inline');
    await f.whenStable();
    expect(pane.collapsedSize()).toBe(32);
  });

  it('renders no toggle and never collapses when not collapsible', async () => {
    @Component({ standalone: true, imports: [RrPane], template: `<rr-pane label="Fixed" [collapsible]="false" />` })
    class Host {}
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const pane = f.debugElement.children[0].componentInstance as RrPane;
    pane.collapse();
    await f.whenStable();
    expect(q(f.nativeElement, '.rr-pane__toggle')).toBeNull();
    expect(pane.isCollapsed()).toBe(false);
  });
});
