import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { RrPane } from './pane';
import { RrPaneGroup } from './pane-group';
import type { RrPaneItem } from './pane-item';
import { provideRrPanes } from './panes.config';

@Component({
  standalone: true,
  imports: [RrPane, RrPaneGroup],
  template: `
    <rr-pane-group class="outer" [resizable]="true" [stateKey]="stateKey()" (resized)="resized.push($event)">
      <rr-pane label="Units" paneId="units" basis="30%" [(collapsed)]="unitsCollapsed" />
      <rr-pane-group class="inner" groupId="work" orientation="block" [resizable]="innerResizable()">
        <rr-pane label="Grid" paneId="grid" />
        <rr-pane label="Details" paneId="deck" />
      </rr-pane-group>
    </rr-pane-group>`,
})
class TestHost {
  stateKey = signal<string | null>(null);
  unitsCollapsed = signal(false);
  innerResizable = signal(false);
  resized: (readonly number[])[] = [];
}

// jsdom has no layout, so every element measures 0 × 0 unless a test says otherwise.
function setSize(el: Element, width: number, height = 600) {
  jest.spyOn(el, 'getBoundingClientRect').mockReturnValue({ width, height } as DOMRect);
}

function press(el: HTMLElement, key: string, shiftKey = false) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true }));
}

function mouse(el: HTMLElement, type: string, x = 0) {
  el.dispatchEvent(new MouseEvent(type, { clientX: x, bubbles: true }));
}

describe('RrPaneGroup', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;
  let outer: HTMLElement;
  let inner: HTMLElement;
  let handle: HTMLElement;

  const find = (selector: string) => el.querySelector(selector) as HTMLElement;
  const splitterOf = (group: HTMLElement) => group.querySelector(':scope > [role="separator"]') as HTMLElement;
  const groupComponent = (cls: string): RrPaneGroup =>
    fixture.debugElement.query((d) => d.nativeElement.classList?.contains(cls)).componentInstance;

  function create(stateKey: string | null = null) {
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    host.stateKey.set(stateKey);
    el = fixture.nativeElement;
    fixture.detectChanges();
    outer = find('.outer');
    inner = find('.inner');
    handle = splitterOf(outer);
  }

  /** Lay the panes out as a browser would: Units 300px wide, the work area 700px. */
  function layOut() {
    setSize(find('[paneid="units"]'), 300);
    setSize(inner, 700);
    setSize(find('[paneid="grid"]'), 700, 300);
    setSize(find('[paneid="deck"]'), 700, 300);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => jest.restoreAllMocks());

  describe('layout', () => {
    it('turns the declared sizes into grid tracks on the first render', () => {
      create();
      expect(outer.style.gridTemplateColumns).toBe('minmax(80px, 30fr) 8px minmax(80px, 70fr)');
      expect(outer.style.gridTemplateRows).toBe('minmax(0, 1fr)');
      expect(inner.style.gridTemplateRows).toBe('minmax(80px, 50fr) 8px minmax(80px, 50fr)');
      expect(inner.style.gridTemplateColumns).toBe('minmax(0, 1fr)');
    });

    it('places each item on its own grid line and passes its orientation to its panes', () => {
      create();
      expect(find('[paneid="units"]').style.gridColumn).toBe('1');
      expect(inner.style.gridColumn).toBe('3');
      expect(find('[paneid="grid"]').style.gridRow).toBe('1');
      expect(find('[paneid="deck"]').style.gridRow).toBe('3');
      expect(find('[paneid="units"]').getAttribute('data-orientation')).toBe('inline');
      expect(find('[paneid="grid"]').getAttribute('data-orientation')).toBe('block');
      expect(outer.style.gridColumn).toBe(''); // the root group is not placed
    });

    it('has no placement for an item that is not one of its own', () => {
      create();
      expect(groupComponent('outer').placementOf({} as RrPaneItem)).toBeNull();
    });

    it('shrinks a collapsed pane to its collapsed size', () => {
      create();
      host.unitsCollapsed.set(true);
      fixture.detectChanges();
      expect(outer.style.gridTemplateColumns).toBe('minmax(26px, 0fr) 8px minmax(80px, 70fr)');
    });

    it('follows a list of panes rendered with @for', () => {
      @Component({
        standalone: true,
        imports: [RrPane, RrPaneGroup],
        template: `
          <rr-pane-group>
            @for (name of names(); track name) {
              <rr-pane [label]="name" />
            }
          </rr-pane-group>`,
      })
      class ListHost {
        names = signal(['a', 'b']);
      }

      const list = TestBed.createComponent(ListHost);
      list.detectChanges();
      const group: HTMLElement = list.nativeElement.querySelector('rr-pane-group');
      expect(group.style.gridTemplateColumns).toBe('minmax(80px, 50fr) 8px minmax(80px, 50fr)');

      list.componentInstance.names.set(['a', 'b', 'c', 'd']);
      list.detectChanges();
      expect(group.style.gridTemplateColumns.split(' 8px ')).toHaveLength(4);
    });

    it('takes the gap and resizable defaults from config', () => {
      TestBed.configureTestingModule({ providers: [provideRrPanes({ gap: 4, resizable: true })] });

      @Component({
        standalone: true,
        imports: [RrPane, RrPaneGroup],
        template: `
          <rr-pane-group class="a"><rr-pane label="1" /><rr-pane label="2" /></rr-pane-group>
          <rr-pane-group class="b" [gap]="12"><rr-pane label="1" /><rr-pane label="2" /></rr-pane-group>`,
      })
      class ConfigHost {}

      const f = TestBed.createComponent(ConfigHost);
      f.detectChanges();
      const a: HTMLElement = f.nativeElement.querySelector('.a');
      const b: HTMLElement = f.nativeElement.querySelector('.b');
      expect(a.style.gridTemplateColumns).toBe('minmax(80px, 50fr) 4px minmax(80px, 50fr)');
      expect(b.style.gridTemplateColumns).toBe('minmax(80px, 50fr) 12px minmax(80px, 50fr)');
      expect(splitterOf(a)).not.toBeNull();
    });

    it('works as an item inside another group', () => {
      @Component({
        standalone: true,
        imports: [RrPane, RrPaneGroup],
        template: `
          <rr-pane-group [resizable]="true">
            <rr-pane-group class="side" groupId="side" label="Side" basis="280px" [min]="200" [max]="400">
              <rr-pane label="1" />
            </rr-pane-group>
            <rr-pane-group class="plain"><rr-pane label="2" /></rr-pane-group>
            <rr-pane label="3" />
          </rr-pane-group>`,
      })
      class NestedHost {}

      const f = TestBed.createComponent(NestedHost);
      f.detectChanges();
      const side: RrPaneGroup = f.debugElement.query((d) => d.nativeElement.classList?.contains('side')).componentInstance;
      const plain: RrPaneGroup = f.debugElement.query((d) => d.nativeElement.classList?.contains('plain')).componentInstance;

      expect(side.itemId()).toBe('side');
      expect(side.itemLabel()).toBe('Side');
      expect(side.regionId()).toBeNull();
      expect(side.basisSpec()).toEqual({ unit: 'px', value: 280 });
      expect(side.minSize()).toBe(200);
      expect(side.maxSize()).toBe(400);
      expect(side.isCollapsed()).toBe(false);
      expect(side.collapsedSize()).toBe(0);
      expect(plain.itemId()).toMatch(/^rr-pane-group-\d+$/);
      expect(plain.minSize()).toBe(80);
      expect(plain.maxSize()).toBeNull();

      const labels = Array.from(f.nativeElement.querySelectorAll('[role="separator"]'), (h: Element) => h.getAttribute('aria-label'));
      expect(labels).toEqual(['Resize Side', 'Resize pane']);
    });
  });

  describe('splitters', () => {
    it('renders an accessible splitter between items', () => {
      create();
      expect(handle.getAttribute('aria-orientation')).toBe('vertical');
      expect(handle.getAttribute('aria-label')).toBe('Resize Units');
      expect(handle.getAttribute('aria-controls')).toBe('units-body');
      expect(handle.style.gridColumn).toBe('2');
      expect(handle.getAttribute('aria-valuenow')).toBeNull();
    });

    it('disables the splitter next to a collapsed pane', () => {
      create();
      host.unitsCollapsed.set(true);
      fixture.detectChanges();
      expect(handle.getAttribute('aria-disabled')).toBe('true');
    });

    it('renders no splitters when not resizable', () => {
      create();
      expect(splitterOf(inner)).toBeNull();
    });

    it('puts a stacked group’s splitter on a row', () => {
      create();
      host.innerResizable.set(true);
      fixture.detectChanges();
      expect(splitterOf(inner).style.gridRow).toBe('2');
      expect(splitterOf(inner).style.gridColumn).toBe('1');
    });

    it('measures on focus so aria-valuenow is right before the first key press', () => {
      create();
      layOut();
      handle.focus();
      fixture.detectChanges();
      expect(handle.getAttribute('aria-valuenow')).toBe('300');
    });
  });

  describe('collapse and expand by id', () => {
    const collapsedPanes = () =>
      Array.from(el.querySelectorAll('rr-pane'), (p) => p.hasAttribute('data-collapsed'));

    it('reaches panes inside nested groups', () => {
      create();
      const group = groupComponent('outer');

      group.collapseAll();
      fixture.detectChanges();
      expect(collapsedPanes()).toEqual([true, true, true]);

      group.expand('deck');
      group.toggle('grid');
      fixture.detectChanges();
      expect(collapsedPanes()).toEqual([true, false, false]);

      group.expandAll();
      fixture.detectChanges();
      expect(collapsedPanes()).toEqual([false, false, false]);
    });

    it('updates a [(collapsed)] binding', () => {
      create();
      groupComponent('outer').collapse('units');
      expect(host.unitsCollapsed()).toBe(true);
    });

    it('ignores unknown ids and the ids of groups', () => {
      create();
      const group = groupComponent('outer');
      for (const id of ['unknown', 'work']) {
        group.collapse(id);
        group.toggle(id);
      }
      fixture.detectChanges();
      expect(collapsedPanes()).toEqual([false, false, false]);
    });
  });

  describe('resizing with the keyboard', () => {
    it('moves the splitter by the step, keeping the two panes’ total the same', () => {
      create();
      layOut();

      press(handle, 'ArrowRight');
      fixture.detectChanges();
      expect(outer.style.gridTemplateColumns).toBe('minmax(80px, 316fr) 8px minmax(80px, 684fr)');
      expect(handle.getAttribute('aria-valuenow')).toBe('316');

      press(handle, 'ArrowLeft', true);
      fixture.detectChanges();
      expect(outer.style.gridTemplateColumns).toBe('minmax(80px, 252fr) 8px minmax(80px, 748fr)');
      expect(host.resized).toEqual([[316, 684], [252, 748]]);
    });

    it('resizes stacked panes along their height', () => {
      create();
      host.innerResizable.set(true);
      fixture.detectChanges();
      layOut();

      press(splitterOf(inner), 'ArrowDown');
      fixture.detectChanges();
      expect(inner.style.gridTemplateRows).toBe('minmax(80px, 316fr) 8px minmax(80px, 284fr)');
    });

    it('supports Home, End, Enter and double-click', () => {
      create();
      layOut();

      press(handle, 'Home');
      fixture.detectChanges();
      expect(outer.style.gridTemplateColumns).toBe('minmax(80px, 80fr) 8px minmax(80px, 920fr)');

      press(handle, 'End');
      fixture.detectChanges();
      expect(outer.style.gridTemplateColumns).toBe('minmax(80px, 920fr) 8px minmax(80px, 80fr)');

      press(handle, 'Enter');
      fixture.detectChanges();
      expect(outer.style.gridTemplateColumns).toBe('minmax(80px, 300fr) 8px minmax(80px, 700fr)');

      press(handle, 'End');
      mouse(handle, 'dblclick');
      fixture.detectChanges();
      expect(outer.style.gridTemplateColumns).toBe('minmax(80px, 300fr) 8px minmax(80px, 700fr)');
    });

    it('turns the collapse animation off while resizing, and back on two frames later', () => {
      // Hold the animation frames and run them by hand. No timers are involved, so this works
      // the same with real or fake timers.
      const frames: FrameRequestCallback[] = [];
      jest.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => frames.push(callback));
      create();
      layOut();

      press(handle, 'ArrowRight');
      press(handle, 'ArrowRight'); // a second key restarts the wait
      fixture.detectChanges();
      expect(outer.hasAttribute('data-resizing')).toBe(true);

      while (frames.length) frames.shift()!(0);
      fixture.detectChanges();
      expect(outer.hasAttribute('data-resizing')).toBe(false);
    });

    it('cancels the pending frame when destroyed', () => {
      create();
      layOut();
      const cancel = jest.spyOn(globalThis, 'cancelAnimationFrame');

      press(handle, 'ArrowRight');
      cancel.mockClear();
      fixture.destroy();

      expect(cancel).toHaveBeenCalled();
    });

    it('does nothing when the group has no size yet (hidden or not attached)', () => {
      create();
      const before = outer.style.gridTemplateColumns;
      for (const key of ['ArrowRight', 'Home', 'End', 'Enter']) press(handle, key);
      mouse(handle, 'pointerdown');
      mouse(handle, 'pointermove', 50);
      mouse(handle, 'pointerup');
      fixture.detectChanges();

      expect(outer.style.gridTemplateColumns).toBe(before);
      expect(host.resized).toEqual([]);
    });
  });

  describe('resizing with the mouse', () => {
    it('drags the splitter and reports the new sizes when released', () => {
      create();
      layOut();

      mouse(handle, 'pointerdown', 500);
      fixture.detectChanges();
      expect(outer.hasAttribute('data-resizing')).toBe(true);

      mouse(handle, 'pointermove', 550);
      fixture.detectChanges();
      expect(outer.style.gridTemplateColumns).toBe('minmax(80px, 350fr) 8px minmax(80px, 650fr)');
      expect(host.resized).toEqual([]);

      mouse(handle, 'pointerup', 550);
      fixture.detectChanges();
      expect(outer.hasAttribute('data-resizing')).toBe(false);
      expect(host.resized).toEqual([[350, 650]]);
    });

    it('stops at the minimum size', () => {
      create();
      layOut();
      mouse(handle, 'pointerdown', 500);
      mouse(handle, 'pointermove', -500);
      fixture.detectChanges();
      expect(outer.style.gridTemplateColumns).toBe('minmax(80px, 80fr) 8px minmax(80px, 920fr)');
    });

    it('stops the drag if a neighbouring pane collapses during it', () => {
      create();
      layOut();
      mouse(handle, 'pointerdown', 500);
      mouse(handle, 'pointermove', 520);

      host.unitsCollapsed.set(true);
      fixture.detectChanges();
      mouse(handle, 'pointermove', 600);
      fixture.detectChanges();

      expect(outer.hasAttribute('data-resizing')).toBe(false);
      expect(host.resized).toEqual([[320, 680]]);
    });

    it('discards a drag if the panes change during it', () => {
      @Component({
        standalone: true,
        imports: [RrPane, RrPaneGroup],
        template: `
          <rr-pane-group [resizable]="true" stateKey="list" (resized)="resized.push($event)">
            @for (name of names(); track name) {
              <rr-pane [label]="name" [paneId]="name" />
            }
          </rr-pane-group>`,
      })
      class ListHost {
        names = signal(['a', 'b']);
        resized: (readonly number[])[] = [];
      }

      const list = TestBed.createComponent(ListHost);
      list.detectChanges();
      const group: HTMLElement = list.nativeElement.querySelector('rr-pane-group');
      list.nativeElement.querySelectorAll('rr-pane').forEach((p: Element) => setSize(p, 500));

      mouse(splitterOf(group), 'pointerdown');
      list.componentInstance.names.set(['a', 'b', 'c']);
      list.detectChanges();
      mouse(splitterOf(group), 'pointerup');

      expect(list.componentInstance.resized).toEqual([]);
      expect(localStorage.getItem('rr-panes:list')).toBeNull();
    });
  });

  it('keeps a size with its pane when the panes are reordered', () => {
    @Component({
      standalone: true,
      imports: [RrPane, RrPaneGroup],
      template: `
        <rr-pane-group [resizable]="true">
          @for (name of names(); track name) {
            <rr-pane [label]="name" [class]="name" />
          }
        </rr-pane-group>`,
    })
    class SortHost {
      names = signal(['a', 'b']);
    }

    const sort = TestBed.createComponent(SortHost);
    sort.detectChanges();
    setSize(sort.nativeElement.querySelector('.a'), 300);
    setSize(sort.nativeElement.querySelector('.b'), 700);
    const group: HTMLElement = sort.nativeElement.querySelector('rr-pane-group');

    press(splitterOf(group), 'ArrowRight');
    sort.detectChanges();
    expect(group.style.gridTemplateColumns).toBe('minmax(80px, 316fr) 8px minmax(80px, 684fr)');

    sort.componentInstance.names.set(['b', 'a']);
    sort.detectChanges();
    expect(group.style.gridTemplateColumns).toBe('minmax(80px, 684fr) 8px minmax(80px, 316fr)');
  });

  describe('saving sizes', () => {
    it('saves the sizes under its stateKey and restores them on the first render', () => {
      create('demo');
      layOut();
      press(handle, 'Enter'); // a reset saves at once
      fixture.destroy();
      expect(JSON.parse(localStorage.getItem('rr-panes:demo')!)).toEqual({
        v: 1,
        weights: [300, 700],
        ids: ['units', 'work'],
      });

      localStorage.setItem('rr-panes:demo', '{"v":1,"weights":[420,580]}');
      create('demo');
      expect(outer.style.gridTemplateColumns).toBe('minmax(80px, 420fr) 8px minmax(80px, 580fr)');
    });

    it('saves a drag as soon as it ends', () => {
      create('drag');
      layOut();
      mouse(handle, 'pointerdown', 0);
      mouse(handle, 'pointermove', 40);
      mouse(handle, 'pointerup', 40);
      expect(JSON.parse(localStorage.getItem('rr-panes:drag')!).weights).toEqual([340, 660]);
    });

    it('saves the old layout and shows the new one when the stateKey changes', () => {
      localStorage.setItem('rr-panes:b', '{"v":1,"weights":[420,580]}');
      create('a');
      layOut();

      press(handle, 'ArrowRight');
      expect(localStorage.getItem('rr-panes:a')).toBeNull(); // key presses save after a short wait

      host.stateKey.set('b');
      fixture.detectChanges();
      expect(JSON.parse(localStorage.getItem('rr-panes:a')!).weights).toEqual([316, 684]);
      expect(outer.style.gridTemplateColumns).toBe('minmax(80px, 420fr) 8px minmax(80px, 580fr)');
    });

    it('resetSizes() forgets the saved sizes and shows the declared ones', () => {
      localStorage.setItem('rr-panes:demo', '{"v":1,"weights":[420,580]}');
      create('demo');

      groupComponent('outer').resetSizes();
      fixture.detectChanges();

      expect(localStorage.getItem('rr-panes:demo')).toBeNull();
      expect(outer.style.gridTemplateColumns).toBe('minmax(80px, 30fr) 8px minmax(80px, 70fr)');
    });

    it('saves nothing without a stateKey', () => {
      create();
      layOut();
      press(handle, 'ArrowRight');
      fixture.destroy();
      expect(localStorage.length).toBe(0);
    });
  });
});
