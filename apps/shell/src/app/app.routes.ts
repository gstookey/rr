import { type Routes } from '@angular/router';
import { canActivateSignedIn, canMatchFloor } from '@rr/auth';
import { BuildingComponent } from './building/building';
import { FloorLayoutComponent } from './floor-layout/floor-layout';
import { LobbyPage } from './lobby/lobby';

/**
 * THE BUILDING'S ROUTE TABLE — and the most doctrine-dense file in the shell.
 *
 * Three things are worth reading slowly.
 *
 * 1. **`canMatch`, not `canActivate`, on every Floor.** A Floor the subject does
 *    not hold does not match, so its lazy chunk is never fetched and there is
 *    nothing in the network tab to prove it exists. `canActivate` would have
 *    loaded the chunk and then refused — a leak with a polite error message.
 *
 * 2. **No Floor label, blurb or order appears here.** Only ids and routes, which
 *    are structure. Everything a person reads comes from `/api/config`. That is
 *    what lets S4 add a tenant without touching a line of code.
 *
 * 3. **The Lobby and the Floors are siblings under the Building**, with the
 *    elevator rail living on the Floor layout only (AW-D23): at `/` the
 *    directory IS the page. The trailing wildcard is what makes an unheld Floor
 *    land somewhere honest — Fay asking for `/invent` gets the Lobby and is told
 *    nothing, because forbidden and non-existent must look identical.
 */
export const routes: Routes = [
  {
    path: 'sign-in',
    loadComponent: () => import('./sign-in/sign-in').then((m) => m.SignInPage),
  },
  {
    path: '',
    component: BuildingComponent,
    // STATE, not entitlement — so it blocks and redirects (see `@rr/auth`).
    canActivate: [canActivateSignedIn()],
    children: [
      { path: '', component: LobbyPage },
      {
        path: '',
        component: FloorLayoutComponent,
        children: [
          {
            path: 'invent',
            canMatch: [canMatchFloor('invent')],
            loadChildren: () => import('@rr/invent-feature-placeholder').then((m) => m.INVENT_ROUTES),
          },
          {
            path: 'command',
            canMatch: [canMatchFloor('command')],
            loadChildren: () => import('@rr/command-feature-placeholder').then((m) => m.COMMAND_ROUTES),
          },
          {
            path: 'vigilance',
            canMatch: [canMatchFloor('vigilance')],
            loadChildren: () => import('@rr/vigilance-feature-placeholder').then((m) => m.VIGILANCE_ROUTES),
          },
          {
            path: 'front-desk',
            canMatch: [canMatchFloor('front-desk')],
            loadChildren: () => import('@rr/front-desk-feature-placeholder').then((m) => m.FRONT_DESK_ROUTES),
          },
        ],
      },
      { path: '**', redirectTo: '' },
    ],
  },
];
