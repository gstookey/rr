/**
 * `@rr/command-feature-placeholder` — the Command Floor's routes.
 *
 * A `type:feature` library behind the Building's `loadChildren`. The whole point
 * of it in S1 is the BOUNDARY: a lazy chunk, on the far side of the Sheriff
 * fence, that a subject without the `command` claim never fetches.
 *
 * DEMOLISHED IN S6.
 */
import type { Routes } from '@angular/router';

export const COMMAND_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./floor-placeholder').then((m) => m.CommandFloorPlaceholder),
  },
];

export { CommandFloorPlaceholder } from './floor-placeholder';
