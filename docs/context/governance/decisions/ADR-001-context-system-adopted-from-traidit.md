---
schema: corpus-doc/v1
status: accepted
title: ADR-001 — Adopt the TrAIdit context system and agent fleet for RR
areas: [process-governance, context-system, agent-fleet]
related: ["docs/context/canonical/context_system.md"]
updated: 2026-08-25
---

# ADR-001 — Adopt the TrAIdit context system and agent fleet for RR

**Date:** 2026-08-25 | **Status:** accepted (Graham, by stubbing the repo; ratified by this record)

## Context
Graham ran TrAIdit for months with a repo-native four-layer context system, a seven-role agent fleet, a corpus graph, a merge gate, and a board/docs split. RR is a new project on an isolated network with a one-year release horizon. Starting from a proven operating model is cheaper than inventing one.

## Decision
Adopt the TrAIdit governance, fleet, tooling, and directory schema wholesale. Strip TrAIdit-domain content (trading, quant, Atlas). Keep TrAIdit's root files as a read-only worked example at `docs/context.root-files.example/`.

## Consequences
- Inherited docs still carry TrAIdit assumptions (pnpm, `apps/web`, Marin, ADR numbering). These surface as contradictions to be resolved, not silently averaged.
- The fleet workflow assumes GitHub + `gh` + Claude Code. Whether those exist on the isolated network is unknown (see `canonical/isolated_network_constraints.md`); the docs must remain human-executable.

## Expiration
None — this is the operating model. Individual inherited conventions may be superseded by later ADRs.
