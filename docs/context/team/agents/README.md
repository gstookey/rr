---
schema: corpus-doc/v1
status: active
title: Agents — Repo-Side Fleet
areas: [agent-fleet, process-governance]
related: ["docs/context/team/agents/agent_operating_contract.md", "docs/context/team/agents/orchestration_model.md"]
updated: 2026-08-25
---

# Agents — Repo-Side Fleet

**Created:** 2026-08-25

Each role has three doc layers (`role` = authority, `workflow` = process, `soul` = identity) plus an identity addendum; Claude Code harnesses mirror them under `.claude/agents/`.

| Role | Name | Docs | Harness id |
|---|---|---|---|
| Lead Systems Engineer / prompt architect | Axium | [`systems-engineer/`](systems-engineer/README.md) | `axium-systems-engineer` |
| Context Librarian | Rin | [`context-librarian/`](context-librarian/README.md) | `rin-librarian` |
| Coder | Marlow | [`software-engineers/01_coder/`](software-engineers/01_coder/README.md) | `marlow-coder` |
| Reviewer | Verin | [`software-engineers/02_reviewer/`](software-engineers/02_reviewer/README.md) | `verin-reviewer` |
| Tester | Vera | [`software-engineers/03_tester/`](software-engineers/03_tester/README.md) | `vera-tester` |
| Fast UI Repairer | Ember | [`software-engineers/05_fast-ui-repairer/`](software-engineers/05_fast-ui-repairer/README.md) | `ember-fast-ui-repairer` |
| UI Designer | Cadence | [`ui-designer/`](ui-designer/README.md) | `cadence-ui-designer` |
| Orchestration coordinator | Marin | not ported (C-003) | — |

Shared contracts: [Operating Contract](agent_operating_contract.md) · [Handoff Contract](agent_handoff_contract.md) · [Orchestration Model](orchestration_model.md) · [Collaboration Model](collaboration_model.md) · [Planning Surface Workflow](planning_surface_workflow.md).

Numbering gap (`04_`) in `software-engineers/` is inherited; a DevOps role would naturally fill it once the isolated-network constraints are known.
