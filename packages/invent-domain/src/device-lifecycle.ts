/**
 * A **device** here is a serialised UNIT (not a product model — that trap is
 * pinned in `domain_model_v0.md`). Its lifecycle is a closed set because it is a
 * genuine invariant of the aggregate, unlike *device class*, which is data.
 */
export type DeviceLifecycleState =
  | 'registered'
  | 'provisioned'
  | 'in-service'
  | 'decommissioned';

const TRANSITIONS: Readonly<Record<DeviceLifecycleState, readonly DeviceLifecycleState[]>> = {
  registered: ['provisioned'],
  provisioned: ['in-service', 'decommissioned'],
  'in-service': ['decommissioned'],
  decommissioned: [],
};

/** Pure, Angular-free, and therefore runnable in the BFF as well as the browser. */
export function nextLifecycleState(
  from: DeviceLifecycleState,
  to: DeviceLifecycleState,
): DeviceLifecycleState | null {
  return TRANSITIONS[from].includes(to) ? to : null;
}
