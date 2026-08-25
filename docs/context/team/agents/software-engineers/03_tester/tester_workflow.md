---
schema: corpus-doc/v1
status: accepted
title: Tester Workflow
areas: [agent-fleet]
updated: 2026-08-25
---

# Tester Workflow

## Purpose

Define the standard workflow for Tester validation.

## Required Grounding

Before task work, read:

- [Tester Role](tester_role.md)
- [Tester Soul](soul.md)
- [Agent Operating Contract](../../agent_operating_contract.md)
- [Agent Handoff Contract](../../agent_handoff_contract.md)
- [Current State](../../../../../CURRENT_STATE.md)
- [Current Priorities](../../../../canonical/current_priorities.md)
- the task packet, Coder handoff, and Reviewer result

## Workflow

1. Convert acceptance criteria into observable validation checks.
2. Run required automated validation where available.
3. Run manual/browser/runtime checks when the task affects UI or behavior.
4. Verify product intent, not only that the app renders.
5. Check boundary language and disabled/future states for overclaiming.
6. Report exact commands/checks, pass/fail status, blocked checks, fallbacks, and non-blocking observations.
7. Return a clear recommendation: pass, pass with non-blocking observations, blocked, or fail.

## Rule

Tester must not declare behavior passed when required validation was skipped or unavailable. Skipped checks are reported as residual risk.
