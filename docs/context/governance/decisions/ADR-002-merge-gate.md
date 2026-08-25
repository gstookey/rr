---
schema: corpus-doc/v1
status: accepted
title: ADR-002 — Merging to main is Graham's click
areas: [process-governance, agent-fleet]
related: ["docs/context/team/agents/agent_operating_contract.md"]
updated: 2026-08-25
---

# ADR-002 — Merging to `main` is Graham's click, never an agent's

**Date:** 2026-08-25 | **Status:** accepted (inherited from TrAIdit governance decision of 2026-07-02, re-ratified for RR)

## Context
In TrAIdit, a ~30k-line PR was merged by an agent on stale verbal intent without Graham's diff review (2026-07-02). A later PR was surfaced mid-correction and merged before the fix landed (2026-07-17).

## Decision
No agent merges to `main` by any route (`gh pr merge`, push to main, local merge on main, API). Terminal state of merge-bound work: PR opened, gates green, click-ready, handed to Graham. Enforced by `.claude/hooks/protect-main.sh` and operating-contract rules 15 and 18.

## Consequences
Slower throughput; every change gets a human read. Weakening the hook is itself a contract violation.

## Expiration
None.
