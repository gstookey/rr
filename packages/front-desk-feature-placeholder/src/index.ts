/**
 * `@rr/front-desk-feature-placeholder` — the Front Desk Floor's routes.
 *
 * A `type:feature` library behind the Building's `loadChildren`. The whole point
 * of it in S1 is the BOUNDARY: a lazy chunk, on the far side of the Sheriff
 * fence, that a subject without the `front-desk` claim never fetches.
 *
 * DEMOLISHED IN S7.
 */
import type { Routes } from '@angular/router';

export const FRONT_DESK_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./floor-placeholder').then((m) => m.FrontDeskFloorPlaceholder),
  },
];

export { FrontDeskFloorPlaceholder } from './floor-placeholder';
