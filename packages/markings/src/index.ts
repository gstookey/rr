/**
 * Public API of `@rr/markings` — marking RENDERERS, never marking strings.
 *
 * The vocabulary (ACME's OPEN < PARTNER < INTERNAL < RESTRICTED and its
 * compartments) is served at runtime by `/api/config`; this package knows only
 * how to draw a banner, a portion mark and a chip from a `Marking` value object.
 * Baking a vocabulary in here is the failure this package exists to prevent.
 */
export { RR_MARKINGS_PACKAGE } from './lib/markings-package';
