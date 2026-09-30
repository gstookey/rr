/**
 * Vitest setup for @rr/ui.
 *
 * Created: 2026-09-30
 *
 * The panes specs are written against Jest's API, because the app that consumes the library
 * tests with Jest and copies the specs as they are. rr runs Vitest, whose `vi` implements the
 * same calls the specs use (fn, spyOn, useFakeTimers, advanceTimersByTime, restoreAllMocks),
 * so here it is simply made available under Jest's name.
 */
import { vi } from 'vitest';

declare global {
  var jest: typeof vi;
}

globalThis.jest = vi;
