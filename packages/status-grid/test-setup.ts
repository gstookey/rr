/**
 * Vitest setup for @rr/status-grid.
 *
 * Created: 2026-10-01
 *
 * The specs are written against Jest's API, because the app that consumes this feature tests with
 * Jest and copies the specs as they are. rr runs Vitest, whose `vi` implements the same calls the
 * specs use, so here it is made available under Jest's name — the same bridge as @rr/ui's.
 */
import { vi } from 'vitest';

declare global {
  var jest: typeof vi;
}

globalThis.jest = vi;
