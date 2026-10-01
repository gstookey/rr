import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { PermissionStore } from './permission-store';

/**
 * `CanActivate` for STATE — the deliberate counterpart to `canMatchFloor`'s
 * `CanMatch` for ENTITLEMENT (`ddd_ui_ux_brief_v0` §4.5).
 *
 * "You are not signed in" is a condition with an obvious remedy and a
 * destination, so it BLOCKS navigation and redirects. "This Floor is not yours"
 * has neither, so it falls through and says nothing. Using one guard kind for
 * both is how a Building ends up telling a partner which Floors it is missing.
 */
export function canActivateSignedIn(): CanActivateFn {
  return (_route, state) => {
    const permissions = inject(PermissionStore);
    if (permissions.isAuthenticated()) {
      return true;
    }
    return inject(Router).createUrlTree(['/sign-in'], { queryParams: { returnTo: state.url } });
  };
}
