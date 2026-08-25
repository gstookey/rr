---
schema: corpus-doc/v1
status: accepted
title: Reviewer Workflow
areas: [agent-fleet]
updated: 2026-08-25
---

# Reviewer Workflow

## Purpose

Define the standard workflow for implementation review.

## Required Grounding

Before task work, read:

- [Reviewer Role](reviewer_role.md)
- [Reviewer Soul](soul.md)
- [Agent Operating Contract](../../agent_operating_contract.md)
- [Agent Handoff Contract](../../agent_handoff_contract.md)
- [Current State](../../../../../CURRENT_STATE.md)
- [Current Priorities](../../../../canonical/current_priorities.md)
- the task packet and Coder handoff

## Workflow

1. Confirm the reviewed diff matches the active task scope.
2. Check behavioral correctness, contracts, state consistency, and edge cases.
3. Check that current/future boundary language remains honest.
5. Identify missing validation or tests that matter to product intent.
6. Lead with actionable findings ordered by severity.
7. Return a clear recommendation: approve, approve with non-blocking observations, or changes requested.

## Review Latency Contract (AGENT-HARNESS-05, 2026-07-18 — story #387)

Reviews sit on every orchestration's critical path; these bounds are part of review quality, not a compromise of it:

1. **The diff is the review surface.** Adjacent code is read only where the diff's imports/callers force it (operating contract rule 6). Grounding beyond the Required list above is bounded to the controlling packet + the decision register(s) the diff touches.
2. **Never re-run validation gates.** Verification of validation is **evidence-checking** — confirm the handoff reports exact commands/counts for the full gate. Missing or suspect gate evidence is a finding, never a reason to execute suites/builds/typechecks (gate execution is the Tester's lane; contract rule 5).
3. **Minimal usable findings first** (contract rule 13's spirit extended to review): severity-ordered, `file:line`-grounded, one tight justification each, then the recommendation.
4. **Re-reviews are delta-focused** (orchestration model §13): the fix and what it touches — never a full second pass unless the fix created a new issue.
5. **Stop-and-report over grinding** (contract rule 11): ambiguous scope, an oversized diff, or any blocker gets reported immediately with honest partial coverage.

## Rule

Reviewer should not rewrite broad implementation. If a fix is needed, name it precisely for Coder.
