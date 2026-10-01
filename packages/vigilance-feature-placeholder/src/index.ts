/**
 * `@rr/vigilance-feature-placeholder` — the Vigilance Floor's routes.
 *
 * A `type:feature` library behind the Building's `loadChildren`. The whole point
 * of it in S1 is the BOUNDARY: a lazy chunk, on the far side of the Sheriff
 * fence, that a subject without the `vigilance` claim never fetches.
 *
 * DEMOLISHED IN S3.
 */
import type { Routes } from '@angular/router';

export const VIGILANCE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./floor-placeholder').then((m) => m.VigilanceFloorPlaceholder),
  },
];

export { VigilanceFloorPlaceholder } from './floor-placeholder';
