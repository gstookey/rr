import { Component, PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RrPane } from './pane';
import { provideRrPanes } from './panes.config';
import { settle } from './testing/panes-testing';

const q = <T extends Element>(root: Element | ShadowRoot, sel: string): T => root.querySelector(sel) as T;

@Component({
  standalone: true,
  imports: [RrPane],
  template: `
    <rr-pane label="Units" [(collapsed)]="collapsed" [forceCollapsed]="forced()" [collapsible]="collapsible()">
      <button class="inside">inside</button>
      <span rrPaneHeader class="action">act</span>
    </rr-pane>
    <button class="outside">outside</button>`,
})
class TwoWayHost {
  readonly collapsed = signal(false);
  readonly forced = signal(false);
  readonly collapsible = signal(true);
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

const paneOf = (f: { debugElement: { children: { componentInstance: unknown }[] } }): RrPane =>
  f.debugElement.children[0].componentInstance as RrPane;

describe('RrPane', () => {
  it('renders its label in the header and projects header actions and body content', async () => {
    const f = TestBed.createComponent(TwoWayHost);
    await settle(f);
    const el = f.nativeElement as HTMLElement;
    expect(q(el, '.rr-pane__title').textContent).toBe('Units');
    expect(q(el, '.rr-pane__actions .action')).not.toBeNull();
    expect(q(el, '.rr-pane__body .inside')).not.toBeNull();
  });

  // WHY: the uncontrolled / two-way model() is the core of "simple to instantiate" — the
  // parent's signal and the pane must stay one value whichever side writes.
  it('keeps a two-way bound signal and the pane in sync, in both directions', async () => {
    const f = TestBed.createComponent(TwoWayHost);
    await settle(f);
    const host = q<HTMLElement>(f.nativeElement, 'rr-pane');

    q<HTMLButtonElement>(host, '.rr-pane__toggle').click();
    await settle(f);
    expect(f.componentInstance.collapsed()).toBe(true);
    expect(host.hasAttribute('data-collapsed')).toBe(true);

    f.componentInstance.collapsed.set(false);
    await settle(f);
    expect(host.hasAttribute('data-collapsed')).toBe(false);
  });

  it('marks the body inert and hidden, and reports state on the toggle, when collapsed', async () => {
    const f = TestBed.createComponent(TwoWayHost);
    f.componentInstance.collapsed.set(true);
    await settle(f);
    const body = q<HTMLElement>(f.nativeElement, '.rr-pane__body');
    expect(body.hasAttribute('inert')).toBe(true);
    expect(body.getAttribute('aria-hidden')).toBe('true');
    expect(q(f.nativeElement, '.rr-pane__toggle').getAttribute('aria-expanded')).toBe('false');
  });

  it('wires the toggle, title and body together for assistive technology', async () => {
    const f = TestBed.createComponent(TwoWayHost);
    await settle(f);
    const pane = paneOf(f);
    const toggle = q(f.nativeElement, '.rr-pane__toggle');
    const body = q(f.nativeElement, '.rr-pane__body');
    expect(toggle.getAttribute('aria-controls')).toBe(body.id);
    expect(body.getAttribute('aria-labelledby')).toBe(q(f.nativeElement, '.rr-pane__title').id);
    expect(pane.regionId()).toBe(body.id);
    expect(body.hasAttribute('inert')).toBe(false);
  });

  // WHY: forcing a pane shut (e.g. a narrow container) must not destroy the user's intent —
  // when the force lifts, the pane returns to exactly what the user last chose.
  it('treats forceCollapsed as an overlay that never writes user intent', async () => {
    const f = TestBed.createComponent(TwoWayHost);
    await settle(f);
    const host = q<HTMLElement>(f.nativeElement, 'rr-pane');

    f.componentInstance.forced.set(true);
    await settle(f);
    expect(host.hasAttribute('data-collapsed')).toBe(true);
    expect(f.componentInstance.collapsed()).toBe(false);
    expect(q<HTMLButtonElement>(host, '.rr-pane__toggle').disabled).toBe(true);

    paneOf(f).toggle(); // a forced pane ignores the toggle
    await settle(f);
    expect(f.componentInstance.collapsed()).toBe(false);

    f.componentInstance.forced.set(false);
    await settle(f);
    expect(host.hasAttribute('data-collapsed')).toBe(false);
  });

  it('collapses and expands through its methods', async () => {
    const f = TestBed.createComponent(TwoWayHost);
    await settle(f);
    const pane = paneOf(f);
    pane.collapse();
    await settle(f);
    expect(f.componentInstance.collapsed()).toBe(true);
    pane.expand();
    await settle(f);
    expect(f.componentInstance.collapsed()).toBe(false);
  });

  describe('focus rescue', () => {
    // WHY: collapsing while focus is inside the body would otherwise drop a keyboard user
    // to <body> once the body goes inert.
    it('moves focus from inside the body to the toggle when it collapses', async () => {
      const f = TestBed.createComponent(TwoWayHost);
      await settle(f);
      const inside = q<HTMLButtonElement>(f.nativeElement, '.inside');
      inside.focus();
      expect(document.activeElement).toBe(inside);

      f.componentInstance.collapsed.set(true);
      await settle(f);
      expect(document.activeElement).toBe(q(f.nativeElement, '.rr-pane__toggle'));
    });

    it('leaves focus alone when it is outside the body', async () => {
      const f = TestBed.createComponent(TwoWayHost);
      await settle(f);
      const outside = q<HTMLButtonElement>(f.nativeElement, '.outside');
      outside.focus();
      f.componentInstance.collapsed.set(true);
      await settle(f);
      expect(document.activeElement).toBe(outside);
    });

    // WHY: a forced-shut pane's toggle is disabled and cannot take focus — the header can.
    it('falls back to the header when the toggle is disabled', async () => {
      const f = TestBed.createComponent(TwoWayHost);
      await settle(f);
      q<HTMLButtonElement>(f.nativeElement, '.inside').focus();
      f.componentInstance.forced.set(true);
      await settle(f);
      expect(document.activeElement).toBe(q(f.nativeElement, '.rr-pane__header'));
    });

    it('falls back to the header when the pane has no toggle at all', async () => {
      const f = TestBed.createComponent(TwoWayHost);
      f.componentInstance.collapsible.set(false);
      await settle(f);
      expect(q(f.nativeElement, '.rr-pane__toggle')).toBeNull();
      q<HTMLButtonElement>(f.nativeElement, '.inside').focus();
      f.componentInstance.forced.set(true);
      await settle(f);
      expect(document.activeElement).toBe(q(f.nativeElement, '.rr-pane__header'));
    });

    // WHY: `document.activeElement` stops at a shadow host. Reading the host's root node is
    // what makes the rescue work when the pane lives inside a shadow root.
    it('works inside a shadow root', async () => {
      const f = TestBed.createComponent(TwoWayHost);
      await settle(f);
      const shadowHost = document.createElement('div');
      document.body.appendChild(shadowHost);
      const shadow = shadowHost.attachShadow({ mode: 'open' });
      shadow.appendChild(f.nativeElement);
      try {
        q<HTMLButtonElement>(shadow, '.inside').focus();
        expect(shadow.activeElement).toBe(q(shadow, '.inside'));
        f.componentInstance.collapsed.set(true);
        await settle(f);
        expect(shadow.activeElement).toBe(q(shadow, '.rr-pane__toggle'));
      } finally {
        shadowHost.remove();
      }
    });

    it('does nothing when nothing inside its root has focus', async () => {
      const f = TestBed.createComponent(TwoWayHost);
      await settle(f);
      const shadowHost = document.createElement('div');
      document.body.appendChild(shadowHost);
      const shadow = shadowHost.attachShadow({ mode: 'open' });
      shadow.appendChild(f.nativeElement);
      try {
        expect(shadow.activeElement).toBeNull();
        f.componentInstance.collapsed.set(true);
        await settle(f);
        expect(shadow.activeElement).toBeNull();
      } finally {
        shadowHost.remove();
      }
    });

    it('never touches focus on the server', async () => {
      TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
      const f = TestBed.createComponent(TwoWayHost);
      await settle(f);
      const inside = q<HTMLButtonElement>(f.nativeElement, '.inside');
      inside.focus();
      f.componentInstance.collapsed.set(true);
      await settle(f);
      expect(document.activeElement).toBe(inside);
    });
  });

  it('defaults the chevron to the start for block and the end for inline, and honours an override', async () => {
    const f = TestBed.createComponent(StandaloneHost);
    await settle(f);
    const host = q<HTMLElement>(f.nativeElement, 'rr-pane');
    expect(host.getAttribute('data-chevron')).toBe('start');

    f.componentInstance.orientation.set('inline');
    await settle(f);
    expect(host.getAttribute('data-chevron')).toBe('end');

    f.componentInstance.chevron.set('start');
    await settle(f);
    expect(host.getAttribute('data-chevron')).toBe('start');
  });

  it('shows the rotated rail only when collapsed inline; a block pane keeps its title bar', async () => {
    const f = TestBed.createComponent(StandaloneHost);
    await settle(f);
    const pane = paneOf(f);

    pane.collapse();
    await settle(f);
    expect(q(f.nativeElement, '.rr-pane__rail')).toBeNull();
    expect(q(f.nativeElement, '.rr-pane__title').textContent).toBe('Solo');

    f.componentInstance.orientation.set('inline');
    await settle(f);
    expect(q(f.nativeElement, '.rr-pane__rail-label').textContent?.trim()).toBe('Solo');
  });

  // WHY: this is the single-source guarantee — the collapsed track the group builds and the
  // header the pane draws come from ONE config value, so they cannot drift.
  it('derives its collapsed size from the same config value that sizes its header', async () => {
    TestBed.configureTestingModule({ providers: [provideRrPanes({ headerSize: 40, railSize: 30 })] });
    const f = TestBed.createComponent(StandaloneHost);
    await settle(f);
    const host = q<HTMLElement>(f.nativeElement, 'rr-pane');
    const pane = paneOf(f);

    expect(pane.collapsedSize()).toBe(42);
    expect(host.style.getPropertyValue('--rr-pane-header-size')).toBe('40px');

    f.componentInstance.orientation.set('inline');
    await settle(f);
    expect(pane.collapsedSize()).toBe(32);
    expect(host.style.getPropertyValue('--rr-pane-rail-size')).toBe('30px');
  });

  it('lets one pane override the configured sizes and bounds', async () => {
    @Component({
      standalone: true,
      imports: [RrPane],
      template: `<rr-pane label="Big" paneId="big" basis="280px" [min]="200" [max]="400"
                          [headerSize]="36" [railSize]="20" />`,
    })
    class Host {}
    const f = TestBed.createComponent(Host);
    await settle(f);
    const pane = paneOf(f);
    expect(pane.itemId()).toBe('big');
    expect(pane.itemLabel()).toBe('Big');
    expect(pane.basisSpec()).toEqual({ unit: 'px', value: 280 });
    expect([pane.minSize(), pane.maxSize()]).toEqual([200, 400]);
    expect(pane.collapsedSize()).toBe(38);
    expect(q<HTMLElement>(f.nativeElement, 'rr-pane').style.getPropertyValue('--rr-pane-rail-size')).toBe('20px');
  });

  it('falls back to the configured minimum and no maximum', async () => {
    const f = TestBed.createComponent(StandaloneHost);
    await settle(f);
    expect([paneOf(f).minSize(), paneOf(f).maxSize()]).toEqual([80, null]);
    expect(paneOf(f).itemId()).toMatch(/^rr-pane-\d+$/);
  });

  it('renders no toggle and never collapses when not collapsible', async () => {
    @Component({ standalone: true, imports: [RrPane], template: `<rr-pane label="Fixed" [collapsible]="false" />` })
    class Host {}
    const f = TestBed.createComponent(Host);
    await settle(f);
    const pane = paneOf(f);
    pane.collapse();
    pane.toggle();
    await settle(f);
    expect(q(f.nativeElement, '.rr-pane__toggle')).toBeNull();
    expect(pane.isCollapsed()).toBe(false);
  });
});
