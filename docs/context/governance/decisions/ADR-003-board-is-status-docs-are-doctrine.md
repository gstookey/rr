---
schema: corpus-doc/v1
status: accepted
title: ADR-003 — The board is status; the docs are doctrine
areas: [process-governance, planning]
related: ["docs/context/team/agents/planning_surface_workflow.md"]
updated: 2026-08-25
---

# ADR-003 — The GitHub Project board is status; the docs corpus is doctrine

**Date:** 2026-08-25 | **Status:** accepted (inherited from TrAIdit "ADR-008", renumbered for RR)

## Context
Two sources of truth drift. TrAIdit resolved this by making the GitHub Project the *planning/status* surface only.

## Decision
The GitHub Project "Project Road Runner Roadmap" (`https://github.com/users/gstookey/projects/3`) carries milestones, epics (`EP-nn:`), and stories with thin bodies: title, value line, status, priority, size, milestone, doc link. Scope, boundaries, and acceptance criteria live only in docs. When they disagree, docs win and the drift is surfaced. Board edits confer no activation authority.

## Consequences
Rin and Axium operate the board via `gh`. Fleet how-to: `docs/context/team/agents/planning_surface_workflow.md`. Inherited docs citing "ADR-008" were retargeted to ADR-003 on 2026-08-25.

## Expiration
Revisit if the isolated network has no GitHub Projects equivalent — the *principle* (one doctrine surface) stands; the *tool* may change.
