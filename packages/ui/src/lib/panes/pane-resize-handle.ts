import { Directive, ElementRef, computed, inject, input, output, signal } from '@angular/core';
import type { RrPaneOrientation } from './panes.types';

/**
 * `[rrPaneResizeHandle]` — a draggable, keyboard-operable window splitter.
 *
 * Created: 2026-09-25
 *
 * It emits INTENT and does no layout math — the group owns sizes. Pattern: WAI-ARIA window
 * splitter (`role="separator"`, focusable, with a value).
 *
 * Lessons carried over from TrAIdit's workstation resize, where each was paid for once:
 *  • pointer capture on pointerdown, so a fast drag that leaves the handle keeps resizing;
 *  • the delta is measured from the DRAG START, not accumulated per event — no drift;
 *  • Enter and double-click reset (keyboard twin of the mouse gesture);
 *  • a handle beside a collapsed pane is inert — you cannot resize a rail.
 *
 * Listeners are template host bindings, not manual addEventListener, deliberately: that is
 * what makes them trigger change detection under zone.js (Angular 17) AND work zoneless
 * (Angular 22) with no code difference.
 */
@Directive({
  selector: '[rrPaneResizeHandle]',
  standalone: true,
  exportAs: 'rrPaneResizeHandle',
  host: {
    role: 'separator',
    class: 'rr-pane-handle',
    '[attr.tabindex]': 'disabled() ? -1 : 0',
    '[attr.aria-orientation]': 'ariaOrientation()',
    '[attr.aria-valuenow]': 'valueNow()',
    '[attr.aria-valuemin]': 'valueMin()',
    '[attr.aria-valuemax]': 'valueMax()',
    '[attr.aria-label]': 'label()',
    '[attr.aria-controls]': 'controls()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-dragging]': 'dragging() ? "" : null',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerEnd($event)',
    '(pointercancel)': 'onPointerEnd($event)',
    '(lostpointercapture)': 'onPointerEnd($event)',
    '(keydown)': 'onKeydown($event)',
    '(dblclick)': 'onReset()',
    '(focus)': 'handleFocus.emit()',
  },
})
export class RrPaneResizeHandle {
  /** The GROUP's orientation. An inline group's splitter is a vertical line. */
  readonly orientation = input.required<RrPaneOrientation>();
  readonly disabled = input(false);
  readonly valueNow = input<number | null>(null);
  readonly valueMin = input<number | null>(null);
  readonly valueMax = input<number | null>(null);
  readonly label = input('Resize');
  /** Id of the element this splitter resizes (the item before it). */
  readonly controls = input<string | null>(null);
  readonly step = input(16);
  readonly stepLarge = input(64);

  /** Drag began. */
  readonly resizeStart = output<void>();
  /** Boundary moved; the value is the TOTAL delta since the drag began, in px. */
  readonly resizeMove = output<number>();
  readonly resizeEnd = output<void>();
  /** Keyboard nudge; the value is an incremental delta in px. */
  readonly resizeStep = output<number>();
  /** Home / End — send the item before the handle to its min or max. */
  readonly resizeExtreme = output<'min' | 'max'>();
  /** Enter / double-click. */
  readonly resizeReset = output<void>();
  readonly handleFocus = output<void>();

  protected readonly dragging = signal(false);
  protected readonly ariaOrientation = computed(() =>
    this.orientation() === 'inline' ? 'vertical' : 'horizontal',
  );

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private pointerId: number | null = null;
  private start = 0;
  /** -1 when the inline axis runs right-to-left. */
  private direction = 1;

  protected onPointerDown(event: PointerEvent): void {
    if (this.disabled() || event.button !== 0) return;
    this.pointerId = event.pointerId;
    this.start = this.coordinate(event);
    this.direction = this.orientation() === 'inline' && this.isRtl() ? -1 : 1;
    // Guarded: jsdom and some older engines do not implement pointer capture.
    this.host.setPointerCapture?.(event.pointerId);
    this.dragging.set(true);
    this.resizeStart.emit();
    event.preventDefault();
  }

  protected onPointerMove(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) return;
    this.resizeMove.emit((this.coordinate(event) - this.start) * this.direction);
  }

  protected onPointerEnd(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) return;
    this.pointerId = null;
    this.dragging.set(false);
    this.resizeEnd.emit();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const inline = this.orientation() === 'inline';
    const size = event.shiftKey ? this.stepLarge() : this.step();
    // Arrow keys follow the SCREEN: → moves the splitter right, even in RTL.
    const rtl = inline && this.isRtl() ? -1 : 1;
    const forward = inline ? 'ArrowRight' : 'ArrowDown';
    const backward = inline ? 'ArrowLeft' : 'ArrowUp';

    switch (event.key) {
      case forward:
        this.resizeStep.emit(size * rtl);
        break;
      case backward:
        this.resizeStep.emit(-size * rtl);
        break;
      case 'Home':
        this.resizeExtreme.emit('min');
        break;
      case 'End':
        this.resizeExtreme.emit('max');
        break;
      case 'Enter':
        this.onReset();
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  protected onReset(): void {
    if (!this.disabled()) this.resizeReset.emit();
  }

  private coordinate(event: PointerEvent): number {
    return this.orientation() === 'inline' ? event.clientX : event.clientY;
  }

  private isRtl(): boolean {
    return typeof getComputedStyle === 'function' && getComputedStyle(this.host).direction === 'rtl';
  }
}
