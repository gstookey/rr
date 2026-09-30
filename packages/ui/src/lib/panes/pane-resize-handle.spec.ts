import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RrPaneResizeHandle } from './pane-resize-handle';

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
class TestHost {
  orientation = signal<'inline' | 'block'>('inline');
  disabled = signal(false);
  events: string[] = [];
}

// Plain MouseEvents: jsdom has no PointerEvent before v22, and the handle only reads the
// position and the button.
function mouse(el: HTMLElement, type: string, x = 0, y = 0, button = 0): MouseEvent {
  const event = new MouseEvent(type, { clientX: x, clientY: y, button, bubbles: true, cancelable: true });
  el.dispatchEvent(event);
  return event;
}

function press(el: HTMLElement, key: string, shiftKey = false): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true });
  el.dispatchEvent(event);
  return event;
}

describe('RrPaneResizeHandle', () => {
  let host: TestHost;
  let handle: HTMLElement;
  let render: () => void;

  beforeEach(() => {
    const fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    render = () => fixture.detectChanges();
    render();
    handle = fixture.nativeElement.querySelector('[rrPaneResizeHandle]');
  });

  it('is an accessible splitter', () => {
    expect(handle.getAttribute('role')).toBe('separator');
    expect(handle.getAttribute('tabindex')).toBe('0');
    expect(handle.getAttribute('aria-label')).toBe('Resize Units');
    expect(handle.getAttribute('aria-controls')).toBe('units-body');
    expect(handle.getAttribute('aria-valuenow')).toBe('300');
    expect(handle.getAttribute('aria-valuemin')).toBe('80');
    expect(handle.getAttribute('aria-valuemax')).toBe('900');
  });

  it('draws a vertical line between side-by-side panes and a horizontal one between stacked panes', () => {
    expect(handle.getAttribute('aria-orientation')).toBe('vertical');
    host.orientation.set('block');
    render();
    expect(handle.getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('leaves the tab order when disabled', () => {
    host.disabled.set(true);
    render();
    expect(handle.getAttribute('tabindex')).toBe('-1');
    expect(handle.getAttribute('aria-disabled')).toBe('true');
  });

  describe('dragging', () => {
    it('reports start, the distance moved since the start, and end', () => {
      const down = mouse(handle, 'pointerdown', 100);
      render();
      expect(down.defaultPrevented).toBe(true);
      expect(handle.hasAttribute('data-dragging')).toBe(true);

      mouse(handle, 'pointermove', 110);
      mouse(handle, 'pointermove', 140);
      mouse(handle, 'pointerup', 140);
      render();

      expect(host.events).toEqual(['start', 'move 10', 'move 40', 'end']);
      expect(handle.hasAttribute('data-dragging')).toBe(false);
    });

    it('uses the vertical position for a block splitter', () => {
      host.orientation.set('block');
      render();
      mouse(handle, 'pointerdown', 0, 200);
      mouse(handle, 'pointermove', 0, 170);
      expect(host.events).toEqual(['start', 'move -30']);
    });

    it('captures the pointer so a fast drag keeps reporting', () => {
      handle.setPointerCapture = jest.fn();
      mouse(handle, 'pointerdown');
      expect(handle.setPointerCapture).toHaveBeenCalled();
    });

    it('ends on pointercancel and lostpointercapture too', () => {
      mouse(handle, 'pointerdown');
      mouse(handle, 'pointercancel');
      mouse(handle, 'pointerdown');
      mouse(handle, 'lostpointercapture');
      expect(host.events).toEqual(['start', 'end', 'start', 'end']);
    });

    it('ignores moves and releases when no drag is in progress', () => {
      mouse(handle, 'pointermove', 50);
      mouse(handle, 'pointerup', 50);
      expect(host.events).toEqual([]);
    });

    it('ignores the right mouse button, and everything while disabled', () => {
      mouse(handle, 'pointerdown', 0, 0, 2);
      host.disabled.set(true);
      render();
      mouse(handle, 'pointerdown');
      expect(host.events).toEqual([]);
    });

    it('reverses a horizontal drag in a right-to-left layout', () => {
      handle.style.direction = 'rtl';
      mouse(handle, 'pointerdown', 100);
      mouse(handle, 'pointermove', 60);
      expect(host.events).toEqual(['start', 'move 40']);
    });
  });

  describe('keyboard', () => {
    it('steps with the arrow keys, and by the large step with Shift', () => {
      const right = press(handle, 'ArrowRight');
      press(handle, 'ArrowLeft');
      press(handle, 'ArrowRight', true);
      expect(host.events).toEqual(['step 10', 'step -10', 'step 50']);
      expect(right.defaultPrevented).toBe(true);
    });

    it('uses up and down for a block splitter', () => {
      host.orientation.set('block');
      render();
      press(handle, 'ArrowDown');
      press(handle, 'ArrowUp', true);
      expect(host.events).toEqual(['step 10', 'step -50']);
    });

    it('leaves other keys alone', () => {
      const down = press(handle, 'ArrowDown');
      press(handle, 'Tab');
      expect(host.events).toEqual([]);
      expect(down.defaultPrevented).toBe(false);
    });

    it('supports Home, End and Enter', () => {
      press(handle, 'Home');
      press(handle, 'End');
      press(handle, 'Enter');
      expect(host.events).toEqual(['extreme min', 'extreme max', 'reset']);
    });

    it('keeps the arrow keys matching the screen in a right-to-left layout', () => {
      handle.style.direction = 'rtl';
      press(handle, 'ArrowRight');
      press(handle, 'ArrowLeft');
      expect(host.events).toEqual(['step -10', 'step 10']);
    });

    it('does nothing while disabled', () => {
      host.disabled.set(true);
      render();
      press(handle, 'ArrowRight');
      press(handle, 'Enter');
      expect(host.events).toEqual([]);
    });
  });

  it('resets on double-click, unless disabled', () => {
    mouse(handle, 'dblclick');
    host.disabled.set(true);
    render();
    mouse(handle, 'dblclick');
    expect(host.events).toEqual(['reset']);
  });

  it('reports focus', () => {
    handle.focus();
    expect(host.events).toEqual(['focus']);
  });
});
