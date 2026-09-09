/**
 * `@rr/invent-feature-placeholder` — the Invent Floor's routes.
 *
 * A `type:feature` library behind the Building's `loadChildren`. The whole point
 * of it in S1 is the BOUNDARY: a lazy chunk, on the far side of the Sheriff
 * fence, that a subject without the `invent` claim never fetches.
 *
 * DEMOLISHED IN S2.
 */
import type { Routes } from '@angular/router';

export const INVENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./floor-placeholder').then((m) => m.InventFloorPlaceholder),
  },
];

export { InventFloorPlaceholder } from './floor-placeholder';
