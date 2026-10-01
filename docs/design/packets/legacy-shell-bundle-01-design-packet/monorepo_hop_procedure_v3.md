---
schema: corpus-doc/v1
status: exploratory
title: Monorepo Hop Procedure v3 — the full ladder 17 → 22.2.1, scripted (tools/hop.sh), on the exact-pinned apps
areas: [frontend, isolated-network, dev-environment]
related: ["docs/design/packets/legacy-shell-bundle-01-design-packet/monorepo_hop_procedure_v2.md", "docs/design/packets/legacy-shell-bundle-01-design-packet/nexus_upload_instructions_v2.md", "docs/design/packets/legacy-shell-bundle-01-design-packet/offline_verification_transcript_v3.md", "docs/design/packets/first-app-hop-01-design-packet/field_hop_procedure_v1.md"]
updated: 2026-10-01
---

# Monorepo Hop Procedure v3 — Angular 17 → 22.2.1, one rung at a time

**Created:** 2026-10-01 | **Status:** `exploratory` — every step below was run on 2026-10-01 on two shells built from the apps' **exact-pinned** package.json files: online first, then **replayed offline against Nexus loaded from the bundle** (offline_verification_transcript_v3). **Supersedes v2** (2026-09-03), which stays as the evidence trail. This file travels in every upgrade bundle as `LADDER.md`.

## What is new in v3

- **The steps are a script:** `tools/hop.sh <app-root> <rung> <step>` (in the bundle). Each step is separate so you review and commit between them on real code. The rehearsal ran exactly this script.
- **The landing is 22.2.1**, not 22.1.5: 22.0–22.1.x carries a critical and a high advisory fixed in 22.2.0; both networks land on the same patch.
- **Re-based on the exact pins** the apps really install (no `^` ranges). `ng update` keeps that style: it writes `18.2.14`, not `^18.2.14`.
- **New finding — 19→20 edits `angular.json`:** Angular 20's migration adds a top-level `"schematics"` block (keeps the pre-v20 file naming for `ng generate`). In this layout it lands in the *temporary* root file; `teardown` now ports it into `packages/client/angular.json` automatically (and proves the port by round-trip), instead of losing it.
- **The TypeScript 6 `types` fix is automatic at 21→22** (was a hand edit): only packages that actually fail with TS1479 get `"types": ["node"]`, re-verified.
- **NgRx 22.0.1** completes phase 2 without the schematic crash 22.0.0 had.
- **Node for the last rung ships in the bundle** (`node/node-v22.23.3-linux-x64.tar.xz`).

## Before the first rung (once per app)

- A **clean git checkout** of the app on a branch; a baseline recorded **before** anything changes: `ng build` (warnings verbatim), `jest` counts, `tsc` per package, `npm ls`, and the **`angular.json` budgets** (a `maximumError` component-style budget turns the v19+ warning below into a build failure).
- The registry (Nexus) serving the rung — `upload-to-nexus.sh --through <rung>` — **with complete npm metadata** (`hop.sh` refuses to start if `@angular/core`'s metadata lacks `ng-update`: a Nexus loaded through its components REST API strips it, and `ng update` then moves core alone — found 2026-10-01), **and** metadata for the app's own `@my-team/*` workspace packages (`ng update` reads metadata for every declared dependency, including your own).
- `.npmrc` with `PUPPETEER_SKIP_DOWNLOAD=true` (already the convention).
- **Private Angular-coupled packages** (`@other-team/core-web-angular`): `npm view @other-team/core-web-angular@<version> peerDependencies`. If it peers on `@angular/* ^<current>`, phase 1 refuses at plan stage until that team publishes a build for the next major. **Do not `--force` past it without them** — and if you do by agreement, the app must be *run* with one of its components on screen before the rung counts as done. (Not rehearsable: those packages are not on the public registry.)

## The steps (per app, per rung)

```bash
B=<extracted bundle>; cd <app root>
$B/tools/hop.sh . <rung> check      # read-only: Node vs. the rung, registry, what will move
$B/tools/hop.sh . <rung> pre        # pre-step edits (18-19, 20-21) + temporary root angular.json -> validate if it changed, commit
$B/tools/hop.sh . <rung> phase1     # ng update @angular/core @angular/cli           -> READ the migration diff, commit
$B/tools/hop.sh . <rung> phase2     # ng update material/cdk (+ any @ngrx/*)         -> review, commit
$B/tools/hop.sh . <rung> pins       # what ng update cannot see (below)              -> review, commit
$B/tools/hop.sh . <rung> teardown   # port angular.json edits, remove temp file, regenerate the lock from clean (+21-22 TS fix) -> commit
$B/tools/hop.sh . <rung> validate   # ng build · tsc per package · jest · npm ls      -> commit
```

**Why the temporary root `angular.json`:** `angular.json` lives in `packages/client/`, but `ng update` must run beside the package.json that declares `@angular/core` — the root. There is no supported way to run the hop from `packages/client` (five approaches tried, v2). `pre` writes the temporary file (`make-root-angular-json.mjs`), `teardown` removes it.

**Never combine phase 1 and phase 2** — the combined plan selects a next-major `@angular/animations` and aborts.

**`pins`** — `ng update` reads only the root package.json, so it moves: `@angular/cli`, `@angular-devkit/build-angular`, `@angular/compiler-cli` (and `typescript` in the package that builds Angular) in every `packages/*/package.json` to the root's new versions; **`keycloak-angular`** to the major that pairs with the new Angular (no migration moves it); and at 21-22 the client tsconfig's `moduleResolution: "node"` → `"bundler"` (TypeScript 6 makes `"node"` a hard error, TS5107).

**`teardown` regenerates the lock from clean** (`rm -rf node_modules packages/*/node_modules package-lock.json && npm install`). The lock `ng update`'s forced installs leave behind has nested stale toolchain and fails `ERESOLVE` on satisfied constraints. Regeneration is the fix, and Nexus serves everything it needs (rehearsed offline).

## The rungs

| | 17→18 | 18→19 | 19→20 | 20→21 | 21→22 |
|---|---|---|---|---|---|
| `@angular/*` | 18.2.14 | 19.2.25 | 20.3.33 | 21.2.25 | **22.2.1** |
| `@angular/cli`, `build-angular` (= temporary CLI) | 18.2.21 | 19.2.27 | 20.3.37 | 21.2.24 | 22.2.1 |
| `@angular/material`, `cdk` | 18.2.14 | 19.2.19 | 20.2.14 | 21.2.14 | 22.2.1 |
| `@ngrx/*` (if declared) | 18.1.1 | 19.2.1 | 20.1.0 | 21.1.1 | 22.0.1 |
| `keycloak-angular` (`pins`) | 16.1.0 | 19.0.2 | 20.1.0 | 21.0.0 | 22.0.0 |
| TypeScript (moved by phase 1 only when out of range) | 5.2.2 → **5.5.4** | — | → **5.9.3** | — | → **6.0.3** |
| zone.js | 0.14.2 → 0.14.10 | → 0.15.1 | — | — | — |
| pre-step (`pre`) | — | `jest-preset-angular` → **14.6.2** (14.1.0 blocks at plan stage) | — | **the Jest 30 stack** (below) | — |
| Node | 22.15.1 ok | ok | ok | ok | **≥ 22.22.3** → install the bundled **22.23.3** first |
| `angular.json` | unchanged | unchanged | **`schematics` block added** (ported by `teardown`) | unchanged | unchanged |
| migrations that touched files (shells) | 1 package.json (NgRx `concatLatestFrom`, app-01) | 1 source file | 1 | 1 | **4** (component source + client tsconfigs) |
| validate | `npm ls --all` WARN: chokidar (below) | budget warning appears (below) | budget warning | budget warning | budget warning; TS1479 fixed in `teardown` |

**The Jest 30 stack (20→21 `pre`)** — `jest-preset-angular` 16.2.0 is the first whose peers reach Angular 21, and it requires Jest 30: `jest`, `jest-environment-jsdom`, `babel-jest` → **30.5.2**; `@types/jest` → **30.0.0**; `ts-jest` → **29.4.14**; `jest-preset-angular` → **16.2.0**; `jsdom` → **26.1.0** wherever it is below 26 — in every package that declares them. Plus the **setup file API**: `import 'jest-preset-angular/setup-jest';` is gone; `pre` rewrites it to
```ts
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
setupZoneTestEnv();
```
(a different form is reported, not rewritten). Validate **green on Jest 30 at v20 before** running phase 1.

**21→22, TypeScript 6 in plain-`tsc` packages** — a package whose `tsconfig.json` has no `"types"` list auto-includes every hoisted `@types/*`; `@types/babel__core` then fails with **TS1479** (ESM import from a CommonJS file). `teardown` finds the packages that fail that way and sets `"types": ["node"]`, re-verifies, and reverts if that does not fix it (a tsconfig with comments is reported for a hand edit). On the shells: `common` (both apps) and `interface` (app-02); `server` already listed `["node"]`.

## Expected warnings (not failures)

- **v18: `npm ls --all` → `invalid: chokidar@4.0.3`.** `@angular/compiler-cli` 18.2 depends on chokidar 4 while `@angular-devkit/core` 18.2 still declares an *optional* chokidar 3 peer; npm hoists 4. Upstream inconsistency, gone at v19, no effect on build or test. `validate` reports it as WARN.
- **v19+: component-style budget** — `Budget 2.00 kB was not met by 925 bytes` on the shells. Warning tier passes; a `maximumError` budget fails the build — check the budgets before hunting a code problem.
- `ng update` lists **optional migrations** at 22 (`migrate-karma-to-vitest`, `use-application-builder`). Neither is part of the hop; they are separate decisions.

## Undo

Each step is a commit: `git reset --hard HEAD~1` undoes the last one precisely. A failed `teardown` leaves the temporary files in place on purpose — read its message.

## What this does not cover

Real application code under migration (the shells have almost no source: on real apps, read every migration diff); the private `@other-team/*` packages (see above); AstroUXDS 7 → 9 (7.x rides every rung untouched — its peer range is permissive — but moving it is separate work); apps with custom webpack or custom schematics.
