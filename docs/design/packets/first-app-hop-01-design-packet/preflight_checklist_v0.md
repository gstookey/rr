---
schema: corpus-doc/v1
status: exploratory
title: Pre-flight Checklist v0 — before the first real application hop
areas: [frontend, isolated-network, dev-environment, risk-gates]
related: ["docs/design/packets/first-app-hop-01-design-packet/field_hop_procedure_v1.md", "docs/design/packets/legacy-shell-bundle-01-design-packet/nexus_upload_instructions_v1.md", "docs/design/packets/first-app-hop-01-design-packet/field_notes_template_v0.md"]
updated: 2026-09-03
---

# Pre-flight Checklist v0

**Created:** 2026-09-03 | **Status:** `exploratory` — written from the rehearsals, never yet run on the island.

Do this **before** the hop, ideally the day before. Nothing here modifies the application. Everything here is either a decision, a measurement you cannot take afterwards, or a way back out.

Budget: **60–90 minutes**, of which most is waiting on a baseline build and test run.

---

## Part 1 — Choose the right application

The first app is an instrument, not a delivery. Choose for **information quality and low blast radius**, not for importance.

- [ ] **It builds clean today.** Non-negotiable. An app that does not build cannot be upgraded, and starting on one means every failure afterwards is ambiguous. If the first candidate does not build, that is itself a finding — record it and pick another.
- [ ] **It has a recent, clean git state**, and you can push a branch nobody else is on.
- [ ] **Nobody is shipping it this week.** You will want the freedom to leave it half-done overnight.
- [ ] **Its owner is reachable** while you work, in case a migration edits something whose intent you cannot read from the diff.
- [ ] **It is representative, not exotic.** Prefer a middle-of-the-estate app. Deliberately *avoid* the app with a custom webpack config or custom schematics for run #1 — that one deserves its own plan, and it will teach you the wrong lesson about the other nine.
- [ ] **Prefer an app whose shape matches the rehearsal** — an npm-workspaces monorepo with `packages/client|common|server`, framework deps hoisted to the root `package.json`, `angular.json` in `packages/client/`, Jest on jsdom. Everything in the procedure was measured on that shape. **If the chosen app differs structurally, say so in the field notes before you start** — the procedure's steps may still work, but its *expected observations* were not measured on your layout.

> **If no app satisfies all of these, relax "representative" first and "builds clean" never.**

---

## Part 2 — Prove the registry is ready

The single most expensive failure mode is discovering mid-hop that Nexus does not serve something. Every check here is cheap; each one costs a transfer cycle if skipped.

- [ ] **Establish what Nexus already holds.** Export a package listing from Nexus and hand it to the `--delta-from` mode of the bundle script on the outside:
      `legacy-shells/tools/build-transfer-bundle.sh <workdir> --delta-from <manifest>`
      The estate builds on the island today, so Nexus very likely already serves the whole v17 surface. If it does, Milestone 1's real payload is roughly **87 MB of hop deltas**, not 191 MB. Measure it rather than assuming it in either direction.
- [ ] **Confirm the hop tarballs are uploaded and resolvable** — not merely uploaded. Upload procedure and the verification loop: [`nexus_upload_instructions_v1.md`](../legacy-shell-bundle-01-design-packet/nexus_upload_instructions_v1.md).
- [ ] **Spot-check resolution from the workstation, not from the Nexus UI.** These must each print a version, from the app directory:
      ```
      npm view @angular/core@18.2.14 version
      npm view @angular/cli@18.2.21 version
      npm view @angular/core@19.2.25 version
      npm view @angular/cli@19.2.27 version
      npm view jest-preset-angular@14.6.2 version
      npm view keycloak-angular@16.1.0 version
      npm view keycloak-angular@19.0.2 version
      ```
- [ ] **Confirm Nexus serves metadata for the private scopes** — `@my-team/*` (confirmed present, Graham 2026-09-03), `@ssd_victor/*`, `@other-team/*`:
      `npm view @my-team/<one-of-your-workspace-packages> version`
      This matters because `ng update` reads metadata for *every* declared dependency, including your own workspace packages, before it will compute a plan.
- [ ] **`npm view @angular/cli@18.2.21 version` must NOT reach the internet.** Confirm `npm config get registry` points at Nexus and no `.npmrc` in the tree overrides it for a scope you need.

---

## Part 3 — Capture the baseline

**You cannot take these measurements after you start.** Write each into the [field notes](field_notes_template_v0.md).

- [ ] `git rev-parse HEAD` and `git status` (must be clean)
- [ ] `node -v` · `npm -v` · `cat .npmrc` (confirm `PUPPETEER_SKIP_DOWNLOAD=true`)
- [ ] `cat package.json` at the root and at every `packages/*` — this is your record of what was hand-pinned where
- [ ] **`packages/client/angular.json` build budgets.** Find `architect.build.configurations.production.budgets` and record the `type`, `maximumWarning` and `maximumError` for each entry, especially `anyComponentStyle`. **At v19 the rehearsal produced a component-style budget warning (2.00 kB exceeded by 925 B). If your budget for that type is configured as `maximumError`, the identical condition fails the build instead of warning.** Knowing the number now saves an hour of hunting a phantom code problem later.
- [ ] **Baseline build, timed:** from `packages/client/`, `time npx ng build`. Record wall time, exit code, and every warning. Warnings you do not record now will look like regressions later.
- [ ] **Baseline tests, timed:** `time npx jest` (or the app's own test script) at the root. Record pass/fail counts and wall time.
- [ ] **Baseline `tsc`** in `packages/common`, `packages/server`, and `packages/interface` if present.
- [ ] `npm ls 2>&1 | tail -40` — record any pre-existing peer warnings. The hop will add its own; you need to be able to tell them apart.
- [ ] **Free disk space** (`df -h .`). Each rung does a full `rm -rf node_modules && npm install`. Budget several GB.

---

## Part 4 — The escape hatch

There is no agent to ask and no internet to search. Before you start, make sure you can get back to zero **in one command you have already tested**.

- [ ] **Work on a branch**, never on the app's main line: `git checkout -b upgrade/ng18-trial`
- [ ] **Commit before every numbered step.** `ng update` refuses to run on a dirty tree anyway, so this is forced discipline — lean into it. One commit per step means `git reset --hard HEAD~1` is always a precise undo.
- [ ] **Test the way back, now, before it matters:**
      ```
      rm -rf node_modules packages/*/node_modules package-lock.json
      npm install
      ```
      then rebuild. If that round trip does not reproduce your baseline **before** you change anything, stop — you have a reproducibility problem that the upgrade will be blamed for.
- [ ] **Know that a poisoned lockfile is expected, not a disaster.** After `ng update` the lock contains nested stale toolchain entries and a plain `npm install` can fail `ERESOLVE` on constraints that are actually satisfied. The fix is the regeneration above, and it is step 5 of the procedure, not an emergency.

---

## Part 5 — Change control and scope

- [ ] **Milestone 1 needs no Node change.** Node 22.15 already satisfies Angular 18 and 19. Do not bundle a Node bump into this request — it is a separate, independently valuable change ([S-13](https://github.com/gstookey/rr/issues/20)) and attaching it here gives the reviewer a reason to say no to both.
- [ ] **Do not upgrade `@other-team/*` packages during this run.** They are upgraded independently by their owning team; Graham coordinates that separately. If a hop's `ng update` proposes touching them, record it and decline.
- [ ] **Do not attempt AstroUXDS 7→9.** It rode both Milestone-1 hops untouched in rehearsal (its peer range is permissive). The 7→9 move is a separate, unrehearsed effort.
- [ ] **Decide in advance how far this run goes.** Recommended: stop at **v19** and let the notes come back before considering v20+. The stretch rungs are rehearsed and their bundles exist, but DR-04 should be decided *by* this run's evidence, not before it.
- [ ] **Tell the app's owner what you are doing** and roughly how long the branch will live.

---

## Ready

You are ready to start when: the app builds clean and you have its timing; the budgets are written down; every spot-check above resolved from Nexus; you have a branch and a tested way back; and the [field notes](field_notes_template_v0.md) document is open with Part 3 already filled in.

Then go to [`field_hop_procedure_v1.md`](field_hop_procedure_v1.md).
