/**
 * Public API of `@rr/auth` — identity as data.
 *
 * The browser never holds a token (BFF/cookie pattern, DA-D17, BCP 212 pattern
 * 1) and the UI is never the enforcement point. What lives here is the hydrated
 * view of the subject, the route gating that makes an unentitled Floor *absent*,
 * and the two navigations that begin and end a session.
 */
export { PermissionStore } from './lib/permission-store';
export { canMatchFloor } from './lib/floor-guards';
export { provideIdentityHydration } from './lib/identity-hydration';
export { RR_AUTH_PACKAGE } from './lib/auth-package';
