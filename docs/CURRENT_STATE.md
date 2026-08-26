---
schema: corpus-doc/v1
status: active
title: CURRENT_STATE — Project Road Runner
areas: [context-system, planning]
related: ["docs/context/canonical/current_priorities.md", "docs/context/canonical/two_island_model.md", "docs/context/index.md"]
updated: 2026-08-26
---

# CURRENT_STATE — Project Road Runner

**Created:** 2026-08-25 | **Last updated:** 2026-08-26 (two-island model, board stood up, Milestone 1 named — Axium)

This file is **implementation truth**: what actually exists and works now. When design docs and this file disagree, this file wins for operational questions. Keep it compact — standing truth, active lane, open decisions. Completed-arc detail moves to `docs/context/operations/milestones/` at closeout.

## Standing truth

- **Phase:** preparation / planning. No application code exists in this repo. No monorepo, no `package.json`, no CI.
- **What exists:** the repo-native context system (this docs corpus), the seven-role agent fleet harnesses under `.claude/agents/`, the merge-gate hook, the corpus-graph tooling (`scripts/corpus-graph.mjs`, green as of 2026-08-25), raw source material for the intended stack and brand.
- **Decided:** package manager is npm (ADR-004, 2026-08-25).
- **Intended stack (design direction, not implemented):** Angular 22 + TypeScript 6 + Vitest + NgRx SignalStore on the client; AstroUXDS design system with RR brand-token overrides; Node/Express gateway; shared TypeScript `common` library; npm-workspaces monorepo; Helm-chart-driven runtime config for Kubernetes. Source: `docs/source-documents/`. Canonical synthesis: `docs/context/canonical/technology_stack.md`.
- **Target environment: TWO isolated networks**, both with **no agent access**; artifacts cross as one-way compressed bundles. **Legacy Island** — 10+ Angular v17 apps on Node 22.15, to be upgraded there (v19 floor, v22 stretch). **Desert Island** — greenfield, nothing on it yet, where the new system is built. They deploy into a related cluster and must stay stack-synchronized. Model: `canonical/two_island_model.md`. Remaining unknowns: `canonical/isolated_network_constraints.md`.
- **Verified 2026-08-25:** Node 22.15 already satisfies Angular 18/19/20/21; only Angular 22 needs a newer Node (`^22.22.3 || ^24.15.0 || >=26.0.0`). **Reaching the v19 floor requires no Node change on Legacy Island.**
- **Team:** Graham (lead front-end engineer, repo owner, C2) + an npm-fluent human team on the island (size/roles undocumented) + the agent fleet on this side.
- **Planning surface:** GitHub Project "Project Road Runner Roadmap" (`https://github.com/users/gstookey/projects/3`). Epics **EP-01..EP-05** and stories **S-01..S-17** created as issues in `gstookey/rr` on 2026-08-26 with Graham's approval. **Caveat:** they are repo issues with sub-issue hierarchy; whether they appear on Project 3 and carry Status/Priority/Size field values is **not verified from this repo** — Projects v2 was not reachable with the tools available this session.
- **Milestone 1: Legacy Island to Angular 19 minimum** (Graham, 2026-08-26). No GitHub milestone object exists yet — see Known limitations.

## Active lane

- Repo initialization merged to `main` (`3d2d735`, PR #1).
- **PR #2 open**: the Isolated-Network Readiness packet + the two-island model. Awaiting Graham's review + merge.
- Milestone 1 is the organizing objective. Nothing is activated: 17 stories exist, none moved to In Progress.

## Open decisions (Graham-gated)

2. **Isolated-network constraints, per island** — what can be installed, how packages reach each network, whether the Node patch bump is permitted. Two questionnaires drafted, not sent.
3. **Monorepo layout** (C-001 layout half) — `apps/*`+`packages/*` assumed; confirm. Cheapest open decision (DR-05).
4. **Harness model assignments** — `.claude/agents/README.md` table vs frontmatter disagree (Axium: fable vs opus; Rin: fable vs haiku).
5. **Prompt-template repo root** — set to `~/repos/rr` as a guess; confirm.

## Known limitations

- **No GitHub milestone object exists for Milestone 1.** The name is carried in docs and epic bodies only. Creating a milestone, adding issues to Project 3, and setting board field values (Status/Priority/Size) were not achievable with this session's tooling — they need Graham or a session with Projects v2 access.
- No `current_file_tree.txt` snapshot: `scripts/snapshot-file-tree.sh` has a 1,000-line floor guard inherited from TrAIdit; this repo's tree is smaller. Floor lowered to 100 on 2026-08-25 — verify it suits.
- `scripts/*.example.*` are TrAIdit reference scripts; none run against this repo.
