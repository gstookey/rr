/**
 * `@rr/command-domain` — the Command Floor's domain ring.
 *
 * May import: its own scope's `type:domain` / `type:util`, and `@rr/common`.
 * May NOT import: Angular, another Floor, any `data-access` or `feature`.
 */
export type { CampaignApprovalState } from './campaign-approval.js';
export { remainingApprovals } from './campaign-approval.js';
