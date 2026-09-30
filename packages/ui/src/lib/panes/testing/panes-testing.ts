import type { ComponentFixture } from '@angular/core/testing';

/**
 * Test helpers for the panes specs — plain TypeScript, no test-runner API.
 *
 * Created: 2026-09-30
 *
 * WHY. The same specs run under two runners: Vitest in `rr` (Angular 22, zoneless) and Jest
 * in a consuming app (Angular 17.3, zone.js). Their mock APIs differ (`vi.*` / `jest.*`),
 * so the specs use none — only `describe` / `it` / `expect`, which both provide — and do
 * their stubbing, recording and timing through the helpers below.
 *
 * Not exported from the panes barrel, so it never ships in the built library.
 */

/**
 * Render and settle a fixture — identically on both change-detection models. Under zone.js
 * `whenStable()` alone does NOT run change detection (zoneless does), so a spec that only
 * awaits it passes on 22 and renders nothing on 17.3.
 */
export async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

const restores: (() => void)[] = [];

/**
 * Replace `target[key]` for the current test. Works for globals (`patch(globalThis, …)`),
 * prototypes and single elements. `restorePatches()` — call it in `afterEach` — puts every
 * original back, most recent first.
 */
export function patch<T extends object, K extends keyof T>(target: T, key: K, value: T[K] | undefined): void {
  define(target, key, { value, writable: true });
}

/** `patch`, for a whole property descriptor — e.g. a getter that throws. */
export function define(target: object, key: PropertyKey, descriptor: PropertyDescriptor): void {
  const own = Object.getOwnPropertyDescriptor(target, key);
  Object.defineProperty(target, key, { configurable: true, ...descriptor });
  restores.push(() => {
    if (own) Object.defineProperty(target, key, own);
    else Reflect.deleteProperty(target, key);
  });
}

export function restorePatches(): void {
  while (restores.length) restores.pop()?.();
}

/** A function that records every call's arguments — the runner-neutral spy. */
export interface Recorder<A extends unknown[], R> {
  (...args: A): R;
  readonly calls: A[];
}

export function recorder<A extends unknown[] = unknown[], R = undefined>(
  impl: (...args: A) => R = () => undefined as R,
): Recorder<A, R> {
  const calls: A[] = [];
  // A `function`, not an arrow: wrapping a method (e.g. Storage.prototype.setItem) must
  // pass its `this` through.
  const fn = function (this: unknown, ...args: A): R {
    calls.push(args);
    return impl.apply(this, args);
  };
  return Object.assign(fn, { calls });
}

/** jsdom has no layout engine. Report the size a browser would have laid `el` out at. */
export function stubSize(el: Element, width: number, height = 600): void {
  const rect = { x: 0, y: 0, top: 0, left: 0, right: width, bottom: height, width, height };
  patch(el, 'getBoundingClientRect', () => ({ ...rect, toJSON: () => rect }) as DOMRect);
}

/**
 * A manual clock for `setTimeout` / `clearTimeout`. `install()` swaps them on `globalThis`
 * (restored by `restorePatches()`); `advance(ms)` fires whatever has come due, in order.
 */
export class ManualClock {
  private now = 0;
  private nextId = 1;
  private readonly pending = new Map<number, { at: number; run: () => void }>();

  install(): this {
    patch(globalThis, 'setTimeout', ((run: () => void, ms = 0) => {
      const id = this.nextId++;
      this.pending.set(id, { at: this.now + ms, run });
      return id;
    }) as unknown as typeof setTimeout);
    patch(globalThis, 'clearTimeout', ((id: number) => {
      this.pending.delete(id);
    }) as unknown as typeof clearTimeout);
    return this;
  }

  advance(ms: number): void {
    this.now += ms;
    for (;;) {
      const due = [...this.pending].filter(([, t]) => t.at <= this.now).sort(([, a], [, b]) => a.at - b.at)[0];
      if (!due) return;
      this.pending.delete(due[0]);
      due[1].run();
    }
  }
}

/**
 * The pointer events a real drag delivers, positioned along one axis. jsdom only gained
 * `PointerEvent` in v22 (Jest 29 ships jsdom 20), so older environments get a MouseEvent of
 * the same type carrying a `pointerId` — which is all the handle reads.
 */
export function pointer(type: string, axis: 'x' | 'y', at: number, pointerId = 1, button = 0): PointerEvent {
  const init = {
    bubbles: true,
    cancelable: true,
    button,
    clientX: axis === 'x' ? at : 0,
    clientY: axis === 'y' ? at : 0,
  };
  const Ctor = typeof PointerEvent === 'function' ? PointerEvent : MouseEvent;
  const event = new Ctor(type, { ...init, pointerId });
  if ((event as PointerEvent).pointerId !== pointerId) Object.defineProperty(event, 'pointerId', { value: pointerId });
  return event as PointerEvent;
}

export function key(k: string, init: KeyboardEventInit = {}): KeyboardEvent {
  return new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init });
}
