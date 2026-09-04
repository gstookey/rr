/**
 * Public API of `@rr/config` — configuration as data.
 *
 * S1 fills this with the `DomainConfigStore` over `/api/config`: navigation
 * manifest, capability flags (keyed by capability, NEVER by group) and theme
 * tokens (practical_picture_v0.md §3).
 */
export { RR_CONFIG_PACKAGE } from './lib/config-package';
