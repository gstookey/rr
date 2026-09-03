---
schema: corpus-doc/v1
status: exploratory
title: Angular v18 to v19 Hop Runbook v1 (rehearsed 2026-08-28)
areas: [frontend, dev-environment, isolated-network, technology-stack]
related: ["docs/design/packets/ng-hop-02-v18-to-v19-design-packet/README.md", "docs/design/packets/ng-hop-02-v18-to-v19-design-packet/v19_hop_bundle_manifest_v0.md", "docs/design/packets/ng-hop-01-v17-to-v18-design-packet/v17_to_v18_hop_runbook_v1.md"]
updated: 2026-08-28
---

# Angular v18 → v19 Hop Runbook v1

**Created:** 2026-08-28 | **Status:** `exploratory` — **rehearsed on a bare app on the open-internet side; not yet run against real estate code**

## Who this is for

Someone on **Legacy Island** upgrading one Angular application from v18 to v19. No internet. No AI assistant. No ability to ask a quick question of anyone outside.

**This hop reaches the programme's floor.** An application that completes it has met Milestone 1's requirement.

**Do hop 1 first.** This runbook assumes the application is already on Angular 18 via [`v17_to_v18_hop_runbook_v1.md`](../ng-hop-01-v17-to-v18-design-packet/v17_to_v18_hop_runbook_v1.md). `ng update` moves one major at a time by design; there is no v17→v19 shortcut.

If what you see does not match what is written here, **stop and record exactly what you saw.** Someone outside will be troubleshooting from your description alone.

---

# Read this first — hop 2 is not hop 1

Hop 1 was a version bump that left your source alone. **Hop 2 rewrites source, moves your TypeScript version, and can introduce build warnings.** Budget more time and more review than hop 1 took.

| | hop 1 (v17→v18) | **hop 2 (v18→v19)** |
|---|---|---|
| TypeScript | unchanged | **bumped `5.4.5` → `5.8.3`** |
| zone.js | unchanged | **bumped `0.14.10` → `0.15.1`** |
| Source files edited | none | **yes — the standalone migration** |
| Optional migrations offered | 1 | **2** |
| New build warnings | none | **yes — component style budget** |

## The three things carried over from hop 1 — all confirmed again

Observed a second time, which makes them rules rather than anomalies:

1. **`ng update` downloads a temporary newer CLI before doing anything.** This hop: `Installing a temporary Angular CLI versioned 19.2.27 to perform the update.` The registry must serve the **v19 CLI before your `package.json` mentions v19**.
2. **It fetches registry metadata for every dependency** — 22 on this bare app, far more on a real one.
3. **Karma needs a real browser binary, which is not an npm package.** Tests failed identically to hop 1 with `No binary for ChromeHeadless browser on your platform`. **Neither hop has ever been validated by a passing test suite.**

## The new one: this hop changes your source

```
❯ Updates non-standalone Directives, Component and Pipes to 'standalone:false'
  and removes 'standalone:true' from those who are standalone.
UPDATE src/app/app.component.ts (293 bytes)
  Migration completed (1 file modified).
```

Angular 19 makes `standalone: true` the **default**, so the migration removes the now-redundant flag from standalone declarables and adds an explicit `standalone: false` to those that are not. Observed edit — the flag was simply removed:

```ts
@Component({
    selector: 'app-root',
    imports: [RouterOutlet],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
```

**On the estate this touches every component, directive and pipe in the application.** One file here because there was one file. Expect a large diff on a real application, and expect to read it.

---

# Before you start

| Requirement | Value | Check |
|---|---|---|
| Application already at Angular 18 | hop 1 complete | `npx ng version` |
| Node.js | v19 needs `^18.19.1 \|\| ^20.11.1 \|\| >=22.0.0` | `node --version` |
| Registry | must hold the **v19** set | [`v19_hop_bundle_manifest_v0.md`](v19_hop_bundle_manifest_v0.md) |
| Working tree | committed and clean | `git status` |

**On Node:** Legacy Island's **Node 22.15 satisfies v19.** No Node change is needed to reach Milestone 1's floor — verified 2026-08-25, matrix in `docs/context/canonical/two_island_model.md`. (Node only becomes a blocker at v22.)

## Commit first

```
git status
git add -A && git commit -m "pre-upgrade checkpoint: <app> at Angular 18"
```

This matters more than in hop 1, because **this hop edits your source**. Version control is the only way to see what the migration did and the only way back. `ng update` refuses to run against a dirty tree; do not reach for `--allow-dirty`.

## Record the starting state

Observed at the start of the rehearsal:

```json
{ "core": "^18.2.14", "cli": "^18.2.21", "ts": "~5.4.2", "zone": "~0.14.3", "rxjs": "~7.8.0" }
```

---

# The procedure

## Step 1 — Prove it builds before you change anything

```
npm ci
npx ng build
```

Observed:

```
Initial chunk files   | Names         |  Raw size | Estimated transfer size
main-6JQH5HXW.js      | main          | 206.53 kB |                55.64 kB
polyfills-FFHMD2TL.js | polyfills     |  34.52 kB |                11.28 kB
                      | Initial total | 241.04 kB |                66.92 kB
Application bundle generation complete. [9.248 seconds]
```

Note this is byte-identical to the total hop 1 finished with — a v18 application built from hop 1's output is stable. **Write down your own "Initial total"**; you compare against it in Step 5.

> **If the build fails here, stop.** You cannot upgrade what does not build, and you will not be able to separate pre-existing breakage from what the upgrade did.

## Step 2 — Run the tests and record the result

```
npx ng test --watch=false --browsers=ChromeHeadless
```

Same three outcomes as hop 1: pass (record the count), fail (record which — they are baseline, do not fix them now), or no browser.

Observed: `ERROR [launcher]: No binary for ChromeHeadless browser on your platform.` — **the rehearsal proceeded without a regression safety net.** If that is also your situation, say so explicitly in your record; it is the single biggest weakness in the evidence behind this runbook.

## Step 3 — Run the update

```
npx ng update @angular/core@19 @angular/cli@19
```

Both in one command. Takes a few minutes.

**Observed package.json rewrites:**

```
Updating package.json with dependency @angular-devkit/build-angular @ "19.2.27" (was "18.2.21")...
Updating package.json with dependency @angular/cli @ "19.2.27" (was "18.2.21")...
Updating package.json with dependency @angular/compiler-cli @ "19.2.25" (was "18.2.14")...
Updating package.json with dependency typescript @ "5.8.3" (was "5.4.5")...
Updating package.json with dependency @angular/animations @ "19.2.25" (was "18.2.14")...
Updating package.json with dependency @angular/common @ "19.2.25" (was "18.2.14")...
Updating package.json with dependency @angular/compiler @ "19.2.25" (was "18.2.14")...
Updating package.json with dependency @angular/core @ "19.2.25" (was "18.2.14")...
Updating package.json with dependency @angular/forms @ "19.2.25" (was "18.2.14")...
Updating package.json with dependency @angular/platform-browser @ "19.2.25" (was "18.2.14")...
Updating package.json with dependency @angular/platform-browser-dynamic @ "19.2.25" (was "18.2.14")...
Updating package.json with dependency @angular/router @ "19.2.25" (was "18.2.14")...
Updating package.json with dependency zone.js @ "0.15.1" (was "0.14.10")...
```

**Note `typescript` and `zone.js` in that list.** Hop 1 touched neither. This is the hop where your language version moves.

### Migrations that ran automatically

From `@angular/cli` — both reported no changes on the bare app:

```
❯ Update '@angular/ssr' import paths to use the new '/node' entry point when 'CommonEngine' is detected.
❯ Update the workspace configuration by replacing deprecated options in 'angular.json' for compatibility with the latest Angular CLI changes.
```

The second one is worth watching on a real application — **an `angular.json` carrying custom builder configuration is exactly what it rewrites**, and the estate may well have those.

From `@angular/core`:

```
❯ Updates non-standalone Directives, Component and Pipes to 'standalone:false' and removes 'standalone:true' from those who are standalone.
  UPDATE src/app/app.component.ts (293 bytes)   ← real source edit
❯ Updates ExperimentalPendingTasks to PendingTasks.          (no changes)
❯ Adds `BootstrapContext` to `bootstrapApplication` calls in `main.server.ts`.  (no changes)
```

### Read the diff — this is the most important step in the hop

```
git diff
```

Unlike hop 1, there **will** be source changes here. Do not accept them unread. The standalone migration is mechanical and generally safe, but it touches every declarable in the application and it is your one chance to see what changed while the change is small and reversible.

### Two optional migrations were offered — neither was run

```
** Optional migrations of package '@angular/cli' **
❯ Migrate application projects to the new build system.
  ng update @angular/cli --name use-application-builder

** Optional migrations of package '@angular/core' **
❯ Replaces `APP_INITIALIZER`, `ENVIRONMENT_INITIALIZER` & `PLATFORM_INITIALIZER` respectively
  with `provideAppInitializer`, `provideEnvironmentInitializer` & `providePlatformInitializer`.
  ng update @angular/core --name provide-initializer
```

**Recommendation: run neither during the hop.** Same reasoning as hop 1 — one variable at a time. When something breaks you need to know whether it was the framework upgrade or the build system. The `provide-initializer` one is likely to be relevant on real estate applications (`APP_INITIALIZER` is common in v17-era code) and is a good candidate for a **deliberate follow-up pass after the estate is at v19**, not during.

**Record that you skipped both**, so the next person knows it was a decision rather than an oversight. `[NEEDS GRAHAM]` — whether the estate adopts either is a programme decision, not a per-app one.

## Step 4 — Confirm the resulting versions

```
npx ng version
```

Observed:

```json
{ "core": "^19.2.25", "cli": "^19.2.27", "ts": "~5.8.3", "zone": "~0.15.1", "rxjs": "~7.8.0" }
```

CLI patch ahead of core is normal. **`rxjs` and `tslib` were not touched by either hop.**

## Step 5 — Build again

```
npx ng build
```

Observed:

```
                      | Initial total | 242.61 kB |                68.17 kB
Application bundle generation complete. [5.045 seconds]

▲ [WARNING] angular:styles/component:css;…;src/app/app.component.html exceeded maximum budget.
  Budget 2.00 kB was not met by 925 bytes with a total of 2.92 kB.
```

Two things to note.

**The size barely moved** — 241.04 kB → 242.61 kB (+0.65%), against +6% for hop 1.

**A new build warning appeared** that was not present at v18 on identical source. It is a **component style budget** warning. The build still succeeded — it is a warning, not an error.

> ⚠️ **The risk this points at:** budgets are configured in `angular.json`, and a project can set them as `maximumError` rather than `maximumWarning`. **On such a project this would fail the build**, and the failure would look like the upgrade broke something when in fact a budget threshold was crossed. If you hit a budget error after this hop, check `angular.json` → `budgets` **before** you start hunting for a code problem.
>
> I have not established *why* the measurement changed between v18 and v19 — only that it did, on unchanged source. `[UNVERIFIED]` as to mechanism.

**If the build now fails**, record the full error text — file, line, message — before changing anything.

## Step 6 — Test again

```
npx ng test --watch=false --browsers=ChromeHeadless
```

Compare with Step 2; the comparison is the signal. If Step 2 could not run, this cannot either — say so rather than leaving it blank.

## Step 7 — Commit and write down what happened

```
git add -A
git commit -m "Upgrade <app> from Angular 18 to Angular 19"
```

Record: app name, date, who; `node`/`npm` versions; versions before and after; **how many files the standalone migration touched and whether the diff looked right**; both build totals; any new build warnings, especially budget ones; test results or why they could not run; every deviation and why; and **how long it took**.

The timing matters: **you are now at Milestone 1's floor for this application.** Hop 1 plus hop 2 timings across the first two or three applications are what turn "10+ apps" into a schedule, and they are the evidence that decides whether the v20→v22 stretch is affordable (DR-04).

---

# If it goes wrong

```
git reset --hard HEAD
rm -rf node_modules
npm ci
```

Back to a working v18 application.

| Symptom | Likely cause | Action |
|---|---|---|
| `404` on a package during update | registry missing part of the v19 set — **including the v19 CLI itself**, fetched first | record exact package + version; bundle defect, do not work around |
| Build fails on a budget | `angular.json` budgets set as errors; see Step 5 | check `budgets` before hunting for a code problem |
| TypeScript errors after upgrade | **TS moved 5.4 → 5.8** — four minor versions of added strictness | record the errors; this is real work, and it is specific to this hop |
| `standalone` errors in components | the standalone migration partially applied | check the diff; do not hand-edit until you understand what it did |
| `Repository is not clean` | uncommitted changes | commit or stash; **do not** use `--allow-dirty` |
| Hangs, no output | tooling reaching for the public internet | check `npm config get registry` |

**Never** point the registry at the internet or hand-edit a version to something that happens to be present. Both produce an application that works today and cannot be rebuilt tomorrow.

---

# Appendix — rehearsal transcript (2026-08-28)

Continued from the `ng-hop-01` application. Machine: Linux, Node v22.22.2, npm 10.9.7.

```
$ node --version && npm --version
v22.22.2
10.9.7

  before: { core: "^18.2.14", cli: "^18.2.21", ts: "~5.4.2", zone: "~0.14.3", rxjs: "~7.8.0" }

$ npx ng build
  Initial total | 241.04 kB | 66.92 kB
  Application bundle generation complete. [9.248 seconds]
  → exit 0

$ npx ng test --watch=false --browsers=ChromeHeadless
  Karma v6.4.4 server started at http://localhost:9876/
  ERROR [launcher]: No binary for ChromeHeadless browser on your platform.
    Please, set "CHROME_BIN" env variable.
  → exit 1   (no browser on the rehearsal machine; did not block the upgrade)

$ npx ng update @angular/core@19 @angular/cli@19
  The installed Angular CLI version is outdated.
  Installing a temporary Angular CLI versioned 19.2.27 to perform the update.
  Using package manager: npm
  Collecting installed dependencies...
  Found 22 dependencies.
  Fetching dependency metadata from registry...
      [13 package.json rewrites — see Step 3, incl. typescript and zone.js]
  UPDATE package.json (1050 bytes)
  ❯ Cleaning node modules directory   ✔
  ❯ Installing packages               ✔

  ** Executing migrations of package '@angular/cli' **
  ❯ Update '@angular/ssr' import paths to use the new '/node' entry point when 'CommonEngine' is detected.
    Migration completed (No changes made).
  ❯ Update the workspace configuration by replacing deprecated options in 'angular.json'…
    Migration completed (No changes made).

  ** Optional migrations of package '@angular/cli' **
  ❯ Migrate application projects to the new build system.   → NOT run

  ** Executing migrations of package '@angular/core' **
  ❯ Updates non-standalone Directives, Component and Pipes to 'standalone:false' and removes
    'standalone:true' from those who are standalone.
    UPDATE src/app/app.component.ts (293 bytes)
    Migration completed (1 file modified).
  ❯ Updates ExperimentalPendingTasks to PendingTasks.
    Migration completed (No changes made).
  ❯ Adds `BootstrapContext` to `bootstrapApplication` calls in `main.server.ts`…
    Migration completed (No changes made).

  ** Optional migrations of package '@angular/core' **
  ❯ Replaces `APP_INITIALIZER`, `ENVIRONMENT_INITIALIZER` & `PLATFORM_INITIALIZER`…
    → NOT run
  → exit 0

  after: { core: "^19.2.25", cli: "^19.2.27", ts: "~5.8.3", zone: "~0.15.1", rxjs: "~7.8.0" }

$ npx ng build
  Initial total | 242.61 kB | 68.17 kB
  Application bundle generation complete. [5.045 seconds]
  ▲ [WARNING] angular:styles/component:css;…;src/app/app.component.html exceeded maximum budget.
    Budget 2.00 kB was not met by 925 bytes with a total of 2.92 kB.
  → exit 0
```

## What this rehearsal did not cover

- **Custom webpack / custom builders** — and note the `angular.json` deprecated-options migration, which is precisely what would touch them.
- **Custom schematics** in the application.
- **Third-party UI libraries** (Material, PrimeNG, internal component libraries) — each needs its own coordinated v19 upgrade and is a common reason a hop stalls.
- **State libraries** (NgRx/NGXS/Akita) with their own ladders.
- **Real source.** The standalone migration touched one file because one file existed.
- **`APP_INITIALIZER` code**, which the skipped optional migration targets and which is common in real v17-era applications.
- **Running the tests** — no browser was available, in either hop.
- **SSR / `main.server.ts`** — two migrations target it; the rehearsal app had no server build.
- **Doing it offline.** Both rehearsals used the public registry. **The offline path is unrehearsed** ([S-16](https://github.com/gstookey/rr/issues/23)) and remains the largest unknown in the upgrade programme.
