---
schema: corpus-doc/v1
status: active
title: CURRENT_STATE — Project Road Runner
areas: [context-system, planning]
related: ["docs/context/canonical/current_priorities.md", "docs/context/canonical/two_island_model.md", "docs/context/index.md"]
updated: 2026-09-03
---

# CURRENT_STATE — Project Road Runner

**Created:** 2026-08-25 | **Last updated:** 2026-09-03 (legacy shells + estate-shaped 17→18 hop + offline-verified bundle — Axium)

This file is **implementation truth**: what actually exists and works now. When design docs and this file disagree, this file wins for operational questions. Keep it compact — standing truth, active lane, open decisions. Completed-arc detail moves to `docs/context/operations/milestones/` at closeout.

## Standing truth

- **Phase:** preparation / planning. No RR application code exists. No CI. **`legacy-shells/` holds two Angular monorepo shells** (approximations of the two ported island apps, from their real, Graham-corrected package.jsons): full v17→v18→v19 lock history committed, no real app code; they model *external* island repos, not RR product space. **Both shells stand at Angular 22.1.5 / TS 6.0.3 (ladder branch; the Milestone-1 PR leaves them at 19.2.25).**
- **Both Milestone-1 hops are rehearsed in the real layout** (angular.json in `packages/client/`; temp-root-angular.json bracket procedure — `legacy-shell-bundle-01/monorepo_hop_procedure_v2.md`) and the **17→19 master pool** (1,495 tarballs / 191.3 MB; per-rung slices v17 104.0 / hop-18 45.1 / hop-19 42.2 MB) is SHA-manifested, **verified offline** (netns, bundle-seeded registry, both hops replayed), and **rebuildable by a tested lock-driven script** — Graham's chosen delivery vehicle (`legacy-shells/tools/build-transfer-bundle.sh`). The real apps test with **Jest, not Karma** — suites ran green at v17/v18/v19 with no browser.
- **Decided 2026-09-03: the two islands' stacks must match (ADR-005, closes DR-10).** Legacy's landing version becomes Desert Island's launch version. Graham has directed rehearsing the hop ladder to v22 (capability evidence for DR-04; only the 21→22 rung forces the island's Node patch bump).
- **Island facts confirmed (Graham, 2026-09-03):** RHEL 9 / linux-x64 workstation; Nexus holds the `@my-team/*` metadata; `@ssd_victor/*` current on Nexus; `@other-team/*` upgraded independently by its owning team; nothing runs puppeteer and every island app's `.npmrc` carries `PUPPETEER_SKIP_DOWNLOAD=true`.
- **What exists:** the repo-native context system (this docs corpus), the seven-role agent fleet harnesses under `.claude/agents/`, the merge-gate hook, the corpus-graph tooling (`scripts/corpus-graph.mjs`, green as of 2026-08-25), raw source material for the intended stack and brand.
- **Decided:** package manager is npm (ADR-004, 2026-08-25).
- **Intended stack (design direction, not implemented):** Angular 22 + TypeScript 6 + Vitest + NgRx SignalStore on the client; AstroUXDS design system with RR brand-token overrides; Node/Express gateway; shared TypeScript `common` library; npm-workspaces monorepo; Helm-chart-driven runtime config for Kubernetes. Source: `docs/source-documents/`. Canonical synthesis: `docs/context/canonical/technology_stack.md`.
- **Target environment: TWO isolated networks**, both with **no agent access**; artifacts cross as one-way compressed bundles. **Legacy Island** — 10+ Angular v17 apps on Node 22.15, to be upgraded there (v19 floor, v22 stretch). **Desert Island** — greenfield, nothing on it yet, where the new system is built. They deploy into a related cluster and must stay stack-synchronized. Model: `canonical/two_island_model.md`. Remaining unknowns: `canonical/isolated_network_constraints.md`.
- **Verified 2026-08-25:** Node 22.15 already satisfies Angular 18/19/20/21; only Angular 22 needs a newer Node (`^22.22.3 || ^24.15.0 || >=26.0.0`). **Reaching the v19 floor requires no Node change on Legacy Island.**
- **Team:** Graham (lead front-end engineer, repo owner, C2) + an npm-fluent human team on the island (size/roles undocumented) + the agent fleet on this side.
- **Planning surface:** GitHub Project "Project Road Runner Roadmap" (`https://github.com/users/gstookey/projects/3`). Epics **EP-01..EP-05** and stories **S-01..S-17** created as issues in `gstookey/rr` on 2026-08-26 with Graham's approval. **Caveat:** they are repo issues with sub-issue hierarchy; whether they appear on Project 3 and carry Status/Priority/Size field values is **not verified from this repo** — Projects v2 was not reachable with the tools available this session.
- **Milestone 1: Legacy Island to Angular 19 minimum** (Graham, 2026-08-26). No GitHub milestone object exists yet — see Known limitations.

## Active lane

- Merged: PR #1 (repo init), PR #2 (readiness packet + two-island model), PR #25 (`ng-hop-01`), PR #26 (`ng-hop-02`), PR #27 + #28 + source-doc fixes (Graham: legacy package.jsons, shells + first bundle).
- **Milestone-1 PR open** (this branch): reconciled shells walked 17→19 in the real layout, ADR-005, the 17→19 pool + slicer + tested rebuild script, offline verification v2, context sync. Awaiting Graham's review + merge.
- **The stretch ladder is DONE on its own branch/PR** (S-09/S-10/S-11): 17→22 pool 2,102 tarballs / 355.6 MB, offline-verified, per-rung findings recorded (Jest-major at 20→21; TS-6 tsconfig edits + ngrx schematic defect + the only Node gate at 21→22, rehearsed on Node 22.23.2). Bare-minimum v22 = the v22 lock-state slice (1,273/143.0 MB). The "golden" variant is specced, not built (next run). Config hand-jam dropped (Graham's call) except an optional later paste of the two client angular.json files.
- Milestone 1 is the organizing objective; the ladder is capability evidence for DR-04, which stays open.

## Open decisions (Graham-gated)

2. **Isolated-network constraints, per island** — what can be installed, how packages reach each network, whether the Node patch bump is permitted. Two questionnaires drafted, not sent.
3. **Monorepo layout** (C-001 layout half) — `apps/*`+`packages/*` assumed; confirm. Cheapest open decision (DR-05).
4. **Harness model assignments** — `.claude/agents/README.md` table vs frontmatter disagree (Axium: fable vs opus; Rin: fable vs haiku).
5. **Prompt-template repo root** — set to `~/repos/rr` as a guess; confirm.

## Known limitations

- **No GitHub milestone object exists for Milestone 1.** The name is carried in docs and epic bodies only. Creating a milestone, adding issues to Project 3, and setting board field values (Status/Priority/Size) were not achievable with this session's tooling — they need Graham or a session with Projects v2 access.
- No `current_file_tree.txt` snapshot: `scripts/snapshot-file-tree.sh` has a 1,000-line floor guard inherited from TrAIdit; this repo's tree is smaller. Floor lowered to 100 on 2026-08-25 — verify it suits.
- `scripts/*.example.*` are TrAIdit reference scripts; none run against this repo.
