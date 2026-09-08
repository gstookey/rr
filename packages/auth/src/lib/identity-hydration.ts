import { type EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';
import { PermissionStore } from './permission-store';

/**
 * Hydrate `/api/me` BEFORE the first navigation resolves.
 *
 * Without this the first `CanMatch` runs while the identity resource is still in
 * flight, reads "no claims yet", and answers as if the subject held nothing — so
 * a deep link into a Floor would bounce to the Lobby on a cold load and work on
 * every load after. Intermittent, and exactly the kind of bug that gets blamed
 * on the router (`identity_stores_brief_v0` §4.6: hydrate in an app initializer
 * so guards read settled state).
 */
export function provideIdentityHydration(): EnvironmentProviders {
  return provideAppInitializer(() => inject(PermissionStore).whenSettled());
}
