/**
 * Campaign approval is **process-as-data** (Boundary Test rung 2, AW-D5): TTW
 * requires one sign-off, MER requires two plus a comment, and neither is a code
 * path. This module holds only the arithmetic over a step list the server sends;
 * the step list itself is never hard-coded here.
 */
export type CampaignApprovalState = 'draft' | 'awaiting-approval' | 'approved' | 'dispatched';

export function remainingApprovals(requiredSteps: number, grantedSteps: number): number {
  return Math.max(0, requiredSteps - grantedSteps);
}
