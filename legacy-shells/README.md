---
schema: corpus-doc/v1
status: exploratory
title: Legacy Shells — approximated Legacy Island app monorepos
areas: [isolated-network, frontend, dev-environment, technology-stack]
related: ["docs/design/packets/legacy-shell-bundle-01-design-packet/README.md", "docs/context/canonical/two_island_model.md"]
updated: 2026-10-01
---

# Legacy Shells

**Created:** 2026-09-03 | **Last updated:** 2026-10-01 (re-based on the exact-pinned sources, re-walked 17 → **22.2.1**, `tools/hop.sh`) | **Status:** `exploratory` — approximations, not ports

Two Angular monorepo shells built from the **real package.json files** of two Legacy Island applications (`docs/source-documents/legacy-apps/`, including Graham's 2026-09-03 corrections: puppeteer 21.9.0, `@types/stompjs ^2.3.9`, real interface package content, fixed cross-app refs). Their purpose is to approximate the island's **dependency lock shapes** so upgrade hops and transfer bundles can be rehearsed against something with the estate's real dependency surface. **They contain no real application code.**

**Current state (2026-10-01): both shells stand at Angular 22.2.1**, walked 17 → 18 → 19 → 20 → 21 → 22.2.1 by `tools/hop.sh` (procedure: `docs/design/packets/legacy-shell-bundle-01-design-packet/monorepo_hop_procedure_v3.md`) after being **re-based on Graham's exact-pinned package.json files** (main 4dec9c4 — the versions actually installed on the island, no `^`). Their v17 baseline is regenerated from those sources by `tools/shells-from-source.mjs`, which prints every correction it applies. Per-rung lock snapshots for bundle-building live in `bundle/locks/v17..v22/` (+ `bundle/tempcli/hop18..hop22/` for `ng update`'s temporary CLI); the pool they define is `bundle/SHA256SUMS` + `bundle/MANIFEST.json` (2,202 tarballs / 375.9 MB; the 2026-09-03 pool is archived beside it for `--delta-from`). Each shell root carries the island's `.npmrc` convention (`PUPPETEER_SKIP_DOWNLOAD=true`).

### Tools (`tools/`)

| Tool | Does |
|---|---|
| `build-transfer-bundle.sh` | the ladder bundle (cumulative / one rung / delta) from the committed locks — see the [bundling scripts guide](../docs/context/operations/user-workflow/bundling_scripts_guide_v1.md) |
| `hop.sh <app> <rung> <step>` | one rung, one step at a time (check · pre · phase1 · phase2 · pins · teardown · validate · all); ships in every bundle |
| `upload-to-nexus.sh` + `npm-load-package.sh` | load a bundle into Nexus (`npm publish`, staged with `--through <rung>`, npm-metadata verify + repair); ship in every bundle |
| `make-root-angular-json.mjs` / `port-root-angular-json.mjs` | the temporary root `angular.json`, and carrying migration edits back into `packages/client/angular.json` |
| `shells-from-source.mjs` | regenerate the shells' v17 package.json files from `docs/source-documents/legacy-apps/` |
| `lock-union.mjs` · `fetch-tarballs.mjs` · `slice-bundle.mjs` | the pool machinery (npm and pnpm v9 lockfiles; shared with the dev-environment bundles) |

They live here in `legacy-shells/` — deliberately **outside** the future RR product space (`apps/*` / `packages/*`, C-001/DR-05) — because they model *external* island repositories, not parts of RR.

- `legacy-app-01/` — npm workspaces: `packages/{common, client, server}`
- `legacy-app-02/` — npm workspaces: `packages/{interface, common, client, server}`

The committed `package-lock.json` at each root is the deliverable: the approximated island lock shape. `node_modules/` and build output are not committed.

## What is real vs. placeholder

| File | Status |
|---|---|
| `package.json` (root + each package) | **Real** — from Graham's hand-jammed copies, with the flagged corrections below |
| `package-lock.json` (each root) | **Generated** here from those package.jsons against the public registry (Node v22.22.2, npm 10.9.7) |
| `packages/client/angular.json`, `tsconfig*.json`, `src/**` | **Placeholder** — a default `ng new @17.3.17` app (`--style=scss --routing`); awaiting Graham's real configs |
| `packages/client/jest.config.cjs`, `setup-jest.ts` | **Placeholder** — minimal `jest-preset-angular` wiring; awaiting Graham's real configs |
| `packages/{common,server,interface}/src/**`, `tsconfig.json` | **Placeholder** — minimal compilable stubs |

**Graham: paste your real files over the placeholders in place** — same paths, parent and children (`jest.config.cjs`, `angular.json`, `setup-jest.ts`, `tsconfig.json`, `tsconfig.spec.json`, and any others). Locks get re-checked after each drop.

## Corrections made to the source package.jsons (each one flagged, none silent)

**As of 2026-10-01 only three remain** (applied by `tools/shells-from-source.mjs`, which prints each): **C1** private-scope packages dropped (`@other-team/*`, `@ssd_victor/*` — not on the public registry); **C2** `&& fix-es-imports` stripped from build scripts (its package is private-scope); **C3** app-02's root `start`/`serve` scripts pointed at app-02's own workspaces. Graham's 2026-10-01 source update resolved the rest (puppeteer 21.9.0, `@types/stompjs` 2.3.9, the `@typescript-eslint` names, app-02's own common package, the real interface package). Notable changes in the sources: **app-02 has no NgRx at all**, and app-02's Material/CDK is **17.0.4** (app-01: 17.3.10). The historical list below is kept for its rationale.

1. **Private-scope packages omitted** — not on the public registry (verified 404): `@other-team/core-web-angular`, `@other-team/core-common`, `@other-team/core-node`, `@ssd_victor/fix-es-imports`, `@ssd_victor/merge-coverage`. They live only on the island's Nexus; **their transitive dependency trees are invisible to this rehearsal** (see honest-limits in the packet).
2. **`puppeteer` `3.2.5` → `3.3.0`** — 3.2.5 does not exist on the public registry (3.x ends at 3.3.0). `[NEEDS GRAHAM]`: the version your Nexus actually serves.
3. **`@types/stompjs: ^29.5.12` omitted** (server packages) — unresolvable anywhere (latest is 2.3.10); looks like a copy-paste of the `@types/jest` version. `[NEEDS GRAHAM]`: the real line.
4. **`typescript-eslint/eslint-plugin|parser` → `@typescript-eslint/...`** (roots) — as written the names are invalid npm names (missing `@`).
5. **app-02's references to `@my-team/legacy-app-01-common` → `legacy-app-02-common`** (root devDeps, server deps) — as written, app-02's install cannot resolve app-01's private workspace package. `[NEEDS GRAHAM]`: if app-02 *genuinely* depends on app-01's common package, that is a cross-app coupling with real supply-chain consequences (app-01-common must be published to Nexus) — say so and these get reverted.
6. **`fix-es-imports` dropped from `build` scripts** (common/server/interface) — its package is private-scope (item 1).
7. **Duplicate `@my-team/*-common` entry removed from server devDependencies** (it appears in both deps and devDeps in the source).
8. **`packages/interface/package.json` invented entirely** — the source file is empty (0 bytes). Modeled on `common`. `[NEEDS GRAHAM]`: the real contents.
9. **`angular.json` lives in `packages/client/`** — resolved by Graham 2026-09-03 (the real layout), reverting the earlier root placement. Because `ng update` must run beside the package.json that declares `@angular/core`, hops use a **temporary root angular.json** generated by `tools/make-root-angular-json.mjs` and deleted at hop end — the full empirical trail and procedure: `docs/design/packets/legacy-shell-bundle-01-design-packet/monorepo_hop_procedure_v2.md`.
10. Root scripts kept verbatim otherwise — including app-02's `start`/`serve` pointing at `legacy-app-01-*` workspace names (suspected transcription artifact, harmless to the lock) and the root `"build": "npm run build"` self-recursion in both apps. `[NEEDS GRAHAM]`: confirm what the real root `build` script says.

## Notable pins (observations, not corrections)

- `typescript 5.2.2` — fine for ng17 (`>=5.2 <5.5`) but **below ng18's floor** (`>=5.4 <5.6`): unlike the bare-app rehearsal, **the 17→18 hop must move TypeScript here**.
- `@ngrx/operators 17.0.0-beta.0` — a **beta pin** in production dependency lists.
- **Two UI libraries at once**: `@astrouxds/angular ^7.20.0` (two majors behind the current v9) *and* Angular Material + CDK 17.
- `keycloak-angular 15.1.0` pins `@angular/* ^17` — its major tracks Angular's, so every hop drags a keycloak-angular bump with it.
- `express 4.18.2` (DR-08 context), `rxjs 7.8.1`, `zone.js 0.14.2`, `tslib 2.6.2`, `jsdom ^20` at root (distinct from jest's own jsdom), `@types/node ^22.10.10` (consistent with island Node 22.15).
- **No `engines` field anywhere** — nothing machine-enforces the island's Node version.

## Install / build

```
npm install            # at legacy-app-01/ or legacy-app-02/ root
npx ng build           # in packages/client
npx tsc                # in packages/common, server, interface
npx jest               # in packages/client — runs on jsdom, no browser needed
```

Set `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` (and `PUPPETEER_SKIP_DOWNLOAD=true`) for installs: puppeteer's post-install Chromium download is not an npm-registry fetch and must not sneak into any bundle accounting.
