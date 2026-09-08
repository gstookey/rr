import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideIdentityHydration } from '@rr/auth';
import { routes } from './app.routes';

/**
 * Zoneless is the Angular v22 default: there is no `provideZonelessChangeDetection()`
 * call and no zone.js polyfill anywhere in this workspace, by construction
 * (verified: `ng new --zoneless` on 22.1.7 emits neither). Adding zone.js back is
 * a forbidden idiom (research corpus README, currency contract §3).
 *
 * `provideIdentityHydration()` is the load-bearing line: it settles `/api/me`
 * before the first navigation resolves, so the Floor guards read decided claims
 * rather than a mid-flight `undefined`. Without it a deep link into a Floor
 * bounces to the Lobby on a cold load and works on every load after — the kind
 * of intermittent failure that gets blamed on the router.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // No `withFetch()`: fetch is the v22 default and re-declaring it is a
    // forbidden idiom in the currency contract.
    provideHttpClient(),
    provideRouter(routes, withComponentInputBinding()),
    provideIdentityHydration(),
  ],
};
