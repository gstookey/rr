/**
 * `@rr/invent-domain` — the Invent Floor's domain ring.
 *
 * May import: its own scope's `type:domain` / `type:util`, and `@rr/common`.
 * May NOT import: Angular, another Floor, any `data-access` or `feature`.
 */
export type { DeviceLifecycleState } from './device-lifecycle.js';
export { nextLifecycleState } from './device-lifecycle.js';
export { deviceRegistryMarking } from './device-marking.js';
