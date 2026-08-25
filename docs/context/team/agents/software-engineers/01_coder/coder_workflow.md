---
schema: corpus-doc/v1
status: accepted
title: Coder Workflow
areas: [agent-fleet]
updated: 2026-08-2025
---

# Coder Workflow

## Purpose

Define the standard workflow for Coder execution.

## Required Grounding

Before task work, read:

- [Coder Role](coder_role.md)
- [Coder Soul](soul.md)
- [Angular Frontend Engineering Policy](angular_frontend_engineering_policy.md)
- [Agent Operating Contract](../../agent_operating_contract.md)
- [Agent Handoff Contract](../../agent_handoff_contract.md)
- [Current State](../../../../../CURRENT_STATE.md)
- [Current Priorities](../../../../canonical/current_priorities.md)
- the active task packet

For web tasks, also inspect:

- `apps/web/package.json`
- `apps/web/angular.json`
- `pnpm-lock.yaml` only enough to verify installed versions when needed
- nearby Angular components/templates/styles/specs relevant to the task

## Workflow

1. Confirm the task is active and approved.
2. Read the allowed files, nearby patterns, and relevant contracts before editing.
3. For Angular work, verify the installed Angular version before using version-specific APIs.
4. Keep the change inside the task's file and behavior boundaries.
5. Preserve current implementation truth and compatibility behavior unless the task explicitly changes it.
6. Prefer small components, small functions, external HTML/SCSS, typed view models, pure projection helpers, and signal-first local state where practical.
7. Use `computed` for derived state and `effect` only for real side effects.
8. For simple local forms, prefer signal-first state and native form semantics over heavy forms machinery. Evaluate Angular Signal Forms only if available in the installed version, appropriate for the task, and acceptable despite experimental status.
9. Add TSDoc/JSDoc only where it preserves contract, boundary, domain, or non-obvious decision context.
10. Avoid broad refactors, speculative architecture, unrelated cleanup, package/lock drift, and backend/API/shared/worker changes unless explicitly scoped.
11. Run the required validation from the task packet.
12. For web builds, report bundle budget status, including whether warnings/errors are existing, changed, or new.
13. Report changed files, validation results, skipped checks, tradeoffs, forms decisions, budget status, and remaining risks.

## Rule

Coder must stop and report if the task would require unauthorized source areas, future live/execution authority, or product-scope changes.

Coder must also stop and report if a UI task is visually under-designed, if Cadence direction is required before implementation, or if build failure is only bundle-budget pressure outside task scope.
