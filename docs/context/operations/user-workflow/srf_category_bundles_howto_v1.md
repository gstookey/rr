---
schema: corpus-doc/v1
status: exploratory
title: SRF Category Bundles How-To v1 — one front-end transfer bundle per SRF approval status, step by step
areas: [dev-environment, isolated-network, technology-stack, frontend]
related: ["docs/context/operations/user-workflow/bundling_scripts_guide_v1.md", "docs/source-documents/desert-island-setup-docs/front-end-srf-status.csv", "docs/design/packets/desert-island-devenv-01-design-packet/devops_tech_stack_list_v2.md", "desert-island-devenv/island/README.md"]
updated: 2026-10-02
---

# SRF Category Bundles — How-To v1

**Created:** 2026-10-02 (Axium, at Graham's request) | **Last updated:** 2026-10-02, later: the sheet's **Vite** (6.4.3 → 8.3.0) and **esbuild** (0.25.0 → 0.28.2) rows now match what Angular 22 itself pins ([§6](#6-what-the-sheet-tells-you) explains why, and what to re-vet); the planner treats each 0.x minor as its own major; sizes and the rehearsal re-done | **Status:** `exploratory` — every step below was run on 2026-10-02 against the committed sheet (results: [§7](#7-rehearsal-2026-10-02)).

**What this is for.** Your front-end tech stack sheet gives every row an **Approval Status**. `build-srf-bundles.sh` reads that column and cuts the front-end/workstation stack into **one transfer bundle per status**, so you can port what's approved now and port each other group as its SRFs come through:

| Order | Bundle | Status in the sheet | Rows | Size (2026-10-02) | What's in it |
|---|---|---|---|---|---|
| 1 | `devenv-frontend-approved-<date>.tar` | MAJOR ALREADY APPROVED | 39 | 403 MB | Node 24 (+npm), VS Code RPM, RxJS, zone.js, tslib, STOMP/RxStomp, SockJS, ws, amqplib, uuid, the Node-server libraries, PostCSS, Autoprefixer, esbuild 0.28, Babel 7, ts-jest, istanbul, typescript-eslint, Prettier and friends, the `@types/*` |
| 2 | `devenv-frontend-bump-submitted-<date>.tar` | MAJOR BUMP SRF SUBMITTED | 8 | 75 MB | Angular 22.2.1: framework, SSR, CLI, both build systems, compiler-cli, Material, CDK |
| 3 | `devenv-frontend-bump-needed-<date>.tar` | MAJOR BUMP SRF NEEDED | 18 | 352 MB | TypeScript 6, AstroUXDS, ng-packagr, NgRx, keycloak-angular/-js, Express 5, Tailwind 4, Vite 8, Jest 30 stack, jsdom, Cypress 16 (+ its binary), ESLint 9, `@types/jest` |
| 4 | `devenv-frontend-new-srf-<date>.tar` | NEW SRF NEEDED | 5 | 301 MB | KafkaJS, Vitest, Playwright (+ Chromium), angular-eslint, Sheriff |
| 5 | `devenv-frontend-nice-to-have-<date>.tar` | need srf - nice to have / can wait | 10 | 250 MB | pnpm, only-allow, the VS Code extensions, uv, Prisma (+ engine), Nx |

Plus `SRF-BUNDLES-<date>.md`, a one-page summary of the lot.

**The rule that makes this work:** each bundle carries its rows' software **plus everything those rows depend on**, so each one loads into Nexus by itself, in any order. A dependency two categories share ships in both; the loader skips it the second time. What a bundle does **not** carry is another *row* of the sheet. If ts-jest (approved) needs Jest (bump needed), the approved bundle doesn't sneak Jest in. It lists it under "Needs software from other bundles" instead, so nothing crosses before its SRF is approved.

---

## Part A — Build the bundles (connected side)

### Step 1. Update the sheet and export it as CSV

1. Edit the spreadsheet as usual. The script needs these **column headings, spelled this way** (order doesn't matter; extra columns are ignored): `Category`, `Software`, `Current Major`, `Requested Version`, `Purpose`, `Approval Status`.
2. **File → Save As → "CSV UTF-8 (Comma delimited)"**, e.g. `~/srf/FrontEndTechStack.csv`.

Notes columns (like the "ask duby" note on TypeScript) are never read and never copied into a bundle. A bundle only carries Category, Software, versions, Purpose and Approval Status.

The committed copy of the sheet is [`docs/source-documents/desert-island-setup-docs/front-end-srf-status.csv`](../../../source-documents/desert-island-setup-docs/front-end-srf-status.csv) (SRC-017). It is the default when you don't pass `--sheet`. When a status changes, re-export the sheet and either pass it with `--sheet` or replace that file and commit it, so the repo records what each bundle was cut from.

### Step 2. Get the latest scripts

```bash
cd ~/rr && git checkout main && git pull
```

Use a Linux x86_64 staging machine with internet access, the same machine `build-frontend-bundle.sh` runs on ([bundling guide §0](bundling_scripts_guide_v1.md#0-the-staging-machine-connected-side)). Free disk: about **4 GB** for the complete front-end bundle the categories are cut from, plus **1.4 GB** for the five `.tar` files.

### Step 3. Run the builder

```bash
desert-island-devenv/tools/build-srf-bundles.sh ~/bundles --sheet ~/srf/FrontEndTechStack.csv
```

The four stages it prints:

| Stage | What happens | Time |
|---|---|---|
| `1/4 complete front-end bundle` | runs `build-frontend-bundle.sh` (every download checksum-verified), then re-verifies the result | 10–40 min the first time, ~1 min on a re-run (download cache) |
| `2/4 plan` | matches each sheet row to its packages and files, walks the dependency graph per status, checks the sheet against the lockfile | seconds |
| `3/4 bundles` | assembles each bundle (hard links, so this is fast), checksums it, tars it | 1–3 min |
| `4/4 summary` | writes `SRF-BUNDLES-<date>.md` and lists the `.tar` files | — |

Options:

| Option | Use it when |
|---|---|
| `--sheet <file.csv>` | always, unless the committed copy is current |
| `--only approved` (repeatable) | you only want some categories this time. Takes the short name (`approved`, `bump-submitted`, `bump-needed`, `new-srf`, `nice-to-have`) or the status text from the sheet |
| `--from-bundle ~/bundles/devenv-frontend-bundle-<date>` | you already built the complete bundle from this commit and just want to re-cut (e.g. after a status change) |
| `--relock` | you changed a version in `stack/frontend/package.json` (passed to `build-frontend-bundle.sh`; commit the new lockfile) |

### Step 4. Read what it printed

The plan stage prints one block per status, for example:

```
  approved         39 rows    426 npm tarballs (21.9 MB)    3 other files (379.8 MB)
      requires: bump-needed:ESLint (+ @eslint/js), bump-needed:Jest, bump-needed:TypeScript
      carries other majors of sheet packages: uuid@8.3.2
```

- **requires** lists the rows from *other* bundles that some of this bundle's rows need before a project can install them. This is your SRF critical path (see [§6](#6-what-the-sheet-tells-you)).
- **carries other majors** lists dependencies that are a different major version of a package the sheet lists. An approval names a major version, so these are worth showing the reviewer (§6).

It ends with `DONE` and a table of the `.tar` files. If it printed `STOP:` or `ABORT:` instead, see [§5](#5-troubleshooting). Nothing was written for that run.

### Step 5. Look at what each bundle holds (and attach it to the SRF)

Every bundle has **`SRF-CONTENTS.md`** at its top. It lists, for that category only:

- **Software:** each row with its version, purpose, and exactly what is delivered for it (npm `name version`, or `raw/…` file);
- **Not in this bundle:** e.g. Python 3.12 comes from the RHEL 9 media, npm ships inside Node;
- **Needs software from other bundles:** which of these rows need which rows elsewhere, and which bundle those are in;
- **Works with, when present (optional):** optional peer dependencies;
- **Other major versions of sheet software carried here;**
- **Transitive npm dependencies:** every other package in the bundle, `name version`, one per line.

`SRF-BUNDLES-<date>.md` (next to the `.tar` files) has the same information across all five bundles on one page.

> **Open question for whoever runs the SRF process (not answered here):** does an SRF cover a package's transitive dependencies, or must they be listed? The bundle has ~100–700 of them. `SRF-CONTENTS.md` lists them all, so you can attach it either way.

---

## Part B — Port, load and prove (isolated side), one category at a time

The island runbook travels inside every bundle (`island/README.md`, section "Bundles by SRF approval status"). It covers configuration, Nexus repositories and troubleshooting in full. These are the steps in order.

### Step 6. First bundle: `approved`

```bash
# 1. on arrival
tar -xf devenv-frontend-approved-<date>.tar && cd devenv-frontend-approved-<date>
sha256sum -c SHA256SUMS --quiet && echo TRANSFER-OK

# 2. first time on this Nexus only (see island/README.md steps 1-2)
cp island/devenv.conf.template island/devenv.conf            # NEXUS_URL, repo names, credentials FILE
island/nexus-create-repos.sh --anonymous-read                # admin account; creates npm/raw/... hosted repos

# 3. load it
island/load-nexus.sh                                         # only FAILED=0 everywhere is success

# 4. set up a workstation (once per machine)
sudo island/install-frontend-workstation.sh system
island/install-frontend-workstation.sh user

# 5. prove this category
island/prove-install.sh category
```

What to expect:

- **`system`** installs Node 24 + npm and VS Code. It prints a `SKIPPED: … re-run this step after loading the bundle that carries it` line for each of pnpm, uv, the Cypress binary and the Playwright browsers. That's expected: those are in later bundles.
- **`user`** writes the offline-safe VS Code settings and prints one `SKIPPED` line for the extensions (they are in the nice-to-have bundle). Not rehearsed: it needs VS Code on a desktop.
- **`prove-install.sh category`** checks that Nexus serves every npm tarball in this bundle (and lists every version in the package metadata) and every file. It then **really installs**, from an empty cache, the npm packages of every row whose needs are met. The rows that need another bundle are listed as `WAIT`, which is not a failure:

```
PASS  npm: all 426 tarballs served by Nexus, each version listed in its package metadata
PASS  raw: all 3 files served by Nexus
WAIT  Jest (bundle: bump-needed) is not in Nexus yet -- needed to install: ts-jest
WAIT  TypeScript (bundle: bump-needed) is not in Nexus yet -- needed to install: ts-jest; typescript-eslint (+ parser and plugin)
WAIT  ESLint (+ @eslint/js) (bundle: bump-needed) is not in Nexus yet -- needed to install: typescript-eslint (+ parser and plugin); eslint-plugin-unused-imports; eslint-config-prettier
NOTE  35 of 39 rows have everything they need in Nexus; 4 wait on the bundles named above
PASS  npm installs the 33 npm packages of every row whose needs are met, from Nexus (empty cache)

RESULT: 3 passed, 0 failed
WAITING: 3 other bundle(s) named above must be loaded before those rows install -- not a failure of this bundle
GREEN -- reproducible from Nexus alone.
```

### Step 7. Each later bundle, as its approvals arrive

For `bump-submitted`, `bump-needed`, `new-srf` and `nice-to-have`, in whatever order approvals come:

```bash
tar -xf devenv-frontend-<status>-<date>.tar && cd devenv-frontend-<status>-<date>
sha256sum -c SHA256SUMS --quiet && echo TRANSFER-OK
cp <previous bundle>/island/devenv.conf island/                # same settings as before
island/load-nexus.sh
island/prove-install.sh category
```

Then re-run the workstation steps if this bundle carries something they install:

| After loading | Re-run on each workstation | Picks up |
|---|---|---|
| `bump-needed` | `sudo FROM_NEXUS=1 island/install-frontend-workstation.sh system` | Cypress binary |
| `new-srf` | same | Playwright browsers |
| `nice-to-have` | same, then `island/install-frontend-workstation.sh user` | pnpm, uv; the VS Code extensions |

(`FROM_NEXUS=1` takes the files from Nexus, so the workstation doesn't need the media. Re-running `system` is safe: it re-installs the same versions.)

A row that was `WAIT` in an earlier category's proof installs once the bundle it waited on is loaded. Re-run that category's `prove-install.sh category` to see it turn into a plain install.

### Step 8. When all five are loaded: the full proof

```bash
island/prove-install.sh frontend        # from any of the five bundles
```

This is the same acceptance test as for the one-piece bundle. It runs `pnpm install --frozen-lockfile` of the whole example stack from an empty store, then checks the Angular CLI, TypeScript 6, Prisma's engine, the Cypress binary, Playwright launching Chromium, npm, uv and Python 3.12. `GREEN` means Nexus alone can supply the whole front-end stack.

---

## Part C — When something changes

| Change | Do |
|---|---|
| **An SRF is approved** (a row's status changes) | Nothing to rebuild if its bundle is already across: load it (Step 7). Update the sheet's status for the record, and re-export it next time you build. |
| **You want two statuses in one bundle** (e.g. Angular plus TypeScript together, since Angular's tooling needs TypeScript 6; see §6) | In a copy of the sheet, give those rows the same Approval Status text, then build with `--sheet <copy>`. The script makes one bundle per distinct status value, so grouping is entirely in your hands. |
| **A row moves to a different status after its bundle was built** | Re-export and re-run (`--from-bundle` to skip the rebuild). The new bundles overlap the old ones; the loader skips whatever Nexus already has (`already-present`). |
| **A new row in the sheet** | The build stops with `these spreadsheet rows are not in srf-components.tsv`. Add one line to `desert-island-devenv/stack/srf-components.tsv` (format below) and, if it's new software, add it to the stack (`stack/frontend/package.json` → `--relock`). Commit both. |
| **A version changes** | Change the stack ([bundling guide §3](bundling_scripts_guide_v1.md#3-when-a-pin-changes)) **and** the sheet's Requested Version. The build checks that they agree and stops if they don't, so a bundle never carries a version its SRF doesn't name. |
| **A row's Software text is renamed in the sheet** | Rename it the same way in `srf-components.tsv` (matching ignores case and extra spaces, nothing else). |

### The mapping file, `desert-island-devenv/stack/srf-components.tsv`

One line per sheet row. **Tab**-separated: `Software as in the sheet`, then its npm packages (space-separated), then any other files:

```
Jest	jest
Angular CDK	@angular/cdk
Cypress	cypress	raw:cypress/
VS Code ext: ESLint		vsix:dbaeumer.vscode-eslint
Python (RHEL 9 media version)		media:the-RHEL-9-AppStream-media-(dnf-install-python3.12)
npm		with:Node.js
```

| Other-file kind | Means |
|---|---|
| `raw:<dir>/` | every file under that directory of the complete bundle's `raw/` (Node, VS Code, uv, the Cypress and Playwright binaries, the Prisma engine) |
| `vsix:<extension id>` | that VS Code extension's `.vsix` |
| `media:<text>` | not in any bundle; comes from the RHEL media (`-` reads as a space in the note) |
| `with:<row>` | ships inside another row's files |

The build refuses to run if any package the stack declares belongs to no row, belongs to two rows, or if the file names a package the stack doesn't declare. Every package has exactly one SRF home.

---

## 5. Troubleshooting

| You see | Means | Do |
|---|---|---|
| `STOP: these spreadsheet rows are not in …srf-components.tsv` | a new or renamed row | Part C, "new row" / "renamed" |
| `STOP: these packages are declared by the stack but belong to no spreadsheet row` | the stack gained a package the sheet doesn't list | add a row to the sheet (and the mapping), or remove it from the stack |
| `STOP: npm package X is claimed by two rows` | the mapping puts one package under two rows | keep it under one |
| `STOP: the sheet's Requested Version does not match what the stack is locked to` | e.g. the sheet says 7.8.2, the lock has 7.8.1 | correct whichever is wrong (Part C, "a version changes") |
| `STOP: the sheet has no "approval status" column` | heading renamed or missing | restore the heading (Step 1) |
| `STOP: two statuses reduce to the same bundle name` | two status texts differ only in punctuation | make them identical, or distinct |
| `STOP: N pool tarballs belong to no status` | the lockfile has a shape the planner doesn't model (should not happen; it is checked on every build) | report it with the lines printed |
| `ABORT: … was built with --skip-browsers or --skip-vscode` | `--from-bundle` points at a trial build | rebuild without the skip flags |
| `ABORT: … built from a different stack/frontend/pnpm-lock.yaml` | `--from-bundle` points at an older build | drop `--from-bundle` |
| island: `STOP: npm not found on this machine, this bundle carries no Node, and Nexus raw has none yet` | loading a later category before `approved` on a machine without Node | load `approved` first, or install Node on the loading machine |
| island: `STOP: load-nexus.sh ended unexpectedly (exit N)` | the loader hit something it has no message for | record that line and the lines above it, then re-run once (it resumes) |
| island: `FAIL  npm: …` in `prove-install.sh category` | this bundle's load is incomplete | run `island/load-nexus.sh npm` again (it repairs); record anything still listed |
| island: `WAIT  …` | that row needs a bundle not loaded yet | not a failure: load that bundle when it's approved |

---

## 6. What the sheet tells you

*(Revised 2026-10-02, after Graham asked: "if we need higher versions than the sheet lists, is the sheet wrong?")* These are facts about the dependency graph, offered for your SRF strategy; they are not decisions.

### 6.1 What the sheet lists, and what it can't

The sheet lists what the stack **declares**: our choices, one row each. The planner checks that every Requested Version is exactly the version the stack is locked to, so the sheet is correct about what it lists. What it can't show is what those choices **bring with them**: the bundles carry about 1,550 npm tarballs, against roughly 100 declared packages.

Sometimes a dependency is **a second copy, at another major, of a package the sheet already lists.** npm and pnpm handle that by installing both copies side by side, each private to the package that asked for it. Angular's build gets its Babel 8 and Jest gets its Babel 7, and neither sees the other. That's normal and safe, but it means "Babel 7 approved" doesn't describe everything that crosses.

There are two kinds of second copy, and they need different answers.

### 6.2 Kind 1: we picked an older line than our own framework pins. The sheet was wrong; fixed 2026-10-02

| Row | Was | Now | Why |
|---|---|---|---|
| Vite | 6.4.3 | **8.3.0** | Angular 22.2.1's build pins Vite **8.3.0** exactly. The only other user of our Vite, Vitest 4.1.11, accepts 6, 7 or 8. Vite 6 was a second major that nothing needed. |
| esbuild | 0.25.0 | **0.28.2** | Angular 22.2.1's build pins esbuild **0.28.2** exactly (ng-packagr wants `^0.28.2`). Our 0.25.0 was only needed by Vite 6; jest-preset-angular accepts `>=0.23.0`, and the ladder's Angular 22 end state already runs Jest on esbuild 0.28.2. |

Both rows changed in the stack (`stack/frontend/package.json`; the relock **only removed** packages: Vite 6.4.3, esbuild 0.25.0 and its platform binaries) and in the committed sheet. The pool went from 1,554 to 1,551 tarballs.

**The SRF picture is now honest:** Angular's build (`@angular/build`, `build-angular`) now lists the **Vite** row (bump needed) and the **esbuild** row as requirements, where before they were hidden copies inside Angular's bundle. Approving Vite 8 covers exactly the Vite that Angular runs.

**How it happened:**
1. Your proposal (SRC-013) listed `vite 6.1.1` and `esbuild 0.25.0`.
2. The reconciliation's rule was to keep each proposed major and move within it only for an advisory or an incompatibility. Vite moved to 6.4.3 for advisories, and esbuild stayed.
3. That rule looked at each package on its own. It never asked whether Angular 22, added in the same pass, pins its own copy at a newer line. Angular pins both exactly, so staying on the proposed major *added* a major instead of avoiding one.
4. esbuild was also hidden by the planner, which counted 0.25 and 0.28 as the same "major 0". Semver, and npm's `^`, treat each 0.x minor as its own breaking line. The planner now does too (`srf-plan.mjs`, 2026-10-02).

### 6.3 Kind 2: both copies are genuinely needed. The sheet is right

Each row below is what *we* use; the second copy is pinned by an upstream package for its own use. No change to the sheet can remove it.

| Sheet row (ours) | Second copy | Pinned by | Why ours can't change |
|---|---|---|---|
| Babel Core 7.29.7 / Preset Env 7.26.9 | **Babel 8.0.5** (+ 8.0.1), preset-env **8.0.5** | Angular 22's build (`@angular/build`, `build-angular`, `compiler-cli`: exact pins) | Jest 30 itself hard-depends on Babel 7 (`@jest/transform`, `jest-snapshot`, `jest-config`: `^7.27.4`), so do istanbul-lib-instrument (`^7.23.9`) and ts-jest (`<8`); both legacy apps declare Babel 7. Both majors stay until Jest supports Babel 8. |
| tslib 2.8.1 | tslib 1.14.1 | `build-angular` → webpack-dev-server → selfsigned → @peculiar/x509 → tsyringe (`^1.9.3`) | ours is the newer one |
| uuid 11.1.1 | uuid 8.3.2 | sockjs 0.3.24 (`^8.3.2`; the latest sockjs) | ours is the newer one; RxStomp needs `>=9 <12` |
| ws 8.22.0 | ws 7.5.13 | Cypress → chrome-remote-interface (`^7.2.0`) | ours is the newer one |
| dotenv 16.4.5 | dotenv 17.4.2 | Prisma → c12 (`^17.3.1`) | 16.4.5 is legacy parity (both legacy apps declare it), and Nx pins 16.4.7, so 16 stays either way |

Each second copy rides with the row that brings it: Babel 8 with Angular (its SRF is already submitted), tslib 1 with Angular, uuid 8 with SockJS (approved), ws 7 with Cypress (bump needed), dotenv 17 with Prisma (nice-to-have). Every bundle's `SRF-CONTENTS.md` lists them under "Other major versions of sheet software carried here". **Whether they need mention on an SRF is the SRF office's call (open).** If they do, Babel 8 is the one that touches an SRF already submitted (Angular's).

### 6.4 The critical path

1. **TypeScript 6 and Vite 8** (both bump needed) gate the Angular toolchain:
   - TypeScript gates the Angular CLI, `@angular/build` and `build-angular` (bump-submitted); ts-jest and typescript-eslint (approved); angular-eslint and Sheriff (new SRF); Nx (nice-to-have).
   - Vite gates `@angular/build` and `build-angular` (as it always did, now visible) and Vitest.

   So the Angular approval alone doesn't give you a working Angular 22 toolchain. The runtime packages (`@angular/core` etc.) need only RxJS and tslib, both approved. If you can, run the TypeScript and Vite bumps alongside Angular's, or put the rows in one bundle (Part C).
2. **ESLint 9** (bump needed) gates typescript-eslint, eslint-plugin-unused-imports and eslint-config-prettier (all approved), plus angular-eslint and Sheriff. **Jest 30** (bump needed) gates ts-jest (approved). Until those bumps land, the approved bundle gives you the libraries, but not linting or Jest.

### 6.5 Still open

- **0.x versions.** zone.js 0.15, **esbuild 0.28** (was 0.25), amqplib 0.10, sockjs 0.3 and `@types/amqplib` 0.10 are approved as "major 0". Under semver every 0.x minor is a breaking line, so whether "major 0 approved" covers esbuild 0.28 is a question for the SRF process. Angular 22 needed 0.28.2 all along, so the question existed before this change.
- **Transitive dependencies:** do SRFs cover them? Each bundle lists every one.
- **keycloak-connect 26** is approved, but ADR-008 D-3 (accepted) says new server code replaces it with standard OIDC/JWT validation: the adapter is stale, every version is flagged through its dependencies, and it pulls `chromedriver: "latest"`. The approval keeps it available (the legacy apps use it); it doesn't reverse D-3 (**flag**).
- **Shared dependencies:** 492 of the 1,551 npm tarballs ship in more than one bundle (≈ 32% by count). That costs transfer bytes only.

---

## 7. Rehearsal (2026-10-02)

Run end to end from the five delivered `.tar` files (extracted, mounted **read-only**):

- **Nexus:** a fresh, empty Nexus 3.76.1.
- **Machines:** two RHEL 9.8 (UBI 9) containers, a loader and a workstation. Both are on a Docker `--internal` network with **no internet**: the negative control `curl https://registry.npmjs.org/` fails. Neither has Node installed.
- **Order:** bundles loaded in the porting order of Part B, with the category proof after each.

| Step | Result |
|---|---|
| Negative test: load `bump-submitted` **first**, into the empty Nexus, on a machine with no Node | `STOP: npm not found on this machine, this bundle carries no Node, and Nexus raw has none yet -- load the bundle that carries Node.js first` (exit 1) |
| `approved`: load | npm **426** uploaded, raw **3**, FAILED 0 (2 min 08 s; publishes with the bundle's own Node) |
| `approved`: workstation `system` | Node 24.21.0 + npm 11.19.0 installed; pnpm, uv, Cypress binary, Playwright browsers each `SKIPPED` (expected) |
| `approved`: `prove-install.sh category` | **GREEN**, 3/3. npm and raw fully served; **35 of 39 rows ready**, and their 33 npm packages installed from an empty cache (the other ready rows are Node, npm, VS Code and Python). `WAIT`: Jest (for ts-jest), TypeScript (for ts-jest and typescript-eslint), ESLint (for typescript-eslint, eslint-plugin-unused-imports, eslint-config-prettier) |
| `bump-submitted`: load | npm **471** uploaded, **80** already present (shared with `approved`), FAILED 0. **Borrowed Node from Nexus raw** (this bundle carries none) |
| `bump-submitted`: proof | **GREEN**, 2/2. **5 of 8 rows installed** (13 npm packages: Angular framework, SSR, compiler-cli, Material, CDK). `WAIT`: TypeScript (for the CLI, `@angular/build`, `build-angular`), **Vite** (for `@angular/build`, `build-angular`) and Express (for `build-angular`) |
| `bump-needed`: load / proof | 398 uploaded, 269 present, raw 1, FAILED 0 / **GREEN**, **18 of 18 rows** installed |
| `new-srf`: load / proof | 45 uploaded, 78 present, raw 1, FAILED 0 / **GREEN**, **5 of 5** |
| `nice-to-have`: load / proof | 211 uploaded, 402 present, raw 14, FAILED 0 / **GREEN**, **10 of 10** |
| Workstation `system` again (`FROM_NEXUS=1`) | pnpm 10.34.6, uv 0.12.21, Cypress 16.1.1 binary, Playwright 1.63.0 browsers: all installed from Nexus |
| `approved` proof again | **39 of 39** rows install. The earlier `WAIT`s cleared once their bundle was loaded |
| **`prove-install.sh frontend`** (from the `nice-to-have` bundle) | **GREEN, 10/10**: `pnpm install --frozen-lockfile` of all 1,790 locked packages from an empty store; Angular CLI; TypeScript 6.0; Prisma + engine; Cypress binary; Playwright launches Chromium; npm; uv; Python 3.12 |
| Load `approved` again | uploaded 0, already-present 426 + 3, FAILED 0 |
| Vitest on the new Vite (in the full-proof project) | `vite/8.3.0`, `esbuild 0.28.2`; `vitest run` of a test file: **1 passed** |

**Uploads across the five loads: 426 + 471 + 398 + 45 + 211 = 1,551**, exactly the complete bundle's pool. Nothing is missing, and nothing was uploaded twice.

*This table is the re-run of 2026-10-02 (later the same day) on the corrected stack (Vite 8.3.0, esbuild 0.28.2; pool 1,551). The first run, on Vite 6.4.3 / esbuild 0.25.0 and a pool of 1,554, was equally green: approved 426, bump-submitted 482, bump-needed 390, new-srf 45, nice-to-have 211 uploaded, 1,817 locked packages in the full proof.*

**What the rehearsal caught (fixed, then re-run from a fresh Nexus):** the loader stopped **without any message** on the first bundle that carries no Node. A file search that finds nothing counted as an error under the scripts' strict shell settings. Fixed, and `load-nexus.sh` now always says STOP when it ends early. The category proof had already flagged that load as `FAIL`, as designed.

**Not covered:**
- VS Code and its extensions on a real desktop (the container ran with `SKIP_VSCODE=1`; the extensions' `user` step needs `code`).
- A Nexus newer than 3.76.1.
- Your real staging machine and Nexus.

**What changed after the run:** nothing. The island scripts and the npm loader in the rehearsed bundles are byte-identical to the repository, and the bundles were cut by the planner as committed.

---

## Where the pieces are

| File | Role |
|---|---|
| `desert-island-devenv/tools/build-srf-bundles.sh` | the builder (this how-to) |
| `desert-island-devenv/tools/srf-plan.mjs` | the planner: sheet + mapping + lockfile → which packages and files go in which bundle; all the checks |
| `desert-island-devenv/tools/srf-emit.mjs` | writes each bundle's `npm/MANIFEST.json`, `SHA256SUMS`, `SRF-CONTENTS.md`, `srf-bundle.json` and the summary page |
| `desert-island-devenv/stack/srf-components.tsv` | the mapping: sheet row → npm packages / files |
| `desert-island-devenv/island/lib/srf-proof.mjs` | the island-side check behind `prove-install.sh category` |
| `docs/source-documents/desert-island-setup-docs/front-end-srf-status.csv` | the committed sheet (SRC-017) |
