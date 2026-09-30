import { Component, PLATFORM_ID, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { RrPane } from './pane';
import { provideRrPanes } from './panes.config';

@Component({
  standalone: true,
  imports: [RrPane],
  template: `
    <rr-pane
      label="Units"
      [orientation]="orientation()"
      [chevronPosition]="chevron()"
      [collapsible]="collapsible()"
      [forceCollapsed]="forced()"
      [(collapsed)]="collapsed">
      <button class="inside">inside</button>
      <span rrPaneHeader class="action">act</span>
    </rr-pane>
    <button class="outside">outside</button>`,
})
class TestHost {
  collapsed = signal(false);
  forced = signal(false);
  collapsible = signal(true);
  orientation = signal<'inline' | 'block'>('block');
  chevron = signal<'start' | 'end' | null>(null);
}

describe('RrPane', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let pane: RrPane;
  let el: HTMLElement;

  const find = <T extends HTMLElement>(selector: string) => el.querySelector(selector) as T;

  function create() {
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
    pane = fixture.debugElement.children[0].componentInstance;
  }

  it('renders its label, header actions and body content', () => {
    create();
    expect(find('.rr-pane__title').textContent).toBe('Units');
    expect(find('.rr-pane__actions .action')).not.toBeNull();
    expect(find('.rr-pane__body .inside')).not.toBeNull();
  });

  it('keeps [(collapsed)] and the pane in sync both ways', () => {
    create();
    find('.rr-pane__toggle').click();
    fixture.detectChanges();
    expect(host.collapsed()).toBe(true);
    expect(find('rr-pane').hasAttribute('data-collapsed')).toBe(true);

    host.collapsed.set(false);
    fixture.detectChanges();
    expect(find('rr-pane').hasAttribute('data-collapsed')).toBe(false);
  });

  it('makes the body inert and hidden when collapsed', () => {
    create();
    host.collapsed.set(true);
    fixture.detectChanges();
    expect(find('.rr-pane__body').hasAttribute('inert')).toBe(true);
    expect(find('.rr-pane__body').getAttribute('aria-hidden')).toBe('true');
    expect(find('.rr-pane__toggle').getAttribute('aria-expanded')).toBe('false');
  });

  it('links the toggle, title and body for screen readers', () => {
    create();
    const body = find('.rr-pane__body');
    expect(find('.rr-pane__toggle').getAttribute('aria-controls')).toBe(body.id);
    expect(body.getAttribute('aria-labelledby')).toBe(find('.rr-pane__title').id);
    expect(pane.regionId()).toBe(body.id);
  });

  it('collapses when forced without changing what the user chose', () => {
    create();
    host.forced.set(true);
    fixture.detectChanges();
    expect(pane.isCollapsed()).toBe(true);
    expect(host.collapsed()).toBe(false);
    expect(find<HTMLButtonElement>('.rr-pane__toggle').disabled).toBe(true);

    pane.toggle(); // ignored while forced
    expect(host.collapsed()).toBe(false);

    host.forced.set(false);
    fixture.detectChanges();
    expect(pane.isCollapsed()).toBe(false);
  });

  it('collapses and expands through its methods', () => {
    create();
    pane.collapse();
    expect(host.collapsed()).toBe(true);
    pane.expand();
    expect(host.collapsed()).toBe(false);
  });

  it('cannot be collapsed when not collapsible', () => {
    create();
    host.collapsible.set(false);
    fixture.detectChanges();
    pane.collapse();
    pane.toggle();
    expect(find('.rr-pane__toggle')).toBeNull();
    expect(pane.isCollapsed()).toBe(false);
  });

  describe('focus', () => {
    it('moves focus to the toggle when it collapses with focus inside the body', () => {
      create();
      find('.inside').focus();
      host.collapsed.set(true);
      fixture.detectChanges();
      expect(document.activeElement).toBe(find('.rr-pane__toggle'));
    });

    it('moves focus to the header when the toggle is disabled', () => {
      create();
      find('.inside').focus();
      host.forced.set(true);
      fixture.detectChanges();
      expect(document.activeElement).toBe(find('.rr-pane__header'));
    });

    it('leaves focus alone when it is outside the body', () => {
      create();
      find('.outside').focus();
      host.collapsed.set(true);
      fixture.detectChanges();
      expect(document.activeElement).toBe(find('.outside'));
    });

    it('does nothing on the server', () => {
      TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
      create();
      find('.inside').focus();
      host.collapsed.set(true);
      fixture.detectChanges();
      expect(document.activeElement).toBe(find('.inside'));
    });
  });

  it('puts the chevron at the start for block and the end for inline, unless told otherwise', () => {
    create();
    expect(find('rr-pane').getAttribute('data-chevron')).toBe('start');

    host.orientation.set('inline');
    fixture.detectChanges();
    expect(find('rr-pane').getAttribute('data-chevron')).toBe('end');

    host.chevron.set('start');
    fixture.detectChanges();
    expect(find('rr-pane').getAttribute('data-chevron')).toBe('start');
  });

  it('shows a rail with the label only when collapsed inline', () => {
    create();
    pane.collapse();
    fixture.detectChanges();
    expect(find('.rr-pane__rail')).toBeNull();

    host.orientation.set('inline');
    fixture.detectChanges();
    expect(find('.rr-pane__rail-label').textContent?.trim()).toBe('Units');
  });

  it('sizes its header, rail and collapsed track from the same config values', () => {
    TestBed.configureTestingModule({ providers: [provideRrPanes({ headerSize: 40, railSize: 30 })] });
    create();
    expect(pane.collapsedSize()).toBe(42); // header + 2px border
    expect(find('rr-pane').style.getPropertyValue('--rr-pane-header-size')).toBe('40px');

    host.orientation.set('inline');
    fixture.detectChanges();
    expect(pane.collapsedSize()).toBe(32); // rail + 2px border
  });

  it('uses config defaults for its id and bounds', () => {
    create();
    expect(pane.itemId()).toMatch(/^rr-pane-\d+$/);
    expect(pane.itemLabel()).toBe('Units');
    expect(pane.minSize()).toBe(80);
    expect(pane.maxSize()).toBeNull();
  });

  it('lets one pane override its id, sizes and bounds', () => {
    @Component({
      standalone: true,
      imports: [RrPane],
      template: `<rr-pane label="Big" paneId="big" basis="280px" [min]="200" [max]="400"
                          [headerSize]="36" [railSize]="20" />`,
    })
    class BigHost {}

    const big = TestBed.createComponent(BigHost);
    big.detectChanges();
    const bigPane: RrPane = big.debugElement.children[0].componentInstance;

    expect(bigPane.itemId()).toBe('big');
    expect(bigPane.basisSpec()).toEqual({ unit: 'px', value: 280 });
    expect(bigPane.minSize()).toBe(200);
    expect(bigPane.maxSize()).toBe(400);
    expect(bigPane.collapsedSize()).toBe(38);
  });
});
