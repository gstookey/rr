---
schema: corpus-doc/v1
status: exploratory
title: Monorepo Hop Procedure v2 — 17→18 and 18→19 in the real layout (angular.json in packages/client)
areas: [frontend, isolated-network, dev-environment]
related: ["docs/design/packets/legacy-shell-bundle-01-design-packet/v17_to_v18_monorepo_runbook_delta_v1.md", "docs/design/packets/ng-hop-01-v17-to-v18-design-packet/v17_to_v18_hop_runbook_v1.md", "docs/design/packets/ng-hop-02-v18-to-v19-design-packet/v18_to_v19_hop_runbook_v1.md"]
updated: 2026-09-03
---

# Monorepo Hop Procedure v2 — the island procedure, in the real layout

**Created:** 2026-09-03 | **Status:** `exploratory` — every step observed on the reconciled shells (Node v22.22.2 / npm 10.9.7), online and replayed **offline**. **Supersedes** the placement finding in [`v17_to_v18_monorepo_runbook_delta_v1.md`](v17_to_v18_monorepo_runbook_delta_v1.md) (kept for its evidence trail); read with the two bare-app runbooks for the per-hop background.

## What changed since v1, and why

v1 was rehearsed with `angular.json` moved to the monorepo root, because `ng update` run from `packages/client` sees only the client package.json (`Package '@angular/core' is not a dependency`). **Graham then confirmed the real apps keep `angular.json` in `packages/client/`** — so the root placement is not the island's reality, and the question became: how does the hop actually run in the real layout?

## Empirical results, real layout (all observed 2026-09-03)

| Attempt | Result |
|---|---|
| `ng update @angular/core@18 @angular/cli@18` from `packages/client` | ✖ `Package '@angular/core' is not a dependency` (reads only client package.json) |
| `ng update @angular/cli@18 @angular-devkit/build-angular@18 @angular/compiler-cli@18` from client | ✔ works — client toolchain + client's `typescript` pin move; root untouched; peer warning about root's stale `@angular/compiler` |
| `ng update @angular/core --migrate-only --from=17 --to=18` from client (unversioned spec) | ✖ **fetches the LATEST temporary CLI** (22.1.7 observed), which then demanded Node ≥ 22.22.3 — an island landmine: unversioned specs reach for latest |
| `ng update @angular/core@18 --migrate-only --from=17` from client (pinned; core hoisted to root node_modules, declared or not) | ✖ `Package is not installed` — the check does not see root-installed @angular packages |
| `@ngrx/* --migrate-only` from client | ✔ works (inconsistently with the above — observed, not explained) |

**Conclusion: there is no supported way to run the full hop from `packages/client` in this layout.** The workable procedure brackets the hop with a **temporary root `angular.json`** so the proven root-workspace procedure applies, then removes it.

## The procedure (per app, per hop)

Prerequisites: clean committed tree; registry (Nexus) serving the hop bundle **and metadata for the `@my-team/*` workspace packages** (confirmed present on island Nexus — Graham, 2026-09-03); `PUPPETEER_SKIP_DOWNLOAD=true` (already in each app's `.npmrc` on the island); baseline `ng build` + `jest` recorded.

0. **Pre-step (18→19 only): `jest-preset-angular` → `14.6.2`** everywhere it is declared (root, client, server). 14.1.0 peers `build-angular >=15 <19`, and `ng update ...@19` refuses at the **plan stage** because of it. 14.6.2 peers reach `<21`.
1. **Generate the temporary root angular.json:** `node legacy-shells/tools/make-root-angular-json.mjs <app-root>` (prefixes the client project's paths with `packages/client/`; refuses to overwrite). Commit it — `ng update` demands a clean tree.
2. **Phase 1 (framework), from the app root:** `npx ng update @angular/core@<N> @angular/cli@<N>`. Observed: temp CLI fetched first (18.2.21 / 19.2.27); root `@angular/*` rewritten; TS/zone moved **only when the current pin is outside the new range** (17→18: TS 5.2.2→5.5.4, zone 0.14.2→0.14.10; 18→19: TS **stayed 5.5.4**, zone 0.14.10→0.15.1); core migrations run (18→19's standalone migration edits component source). Commit.
3. **Phase 2 (Angular-coupled third parties), from the app root:** `npx ng update @angular/material@<N> @angular/cdk@<N> @ngrx/store@<N> @ngrx/effects@<N> @ngrx/signals@<N> @ngrx/operators@<N>`. **Never combine with phase 1** — the combined command computes a broken plan (selects a next-major `@angular/animations`) and aborts. Commit.
4. **Hand-bumps** (invisible to root `ng update`): client toolchain pins (`build-angular`/`cli`/`compiler-cli`, and `typescript` where phase 1 moved it) to the versions phase 1 chose; **`keycloak-angular`** to the major pairing the new Angular (16.1.0 for ng18, 19.0.2 for ng19 — its majors track Angular's).
5. **Teardown + lock regeneration:** verify the temp root `angular.json` is byte-identical to what step 1 generated (it was, both hops — if not, port its changes into `packages/client/angular.json` before deleting), delete it, then `rm -rf node_modules packages/*/node_modules package-lock.json && npm install`. The lock left by ng update's forced installs is poisoned (nested stale toolchain; plain install ERESOLVE-fails on satisfied constraints); regeneration is the fix and the offline registry serves everything it needs (verified).
6. **Validate:** `ng build` from `packages/client` (at v19 expect the **component-style budget warning** — 2.00 kB exceeded by 925 B on the shells, byte-identical to the bare rehearsal; warning-tier passes, a `maximumError` budget config **fails the build** — check `angular.json` budgets before hunting a code problem; real budget values `[NEEDS GRAHAM / island check]`); `tsc` in common/server/interface; `jest` (runs on jsdom, no browser); `npm ls` peer-clean. Commit.

## Version pairings observed (the island table)

| | 17→18 | 18→19 |
|---|---|---|
| @angular/* runtime | 18.2.14 | 19.2.25 |
| @angular/cli + build-angular | 18.2.21 | 19.2.27 (temp CLI = same) |
| typescript | 5.2.2 → **5.5.4** | **unchanged** (5.5.4 satisfies `>=5.5 <5.9`) |
| zone.js | 0.14.2 → 0.14.10 | 0.14.10 → 0.15.1 |
| @angular/material + cdk | 18.2.14 | 19.2.19 |
| @ngrx/* (incl. the 17.0.0-beta.0 operators pin) | 18.1.1 | 19.2.1 |
| keycloak-angular (hand-bump) | 16.1.0 | 19.0.2 |
| jest-preset-angular | (14.1.0 ok) | **pre-step → 14.6.2** |

## Effort signals per rung (DR-04 evidence)

- **17→18:** no source edits on the shells (migrations no-op'd — real apps: expect HttpClientModule rewrites); 1 package.json edit by NgRx's `concatLatestFrom` migration; 3 third-party majors ride the hop (material/cdk, ngrx, keycloak-angular).
- **18→19:** 1 source edit even on the near-empty shells (standalone migration touches **every declarable** on real apps); the jest-preset-angular plan-stage wall; the budget warning appears; otherwise the same shape.

## What this still does not cover

Real application code under migration; the private `@other-team/*` packages (upgraded independently — Graham coordinates with that team at guinea-pig time); real angular.json/jest configs (not ported — Graham decided to skip the hand-jam; the optional later paste of the two client angular.json files is the only pending config item); AstroUXDS's own upgrade path (7.x rode both hops untouched — its peer range `>=12` is permissive — but the 7→9 move is a separate, unrehearsed effort).
