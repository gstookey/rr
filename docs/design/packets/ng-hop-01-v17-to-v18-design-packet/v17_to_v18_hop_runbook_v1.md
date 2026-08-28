---
schema: corpus-doc/v1
status: exploratory
title: Angular v17 to v18 Hop Runbook v1 (rehearsed 2026-08-26)
areas: [frontend, dev-environment, isolated-network, technology-stack]
related: ["docs/design/packets/ng-hop-01-v17-to-v18-design-packet/README.md", "docs/design/packets/ng-hop-01-v17-to-v18-design-packet/v18_hop_bundle_manifest_v0.md", "docs/context/canonical/two_island_model.md"]
updated: 2026-08-26
---

# Angular v17 → v18 Hop Runbook v1

**Created:** 2026-08-26 | **Status:** `exploratory` — **rehearsed on a bare app on the open-internet side; not yet run against real estate code**

## Who this is for

Someone on **Legacy Island** upgrading one Angular application from v17 to v18. No internet. No AI assistant. No ability to ask a quick question of anyone outside.

Everything you need is in this document. Where a step can fail, the failure and what to do about it are written beside it. Where output should be checked, the observed output is shown. **If what you see does not match what is written, stop and record exactly what you saw** — someone outside will be troubleshooting from your description alone, and your description is all they will get.

This is **hop 1 of at least 2** (v17→v18→v19). Do not attempt to skip a version; `ng update` supports one major at a time by design.

---

# What the rehearsal found

Three things that the upgrade guides do not tell you, each of which would have cost a transfer cycle to discover on the island. **Read these before starting.**

### 1. `ng update` downloads a temporary newer CLI before it does anything

Observed, verbatim:

```
The installed Angular CLI version is outdated.
Installing a temporary Angular CLI versioned 18.2.21 to perform the update.
```

The v17 CLI cannot perform a v18 update. It fetches **`@angular/cli@18.2.21` and that package's own dependency tree** from the registry first, into a temporary location, and only then starts work.

**Why this matters more than it looks:** it means the island's registry must be able to serve the **v18 CLI and its transitive dependencies before the application's `package.json` has ever mentioned v18**. A registry seeded only with "what the upgraded app declares" is not enough. If this fetch fails, `ng update` stops before making a single change — the failure comes first, not last, which is at least a merciful ordering.

### 2. `ng update` queries the registry for metadata on every dependency

Observed:

```
Collecting installed dependencies...
Found 22 dependencies.
Fetching dependency metadata from registry...
```

It resolves version information for **every** dependency, not just Angular's. A package present in `node_modules` but absent from the registry will surface here. On a bare app that was 22 dependencies; a real estate application will have many more, and each is a chance for a gap in the seeded registry to bite.

### 3. The test runner needs a browser binary, which is not an npm package

The baseline test run **failed**, before any upgrade, with:

```
ERROR [launcher]: No binary for ChromeHeadless browser on your platform.
  Please, set "CHROME_BIN" env variable.
```

Karma launches a **real browser**. That browser is an operating-system binary — it does not arrive via npm and it will not be in any package bundle. If Legacy Island's applications use Karma (the v17 default, so probably most of them), then **a browser binary is a separate supply-chain item** that has to be present or transferred independently.

**This did not block the upgrade** — build and update both succeeded without it. But it means "the tests pass" may be unverifiable on the island until a browser is sorted out, and *not being able to run the tests removes the main safety net for a 10+ application upgrade.* Worth resolving before the estate work starts, not during it.

> On the rehearsal machine this was an artifact of a container with no browser installed. **Do not assume Legacy Island is the same** — its workstations may well have a browser already. Check early (`echo $CHROME_BIN`, or just run the tests) rather than discovering it mid-estate.

---

# Before you start

## Prerequisites

| Requirement | Value | How to check |
|---|---|---|
| Node.js | v17→v18 needs `^18.19.1 \|\| ^20.11.1 \|\| >=22.0.0` | `node --version` |
| Registry | must already hold the **v18** package set | see [`v18_hop_bundle_manifest_v0.md`](v18_hop_bundle_manifest_v0.md) |
| Working tree | committed and clean | `git status` |

**On Node:** Legacy Island runs **Node 22.15**, which satisfies v18's requirement. **This hop needs no Node change.** (Verified 2026-08-25; full matrix in `docs/context/canonical/two_island_model.md`.) The same is true of v19, v20 and v21 — only v22 needs a newer Node.

## Commit first — this is not optional

`ng update` rewrites `package.json`, deletes and reinstalls `node_modules`, and may edit source files. **Its safety net is your version control, and nothing else.**

```
git status
git add -A && git commit -m "pre-upgrade checkpoint: <app> at Angular 17"
```

`ng update` refuses to run against a dirty tree. That refusal is a feature — do not reach for `--allow-dirty` to get past it. If it complains, commit or stash, do not override.

## Record the starting state

You will want this if anything goes wrong, and whoever supports you from outside will definitely want it:

```
node --version
npm --version
npx ng version
```

and from `package.json`, the values of `@angular/core`, `@angular/cli`, `typescript`, and `zone.js`.

Observed in the rehearsal at the v17 starting line:

```json
{ "core": "^17.3.0", "cli": "^17.3.17", "ts": "~5.4.2", "zone": "~0.14.3" }
```

---

# The procedure

## Step 1 — Prove it builds *before* you change anything

```
npm ci
npx ng build
```

**Expected:** a bundle summary and `Application bundle generation complete.`

Observed in the rehearsal:

```
Initial chunk files   | Names         |  Raw size | Estimated transfer size
main-SVN6ST6I.js      | main          | 193.55 kB |                52.52 kB
polyfills-FFHMD2TL.js | polyfills     |  33.71 kB |                11.02 kB
styles-5INURTSO.css   | styles        |   0 bytes |                 0 bytes
                      | Initial total | 227.26 kB |                63.54 kB
Application bundle generation complete. [9.519 seconds]
```

**Write down the "Initial total".** You will compare against it in Step 5.

> **If the build fails here, stop. Do not upgrade.** You cannot upgrade an application that does not build — you will not be able to tell the pre-existing breakage from the breakage you just introduced. A failing baseline is a separate problem to fix first, and it is exactly what the estate build-health triage ([S-12](https://github.com/gstookey/rr/issues/19)) exists to find in advance.

## Step 2 — Run the tests, and record the result honestly

```
npx ng test --watch=false --browsers=ChromeHeadless
```

Three possible outcomes, all worth recording:

| Outcome | What to do |
|---|---|
| Tests pass | Note the count. This is your best regression signal — you will re-run them in Step 6. |
| Tests fail | Record which. **Do not fix them now.** Pre-existing failures are baseline, not upgrade damage; the point is to know which failures you started with. |
| `No binary for ChromeHeadless browser` | The browser binary is missing (see finding 3). Record it and continue — it does not block the upgrade, but note that **you are proceeding without a regression safety net.** |

## Step 3 — Run the update

```
npx ng update @angular/core@18 @angular/cli@18
```

Both packages in **one command**. Updating them separately produces a mismatched intermediate state that Angular's own tooling will complain about.

This takes a few minutes. It will:

1. download a temporary v18 CLI (finding 1),
2. collect and resolve your dependencies against the registry (finding 2),
3. rewrite `package.json`,
4. delete and reinstall `node_modules`,
5. run the v18 migration schematics.

**Observed package.json rewrites:**

```
Updating package.json with dependency @angular-devkit/build-angular @ "18.2.21" (was "17.3.17")...
Updating package.json with dependency @angular/cli @ "18.2.21" (was "17.3.17")...
Updating package.json with dependency @angular/compiler-cli @ "18.2.14" (was "17.3.12")...
Updating package.json with dependency @angular/animations @ "18.2.14" (was "17.3.12")...
Updating package.json with dependency @angular/common @ "18.2.14" (was "17.3.12")...
Updating package.json with dependency @angular/compiler @ "18.2.14" (was "17.3.12")...
Updating package.json with dependency @angular/core @ "18.2.14" (was "17.3.12")...
Updating package.json with dependency @angular/forms @ "18.2.14" (was "17.3.12")...
Updating package.json with dependency @angular/platform-browser @ "18.2.14" (was "17.3.12")...
Updating package.json with dependency @angular/platform-browser-dynamic @ "18.2.14" (was "17.3.12")...
Updating package.json with dependency @angular/router @ "18.2.14" (was "17.3.12")...
```

**Note what did *not* change:** TypeScript stayed at `~5.4.2` and zone.js stayed at `~0.14.3`. Angular 18 accepts both (`typescript >=5.4 <5.6`, `zone.js ~0.14.x`), so **this hop needs no TypeScript bump.** If you see `ng update` trying to move TypeScript, something differs from the rehearsal — record it.

### Migrations

Four migrations ran automatically:

```
❯ Updates two-way bindings that have an invalid expression to use the longform expression instead.
❯ Replace deprecated HTTP related modules with provider functions.
❯ Updates calls to afterRender with an explicit phase to the new API.
❯ Adds `BootstrapContext` to `bootstrapApplication` calls in `main.server.ts` to support server rendering.
```

All four reported **"Migration completed (No changes made)"** — because the rehearsal app had no code in it. **On a real application, expect these to make real edits**, especially the HTTP one: `HttpClientModule` is extremely common in v17-era code, and the migration rewrites it to `provideHttpClient()`.

**After the update, read the diff.** This is the most important review step in the hop:

```
git diff
```

Anything the migrations changed in your source is here. Do not accept it unread.

### The optional migration — a decision, not a step

`ng update` also offered, but **did not run**:

```
** Optional migrations of package '@angular/cli' **
❯ Migrate application projects to the new build system.
  ng update @angular/cli --name use-application-builder
```

**Recommendation for the estate: do not run this during the hop.** It changes the build system, which is a large, independent change; bundling it with a framework upgrade means that when something breaks you cannot tell which change broke it. Get to v19 first with one variable moving at a time, then consider the build system separately.

**Record that you skipped it.** It is a legitimate later improvement, and the next person needs to know it was a deliberate deferral rather than an oversight. `[NEEDS GRAHAM]` — whether the estate adopts the application builder at all is an open programme decision, not a per-app one.

## Step 4 — Confirm the resulting versions

```
npx ng version
```

Observed after the rehearsal update:

```json
{ "core": "^18.2.14", "cli": "^18.2.21", "ts": "~5.4.2", "zone": "~0.14.3" }
```

The CLI patch (`18.2.21`) running ahead of core (`18.2.14`) is **normal**, not a mismatch.

## Step 5 — Build again

```
npx ng build
```

Observed:

```
Initial chunk files   | Names         |  Raw size | Estimated transfer size
                      | Initial total | 241.04 kB |                66.92 kB
Application bundle generation complete. [5.686 seconds]
```

Compare to your Step 1 figure. In the rehearsal the bundle grew from **227.26 kB to 241.04 kB** (+6%) with no source change. **A modest size increase across a major version is normal and not a defect.** A dramatic change in either direction is worth recording.

**If the build now fails**, the error is almost always either a template type-check tightening or a removed API. Record the **full** error text — file, line, and message. Do not start rewriting code to make it compile without understanding what changed; that is how an upgrade turns into an outage.

## Step 6 — Test again

```
npx ng test --watch=false --browsers=ChromeHeadless
```

Compare against Step 2. **The comparison is the signal, not the raw result** — the same failures as before are a pass for upgrade purposes; new failures are upgrade damage and need recording individually.

If Step 2 could not run for lack of a browser, this cannot either. Say so explicitly in your record rather than leaving it blank.

## Step 7 — Commit, and write down what happened

```
git add -A
git commit -m "Upgrade <app> from Angular 17 to Angular 18"
```

Then record, somewhere that survives:

1. Application name, date, who did it.
2. `node --version`, `npm --version`.
3. Versions before and after.
4. **Which migrations reported changes**, and what the `git diff` showed.
5. Build result before and after, with both "Initial total" figures.
6. Test result before and after — or that tests could not run, and why.
7. **Every deviation from this runbook**, and why. A deviation nobody wrote down is what breaks application number seven.
8. Roughly how long it took, and where the time went.

Item 8 matters more than it looks: **the first three applications' timings are what turn "10+ apps" into a schedule**, and they are the evidence that decides whether the v22 stretch is affordable (DR-04).

---

# If it goes wrong

**The recovery is always the same, and it is why Step 0 was a commit:**

```
git reset --hard HEAD
rm -rf node_modules
npm ci
```

That returns you to a working v17 application. Nothing about a failed hop is unrecoverable as long as the pre-upgrade commit exists.

| Symptom | Likely cause | Action |
|---|---|---|
| `404 Not Found` for a package during update | registry is missing part of the v18 set | **record the exact package and version** — this is a bundle defect, not something to work around. See finding 1: the temp CLI is fetched before anything else. |
| Update hangs with no output | tooling is trying to reach the public internet | check the registry configuration (`npm config get registry`) |
| `Repository is not clean` | uncommitted changes | commit or stash. **Do not use `--allow-dirty`.** |
| Build fails after upgrade, template errors | stricter v18 template type-checking | record the full error; this is real work, not a config toggle |
| Build fails, "cannot find module" | a peer dependency not carried in the bundle | record package + version |
| Tests fail that passed before | genuine upgrade damage | record each one individually |

**Never** "fix" a missing package by pointing the registry at the internet or by hand-editing a version to something that happens to be present. Both produce an application that works today and cannot be rebuilt tomorrow, which is worse than a clean failure.

---

# Appendix — rehearsal transcript (2026-08-26)

Performed on the open-internet side against the public registry. Machine: Linux, Node v22.22.2, npm 10.9.7. Application: a default `ng new` at Angular 17.3 (`--style=scss --routing`).

```
$ npx --yes @angular/cli@17.3.17 new legacy17 --defaults --skip-git --style=scss --routing --package-manager=npm
  → created; { core: "^17.3.0", cli: "^17.3.17", ts: "~5.4.2", zone: "~0.14.3" }

$ npx ng build
  Initial total | 227.26 kB | 63.54 kB
  Application bundle generation complete. [9.519 seconds]
  → exit 0

$ npx ng test --watch=false --browsers=ChromeHeadless
  Karma v6.4.4 server started at http://localhost:9876/
  [launcher]: Starting browser ChromeHeadless
  ERROR [launcher]: No binary for ChromeHeadless browser on your platform.
    Please, set "CHROME_BIN" env variable.
  → exit 1   (environment lacked a browser; did not block the upgrade)

$ npx ng update @angular/core@18 @angular/cli@18
  The installed Angular CLI version is outdated.
  Installing a temporary Angular CLI versioned 18.2.21 to perform the update.
  Using package manager: npm
  Collecting installed dependencies...
  Found 22 dependencies.
  Fetching dependency metadata from registry...
      [11 package.json rewrites — see Step 3]
  UPDATE package.json (1050 bytes)
  ❯ Cleaning node modules directory      ✔
  ❯ Installing packages                  ✔

  ** Optional migrations of package '@angular/cli' **
  This package has 1 optional migration that can be executed.
  ❯ Migrate application projects to the new build system.
    ng update @angular/cli --name use-application-builder
    → NOT run

  ** Executing migrations of package '@angular/core' **
  ❯ Updates two-way bindings that have an invalid expression to use the longform expression instead.
    Migration completed (No changes made).
  ❯ Replace deprecated HTTP related modules with provider functions.
    Migration completed (No changes made).
  ❯ Updates calls to afterRender with an explicit phase to the new API.
    Migration completed (No changes made).
  ❯ Adds `BootstrapContext` to `bootstrapApplication` calls in `main.server.ts` to support server rendering.
    Migration completed (No changes made).
  → exit 0

  → after: { core: "^18.2.14", cli: "^18.2.21", ts: "~5.4.2", zone: "~0.14.3" }

$ npx ng build
  Initial total | 241.04 kB | 66.92 kB
  Application bundle generation complete. [5.686 seconds]
  → exit 0
```

**Every "No changes made" above is the result for an application with no code in it.** Do not read them as evidence that the estate's applications will be untouched.

## What this rehearsal did not cover

Named explicitly so nobody mistakes silence for safety:

- **Custom webpack / custom builders** (`@angular-builders/custom-webpack`, `ngx-build-plus`) — a real possibility across the estate and the most likely source of a hard hop.
- **Custom schematics** in the application itself.
- **Third-party UI libraries** (Angular Material, PrimeNG, an internal component library) — these need their own coordinated major upgrades and are a common reason a hop stalls.
- **State libraries** (NgRx/NGXS/Akita) with their own version ladders.
- **Real application code** — the migrations found nothing to migrate; on real code they will.
- **Running the actual tests** — no browser was available.
- **SSR / `main.server.ts`** — one migration targets it; the rehearsal app had no server build.
- **Doing it offline.** The rehearsal ran against the public registry. **The offline path is unrehearsed** — that is [S-16](https://github.com/gstookey/rr/issues/23) plus the bundle in [`v18_hop_bundle_manifest_v0.md`](v18_hop_bundle_manifest_v0.md), and it is the single largest remaining unknown in this hop.
