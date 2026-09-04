---
schema: corpus-doc/v1
status: active
title: RR Context Wiki Index
areas: [context-system]
updated: 2026-09-03
---

# RR Context Wiki Index

**Created:** 2026-08-25 | **Last updated:** 2026-09-03 (post-merge closeout — the whole v17→v22 ladder is on `main`; `first-app-hop-01` field kit cut. Earlier the same day: ADR-005, DDD-ARCH-01 packet + architecture research corpus R1..R7 under `platform/research/`)

Navigation spine for the RR context system. Update when a page is added, removed, or changes meaningfully.

---

# Start Here

- [START_HERE (session bootstrap)](bootstrap/START_HERE.md)
- [Context README](README.md) · [Repo AGENTS](../../AGENTS.md) · [Repo README](../../README.md)
- [CURRENT_STATE](../CURRENT_STATE.md) — implementation truth
- [Current Priorities](canonical/current_priorities.md) — what matters now, oriented on **Milestone 1: Legacy Island to Angular 19 minimum**
- [Context Log](log.md)
- [Corpus Graph Index (generated)](corpus_graph_index_v0.md) — lookup: `node scripts/corpus-graph.mjs lookup <path-or-term>`; viewer: [`corpus_graph_viewer.html`](corpus_graph_viewer.html)
- [Doc Hierarchy — which doc wins](governance/meta/rr_doc_overview.md)

---

# Canonical

- [Canonical README](canonical/README.md)
- [Project Overview](canonical/project_overview.md) — `[NEEDS GRAHAM]` markers
- [**The Two-Island Model**](canonical/two_island_model.md) — Legacy Island + Desert Island, the verified hop matrix, Milestone 1. Read before anything environment-shaped.
- [Technology Stack (intended)](canonical/technology_stack.md)
- [Isolated Network Constraints](canonical/isolated_network_constraints.md)
- [Context System](canonical/context_system.md)

# Design

- [Design README](../design/README.md)
- [Brand — Visual Identity](../design/brand/README.md)
- Packets:
- [**DDD-ARCH-01 — Desert Island system architecture, front-end-first** (`ddd-arch-01`)](../design/packets/ddd-arch-01-design-packet/README.md) — `exploratory`, opened 2026-09-03 as a Graham-initiated side-quest beside Milestone 1
  - [Decision Register v0 (DA-D1..DA-D10)](../design/packets/ddd-arch-01-design-packet/decision_register_v0.md) · [Tier Model Exploration v0](../design/packets/ddd-arch-01-design-packet/tier_model_exploration_v0.md) · [Diagramming Approach v0](../design/packets/ddd-arch-01-design-packet/diagramming_approach_v0.md) · diagrams [01 context](../design/packets/ddd-arch-01-design-packet/diagrams/01-context-desert-island.md) · [02 tier model](../design/packets/ddd-arch-01-design-packet/diagrams/02-tier-model-building-floors.md)
- [**First App Hop — the field kit for the first REAL application upgrade** (`first-app-hop-01`)](../design/packets/first-app-hop-01-design-packet/README.md) — `exploratory`, cut 2026-09-03; the current lane. Written for a person on RHEL 9 with no agent, no internet and change control
  - [**Island Execution Plan v1**](../design/packets/first-app-hop-01-design-packet/island_execution_plan_v1.md) — the plan of record · [Pre-flight Checklist v0](../design/packets/first-app-hop-01-design-packet/preflight_checklist_v0.md) · [Field Hop Procedure v1](../design/packets/first-app-hop-01-design-packet/field_hop_procedure_v1.md) · [Field Notes Template v0](../design/packets/first-app-hop-01-design-packet/field_notes_template_v0.md)
- [Legacy Shell Bundle (`legacy-shell-bundle-01`)](../design/packets/legacy-shell-bundle-01-design-packet/README.md) — `exploratory`; **the whole v17→v22 ladder rehearsed 2026-09-03; 17→22 pool (2,102 tarballs / 355.6 MB) verified offline**
  - [Monorepo Hop Procedure v2](../design/packets/legacy-shell-bundle-01-design-packet/monorepo_hop_procedure_v2.md) — **the island procedure** · [v17→v19 Bundle Manifest v2](../design/packets/legacy-shell-bundle-01-design-packet/v17_to_v19_bundle_manifest_v2.md) · [Offline Verification Transcript v2](../design/packets/legacy-shell-bundle-01-design-packet/offline_verification_transcript_v2.md) · [Nexus Upload Instructions v1](../design/packets/legacy-shell-bundle-01-design-packet/nexus_upload_instructions_v1.md)
  - Superseded evidence trail: runbook delta v1 · bundle manifest v1 · transcript v1 (in the same packet dir)
  - Shells themselves: [`legacy-shells/README.md`](../../legacy-shells/README.md) — two approximated island monorepos **standing at Angular 19.2.25**, full v17→v19 lock history
- [Angular v18→v19 Hop (`ng-hop-02`)](../design/packets/ng-hop-02-v18-to-v19-design-packet/README.md) — `exploratory`; **rehearsed 2026-08-28**; reaches Milestone 1's floor
  - [v18→v19 Hop Runbook v1](../design/packets/ng-hop-02-v18-to-v19-design-packet/v18_to_v19_hop_runbook_v1.md) · [v19 Hop Bundle Manifest v0](../design/packets/ng-hop-02-v18-to-v19-design-packet/v19_hop_bundle_manifest_v0.md)
- [Angular v17→v18 Hop (`ng-hop-01`)](../design/packets/ng-hop-01-v17-to-v18-design-packet/README.md) — `exploratory`; **rehearsed 2026-08-26**
  - [v17→v18 Hop Runbook v1](../design/packets/ng-hop-01-v17-to-v18-design-packet/v17_to_v18_hop_runbook_v1.md) · [v18 Hop Bundle Manifest v0](../design/packets/ng-hop-01-v17-to-v18-design-packet/v18_hop_bundle_manifest_v0.md)
- [Isolated-Network Readiness (`iso-net-readiness-01`)](../design/packets/iso-net-readiness-01-design-packet/README.md) — `exploratory`, proposed not activated
  - [Island Questionnaire v0](../design/packets/iso-net-readiness-01-design-packet/island_questionnaire_v0.md) · [Legacy Estate Inventory Template v0](../design/packets/iso-net-readiness-01-design-packet/legacy_estate_inventory_template_v0.md) · [Stack Dependency Manifest v0](../design/packets/iso-net-readiness-01-design-packet/stack_dependency_manifest_v0.md) · [Day One on the Island Runbook v0](../design/packets/iso-net-readiness-01-design-packet/day_one_on_the_island_runbook_v0.md) · [Decision Register v0 (DR-01..DR-10)](../design/packets/iso-net-readiness-01-design-packet/decision_register_v0.md) · [Story Decomposition v0 (S-01..S-17, board-linked)](../design/packets/iso-net-readiness-01-design-packet/story_decomposition_v0.md)
- `mockups/` — empty

# Governance

- [Governance README](governance/README.md)
- [Decisions (ADR index)](governance/decisions/README.md) — ADR-001 context system · ADR-002 merge gate · ADR-003 board/doctrine · ADR-004 npm · **ADR-005 island stack sync (2026-09-03)**
- [Contradiction Register](governance/contradictions/register.md) — C-001..C-009
- [Meta](governance/meta/README.md)

# Operations

- [Operations README](operations/README.md)
- [Milestones](operations/milestones/README.md) · [RR Milestone Ledger](operations/milestones/rr_milestone_ledger.md)
- Sessions: [SESSION_LOG](operations/sessions/SESSION_LOG.md) · [Rollup Checklist](operations/sessions/session_rollup_checklist.md) · [2026-08-25 Repo Initialization Plan](operations/sessions/2026-08-25_repo_initialization_plan.md)
- [Feedback](operations/feedback/README.md) · [Raw backlog](operations/feedback/raw/user_feedback_backlog.md)
- [Reviews](operations/reviews/README.md)
- [User Workflow](operations/user-workflow/README.md)

# Team / Agents

- [Team](team/README.md) · [Agents fleet index](team/agents/README.md)
- Contracts: [Operating](team/agents/agent_operating_contract.md) · [Handoff](team/agents/agent_handoff_contract.md) · [Orchestration Model](team/agents/orchestration_model.md) · [Collaboration Model](team/agents/collaboration_model.md) · [Planning Surface Workflow](team/agents/planning_surface_workflow.md)
- Roles: [Axium](team/agents/systems-engineer/README.md) · [Rin](team/agents/context-librarian/README.md) · [Software engineers (Marlow/Verin/Vera/Ember)](team/agents/software-engineers/README.md) · [Cadence](team/agents/ui-designer/README.md)
- Claude Code harnesses: [`.claude/agents/`](../../.claude/agents/README.md)

# Platform

- [Platform (reusable concepts)](platform/README.md)
- [**Architecture Research Corpus** (R1..R7)](platform/research/README.md) — DDD · Data Fabric · Event/Message Buses · Identity Stores · MAC Stores · Cross Domain Solution integration · UI/UX in relation to DDD. `exploratory` research briefs, not doctrine; the base corpus for DDD-ARCH-01. **Pass 2 (2026-09-03):** all seven modernized to the README's currency contract (2026 signal-first Angular idiom), each with a Modernization ledger.

# Evidence

- [Evidence README](evidence/README.md)
- [Source Register](evidence/raw/source_register.md) — SRC-001..SRC-012
- Raw: `evidence/raw/project-road-runner-description.txt` (SRC-012, founder source)
- [Raw](evidence/raw/README.md) · [Images](evidence/images/README.md)
- Raw source folders (registered, not moved): `../source-documents/`, `../angular-upgrade-docs/`, `../../images/rr_logos/`
- Reference: `../context.root-files.example/` (TrAIdit exemplar)
