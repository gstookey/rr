---
schema: corpus-doc/v1
status: exploratory
title: v17→v18 Monorepo Runbook Delta v1 — what changes on estate-shaped apps
areas: [frontend, isolated-network, dev-environment]
related: ["docs/design/packets/ng-hop-01-v17-to-v18-design-packet/v17_to_v18_hop_runbook_v1.md", "docs/design/packets/legacy-shell-bundle-01-design-packet/README.md"]
updated: 2026-09-03
---

# v17 → v18 Monorepo Runbook Delta v1

**Created:** 2026-09-03 | **Status:** `exploratory` — every finding below was observed on the legacy shells (2026-09-03, Node v22.22.2 / npm 10.9.7), not predicted. **Read together with** [`ng-hop-01/v17_to_v18_hop_runbook_v1.md`](../ng-hop-01-v17-to-v18-design-packet/v17_to_v18_hop_runbook_v1.md) — that procedure stands; this is what changes when the app is one of the estate's workspace monorepos.

## The shape of the problem

The estate apps are npm-workspaces monorepos with the Angular framework deps declared at the **root** package.json and per-package toolchain pins in the children (`packages/client` etc.). `ng update` was built for single-package workspaces. The hop still works — but it becomes a **three-step procedure**, and four walls stand in the way that a bare app never shows.

## Finding 1 — run `ng update` from the monorepo root, and `angular.json` must live there

Run from `packages/client`, `ng update` reads only the client package.json and fails:

```
Found 18 dependencies.
Package '@angular/core' is not a dependency.
```

`@angular/core` is declared at the root. `ng update` must run where `angular.json` sits, next to the package.json that declares the framework — for these apps, the **monorepo root**. (The shells were restructured accordingly; `[NEEDS GRAHAM]` — confirm where the real apps keep `angular.json`.)

## Finding 2 — `ng update`'s metadata sweep 404s fatally on private workspace packages

With the root package.json declaring the workspace-local `@my-team/legacy-app-01-common: "*"`, the update dies before touching anything:

```
Fetching dependency metadata from registry...
✖ Migration failed: 404 Not Found - GET https://registry.npmjs.org/@my-team%2flegacy-app-01-common - Not found
```

`ng update` queries the registry for **every** dependency declared at the workspace root — including packages that npm itself resolves as local workspace links and never fetches. **Island consequence: Nexus must serve metadata for the `@my-team/*` packages (even a placeholder publish of the exact versions), or every `ng update` on the estate dies at this wall.** Questionnaire item added. Rehearsal workaround: temporarily remove the line, restore after the update.

## Finding 3 — the hop moves TypeScript and zone.js on these apps (unlike the bare app)

The estate pins `typescript 5.2.2` and `zone.js 0.14.2` — both below Angular 18's floors. Observed rewrites:

```
typescript @ "5.5.4"  (was "5.2.2")     ← top of ng18's >=5.4 <5.6 window
zone.js    @ "0.14.10" (was "0.14.2")
```

This confirms the working rule from the two bare rehearsals: **`ng update` moves TS/zone.js to the top of the new accepted range, but only when the current pin falls outside it.** Bundle consequence: TypeScript 5.5.4 and zone.js 0.14.10 are hop cargo for the estate even though the bare-app manifest said "unchanged."

## Finding 4 — the third-party Angular-coupled deps do NOT ride along, and the tree is broken until they are updated

After `ng update @angular/core@18 @angular/cli@18` succeeds, the tree is **peer-invalid**: `@ngrx/*@17.2.0` and `keycloak-angular@15.1.0` pin `@angular/core ^17` against the installed 18.2.14 (`npm ls` reports `invalid`; a plain `npm install` at this point ERESOLVE-fails). `ng update`'s own installer forces past what npm will not. The fix is a **second** update phase:

```
npx ng update @angular/material@18 @angular/cdk@18 @ngrx/store@18 @ngrx/effects@18 @ngrx/signals@18 @ngrx/operators@18
```

Observed: Material/CDK 17.3.10 → 18.2.14, all `@ngrx/*` → 18.1.1 (including the `17.0.0-beta.0` operators pin), and the NgRx `concatLatestFrom` migration made a real file edit — the first code-touching migration seen in any rehearsal.

**Do not combine the two phases.** The one-command variant (core+cli+material+ngrx together) computed a broken plan on app-02 — it selected `@angular/animations@19.2.25` against core 18.2.14 — and aborted with `Incompatible peer dependencies found`. Framework first, third parties second. This is mandatory sequencing, not style.

## Finding 5 — child-package declarations are invisible to `ng update`; hand-bumps required

Two classes of dependency have to be edited by hand because they live in `packages/client/package.json`, which root-level `ng update` never reads (`Package 'keycloak-angular' is not a dependency`):

1. **`keycloak-angular`** `15.1.0 → 16.1.0` (its major tracks Angular's; 16.x peers `@angular/* ^18`, keeps `keycloak-js 23.0.7`). Chosen by hand from the registry, not by schematic.
2. **The client's own toolchain pins**: `@angular-devkit/build-angular` / `@angular/cli` → `^18.2.21`, `@angular/compiler-cli` → `^18.2.14`, `typescript` → `5.5.4`. Left stale, they nest a conflicting v17 compiler under `packages/client` and poison later installs.

## Finding 6 — after the hop, regenerate the lock

The lock that `ng update`'s forced installs leave behind still carries nested v17 toolchain entries; a plain `npm install` then ERESOLVE-fails **on a constraint that is actually satisfied** (it reported typescript 5.5.4 conflicting with `>=5.4 <5.6`). Recovery, and now the standard final step:

```
rm -rf node_modules packages/*/node_modules package-lock.json
npm install
```

Full re-resolution produces a clean, peer-valid lock. On the island this re-resolution runs against Nexus and needs no package that is not already in the hop bundle (verified offline — see the transcript doc).

## The estate procedure, consolidated

0. Clean tree, committed. Baseline `ng build` + `jest` recorded.
1. `npx ng update @angular/core@18 @angular/cli@18` (from the monorepo root; Finding 2 wall handled first).
2. `npx ng update @angular/material@18 @angular/cdk@18 @ngrx/store@18 @ngrx/effects@18 @ngrx/signals@18 @ngrx/operators@18`.
3. Hand-bumps (Finding 5), then lock regeneration (Finding 6), then `ng build` + `jest` + `npm ls` peer check.

Observed green end-state on both shells: core 18.2.14 / cli 18.2.21 / ts 5.5.4 / zone 0.14.10, `ng build` clean, jest 3/3 **with no browser present** (the real apps are Jest-based — this materially softens the Karma browser-binary risk from `ng-hop-01`; a browser remains relevant for e2e and manual verification only).

## What a real app adds beyond this

Real source code (migrations will edit it), the private `@other-team/*` packages and their peers (invisible from here), real jest/angular configs (build budgets are a known v19-adjacent risk), and whatever `@ssd_victor/fix-es-imports` does to the build chain. `[NEEDS GRAHAM]` on all four.
