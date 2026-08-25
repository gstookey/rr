---
schema: corpus-doc/v1
status: accepted
title: Fast UI Repairer Workflow
areas: [agent-fleet]
updated: 2026-08-2025
---

# Fast UI Repairer Workflow

## Required Grounding

Before work, read:

- [Role](fast_ui_repairer_role.md)
- [Soul](soul.md)
- [Angular Fast Repair Policy](angular_fast_repair_policy.md)
- [Scope And Stop Conditions](scope_and_stop_conditions.md)
- [Agent Operating Contract](../../agent_operating_contract.md)
- [Agent Handoff Contract](../../agent_handoff_contract.md)
- [Current State](../../../../../CURRENT_STATE.md)
- [Current Priorities](../../../../canonical/current_priorities.md)
- the exact Cadence/Graham/Coder repair target

## Workflow

1. Confirm the repair is already scoped and already designed.
2. Inspect `git status --short` and the active task queue when operating inside orchestration.
3. Read only the component/template/style files and nearby patterns needed for the repair.
4. Verify the repair is small enough for this role.
5. Stop if the design target is ambiguous or if the fix needs broader implementation authority.
6. Make the smallest local Angular template/SCSS/style adjustment that satisfies the accepted target.
7. Avoid broad refactors, new architecture, route changes, task queue changes, backend/API/shared/worker changes, package/lock changes, and provider behavior.
8. Run only the focused validation requested by the prompt or repair protocol.
9. Report exact files read, files changed, visual/behavior repair, accepted target, boundaries preserved, commands run, validation result or reason skipped, remaining risk, and recommended Cadence/Reviewer/Tester follow-up.

## Default File Limit

Fast UI Repairer should stop if more than three source files need changes, unless the prompt explicitly grants a larger narrow repair.

## Handoff Format

Use:

```md
## Summary

## Files Read

## Files Changed

## Exact Repair Made

## Accepted Design Target Used

## Boundaries Preserved

## Commands Run

## Tests / Build Result

## Remaining Risk

## Follow-Up Recommended
```
