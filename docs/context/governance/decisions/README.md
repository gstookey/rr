---
schema: corpus-doc/v1
status: active
title: Decision Records (ADRs)
areas: [process-governance]
updated: 2026-09-08
---

# Decision Records

**Created:** 2026-08-25 | **Last updated:** 2026-10-01 (ADR-008 — Desert Island dev-environment baseline; amends ADR-004)

| ADR | Title | Status | Date |
|---|---|---|---|
| [ADR-001](ADR-001-context-system-adopted-from-traidit.md) | Adopt the TrAIdit repo-native context system and agent fleet for RR | accepted | 2026-08-25 |
| [ADR-002](ADR-002-merge-gate.md) | Merging to `main` is Graham's click, never an agent's | accepted | 2026-08-25 |
| [ADR-003](ADR-003-board-is-status-docs-are-doctrine.md) | GitHub Project board is status; the docs corpus is doctrine | accepted | 2026-08-25 |
| [ADR-004](ADR-004-package-manager-npm.md) | Package manager: npm (workspaces) for RR and the legacy estate | accepted; island clause amended by ADR-008 | 2026-08-25 |
| [ADR-005](ADR-005-island-stack-sync.md) | The two islands' stacks must match (closes DR-10) | accepted | 2026-09-03 |
| [ADR-006](ADR-006-repo-layout-apps-packages-services.md) | Repository layout: `apps/` + `packages/` + `services/` npm workspaces (closes C-001's layout half, DR-05) | accepted | 2026-09-04 |
| [ADR-007](ADR-007-acme-workshop-is-a-learning-instrument.md) | ACME Workshop is a learning instrument, not the Desert Island scaffold (resolves C-008) | accepted | 2026-09-08 |
| [ADR-008](ADR-008-desert-island-devenv-baseline.md) | Desert Island dev-environment baseline: npm + pnpm (per app), Docker CE + kind, Angular 22.2.1 on both islands, k8s tools at the cluster minor, newest Nexus (resolves C-011, C-013) | accepted | 2026-10-01 |

Format: Context / Decision / Consequences / Expiration (if the decision is a temporary constraint, say when it expires — AGENTS.md "What to avoid").
