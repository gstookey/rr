---
schema: corpus-doc/v1
status: active
title: CURRENT_STATE — Project Road Runner
areas: [context-system, planning]
related: ["docs/context/canonical/current_priorities.md", "docs/context/canonical/two_island_model.md", "docs/context/index.md"]
updated: 2026-09-03
---

# CURRENT_STATE — Project Road Runner

**Created:** 2026-08-25 | **Last updated:** 2026-09-03 (DDD-ARCH-01 packet + research corpus opened; earlier: legacy shells + estate-shaped 17→18 hop + offline-verified bundle — Axium)

This file is **implementation truth**: what actually exists and works now. When design docs and this file disagree, this file wins for operational questions. Keep it compact — standing truth, active lane, open decisions. Completed-arc detail moves to `docs/context/operations/milestones/` at closeout.

## Standing truth

- **Phase:** preparation / planning. No RR application code exists. No CI. **`legacy-shells/` now holds two Angular monorepo shells** (approximations of the two ported island apps, built from their real package.jsons — `docs/source-documents/legacy-apps/`): committed v17→v18 lock history, no real app code; they model *external* island repos, not RR product space.
- **The 17→18 hop is rehearsed estate-shaped and its transfer bundle is verified offline** (2026-09-03, packet `legacy-shell-bundle-01`): 1,311 tarballs / 143.4 MB, SHA-manifested, proven against a bundle-seeded registry inside a no-network namespace (v17 `npm ci`, full `ng update` replay, v18 `npm ci` — all green). The real apps test with **Jest, not Karma** — suites ran with no browser.
- **What exists:** the repo-native context system (this docs corpus), the seven-role agent fleet harnesses under `.claude/agents/`, the merge-gate hook, the corpus-graph tooling (`scripts/corpus-graph.mjs`, green as of 2026-08-25), raw source material for the intended stack and brand.
- **Decided:** package manager is npm (ADR-004, 2026-08-25).
- **Architecture design opened (2026-09-03), nothing ruled:** `docs/design/packets/ddd-arch-01-design-packet/` (DA-D1..DA-D12 open) on top of the seven-brief research corpus `docs/context/platform/research/` (R1..R7, `exploratory`, **pass 2 modernized 2026-09-03** to the corpus README's currency contract — Angular 22.1 / NgRx Signals 22 idiom verified from framework source; `[UNVERIFIED]`-marked where policy/book hosts were unreachable). Working hypothesis, confirmed by R7 and awaiting Graham: Floors = bounded contexts, groups = access/tailoring overlay, one app with lazy fenced Floors, tenant as a claim. No application code, no scaffold.
- **Intended stack (design direction, not implemented):** Angular 22 + TypeScript 6 + Vitest + NgRx SignalStore on the client; AstroUXDS design system with RR brand-token overrides; Node/Express gateway; shared TypeScript `common` library; npm-workspaces monorepo; Helm-chart-driven runtime config for Kubernetes. Source: `docs/source-documents/`. Canonical synthesis: `docs/context/canonical/technology_stack.md`.
- **Target environment: TWO isolated networks**, both with **no agent access**; artifacts cross as one-way compressed bundles. **Legacy Island** — 10+ Angular v17 apps on Node 22.15, to be upgraded there (v19 floor, v22 stretch). **Desert Island** — greenfield, nothing on it yet, where the new system is built. They deploy into a related cluster and must stay stack-synchronized. Model: `canonical/two_island_model.md`. Remaining unknowns: `canonical/isolated_network_constraints.md`.
- **Verified 2026-08-25:** Node 22.15 already satisfies Angular 18/19/20/21; only Angular 22 needs a newer Node (`^22.22.3 || ^24.15.0 || >=26.0.0`). **Reaching the v19 floor requires no Node change on Legacy Island.**
- **Team:** Graham (lead front-end engineer, repo owner, C2) + an npm-fluent human team on the island (size/roles undocumented) + the agent fleet on this side.
- **Planning surface:** GitHub Project "Project Road Runner Roadmap" (`https://github.com/users/gstookey/projects/3`). Epics **EP-01..EP-05** and stories **S-01..S-17** created as issues in `gstookey/rr` on 2026-08-26 with Graham's approval. **Caveat:** they are repo issues with sub-issue hierarchy; whether they appear on Project 3 and carry Status/Priority/Size field values is **not verified from this repo** — Projects v2 was not reachable with the tools available this session.
- **Milestone 1: Legacy Island to Angular 19 minimum** (Graham, 2026-08-26). No GitHub milestone object exists yet — see Known limitations.

## Active lane

- Merged: PR #1 (repo init), PR #2 (readiness packet + two-island model), PR #25 (`ng-hop-01`), PR #26 (`ng-hop-02`), PR #27 (Graham: legacy package.jsons).
- **PR #28 open**: legacy shells + estate-shaped 17→18 hop + verified transfer bundle (`legacy-shell-bundle-01`, delivers S-07's bundle half). Awaiting Graham's review + merge.
- **Next after merge:** Graham hand-jams the real config files (angular.json, jest.config.cjs, setup-jest.ts, tsconfig*) into the shells; locks and hop then re-verified (angular.json build budgets = known re-check). 18→19 hop on the shells is the natural next docket item.
- Milestone 1 is the organizing objective. **Side-quest lane (design only):** DDD-ARCH-01 — next step is Graham reading R1..R7 and ruling round 1 (DA-D1..D6, D8); pass 1 merged (PR #30, 21:56Z); pass 2 (currency contract + modernized briefs + canonical stack corrections + C-009) on branch `claude/ddd-arch-01-modernization-pass-2`, PR pending.

## Open decisions (Graham-gated)

2. **Isolated-network constraints, per island** — what can be installed, how packages reach each network, whether the Node patch bump is permitted. Two questionnaires drafted, not sent.
3. **Monorepo layout** (C-001 layout half) — `apps/*`+`packages/*` assumed; confirm. Cheapest open decision (DR-05).
4. **Harness model assignments** — `.claude/agents/README.md` table vs frontmatter disagree (Axium: fable vs opus; Rin: fable vs haiku).
5. **Prompt-template repo root** — set to `~/repos/rr` as a guess; confirm.

## Known limitations

- **No GitHub milestone object exists for Milestone 1.** The name is carried in docs and epic bodies only. Creating a milestone, adding issues to Project 3, and setting board field values (Status/Priority/Size) were not achievable with this session's tooling — they need Graham or a session with Projects v2 access.
- No `current_file_tree.txt` snapshot: `scripts/snapshot-file-tree.sh` has a 1,000-line floor guard inherited from TrAIdit; this repo's tree is smaller. Floor lowered to 100 on 2026-08-25 — verify it suits.
- `scripts/*.example.*` are TrAIdit reference scripts; none run against this repo.
