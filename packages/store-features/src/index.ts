/**
 * Public API of `@rr/store-features` — `signalStoreFeature`s shared by every
 * Floor store: `withRequestStatus`, `withMarkings`, `withEventStream` (S3).
 *
 * A Floor store composes these with `withFeature`; it never grows its own
 * "current time" or its own identity (presumed-global state rule).
 */
export { RR_STORE_FEATURES_PACKAGE } from './lib/store-features-package';
