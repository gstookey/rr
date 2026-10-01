import { Injector, computed, effect, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { signalStore, withComputed, withMethods, withProps } from '@ngrx/signals';
import { type Me, MeSchema, type SubjectClearance } from '@rr/common';

/**
 * `PermissionStore` — identity as data, under the BFF (`identity_stores_brief_v0`
 * §4.6).
 *
 * The browser holds **no token, no Keycloak library and no auth state of its
 * own**. It hydrates the server's view of the subject from `/api/me` over a
 * same-origin HttpOnly cookie, and that is the whole of what it knows. There is
 * nothing here that decodes a JWT because there is nothing here to decode.
 *
 * Everything derived below is **UX**. The gateway re-checks the same claims on
 * every request regardless of what this store says (ASVS 5.0 §8.3.1) — a guard
 * that reads these signals is deciding what to *render*, never what to *permit*.
 */
export const PermissionStore = signalStore(
  { providedIn: 'root' },
  withProps(() => ({
    me: httpResource(() => '/api/me', { parse: (raw: unknown): Me => MeSchema.parse(raw) }),
    /** Captured so `whenSettled()` can observe the resource outside a component. */
    injector: inject(Injector),
  })),
  withComputed(({ me }) => ({
    isAuthenticated: computed(() => me.hasValue()),
    /** Distinguishes "not signed in" from "we do not know yet" — the states differ on screen. */
    isSettled: computed(() => !me.isLoading()),

    /** The group the subject is acting as, by its display name (AW-D20: resolved server-side). */
    actingAs: computed(() => (me.hasValue() ? me.value().group.displayName : undefined)),
    subjectName: computed(() => (me.hasValue() ? me.value().displayName : undefined)),

    /**
     * The reader's clearance as the published language's value object. A display
     * convenience: it chooses which primitives to render, and never filters data
     * the API returned — because the API must never have returned it.
     */
    clearance: computed<SubjectClearance | undefined>(() =>
      me.hasValue() ? { level: me.value().handlingLevel, compartments: me.value().compartments } : undefined,
    ),

    /** The Floor claim set, resolved server-side from the subject's group. */
    claimedFloors: computed(() => new Set(me.hasValue() ? me.value().floors : [])),
  })),
  withMethods((store) => ({
    /**
     * Does this subject hold the claim for a Floor?
     *
     * A method over the computed `Set`, rather than a computed returning a
     * predicate, because `store.hasFloor('invent')` reads as English and
     * `store.hasFloor()('invent')` does not. The reactive dependency is the same
     * either way — the `Set` is the computed.
     */
    hasFloor(floorId: string): boolean {
      return store.claimedFloors().has(floorId);
    },

    /**
     * Resolve once `/api/me` has settled — used by `provideIdentityHydration()`
     * so route guards read decided state rather than a mid-flight `undefined`
     * (`identity_stores_brief_v0` §4.6).
     */
    whenSettled(): Promise<void> {
      if (store.isSettled()) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        const ref = effect(
          () => {
            if (store.isSettled()) {
              resolve();
              ref.destroy();
            }
          },
          { injector: store.injector },
        );
      });
    },

    /**
     * Sign-in is a **full-page navigation out of the application**, not an
     * `fetch`: the redirect chain belongs to the gateway, and the SPA's entire
     * contribution is leaving. (See the sign-in mockup: no form, one link.)
     */
    signIn(returnTo: string = globalThis.location.pathname): void {
      globalThis.location.assign(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
    },

    /**
     * Sign-out ends the SERVER's session; the browser had nothing to throw away
     * but a cookie it cannot read. When the provider advertises RP-initiated
     * logout the gateway returns that URL and we go there, so the identity
     * provider's session ends too — otherwise the next "sign in" completes
     * silently and looks like the sign-out never happened.
     */
    async signOut(): Promise<void> {
      let endSessionUrl: string | undefined;
      try {
        const response = await fetch('/auth/logout', { method: 'POST', credentials: 'same-origin' });
        const body = (await response.json()) as { endSessionUrl?: string };
        endSessionUrl = body.endSessionUrl;
      } catch {
        // The local session may already be gone. Land on the signed-out surface
        // either way: a sign-out that appears to fail is worse than one that is
        // merely incomplete at the provider.
      }
      globalThis.location.assign(endSessionUrl ?? '/sign-in');
    },
  })),
);
