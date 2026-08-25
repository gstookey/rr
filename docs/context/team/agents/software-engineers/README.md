---
schema: corpus-doc/v1
status: accepted
title: Software Engineers
areas: [agent-fleet]
updated: 2026-08-2025
---

# Software Engineers

## Purpose
This folder holds the implementation and verification roles that execute bounded engineering work.

## Current roles
- `01_coder/` - implementation role
- `02_reviewer/` - code review role
- `03_tester/` - validation role
- `04_dev-ops/` - runtime and delivery role
- `05_fast-ui-repairer/` - fast, narrow UI repair role for exact Cadence/Graham-targeted Angular template/SCSS polish addenda

## Role / Workflow / Soul Coverage
- `01_coder/README.md` - Coder local landing page
- `01_coder/coder_role.md` - Coder authority and responsibility
- `01_coder/coder_workflow.md` - Coder execution workflow
- `01_coder/angular_frontend_engineering_policy.md` - Coder Angular / TypeScript frontend implementation policy
- `01_coder/soul.md` - Coder identity, virtues, and failure modes
- `02_reviewer/README.md` - Reviewer local landing page
- `02_reviewer/reviewer_role.md` - Reviewer authority and responsibility
- `02_reviewer/reviewer_workflow.md` - Reviewer review workflow
- `02_reviewer/soul.md` - Reviewer identity, virtues, and failure modes
- `03_tester/README.md` - Tester local landing page
- `03_tester/tester_role.md` - Tester authority and responsibility
- `03_tester/tester_workflow.md` - Tester validation workflow
- `03_tester/soul.md` - Tester identity, virtues, and failure modes
- `04_dev-ops/README.md` - DevOps local landing page
- `04_dev-ops/dev-ops_role.md` - DevOps authority and responsibility
- `04_dev-ops/dev-ops_workflow.md` - DevOps operational workflow
- `04_dev-ops/soul.md` - DevOps identity, virtues, and failure modes
- `05_fast-ui-repairer/README.md` - Fast UI Repairer local landing page
- `05_fast-ui-repairer/fast_ui_repairer_role.md` - Fast UI Repairer authority and responsibility
- `05_fast-ui-repairer/fast_ui_repairer_workflow.md` - Fast UI Repairer execution workflow
- `05_fast-ui-repairer/angular_fast_repair_policy.md` - Fast UI Repairer Angular template/SCSS repair policy
- `05_fast-ui-repairer/scope_and_stop_conditions.md` - Fast UI Repairer allowed scope and stop conditions
- `05_fast-ui-repairer/soul.md` - Fast UI Repairer identity, virtues, and failure modes

Workflow guidance for these roles now has local workflow docs. Task packets, orchestration docs, handoff contracts, and role-specific task instructions remain binding and more specific when present.

## Rule
These roles execute within architecture, milestone, and task constraints. They do not redefine product direction.

Fast UI Repairer is a constrained repair addendum role, not the primary Coder. Use Marlow Coder for normal implementation phases, multi-file work, TypeScript logic/state architecture, backend/API/shared/worker changes, package work, and serious refactors.
