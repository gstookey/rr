---
schema: corpus-doc/v1
status: active
title: CURRENT_STATE — Project Road Runner
areas: [context-system, planning]
related: ["docs/context/canonical/current_priorities.md", "docs/context/canonical/two_island_model.md", "docs/context/index.md"]
updated: 2026-09-03
---

# CURRENT_STATE — Project Road Runner

**Created:** 2026-08-25 | **Last updated:** 2026-09-03 (post-merge closeout — the whole Milestone-1 + ladder arc is on `main`; `first-app-hop-01` field kit cut — Axium)

This file is **implementation truth**: what actually exists and works now. When design docs and this file disagree, this file wins for operational questions. Keep it compact — standing truth, active lane, open decisions. Completed-arc detail moves to `docs/context/operations/milestones/` at closeout.

## Standing truth

- **Phase:** preparation / planning. No RR application code exists. No CI. **`legacy-shells/` holds two Angular monorepo shells** (approximations of the two ported island apps, from their real, Graham-corrected package.jsons): full **v17→v22** lock history committed, no real app code; they model *external* island repos, not RR product space. **Both shells stand at Angular 22.1.5 / TS 6.0.3 on `main`.**
- **The whole ladder v17→v22 is rehearsed in the real layout** (angular.json in `packages/client/`; temp-root-angular.json bracket procedure — `legacy-shell-bundle-01/monorepo_hop_procedure_v2.md`), green at every rung. The **master pool is 17→22: 2,102 tarballs / 355.6 MB**, linux-x64, SHA-manifested, **verified offline** (netns, pool-seeded registry, every rung replayed) and **rebuildable by a tested lock-driven script** — Graham's chosen delivery vehicle (`legacy-shells/tools/build-transfer-bundle.sh`, modes `--cumulative` / `--rung` / `--delta-from`). Slices: v17 baseline 104.0 MB · Milestone-1 union (17→19) 1,495/191.3 MB · per-rung deltas 42–73 MB · bare-minimum v22 1,273/143.0 MB. The real apps test with **Jest, not Karma** — suites ran green at every rung with no browser.
- **What the rehearsals do NOT prove:** the shells carry the estate's *dependency surface*, not its *source*. Migrations mostly no-op'd for want of code; on real apps they edit components, templates and stores. The supply-chain half of the hop is de-risked; the source-migration half is not. That asymmetry is why the first real hop is irreplaceable — see `first-app-hop-01`.
- **Decided 2026-09-03: the two islands' stacks must match (ADR-005, closes DR-10).** Legacy's landing version becomes Desert Island's launch version. Graham has directed rehearsing the hop ladder to v22 (capability evidence for DR-04; only the 21→22 rung forces the island's Node patch bump).
- **Island facts confirmed (Graham, 2026-09-03):** RHEL 9 / linux-x64 workstation; Nexus holds the `@my-team/*` metadata; `@ssd_victor/*` current on Nexus; `@other-team/*` upgraded independently by its owning team; nothing runs puppeteer and every island app's `.npmrc` carries `PUPPETEER_SKIP_DOWNLOAD=true`.
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

- Merged: PR #1 (repo init), PR #2 (readiness packet + two-island model), PR #25 (`ng-hop-01`), PR #26 (`ng-hop-02`), PR #27 + #28 + source-doc fixes (Graham: legacy package.jsons, shells + first bundle), PR #30 (DDD-ARCH-01 architecture packet + research corpus).
- **Milestone-1 PR #29 merged 2026-09-03:** reconciled shells walked 17→19 in the real layout, ADR-005, the 17→19 pool + slicer + tested rebuild script, offline verification v2, context sync.
- **The stretch ladder is DONE — PR #31 merged 2026-09-03** (S-09/S-10/S-11): 17→22 pool 2,102 tarballs / 355.6 MB, offline-verified, per-rung findings recorded (Jest-major at 20→21; TS-6 tsconfig edits + ngrx schematic defect + the only Node gate at 21→22, rehearsed on Node 22.23.2). Bare-minimum v22 = the v22 lock-state slice (1,273/143.0 MB). The "golden" variant is specced, not built (next run). Config hand-jam dropped (Graham's call) except an optional later paste of the two client angular.json files.
- Milestone 1 is the organizing objective; the ladder is capability evidence for DR-04, which stays open.
- **Closeout 2026-09-03 (this pass):** docs re-synced to post-merge reality and the seven delivered stories closed on the board as records of a Graham-gated closeout (S-07, S-08, S-09, S-10, S-11, S-14, S-15 — rule 16: closing records, it does not decide). S-16 stays open: the offline *bundle* path is rehearsed, the *day-one runbook* is not.
- **Current lane — `first-app-hop-01`:** the field kit for the first real application hop (plan of record, pre-flight, field-executable procedure, field notes). Written for a person on RHEL 9 with no agent, no internet and change control. What it needs next is **Graham on the island**, not more work here.
- **Graham's execution decisions (2026-09-04), recorded in `island_execution_plan_v1.md`:** port the **full 17→22 ladder in one transfer cycle** (bytes are cheap, transfer cycles are the scarce resource); **skip `--delta-from`** (exporting a Nexus listing costs days-to-weeks of paperwork; `409 Conflict` on duplicate upload is already treated as success); **stage the Nexus uploads one rung at a time** (keeps the registry's state matched to the estate, so a loose `^` range cannot silently resolve higher on an unrelated app).
- **The three `@other-team/*` packages are NOT being bumped, and the rehearsals prove nothing about them** — they were stripped from the shells entirely (private, unresolvable from the public registry; **zero `@other-team` tarballs in the pool**). Resolved as a 60-second pre-flight peer-declaration check with a decision table, not a scope expansion: no bundle changes are needed under any outcome, since those packages come from Nexus. The `ng update` peer-refusal mechanism is **observed** (jest-preset-angular blocked 18→19 at the plan stage); whether a `--force` bypass holds **at runtime** is `[UNVERIFIED]` and carries a hard acceptance criterion (`npm ls @angular/core` must print one version; the app must be loaded with an `@other-team` component on screen).
- **Not built by choice:** the "golden" bundle variant (specced in `v17_to_v19_bundle_manifest_v2.md`). Deferred because it is capability for DR-04, which cannot close until a real app moves, and because ADR-005 binds its pins to legacy's achieved ceiling.
- **Side-quest lane (design only):** DDD-ARCH-01 — pass 1 merged (PR #30); **pass 2** (currency contract + all seven briefs modernized to the 2026 signal-first Angular idiom + canonical stack corrections + C-009) on branch `claude/ddd-arch-01-modernization-pass-2`, **PR #32 merged 2026-09-03**. Next step: Graham reads R1..R7 (pass 2 supersedes the pass-1 read) and rules round 1 (DA-D1..D6, D8).

## Open decisions (Graham-gated)

1. **ADR-005 granularity and binding layer** — identical *exact* versions across the islands, or same-major with patch drift? And what actually binds at the cluster boundary: the Node runtime + shared runtime libs (`@other-team/core-*`, possibly AstroUXDS), or everything? **Planning proceeds on the strictest reading (exact parity, everything), which is the expensive one.** Highest-leverage open question on the board. Source: [ADR-005](context/governance/decisions/ADR-005-island-stack-sync.md).
2. **Isolated-network constraints, per island** — what can be installed, how packages reach each network, whether the Node patch bump is permitted. Two questionnaires drafted, not sent.
3. **Monorepo layout** (C-001 layout half) — `apps/*`+`packages/*` assumed; confirm. Cheapest open decision (DR-05).
4. **Harness model assignments** — `.claude/agents/README.md` table vs frontmatter disagree (Axium: fable vs opus; Rin: fable vs haiku).
5. **Prompt-template repo root** — set to `~/repos/rr` as a guess; confirm.

## Known limitations

- **No GitHub milestone object exists for Milestone 1.** The name is carried in docs and epic bodies only. Creating a milestone, adding issues to Project 3, and setting board field values (Status/Priority/Size) were not achievable with this session's tooling — they need Graham or a session with Projects v2 access.
- No `current_file_tree.txt` snapshot: `scripts/snapshot-file-tree.sh` has a 1,000-line floor guard inherited from TrAIdit; this repo's tree is smaller. Floor lowered to 100 on 2026-08-25 — verify it suits.
- `scripts/*.example.*` are TrAIdit reference scripts; none run against this repo.
