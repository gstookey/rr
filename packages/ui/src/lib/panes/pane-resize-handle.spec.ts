import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RrPaneResizeHandle } from './pane-resize-handle';
import type { RrPaneOrientation } from './panes.types';
import { key, patch, pointer, recorder, restorePatches, settle } from './testing/panes-testing';

@Component({
  standalone: true,
  imports: [RrPaneResizeHandle],
  template: `
    <div
      rrPaneResizeHandle
      [orientation]="orientation()"
      [disabled]="disabled()"
      [valueNow]="300"
      [valueMin]="80"
      [valueMax]="900"
      label="Resize Units"
      controls="units-body"
      [step]="10"
      [stepLarge]="50"
      (resizeStart)="events.push('start')"
      (resizeMove)="events.push('move ' + $event)"
      (resizeEnd)="events.push('end')"
      (resizeStep)="events.push('step ' + $event)"
      (resizeExtreme)="events.push('extreme ' + $event)"
      (resizeReset)="events.push('reset')"
      (handleFocus)="events.push('focus')"></div>`,
})
class Host {
  readonly orientation = signal<RrPaneOrientation>('inline');
  readonly disabled = signal(false);
  readonly events: string[] = [];
}

async function setup(orientation: RrPaneOrientation = 'inline') {
  const f = TestBed.createComponent(Host);
  f.componentInstance.orientation.set(orientation);
  await settle(f);
  const handle = f.nativeElement.querySelector('[rrPaneResizeHandle]') as HTMLElement;
  return { f, handle, events: f.componentInstance.events };
}

describe('RrPaneResizeHandle', () => {
  afterEach(() => restorePatches());

  it('is an accessible window splitter', async () => {
    const { handle } = await setup();
    expect(handle.getAttribute('role')).toBe('separator');
    expect(handle.getAttribute('tabindex')).toBe('0');
    expect(handle.getAttribute('aria-label')).toBe('Resize Units');
    expect(handle.getAttribute('aria-controls')).toBe('units-body');
    expect(handle.getAttribute('aria-valuenow')).toBe('300');
    expect(handle.getAttribute('aria-valuemin')).toBe('80');
    expect(handle.getAttribute('aria-valuemax')).toBe('900');
    expect(handle.getAttribute('aria-disabled')).toBeNull();
    expect(handle.classList.contains('rr-pane-handle')).toBe(true);
  });

  // WHY: ARIA names a splitter by the LINE it draws. Items side by side (inline) are split by
  // a vertical line; stacked items by a horizontal one.
  it('reports the orientation of the line it draws', async () => {
    expect((await setup('inline')).handle.getAttribute('aria-orientation')).toBe('vertical');
    expect((await setup('block')).handle.getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('leaves the tab order and says so when disabled', async () => {
    const { f, handle } = await setup();
    f.componentInstance.disabled.set(true);
    await settle(f);
    expect(handle.getAttribute('tabindex')).toBe('-1');
    expect(handle.getAttribute('aria-disabled')).toBe('true');
  });

  describe('pointer', () => {
    // WHY: the move reports the TOTAL distance since the drag began, not the step since the
    // last event — so a dropped or coalesced pointermove can never lose distance.
    it('reports a drag as start, total moves and end', async () => {
      const { f, handle, events } = await setup();
      const down = pointer('pointerdown', 'x', 100);
      handle.dispatchEvent(down);
      await settle(f);
      expect(down.defaultPrevented).toBe(true); // no text selection, no native drag
      expect(handle.hasAttribute('data-dragging')).toBe(true);

      handle.dispatchEvent(pointer('pointermove', 'x', 110));
      handle.dispatchEvent(pointer('pointermove', 'x', 140));
      handle.dispatchEvent(pointer('pointerup', 'x', 140));
      await settle(f);
      expect(events).toEqual(['start', 'move 10', 'move 40', 'end']);
      expect(handle.hasAttribute('data-dragging')).toBe(false);
    });

    it('reads the vertical axis for a block splitter', async () => {
      const { handle, events } = await setup('block');
      handle.dispatchEvent(pointer('pointerdown', 'y', 200));
      handle.dispatchEvent(pointer('pointermove', 'y', 170));
      expect(events).toEqual(['start', 'move -30']);
    });

    // WHY: a fast drag leaves the 8px handle within a frame. Capturing the pointer keeps
    // every move flowing to the handle until release.
    it('captures the pointer where the platform supports it', async () => {
      const { handle } = await setup();
      const capture = recorder();
      patch(handle, 'setPointerCapture', capture);
      handle.dispatchEvent(pointer('pointerdown', 'x', 0, 7));
      expect(capture.calls).toEqual([[7]]);
    });

    it('still drags where pointer capture does not exist', async () => {
      const { handle, events } = await setup();
      patch(handle, 'setPointerCapture', undefined);
      handle.dispatchEvent(pointer('pointerdown', 'x', 0));
      handle.dispatchEvent(pointer('pointermove', 'x', 5));
      expect(events).toEqual(['start', 'move 5']);
    });

    it('follows only the pointer that started the drag', async () => {
      const { handle, events } = await setup();
      handle.dispatchEvent(pointer('pointermove', 'x', 50)); // no drag in progress
      handle.dispatchEvent(pointer('pointerdown', 'x', 0, 1));
      handle.dispatchEvent(pointer('pointermove', 'x', 50, 2));
      handle.dispatchEvent(pointer('pointerup', 'x', 50, 2));
      handle.dispatchEvent(pointer('pointermove', 'x', 20, 1));
      expect(events).toEqual(['start', 'move 20']);
    });

    it('ends the drag on cancel or lost capture as well as on release', async () => {
      for (const type of ['pointercancel', 'lostpointercapture']) {
        const { handle, events } = await setup();
        handle.dispatchEvent(pointer('pointerdown', 'x', 0));
        handle.dispatchEvent(pointer(type, 'x', 0));
        handle.dispatchEvent(pointer('pointerup', 'x', 0)); // already ended
        expect(events).toEqual(['start', 'end']);
      }
    });

    it('ignores any button but the primary one, and any pointer while disabled', async () => {
      const { f, handle, events } = await setup();
      handle.dispatchEvent(pointer('pointerdown', 'x', 0, 1, 2));
      f.componentInstance.disabled.set(true);
      await settle(f);
      handle.dispatchEvent(pointer('pointerdown', 'x', 0));
      expect(events).toEqual([]);
    });

    // WHY: in a right-to-left layout the inline axis runs the other way. Dragging towards
    // the end of the line must still grow the item before the handle.
    it('mirrors an inline drag in a right-to-left layout', async () => {
      const { handle, events } = await setup();
      handle.style.direction = 'rtl';
      handle.dispatchEvent(pointer('pointerdown', 'x', 100));
      handle.dispatchEvent(pointer('pointermove', 'x', 60));
      expect(events).toEqual(['start', 'move 40']);
    });
  });

  describe('keyboard', () => {
    it('steps along its own axis, by the large step with Shift', async () => {
      const { handle, events } = await setup();
      const right = key('ArrowRight');
      handle.dispatchEvent(right);
      handle.dispatchEvent(key('ArrowLeft'));
      handle.dispatchEvent(key('ArrowRight', { shiftKey: true }));
      expect(events).toEqual(['step 10', 'step -10', 'step 50']);
      expect(right.defaultPrevented).toBe(true); // the page does not scroll
    });

    it('uses up / down for a block splitter', async () => {
      const { handle, events } = await setup('block');
      handle.dispatchEvent(key('ArrowDown'));
      handle.dispatchEvent(key('ArrowUp', { shiftKey: true }));
      expect(events).toEqual(['step 10', 'step -50']);
    });

    // WHY: a key the splitter does not use must reach the page untouched — Tab, and the
    // other axis's arrows, included.
    it('leaves every other key alone', async () => {
      const { handle, events } = await setup();
      const down = key('ArrowDown');
      handle.dispatchEvent(down);
      handle.dispatchEvent(key('Tab'));
      expect(events).toEqual([]);
      expect(down.defaultPrevented).toBe(false);
    });

    it('sends the item to an extreme with Home / End and resets with Enter', async () => {
      const { handle, events } = await setup();
      handle.dispatchEvent(key('Home'));
      handle.dispatchEvent(key('End'));
      handle.dispatchEvent(key('Enter'));
      expect(events).toEqual(['extreme min', 'extreme max', 'reset']);
    });

    // WHY: arrow keys follow the SCREEN. → moves the splitter right in RTL too — which, with
    // the axis mirrored, means shrinking the item before it.
    it('keeps arrow keys on screen direction in a right-to-left layout', async () => {
      const { handle, events } = await setup();
      handle.style.direction = 'rtl';
      handle.dispatchEvent(key('ArrowRight'));
      handle.dispatchEvent(key('ArrowLeft'));
      expect(events).toEqual(['step -10', 'step 10']);
    });

    it('does nothing while disabled', async () => {
      const { f, handle, events } = await setup();
      f.componentInstance.disabled.set(true);
      await settle(f);
      handle.dispatchEvent(key('ArrowRight'));
      handle.dispatchEvent(key('Enter'));
      expect(events).toEqual([]);
    });
  });

  it('resets on double-click, unless disabled', async () => {
    const { f, handle, events } = await setup();
    handle.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    f.componentInstance.disabled.set(true);
    await settle(f);
    handle.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(events).toEqual(['reset']);
  });

  it('announces focus, so its group can measure before the first key', async () => {
    const { handle, events } = await setup();
    handle.focus();
    expect(events).toEqual(['focus']);
  });
});
