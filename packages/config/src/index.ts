/**
 * Public API of `@rr/config` — configuration as data.
 *
 * One store, `providedIn: 'root'`, over `/api/config`. It is the only place in
 * the browser that knows which Floors exist, what they are called, what order
 * they come in, and how a marking is spelled — and it learned all of it at
 * runtime (practical_picture_v0 §3).
 */
export { DomainConfigStore } from './lib/domain-config-store';
export { RR_CONFIG_PACKAGE } from './lib/config-package';
