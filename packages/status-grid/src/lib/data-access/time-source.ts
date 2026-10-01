import { DestroyRef, Injectable, PLATFORM_ID, inject, signal, type Signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** How often `now` advances. Samples arrive every 10–15 minutes, so a 30s lag on the
 *  "future starts here" boundary is invisible — and a per-second tick would invalidate the grid
 *  far more often than anything on it can change. */
export const TIME_SOURCE_TICK_MS = 30_000;

/**
 * The feature's clock: `now` as a SIGNAL.
 *
 * Created: 2026-10-01
 *
 * Why a signal, not Date.now(): a computed() that calls Date.now() inline captures no dependency,
 * so it never invalidates — the NO_DATA boundary would freeze at first render and the grid would
 * quietly go stale. Read time through this, and override it in tests:
 *
 *   { provide: TimeSource, useValue: { now: signal(Date.parse('2026-10-01T14:05:00Z')) } }
 */
@Injectable({ providedIn: 'root' })
export class TimeSource {
  private readonly current = signal(Date.now());
  readonly now: Signal<number> = this.current.asReadonly();

  constructor() {
    // A server render has nothing to keep fresh, and an interval would hold the process open.
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    const handle = setInterval(() => this.current.set(Date.now()), TIME_SOURCE_TICK_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(handle));
  }
}
