---
schema: corpus-doc/v1
status: accepted
title: Agent Collaboration Model
areas: [agent-fleet, process-governance]
updated: 2026-08-2025
---

# Collaboration Model

## Purpose
This page describes how work has actually been getting done across:
- the human operator
- Axium / systems-engineering layer
- specialist repo-side agents
- the repo-native context system

## Current truth
The project is operating as a small human-plus-agent system with explicit role separation, even though those roles are still documentation-driven rather than productized in code.

## Roles

### Human operator
Owns:
- vision
- taste
- final product judgment
- repo control
- local environment
- go/no-go decisions

### Axium / systems-engineering layer
Owns:
- systems reasoning
- product framing
- design synthesis
- milestone shaping
- context rollups
- contradiction detection
- decision hygiene

### Specialist repo-side agents
Own:
- bounded context maintenance
- design document production
- task decomposition
- implementation, review, and testing roles when delegated

### Repo-native context system
Owns:
- durable shared memory
- project truth outside chat memory
- milestone and decision traceability
- reusable knowledge for Project Road Runner and later Project Road Runner

## Operating loop
1. Human raises ideas, constraints, goals, or feedback.
2. Axium or the systems-engineering layer turns that into coherent structure and sequencing.
3. Specialist agents or architectural roles shape bounded work packets.
4. Human reviews the result.
5. The context system is updated so the next session starts from durable truth.

## What made this work well
- broad design before narrow implementation
- milestone discipline
- durable docs instead of relying on memory
- honest constraints around what was and was not built
- context rollup after major sessions

## Failure mode to avoid
The project gets weaker if:
- chat becomes the only memory
- docs stop being updated
- milestone sequencing becomes ad hoc
- rationale disappears

## Desired future state
This collaboration model should eventually become a productized pattern inside Project Road Runner:
- planner / systems role
- executor role
- verifier role
- context maintainer role
- human governance role

## Related pages
- [Axium Assistant Role](../../governance/meta/assistant_role.md)
- [Context System](../../canonical/context_system.md)
- [Current Priorities](../../canonical/current_priorities.md)
