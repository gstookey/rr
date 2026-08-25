---
schema: corpus-doc/v1
status: active
title: Contradiction Register
areas: [process-governance, context-system]
updated: 2026-08-25
---

# Contradiction Register

**Created:** 2026-08-25 | **Last updated:** 2026-08-25

Numbered, never silently resolved. Status: `open` | `resolved (ADR/commit)` | `accepted tension`.

| # | Date | Contradiction | Where | Status | Resolution / owner |
|---|---|---|---|---|---|
| C-001 | 2026-08-25 | **Monorepo layout and package manager.** Source docs prescribe npm workspaces with `client/ common/ server/`. Inherited fleet docs (coder policy, workflows, `scripts/README.example.md`, `.claude/launch.json`) assume pnpm + corepack and `apps/web`, `apps/api`, `@project-road-runner/web`. | `docs/source-documents/monorepo-set-up-docs/`, `docs/context/team/agents/software-engineers/01_coder/*`, `.claude/launch.json` | open | Graham decides; then Rin sweeps the losing convention. First real architecture decision for RR. |
| C-002 | 2026-08-25 | **Harness model assignments.** `.claude/agents/README.md` table: Axium=fable, Rin=fable. Frontmatter: Axium=`opus`, Rin=`haiku`. | `.claude/agents/` | open | Graham picks; trivial edit. |
| C-003 | 2026-08-25 | **Marin (orchestration coordinator)** is referenced in Axium's identity addendum and harness as a role, but has no harness in `.claude/agents/` or docs in `team/agents/`. | `docs/context/team/agents/systems-engineer/identity_addendum.md`, `.claude/agents/axium-systems-engineer.md` | accepted tension | Port when a run needs it (harness README already says so). |
| C-004 | 2026-08-25 | **Librarian checklist still lists TrAIdit-era pages** (`canonical/evaluation.md`, `versioning.md`, `implementation_program.md`, `operations/task-queue/`, `operations/milestones/rr_milestone_ledger.md`, feedback retrospectives) that do not exist in RR. | `context-librarian/context_librarian_checklist.md`, `context_maintenance_workflow.md`, `.claude/agents/rin-librarian.md` | open | Retargeted the milestone-ledger path on 2026-08-25; remaining page names left as "create-when-needed" markers. Rin to prune on first real closeout pass. |
| C-005 | 2026-08-25 | **Brand guide references a companion `_roadrunner-tokens.scss`** that is not in the repo. | `docs/source-documents/.../project-rr-style-guide.md` §6 | open | Cadence/Graham: locate or author it in `docs/design/brand/`. |
| C-006 | 2026-08-25 | **Project description exists in the Claude project but not in the repo.** `canonical/project_overview.md` is partial. | Claude project vs `docs/context/` | open | Graham pastes it into `evidence/raw/`; Rin reconciles. |
