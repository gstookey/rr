/**
 * Public API of `@rr/auth` — identity as data.
 *
 * S1 fills this with the `/api/me` `httpResource`, the `PermissionStore` and the
 * `CanMatchFn` factories. The browser never holds a token (BFF/cookie pattern,
 * DA-D17); the UI is never the enforcement point.
 */
export { RR_AUTH_PACKAGE } from './lib/auth-package';
