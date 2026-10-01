import { inject } from '@angular/core';
import { type CanMatchFn, Router } from '@angular/router';
import { PermissionStore } from './permission-store';

/**
 * `CanMatch`, never `CanActivate` — and the difference is the entire proof.
 *
 * `CanMatch` decides whether a route MATCHES during path matching, so a Floor
 * the subject does not hold is not "blocked": it does not exist. The route never
 * matches, **the lazy chunk is never fetched**, and there is nothing in the
 * bundle or the DOM to point at. `CanActivate` would have loaded the chunk and
 * then said no — a Floor you can prove exists by watching the network tab.
 *
 * That is the "absent, not disabled" rule from `ddd_ui_ux_brief_v0` §4.5 as a
 * function. Use `CanActivate` for STATE (not signed in, session expired); use
 * this for ENTITLEMENT.
 *
 * And it is still only UX: the gateway re-checks on every request. A subject who
 * forges their way past this guard reaches a Floor whose every read is refused.
 */
export function canMatchFloor(floorId: string): CanMatchFn {
  return () => {
    const permissions = inject(PermissionStore);

    // Not signed in is a STATE, not an entitlement: send them to the signed-out
    // surface rather than falling through to "no such route", which would tell a
    // returning visitor that their bookmark had gone bad.
    if (!permissions.isAuthenticated()) {
      return inject(Router).createUrlTree(['/sign-in']);
    }

    // No `UrlTree` here, on purpose: returning `false` lets matching FALL THROUGH
    // to whatever the Building's last route is (the Lobby). Fay asking for
    // /invent is answered with the Lobby and told nothing — forbidden and
    // non-existent must look identical (`mac_stores_brief_v0` §6).
    return permissions.hasFloor(floorId);
  };
}
