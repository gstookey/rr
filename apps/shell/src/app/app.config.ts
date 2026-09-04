import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

/**
 * Zoneless is the Angular v22 default: there is no `provideZonelessChangeDetection()`
 * call and no zone.js polyfill anywhere in this workspace, by construction
 * (verified: `ng new --zoneless` on 22.1.7 emits neither). Adding zone.js back is
 * a forbidden idiom (research corpus README, currency contract §3).
 */
export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideRouter(routes)],
};
