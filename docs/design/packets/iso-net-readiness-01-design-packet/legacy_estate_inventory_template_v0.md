---
schema: corpus-doc/v1
status: exploratory
title: Legacy Estate Inventory Template v0 — Angular v17 applications
areas: [isolated-network, frontend, dev-environment, planning]
related: ["docs/context/canonical/project_overview.md", "docs/context/canonical/isolated_network_constraints.md", "docs/design/packets/iso-net-readiness-01-design-packet/README.md"]
updated: 2026-08-25
---

# Legacy Estate Inventory Template v0

**Created:** 2026-08-25 | **Last updated:** 2026-08-25 | **Status:** `exploratory` — instrument draft, not yet issued

## What this is and why it is the bottleneck

There are **10+ Angular applications at v17** on the isolated network that must be upgraded to **v19 at minimum, v22 if we can carry the effort** (`project_overview.md`, LOE-6).

That sentence is not a plan. It cannot be turned into one, because the effort per application varies by more than an order of magnitude depending on facts nobody has written down: whether an app uses the Angular CLI or a hand-rolled webpack config, whether its tests are Karma or something else, whether it depends on a UI library whose v22-compatible release exists, whether someone wrote custom schematics five years ago.

**This table is the input the LOE-6 upgrade plan cannot be sized without.** One filled row per application converts "10+ apps, v17 → v19/v22" from a hope into an estimate with a spread.

Fill it on the network. It requires no internet access — every field is readable from files already in each repository.

---

## The table

Copy this into a spreadsheet or keep it as markdown; one row per application. Column meanings and where to find each value are in the next section.

| # | App name | Angular ver. | Node ver. | Pkg mgr + lockfile | Build tooling | Test runner | UI libs | Notable 3rd-party deps | Custom schematics | CI present | Owner |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 |  |  |  |  |  |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |  |  |  |  |  |
| 4 |  |  |  |  |  |  |  |  |  |  |  |
| 5 |  |  |  |  |  |  |  |  |  |  |  |
| 6 |  |  |  |  |  |  |  |  |  |  |  |
| 7 |  |  |  |  |  |  |  |  |  |  |  |
| 8 |  |  |  |  |  |  |  |  |  |  |  |
| 9 |  |  |  |  |  |  |  |  |  |  |  |
| 10 |  |  |  |  |  |  |  |  |  |  |  |
| 11 |  |  |  |  |  |  |  |  |  |  |  |
| 12 |  |  |  |  |  |  |  |  |  |  |  |

*(Add rows as needed. If the count is not exactly known, that itself is a finding — record it.)*

### Column definitions

| Column | What to write | Where it comes from |
|---|---|---|
| **App name** | The repository or project name. Use a placeholder if naming is restricted (see questionnaire C1) and keep the mapping locally. | — |
| **Angular ver.** | The exact version string of `@angular/core`, e.g. `17.3.12` — not just "17". | `package.json` → `dependencies["@angular/core"]`, or `package-lock.json` for the resolved version |
| **Node ver.** | The Node version this app is actually built with today. If it is pinned somewhere, say where. | `.nvmrc`, `package.json` → `engines.node`, CI config, or ask the person who builds it |
| **Pkg mgr + lockfile** | Which package manager, and **which lockfile file actually exists in the repo**: `package-lock.json` (npm), `yarn.lock` (Yarn), `pnpm-lock.yaml` (pnpm), or **none**. | file listing at the repo root |
| **Build tooling** | One of: `Angular CLI (default builder)`, `Angular CLI + custom builder`, `custom webpack`, `esbuild/other`, `unknown`. Note any `ngx-build-plus`, `@angular-builders/custom-webpack`, or a `webpack.config.js` at the root. | `angular.json` → `projects.*.architect.build.builder`, plus root config files |
| **Test runner** | `Karma+Jasmine`, `Jest`, `Vitest`, `none`, or `configured but not run`. Note if tests exist but currently fail. | `angular.json` → `test.builder`, plus `karma.conf.js` / `jest.config.*` / `vitest.config.*` |
| **UI libs** | Angular Material, AstroUXDS, PrimeNG, NG Bootstrap, Kendo, an internal component library, or none — **with versions**. | `package.json` `dependencies` |
| **Notable 3rd-party deps** | Anything that historically breaks across Angular majors: state libraries (NgRx/NGXS/Akita), charting (Highcharts/D3/ECharts), grids (ag-Grid), `moment`, RxJS if pinned oddly, anything unmaintained. Versions included. Three to six entries is enough — do not transcribe the whole file. | `package.json` `dependencies` |
| **Custom schematics** | `yes` / `no`. Yes if the repo contains a `schematics/` folder, a `collection.json`, or `ng-update`/`ng-add` definitions of its own. | repo file listing; `package.json` → `schematics` field |
| **CI present** | `yes (<system>)` / `no`. Whether an automated build runs on commit. | `.gitlab-ci.yml`, `Jenkinsfile`, `.github/workflows/`, or the CI system's own project list |
| **Owner** | A person or team who can answer questions and approve changes to this app. | — |

---

## How to fill this in offline, in 15 minutes per app

No internet needed. Work from a clean checkout of each application.

1. **(2 min) Open `package.json`.** Read off, in order: `dependencies["@angular/core"]` → *Angular ver.* · `engines.node` if present → *Node ver.* · scan `dependencies` for UI libraries → *UI libs* · scan again for state/chart/grid/date libraries → *Notable 3rd-party deps* · check for a top-level `"schematics"` field → *Custom schematics*.
2. **(1 min) List the repository root.** Which lockfile is present → *Pkg mgr + lockfile*. Is there a `webpack.config.js`, a `karma.conf.js`, a `jest.config.*`, a `schematics/` folder, a `.nvmrc`? Each answers a column.
3. **(3 min) Open `angular.json`.** Find your main project under `projects`, then `architect.build.builder` → *Build tooling* (a value that is not `@angular-devkit/build-angular:*` or `@angular/build:*` means custom — write down what it is). Then `architect.test.builder` → *Test runner*.
4. **(1 min) Check for CI.** Look for `.gitlab-ci.yml`, `Jenkinsfile`, `.github/workflows/`, `azure-pipelines.yml` → *CI present*.
5. **(2 min) Confirm the Node version actually used.** If step 1 gave nothing, check `.nvmrc`, then the CI config, then ask whoever builds it. Write `unknown` rather than guessing — a wrong Node version here produces a wrong upgrade estimate.
6. **(5 min, optional but high value) Try a clean build.** From a clean checkout: install dependencies, then build. Record only the outcome — `builds clean`, `builds with warnings`, `fails`, or `not attempted` — in a notes column. **An app that does not build today cannot be upgraded; finding that out now rather than mid-upgrade is worth the five minutes.**
7. **Write `unknown` freely.** An honest `unknown` routes to a follow-up question. A confident guess routes to a wrong plan.

If you only have time for part of this: **columns 3, 5, 6, and 9** (Angular version, build tooling, test runner, custom schematics) carry most of the sizing signal.

---

## How the filled table gets used

Once returned, each row sorts into a rough effort band. These bands are **Axium's first-order judgement, not measured data** — they exist to make the shape of the estimate visible, and they get replaced by real numbers after the first application is upgraded for real.

| Band | Signature | Implication |
|---|---|---|
| **Straightforward** | Angular CLI default builder · Karma or no tests · no custom schematics · mainstream UI lib with a current release | `ng update` per major version hop, mostly mechanical |
| **Moderate** | CLI with a custom builder, **or** a heavily-used UI library, **or** a state library needing its own major upgrades in step | each hop needs its own verification pass |
| **Hard** | custom webpack **or** custom schematics **or** an unmaintained dependency with no v22-compatible release **or** does not currently build | needs an individual plan; may be the reason the estate stops at v19 rather than v22 |

The distribution across those three bands — not the app count — is what determines whether **v22 is reachable or v19 is the honest target**. That is a decision this packet raises and does not close (see `decision_register_v0.md`, DR-04).

Two structural facts are already known and worth stating before the table returns:

- The hop chain is **v17 → v18 → v19 → v20 → v21 → v22**: five successive major upgrades, each done in order, not one jump. Raw guidance for each hop is already in `docs/angular-upgrade-docs/`.
- Every version-hop toolchain must itself be **carried onto the network as packages**. Upgrading an app to v18 requires the v18 packages to be present in the internal registry. The delivery must therefore cover the *intermediate* versions, not only the destination — a requirement that is easy to miss and expensive to discover late. (Anchor versions per hop are listed in [`stack_dependency_manifest_v0.md`](stack_dependency_manifest_v0.md), Appendix B.)
