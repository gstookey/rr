import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { RrPane } from './pane';
import { RrPaneGroup } from './pane-group';
import type { RrPaneItem } from './pane-item';
import { provideRrPanes } from './panes.config';
import { key, patch, pointer, recorder, restorePatches, settle, stubSize } from './testing/panes-testing';

const cols = (el: HTMLElement): string => el.style.gridTemplateColumns;
const rows = (el: HTMLElement): string => el.style.gridTemplateRows;

@Component({
  standalone: true,
  imports: [RrPane, RrPaneGroup],
  template: `
    <rr-pane-group #g="rrPaneGroup" class="outer" orientation="inline" [resizable]="true"
                   [stateKey]="stateKey()" (resized)="resized.push($event)">
      <rr-pane label="Units" paneId="units" basis="30%" [(collapsed)]="unitsCollapsed" />
      <rr-pane-group class="inner" groupId="work" orientation="block" [resizable]="innerResizable()">
        <rr-pane label="Grid" paneId="grid" />
        <rr-pane label="Details" paneId="deck" />
      </rr-pane-group>
    </rr-pane-group>`,
})
class Host {
  readonly stateKey = signal<string | null>(null);
  readonly unitsCollapsed = signal(false);
  readonly innerResizable = signal(false);
  readonly resized: (readonly number[])[] = [];
}

const outer = (root: HTMLElement) => root.querySelector('.outer') as HTMLElement;
const inner = (root: HTMLElement) => root.querySelector('.inner') as HTMLElement;
const panes = (root: HTMLElement) => [...root.querySelectorAll('rr-pane')] as HTMLElement[];
const splitter = (group: HTMLElement) => group.querySelector(':scope > [role="separator"]') as HTMLElement;
const groupOf = (f: ComponentFixture<unknown>, cls: string) =>
  f.debugElement.query((d) => d.nativeElement.classList?.contains(cls)).componentInstance as RrPaneGroup;

/** Render the standard layout, laid out at Units 300 · work area 700 (grid/deck 300 each). */
async function laidOut() {
  const f = TestBed.createComponent(Host);
  await settle(f);
  const root = f.nativeElement as HTMLElement;
  stubSize(root.querySelector('rr-pane[paneid="units"]') as Element, 300);
  stubSize(inner(root), 700);
  stubSize(root.querySelector('rr-pane[paneid="grid"]') as Element, 700, 300);
  stubSize(root.querySelector('rr-pane[paneid="deck"]') as Element, 700, 300);
  return { f, root, handle: splitter(outer(root)) };
}

describe('RrPaneGroup', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => restorePatches());

  describe('arrangement', () => {
    // WHY: the whole point — declared bases become tracks with NO measurement, so the very
    // first render is the final layout.
    it('turns declared bases into grid tracks on the first render', async () => {
      const f = TestBed.createComponent(Host);
      await settle(f);
      expect(cols(outer(f.nativeElement))).toBe('minmax(80px, 30fr) 8px minmax(80px, 70fr)');
      expect(rows(outer(f.nativeElement))).toBe('minmax(0, 1fr)');
      expect(rows(inner(f.nativeElement))).toBe('minmax(80px, 50fr) 8px minmax(80px, 50fr)');
      expect(cols(inner(f.nativeElement))).toBe('minmax(0, 1fr)');
    });

    it('sees only its DIRECT items — a nested group is one item, not its panes', async () => {
      const f = TestBed.createComponent(Host);
      await settle(f);
      // outer: Units + inner group = 2 items → one gap; inner: 2 panes → one gap.
      expect(cols(outer(f.nativeElement)).split(' 8px ')).toHaveLength(2);
    });

    it('places each item on its own grid line and gives panes the group orientation', async () => {
      const f = TestBed.createComponent(Host);
      await settle(f);
      const [units, grid, deck] = panes(f.nativeElement);
      expect(units.style.gridColumn).toBe('1');
      expect(inner(f.nativeElement).style.gridColumn).toBe('3');
      expect(grid.style.gridRow).toBe('1');
      expect(deck.style.gridRow).toBe('3');
      expect(units.getAttribute('data-orientation')).toBe('inline');
      expect(grid.getAttribute('data-orientation')).toBe('block');
      expect(outer(f.nativeElement).style.gridColumn).toBe(''); // a root group places nothing
    });

    it('places nothing for an item that is not its own', async () => {
      const f = TestBed.createComponent(Host);
      await settle(f);
      expect(groupOf(f, 'outer').placementOf({} as RrPaneItem)).toBeNull();
    });

    // WHY: collapse needs no redistribution math — the collapsed track becomes 0fr and CSS
    // Grid hands its space to the siblings.
    it('renders a collapsed pane as its collapsed-size track', async () => {
      const f = TestBed.createComponent(Host);
      f.componentInstance.unitsCollapsed.set(true);
      await settle(f);
      expect(cols(outer(f.nativeElement))).toBe('minmax(26px, 0fr) 8px minmax(80px, 70fr)');
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
      await settle(f);
      const group = f.nativeElement.querySelector('rr-pane-group') as HTMLElement;
      expect(cols(group)).toBe('minmax(80px, 50fr) 8px minmax(80px, 50fr)');

      f.componentInstance.names.set(['a', 'b', 'c', 'd']);
      await settle(f);
      expect(cols(group).split(' 8px ')).toHaveLength(4);
    });

    it('takes its gap and resizability from config, and lets an input override the gap', async () => {
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
      await settle(f);
      const [a, b] = ['.a', '.b'].map((s) => f.nativeElement.querySelector(s) as HTMLElement);
      expect(cols(a)).toBe('minmax(80px, 50fr) 4px minmax(80px, 50fr)');
      expect(cols(b)).toBe('minmax(80px, 50fr) 12px minmax(80px, 50fr)');
      expect(splitter(a)).not.toBeNull(); // resizable from config
    });

    // WHY: a nested group is an item of its parent exactly like a pane — it has a basis,
    // bounds and an id, and it never collapses itself.
    it('acts as an item of its parent group', async () => {
      @Component({
        standalone: true,
        imports: [RrPane, RrPaneGroup],
        template: `
          <rr-pane-group [resizable]="true">
            <rr-pane-group class="side" groupId="side" label="Side" basis="280px" [min]="200" [max]="400">
              <rr-pane label="1" />
            </rr-pane-group>
            <rr-pane-group class="bare"><rr-pane label="2" /></rr-pane-group>
            <rr-pane label="3" />
          </rr-pane-group>`,
      })
      class NestHost {}
      const f = TestBed.createComponent(NestHost);
      await settle(f);
      const side = groupOf(f, 'side');
      const bare = groupOf(f, 'bare');
      expect([side.itemId(), side.itemLabel(), side.regionId()]).toEqual(['side', 'Side', null]);
      expect([side.basisSpec(), side.minSize(), side.maxSize()]).toEqual([{ unit: 'px', value: 280 }, 200, 400]);
      expect([side.isCollapsed(), side.collapsedSize()]).toEqual([false, 0]);
      expect([bare.itemId(), bare.minSize(), bare.maxSize()]).toEqual([expect.stringMatching(/^rr-pane-group-\d+$/), 80, null]);

      const labels = [...f.nativeElement.querySelectorAll('[role="separator"]')].map((h) => h.getAttribute('aria-label'));
      expect(labels).toEqual(['Resize Side', 'Resize pane']); // an unlabelled item still names its splitter
    });
  });

  describe('splitters', () => {
    it('renders one accessible splitter per boundary, inert beside a collapsed pane', async () => {
      const f = TestBed.createComponent(Host);
      await settle(f);
      const handle = () => splitter(outer(f.nativeElement));
      expect(handle().getAttribute('aria-orientation')).toBe('vertical');
      expect(handle().getAttribute('aria-label')).toBe('Resize Units');
      expect(handle().getAttribute('aria-controls')).toBe('units-body');
      expect(handle().style.gridColumn).toBe('2');
      expect(handle().getAttribute('aria-disabled')).toBeNull();
      expect(handle().getAttribute('aria-valuenow')).toBeNull(); // unknown until measured

      f.componentInstance.unitsCollapsed.set(true);
      await settle(f);
      expect(handle().getAttribute('aria-disabled')).toBe('true');
      expect(handle().getAttribute('tabindex')).toBe('-1');
    });

    it('renders no splitters when not resizable', async () => {
      const f = TestBed.createComponent(Host);
      await settle(f);
      expect(splitter(inner(f.nativeElement))).toBeNull();
    });

    it('places a block group’s splitter on a row line', async () => {
      const f = TestBed.createComponent(Host);
      f.componentInstance.innerResizable.set(true);
      await settle(f);
      const handle = splitter(inner(f.nativeElement));
      expect([handle.style.gridRow, handle.style.gridColumn]).toEqual(['2', '1']);
      expect(handle.getAttribute('aria-orientation')).toBe('horizontal');
    });

    // WHY: aria-valuenow must be right the moment a screen reader lands on the splitter,
    // before any key has been pressed.
    it('measures on focus, so the value is announced before the first key', async () => {
      const { f, handle } = await laidOut();
      handle.focus();
      await settle(f);
      expect(handle.getAttribute('aria-valuenow')).toBe('300');
    });
  });

  describe('imperative API', () => {
    // WHY: "collapse all" on a layout root means every pane in it — found in the browser,
    // where it had only collapsed the root's direct panes and left nested ones open.
    it('reaches into nested groups for collapseAll / expandAll and for ids', async () => {
      const f = TestBed.createComponent(Host);
      await settle(f);
      const g = groupOf(f, 'outer');
      const collapsed = () => panes(f.nativeElement).map((p) => p.hasAttribute('data-collapsed'));

      g.collapseAll();
      await settle(f);
      expect(collapsed()).toEqual([true, true, true]);

      g.expand('deck');
      await settle(f);
      expect(collapsed()).toEqual([true, true, false]);

      g.toggle('grid');
      await settle(f);
      expect(collapsed()).toEqual([true, false, false]);

      g.expandAll();
      await settle(f);
      expect(collapsed()).toEqual([false, false, false]);
    });

    it('writes intent, so a two-way binding follows', async () => {
      const f = TestBed.createComponent(Host);
      await settle(f);
      const g = groupOf(f, 'outer');

      g.collapse('units');
      await settle(f);
      expect(f.componentInstance.unitsCollapsed()).toBe(true);

      g.toggle('units');
      await settle(f);
      expect(f.componentInstance.unitsCollapsed()).toBe(false);
    });

    it('ignores an id it does not know, and one that names a group', async () => {
      const f = TestBed.createComponent(Host);
      await settle(f);
      const g = groupOf(f, 'outer');
      for (const id of ['nope', 'work']) {
        g.collapse(id);
        g.expand(id);
        g.toggle(id);
      }
      await settle(f);
      expect(panes(f.nativeElement).some((p) => p.hasAttribute('data-collapsed'))).toBe(false);
    });
  });

  describe('keyboard resizing', () => {
    it('moves the boundary by the keyboard step, conserving the pair', async () => {
      const { f, root, handle } = await laidOut();
      handle.dispatchEvent(key('ArrowRight'));
      await settle(f);
      expect(cols(outer(root))).toBe('minmax(80px, 316fr) 8px minmax(80px, 684fr)');
      expect(handle.getAttribute('aria-valuenow')).toBe('316');

      handle.dispatchEvent(key('ArrowLeft', { shiftKey: true }));
      await settle(f);
      expect(cols(outer(root))).toBe('minmax(80px, 252fr) 8px minmax(80px, 748fr)');
      expect(f.componentInstance.resized).toEqual([[316, 684], [252, 748]]);
    });

    it('resizes a block group along its rows', async () => {
      const { f, root } = await laidOut();
      f.componentInstance.innerResizable.set(true);
      await settle(f);
      splitter(inner(root)).dispatchEvent(key('ArrowDown'));
      await settle(f);
      expect(rows(inner(root))).toBe('minmax(80px, 316fr) 8px minmax(80px, 284fr)');
    });

    it('Home and End send the pane to its bounds; Enter and double-click restore the declared split', async () => {
      const { f, root, handle } = await laidOut();
      handle.dispatchEvent(key('Home'));
      await settle(f);
      expect(cols(outer(root))).toBe('minmax(80px, 80fr) 8px minmax(80px, 920fr)');

      handle.dispatchEvent(key('End'));
      await settle(f);
      expect(cols(outer(root))).toBe('minmax(80px, 920fr) 8px minmax(80px, 80fr)');

      handle.dispatchEvent(key('Enter'));
      await settle(f);
      expect(cols(outer(root))).toBe('minmax(80px, 300fr) 8px minmax(80px, 700fr)');

      handle.dispatchEvent(key('End'));
      handle.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      await settle(f);
      expect(cols(outer(root))).toBe('minmax(80px, 300fr) 8px minmax(80px, 700fr)');
    });

    // WHY: a hidden or detached group reports zero sizes. Resizing then must do nothing,
    // not normalise every pane down to its minimum.
    it('ignores every kind of resize while the group is not laid out', async () => {
      const f = TestBed.createComponent(Host);
      await settle(f);
      const before = cols(outer(f.nativeElement));
      const handle = splitter(outer(f.nativeElement));
      for (const k of ['ArrowRight', 'Home', 'End', 'Enter']) handle.dispatchEvent(key(k));
      handle.dispatchEvent(pointer('pointerdown', 'x', 0));
      handle.dispatchEvent(pointer('pointermove', 'x', 50));
      handle.dispatchEvent(pointer('pointerup', 'x', 50));
      await settle(f);
      expect(cols(outer(f.nativeElement))).toBe(before);
      expect(f.componentInstance.resized).toEqual([]);
    });

    describe('THE SPLITTER MOVES INSTANTLY; ONLY COLLAPSE ANIMATES', () => {
      /** Hand-cranked animation frames: a keyboard step's chain runs only when told to. */
      function frames() {
        const queue = new Map<number, FrameRequestCallback>();
        let id = 0;
        const cancel = recorder((n: number) => {
          queue.delete(n);
        });
        patch(globalThis, 'requestAnimationFrame', (cb: FrameRequestCallback) => {
          queue.set(++id, cb);
          return id;
        });
        patch(globalThis, 'cancelAnimationFrame', cancel);
        return {
          cancel,
          issuedSince: (from: number) => Array.from({ length: id - from }, (_, i) => from + i + 1),
          get lastId() {
            return id;
          },
          runAll() {
            while (queue.size) {
              const [n, cb] = queue.entries().next().value as [number, FrameRequestCallback];
              queue.delete(n);
              cb(0);
            }
          },
        };
      }

      // WHY: found in the browser — a keyboard step ran through the collapse transition, so held
      // keys rubber-banded and the screen lagged the announced aria-valuenow.
      it('suppresses the transition for a keyboard resize, then restores it two frames later', async () => {
        const raf = frames();
        const { f, root, handle } = await laidOut();
        expect(outer(root).hasAttribute('data-resizing')).toBe(false);

        handle.dispatchEvent(key('ArrowRight'));
        await settle(f);
        expect(outer(root).hasAttribute('data-resizing')).toBe(true);

        raf.runAll();
        await settle(f);
        expect(outer(root).hasAttribute('data-resizing')).toBe(false);
      });

      it('restarts the two-frame window on every key of a burst', async () => {
        const raf = frames();
        const { handle } = await laidOut();
        const before = raf.lastId;
        handle.dispatchEvent(key('ArrowRight'));
        const fromFirstKey = raf.issuedSince(before);
        handle.dispatchEvent(key('ArrowRight'));
        expect(raf.cancel.calls.some(([n]) => fromFirstKey.includes(n))).toBe(true);
      });

      // WHY: found in review — a group torn down inside that window must not leave the frames
      // running. Angular's own scheduler also requests and cancels frames, so only a cancel
      // made BY THE DESTROY, of a frame the keyboard step requested, counts.
      it('cancels the pending frame when destroyed', async () => {
        const raf = frames();
        const { f, handle } = await laidOut();
        const before = raf.lastId;
        handle.dispatchEvent(key('ArrowRight'));
        const fromStep = raf.issuedSince(before);
        raf.cancel.calls.length = 0;
        f.destroy();
        expect(raf.cancel.calls.some(([n]) => fromStep.includes(n))).toBe(true);
      });

      it('leaves the transition off where there are no animation frames', async () => {
        const { f, root, handle } = await laidOut();
        patch(globalThis, 'requestAnimationFrame', undefined);
        handle.dispatchEvent(key('ArrowRight'));
        await settle(f);
        expect(cols(outer(root))).toBe('minmax(80px, 316fr) 8px minmax(80px, 684fr)');
        expect(outer(root).hasAttribute('data-resizing')).toBe(true);
      });
    });
  });

  describe('pointer resizing', () => {
    it('drags the boundary, conserving the pair, and reports when the drag ends', async () => {
      const { f, root, handle } = await laidOut();
      handle.dispatchEvent(pointer('pointerdown', 'x', 500));
      await settle(f);
      expect(outer(root).hasAttribute('data-resizing')).toBe(true);

      handle.dispatchEvent(pointer('pointermove', 'x', 530));
      handle.dispatchEvent(pointer('pointermove', 'x', 550));
      await settle(f);
      expect(cols(outer(root))).toBe('minmax(80px, 350fr) 8px minmax(80px, 650fr)');
      expect(f.componentInstance.resized).toEqual([]); // not while dragging

      handle.dispatchEvent(pointer('pointerup', 'x', 550));
      await settle(f);
      expect(outer(root).hasAttribute('data-resizing')).toBe(false);
      expect(f.componentInstance.resized).toEqual([[350, 650]]);
    });

    it('clamps a drag at the minimum of either neighbour', async () => {
      const { f, root, handle } = await laidOut();
      handle.dispatchEvent(pointer('pointerdown', 'x', 500));
      handle.dispatchEvent(pointer('pointermove', 'x', -500));
      await settle(f);
      expect(cols(outer(root))).toBe('minmax(80px, 80fr) 8px minmax(80px, 920fr)');
    });

    // WHY (TrAIdit F3): a neighbour can collapse mid-drag — by a shortcut, or the app. The
    // drag must stop there rather than resize a rail.
    it('ends a drag whose neighbour collapses mid-way', async () => {
      const { f, root, handle } = await laidOut();
      handle.dispatchEvent(pointer('pointerdown', 'x', 500));
      handle.dispatchEvent(pointer('pointermove', 'x', 520));
      f.componentInstance.unitsCollapsed.set(true);
      await settle(f);
      handle.dispatchEvent(pointer('pointermove', 'x', 600));
      await settle(f);
      expect(outer(root).hasAttribute('data-resizing')).toBe(false);
      expect(f.componentInstance.resized).toEqual([[320, 680]]);
    });

    // WHY: sizes are recorded against the items they were made for. If the items change
    // mid-drag, the drag's sizes no longer describe them and must not be written anywhere.
    it('drops a drag whose items changed under it', async () => {
      @Component({
        standalone: true,
        imports: [RrPane, RrPaneGroup],
        template: `
          <rr-pane-group orientation="inline" [resizable]="true" stateKey="list" (resized)="resized.push($event)">
            @for (name of names(); track name) { <rr-pane [label]="name" [paneId]="name" /> }
          </rr-pane-group>`,
      })
      class ListHost {
        readonly names = signal(['a', 'b']);
        readonly resized: (readonly number[])[] = [];
      }
      const f = TestBed.createComponent(ListHost);
      await settle(f);
      const group = f.nativeElement.querySelector('rr-pane-group') as HTMLElement;
      for (const p of panes(f.nativeElement)) stubSize(p, 500);
      const handle = splitter(group);
      handle.dispatchEvent(pointer('pointerdown', 'x', 0));
      f.componentInstance.names.set(['a', 'b', 'c']);
      await settle(f);
      handle.dispatchEvent(pointer('pointerup', 'x', 0));
      await settle(f);
      expect(f.componentInstance.resized).toEqual([]);
      expect(localStorage.getItem('rr-panes:list')).toBeNull();
      expect(cols(group)).toBe('minmax(80px, 33.333fr) 8px minmax(80px, 33.333fr) 8px minmax(80px, 33.333fr)');
    });
  });

  describe('sizes that follow their panes', () => {
    // WHY: a size belongs to a pane, not to a position — found in review. Re-sort the list and
    // the pane the user widened must stay wide.
    it('keeps a resized size with its pane when the list reorders', async () => {
      @Component({
        standalone: true,
        imports: [RrPane, RrPaneGroup],
        template: `
          <rr-pane-group orientation="inline" [resizable]="true">
            @for (name of names(); track name) { <rr-pane [label]="name" [class]="name" /> }
          </rr-pane-group>`,
      })
      class SortHost {
        readonly names = signal(['a', 'b']);
      }
      const f = TestBed.createComponent(SortHost);
      await settle(f);
      stubSize(f.nativeElement.querySelector('.a'), 300);
      stubSize(f.nativeElement.querySelector('.b'), 700);
      const group = f.nativeElement.querySelector('rr-pane-group') as HTMLElement;
      splitter(group).dispatchEvent(key('ArrowRight'));
      await settle(f);
      expect(cols(group)).toBe('minmax(80px, 316fr) 8px minmax(80px, 684fr)');

      f.componentInstance.names.set(['b', 'a']);
      await settle(f);
      expect(cols(group)).toBe('minmax(80px, 684fr) 8px minmax(80px, 316fr)');
    });
  });

  describe('persistence', () => {
    it('persists a resize under its stateKey and restores it on the FIRST render', async () => {
      const first = await laidOut();
      first.f.componentInstance.stateKey.set('demo');
      await settle(first.f);
      first.handle.dispatchEvent(key('Enter')); // reset = flush
      first.f.destroy();
      expect(JSON.parse(localStorage.getItem('rr-panes:demo') ?? 'null')).toEqual({
        v: 1, weights: [300, 700], ids: ['units', 'work'],
      });

      localStorage.setItem('rr-panes:demo', JSON.stringify({ v: 1, weights: [420, 580] }));
      const second = TestBed.createComponent(Host);
      second.componentInstance.stateKey.set('demo');
      await settle(second);
      expect(cols(outer(second.nativeElement))).toBe('minmax(80px, 420fr) 8px minmax(80px, 580fr)');
    });

    it('writes a drag the moment it ends', async () => {
      const { f, handle } = await laidOut();
      f.componentInstance.stateKey.set('drag');
      await settle(f);
      handle.dispatchEvent(pointer('pointerdown', 'x', 0));
      handle.dispatchEvent(pointer('pointermove', 'x', 40));
      handle.dispatchEvent(pointer('pointerup', 'x', 40));
      expect(JSON.parse(localStorage.getItem('rr-panes:drag') ?? 'null')?.weights).toEqual([340, 660]);
    });

    // WHY: a stateKey names a layout. Switching it must show THAT layout, and a write still
    // settling for the old key must land under the old key now — not from an orphaned timer.
    it('switches layouts when the stateKey changes, flushing the old key first', async () => {
      localStorage.setItem('rr-panes:b', JSON.stringify({ v: 1, weights: [420, 580] }));
      const { f, root, handle } = await laidOut();
      f.componentInstance.stateKey.set('a');
      await settle(f);
      handle.dispatchEvent(key('ArrowRight'));
      expect(localStorage.getItem('rr-panes:a')).toBeNull(); // still inside the settle window

      // No waiting: the key change ALONE must write it. (Awaiting whenStable() here would
      // prove nothing under zone.js, which also waits out the settle timer.)
      f.componentInstance.stateKey.set('b');
      f.detectChanges();
      expect(JSON.parse(localStorage.getItem('rr-panes:a') ?? 'null')?.weights).toEqual([316, 684]);
      await settle(f);
      expect(cols(outer(root))).toBe('minmax(80px, 420fr) 8px minmax(80px, 580fr)');
    });

    it('forgets persisted sizes on resetSizes()', async () => {
      localStorage.setItem('rr-panes:demo', JSON.stringify({ v: 1, weights: [420, 580] }));
      const f = TestBed.createComponent(Host);
      f.componentInstance.stateKey.set('demo');
      await settle(f);
      groupOf(f, 'outer').resetSizes();
      await settle(f);
      expect(localStorage.getItem('rr-panes:demo')).toBeNull();
      expect(cols(outer(f.nativeElement))).toBe('minmax(80px, 30fr) 8px minmax(80px, 70fr)');
    });

    it('keeps sizes in memory only when it has no stateKey', async () => {
      const { f, handle } = await laidOut();
      handle.dispatchEvent(key('ArrowRight'));
      await settle(f);
      groupOf(f, 'outer').resetSizes();
      f.destroy();
      expect(localStorage.length).toBe(0);
    });
  });
});
