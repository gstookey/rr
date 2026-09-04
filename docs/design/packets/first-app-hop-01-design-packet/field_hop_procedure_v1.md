---
schema: corpus-doc/v1
status: exploratory
title: Field Hop Procedure v1 — one Angular rung on a real app, on the island
areas: [frontend, isolated-network, dev-environment]
related: ["docs/design/packets/legacy-shell-bundle-01-design-packet/monorepo_hop_procedure_v2.md", "docs/design/packets/first-app-hop-01-design-packet/preflight_checklist_v0.md", "docs/design/packets/first-app-hop-01-design-packet/field_notes_template_v0.md"]
updated: 2026-09-03
---

# Field Hop Procedure v1

**Created:** 2026-09-03 | **Status:** `exploratory` — an operational rewrite of [`monorepo_hop_procedure_v2.md`](../legacy-shell-bundle-01-design-packet/monorepo_hop_procedure_v2.md), which remains authoritative for *what was observed*. This document is what to *do*, and what to do when reality differs.

**Run this once per rung.** For Milestone 1 that is twice: 17→18, then 18→19. Complete and validate a rung fully before starting the next.

> **Before you start:** [`preflight_checklist_v0.md`](preflight_checklist_v0.md) must be done, and the baseline in Part 3 written down. If you skipped the baseline build timing, go back — you cannot recover it later.

---

## Why the procedure has the shape it has

Three facts drive everything below. They were each established the hard way in rehearsal, and each one bites immediately if ignored.

1. **`ng update` must run from the monorepo root, but your `angular.json` lives in `packages/client/`.** The CLI needs its workspace file next to the `package.json` that declares `@angular/core` — and in these apps the framework deps are hoisted to the root. Running from `packages/client` fails with `Package '@angular/core' is not a dependency`. There is **no supported way** to run the full hop from the client directory. The answer is a temporary root `angular.json` that exists only for the duration of the hop.
2. **Framework and third parties must be updated in two separate commands.** Combining them makes the CLI compute a plan that selects a next-major `@angular/animations` and then abort.
3. **The lockfile `ng update` leaves behind is poisoned** and must be regenerated from scratch. This is expected, every time.

---

## Step 0 — Pre-step (18→19 rung ONLY)

Bump `jest-preset-angular` to **`14.6.2`** everywhere it is declared — root, `packages/client`, `packages/server`, anywhere else it appears.

```
npm install -D jest-preset-angular@14.6.2 -w <each workspace that declares it>
```

**Why:** 14.1.0 declares peers `@angular/build-angular >=15 <19`. `ng update ...@19` refuses at the **plan stage** because of it — you never reach the migration, you get a peer error that looks unrelated. 14.6.2's peers reach `<21`.

- [ ] Run the app's tests after this bump and before hopping. They should still pass.
- [ ] Commit.

> Skip this step entirely on the 17→18 rung. 14.1.0 is fine for ng18.

---

## Step 1 — Create the temporary root `angular.json`

From the **app root**, save this as `make-root-angular-json.mjs` (it is not on the island; paste it):

```js
// TEMPORARY root angular.json from packages/client/angular.json, paths prefixed.
// Used only for the duration of one ng update hop. DELETE afterwards.
import fs from 'node:fs'; import path from 'node:path';
const root = process.argv[2] || '.';
const src = path.join(root, 'packages/client/angular.json');
const aj = JSON.parse(fs.readFileSync(src, 'utf8'));
const P = 'packages/client/';
for (const proj of Object.values(aj.projects)) {
  proj.root = P.slice(0, -1) + (proj.root ? '/' + proj.root : '');
  if (proj.sourceRoot !== undefined) proj.sourceRoot = P + proj.sourceRoot;
  for (const target of Object.values(proj.architect || {})) {
    const fix = o => { if (!o) return;
      for (const k of ['outputPath','index','browser','main','tsConfig','polyfills']) {
        if (typeof o[k] === 'string' && !o[k].startsWith('zone.js')) o[k] = P + o[k];
      }
      for (const k of ['assets','styles','scripts']) {
        if (Array.isArray(o[k])) o[k] = o[k].map(v => typeof v === 'string' ? P + v : v);
      }
    };
    fix(target.options);
  }
}
const dest = path.join(root, 'angular.json');
if (fs.existsSync(dest)) { console.error('refusing: root angular.json already exists'); process.exit(1); }
fs.writeFileSync(dest, JSON.stringify(aj, null, 2) + '\n');
console.log('wrote temporary', dest, '- DELETE IT when the hop is done.');
```

```
node make-root-angular-json.mjs .
```

- [ ] **Open the generated `angular.json` and read it.** See STOP condition **F-3** below — the script only prefixes paths under `architect.*.options`, not under `architect.*.configurations.*`. Real apps commonly have `fileReplacements` in the `production` configuration. **Prefix those by hand now.**
- [ ] Commit it (`ng update` demands a clean tree).

> **Expected:** a root `angular.json` whose every path starts `packages/client/`, and `git status` clean.

---

## Step 2 — Phase 1: the framework

From the **app root**:

```
npx ng update @angular/core@<N> @angular/cli@<N>
```

where `<N>` is `18` then, on the next rung, `19`.

**Expected observations:**
- A temporary CLI is fetched first (18.2.21 / 19.2.27 respectively) — this is normal.
- Root `@angular/*` versions are rewritten.
- TypeScript and `zone.js` move **only if the current pin falls outside the new range.** 17→18: TS `5.2.2`→`5.5.4`, zone `0.14.2`→`0.14.10`. 18→19: **TypeScript does not move** (5.5.4 already satisfies `>=5.5 <5.9`); zone `0.14.10`→`0.15.1`.
- Core migrations run. On 18→19 the **standalone migration touches every declarable in the app** — on a real application this is the largest source diff of the two rungs. On 17→18 expect `HttpClientModule` rewrites.

- [ ] **Read the migration diff before committing it.** `git diff --stat` then spot-read the largest files. This is the evidence the rehearsals could not produce — record the file count and what kind of change it made in the field notes.
- [ ] Commit.

---

## Step 3 — Phase 2: the Angular-coupled third parties

Still from the **app root**, as a **separate command**:

```
npx ng update @angular/material@<N> @angular/cdk@<N> \
              @ngrx/store@<N> @ngrx/effects@<N> @ngrx/signals@<N> @ngrx/operators@<N>
```

Include only the packages your app actually declares.

> **Never combine this with Step 2.** The combined command computes a broken plan and aborts.

**Expected:** version rewrites plus, on 17→18, NgRx's `concatLatestFrom` migration editing one `package.json`.

- [ ] Commit.

---

## Step 4 — Hand-bumps

`ng update` run from the root **cannot see** the pins declared in `packages/client/package.json`. These will not move on their own, and leaving them behind produces peer errors at install time that look like bundle problems.

Bring these to the versions Phase 1 chose:

- [ ] `@angular-devkit/build-angular`, `@angular/cli`, `@angular/compiler-cli` in `packages/client/package.json`
- [ ] `typescript` **wherever it is declared** (root and each package) — only on rungs where Phase 1 moved it, i.e. 17→18
- [ ] **`keycloak-angular`** — its majors track Angular's and `ng update` will not move it: **`16.1.0`** for ng18, **`19.0.2`** for ng19
- [ ] Anything else your baseline `package.json` capture shows pinned to an Angular-coupled major

- [ ] Commit.

---

## Step 5 — Teardown and lock regeneration

- [ ] **Verify the temporary root `angular.json` is unchanged** from what Step 1 generated (plus your manual `configurations` fix): `git diff HEAD -- angular.json` should be empty. **If a migration edited it, port those edits into `packages/client/angular.json` before deleting** — otherwise you silently lose them.
- [ ] Delete it: `rm angular.json`
- [ ] Regenerate the lockfile from scratch:
      ```
      rm -rf node_modules packages/*/node_modules package-lock.json
      npm install
      ```

> **This is mandatory, not optional cleanup.** The lock `ng update` leaves contains nested stale toolchain entries; a plain `npm install` on it can fail `ERESOLVE` on constraints that are in fact satisfied. Regeneration is the fix, and the offline registry serves everything it needs (verified in rehearsal).

- [ ] Commit.

---

## Step 6 — Validate

Run all four. Record every result in the field notes, including timings, and compare against your baseline.

- [ ] **Build:** from `packages/client/`, `time npx ng build`
      - At **v19** expect a **component-style budget warning**. In rehearsal: 2.00 kB budget exceeded by 925 B. **A warning passes. If your `angular.json` configures that budget as `maximumError`, the identical condition FAILS the build** — check the budget value you recorded in pre-flight before hunting for a code problem.
- [ ] **Types:** `npx tsc` in `packages/common`, `packages/server`, `packages/interface` if present
- [ ] **Tests:** `time npx jest` at the root. Runs on jsdom — no browser needed, and none should be downloaded (`PUPPETEER_SKIP_DOWNLOAD=true`).
- [ ] **Peers:** `npm ls 2>&1 | tail -40` — compare against the pre-existing warnings you recorded in pre-flight. New warnings are the signal; old ones are noise.
- [ ] Commit. **The rung is done.**

---

## The version table — what each rung lands on

Measured in rehearsal on the estate's real dependency surface. If `ng update` selects something different, that is a finding: record it and continue.

| | **17→18** | **18→19** |
|---|---|---|
| `@angular/*` runtime | 18.2.14 | 19.2.25 |
| `@angular/cli` + `build-angular` (= temp CLI) | 18.2.21 | 19.2.27 |
| `typescript` | 5.2.2 → **5.5.4** | **unchanged** |
| `zone.js` | 0.14.2 → 0.14.10 | 0.14.10 → 0.15.1 |
| `@angular/material` + `cdk` | 18.2.14 | 19.2.19 |
| `@ngrx/*` | 18.1.1 | 19.2.1 |
| `keycloak-angular` *(hand-bump)* | 16.1.0 | 19.0.2 |
| `jest-preset-angular` | 14.1.0 (no change) | **pre-step → 14.6.2** |
| **Node** | no change | no change |

*The stretch rungs (19→20, 20→21, 21→22) are rehearsed and tabulated in [`monorepo_hop_procedure_v2.md`](../legacy-shell-bundle-01-design-packet/monorepo_hop_procedure_v2.md). Do not attempt them on this run — 20→21 carries a Jest major and a `setup-jest.ts` API rewrite, and 21→22 carries TypeScript 6 and the only Node gate in the ladder.*

---

## STOP conditions

When one of these happens, **stop, record it in the field notes, and do not improvise past it.** Each of these was either observed in rehearsal or is a known trap.

**F-1 — `ng update` fetches a CLI far newer than the rung** (e.g. 22.x while hopping to 18), then complains about the Node version.
→ You used an **unversioned** package spec. An unversioned `--migrate-only` spec reaches for the *latest* CLI. Always pin: `@angular/core@18`, never `@angular/core`. Re-run with the version pinned.

**F-2 — `Package '@angular/core' is not a dependency`.**
→ You are running from `packages/client`, or the temporary root `angular.json` is missing. Run from the app root, with Step 1 done.

**F-3 — The build fails after the hop with a path that does not start `packages/client/`.**
→ The temp root `angular.json` generator only prefixes paths under `architect.*.options`. Anything under `architect.*.configurations.*` — most commonly `fileReplacements` for the production environment file — was left unprefixed. Fix by hand and re-run. **Record this: it means the generator needs fixing for the rest of the estate.**

**F-4 — `ng update` refuses at the plan stage citing `jest-preset-angular`.**
→ Step 0. You are on the 18→19 rung and jest-preset-angular is still 14.1.0.

**F-5 — `npm install` fails `ERESOLVE` on a constraint that looks satisfied.**
→ The poisoned lock. Step 5's full regeneration. Not an emergency, not a bundle problem.

**F-6 — A package cannot be resolved from Nexus mid-hop.**
→ Stop. Record the **exact** package name and version string. This is a bundle gap; the delta must be prepared on the outside and ported. Do not work around it by relaxing a version — that silently changes what the estate runs.

**F-7 — The combined update command aborts talking about `@angular/animations` and a next major.**
→ You combined Steps 2 and 3. Reset and run them separately.

**F-8 — A migration wants to edit an `@other-team/*` package.**
→ Decline and record it. Those are upgraded independently by their owning team.

**F-9 — Tests fail after the hop that passed at baseline.**
→ This is exactly the signal this run exists to find. Do not skip, disable, or quarantine the test. Record the failure, the test name, and what the migration changed nearby. If the cause is not apparent in 30 minutes, stop the run and bring it back — a real migration defect on real code is a more valuable result than a green branch.

**F-10 — Anything at all differs from an "expected observation" above.**
→ Not necessarily a problem, but always a finding. Record it. The rehearsals ran on shells with almost no source; divergence on real code is the whole point of the experiment.

---

## When the rung is done

Fill in that rung's section of [`field_notes_template_v0.md`](field_notes_template_v0.md) **before** starting the next one, while it is still fresh. Then either proceed to 18→19 or stop and send the notes back.
