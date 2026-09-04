---
schema: corpus-doc/v1
status: exploratory
title: Island Execution Plan v1 — porting the full ladder and guinea-pigging the first app
areas: [frontend, isolated-network, dev-environment, planning]
related: ["docs/design/packets/first-app-hop-01-design-packet/preflight_checklist_v0.md", "docs/design/packets/first-app-hop-01-design-packet/field_hop_procedure_v1.md", "docs/design/packets/legacy-shell-bundle-01-design-packet/nexus_upload_instructions_v1.md", "docs/design/packets/legacy-shell-bundle-01-design-packet/monorepo_hop_procedure_v2.md"]
updated: 2026-09-04
---

# Island Execution Plan v1

**Created:** 2026-09-04 | **Author:** Axium | **Status:** `exploratory` — the plan of record for the first real hop, incorporating Graham's decisions of 2026-09-04. Nothing in it has been executed yet.

The end-to-end sequence, from "we have a verified pool on the outside" to "one real application is on Angular 18." Read [`preflight_checklist_v0.md`](preflight_checklist_v0.md) and [`field_hop_procedure_v1.md`](field_hop_procedure_v1.md) alongside it — this document is the spine; those two carry the detail.

## Graham's decisions this plan is built on (2026-09-04)

1. **Port the full ladder in one transfer: 17→22, 2,102 tarballs / 355.6 MB.** One transfer cycle is the scarce resource; bytes are not. Porting the whole ladder costs one cycle and removes the possibility of ever queuing another for toolchain reasons.
2. **Skip the `--delta-from` minimization.** Getting a Nexus package listing *off* the island costs days-to-weeks of paperwork and approvals — far more than the bytes are worth. Duplicate uploads return `409 Conflict`, which the upload loop already treats as success.
3. **Upload to Nexus one rung at a time**, not all at once: v18 surface → hop app to 18 → v19 surface → hop to 19 → and so on.
4. **Do not expand the run to the three `@other-team/*` projects.** See §1.

> **Why staged upload is right, beyond convenience:** it keeps Nexus's state matched to where the estate actually is. If the entire v22 surface is present at once, a loose `^` range in some unrelated app's devDependencies can silently resolve higher than intended on its next install. Staged upload makes that impossible, and costs nothing — the tarballs are already on the island either way.

---

## 1. The `@other-team/*` question — resolved as a pre-flight check, not a scope expansion

The two apps depend on three private packages: **`@other-team/core-common`**, **`@other-team/core-web-angular`**, **`@other-team/core-node`**. All three are Angular-17-era Node/Angular/Express projects, upgraded independently by their owning team on a cadence that lags this one. They are **not** being bumped as part of this run.

**What the rehearsals prove about them: nothing.** They were stripped from the legacy shells entirely — private packages, unresolvable from the public registry — and there are zero `@other-team` tarballs in the transfer pool. Any claim about their behaviour under `ng update` is reasoning, not measurement, and is marked as such below.

### The mechanism is confirmed; only the input is unknown

`ng update` refuses to proceed when any installed package declares a `peerDependencies` range the target version would violate. **This is observed, not theorized:** at 18→19, `jest-preset-angular@14.1.0` blocked the hop at the plan stage for exactly this reason (peers `@angular/build-angular >=15 <19`). See [`monorepo_hop_procedure_v2.md`](../legacy-shell-bundle-01-design-packet/monorepo_hop_procedure_v2.md) Step 0.

So the entire question reduces to one line, readable on the island in under a minute:

```
npm view @other-team/core-web-angular@1.6.0 peerDependencies
npm view @other-team/core-common@1.2.0 peerDependencies
npm view @other-team/core-node@1.2.0 peerDependencies
```

`core-common` and `core-node` are expected to be irrelevant (framework-agnostic and Node-side respectively). **`core-web-angular` is the one that matters.**

| Result | Consequence | Action |
|---|---|---|
| **`@angular/*: ^17.x` in `peerDependencies`** *(most likely — the ng-packagr convention)* | `ng update @angular/core@18` refuses at the plan stage | Proceed with `--force` on `ng update` and `--legacy-peer-deps` on the Step-5 install. **Then verify at runtime — see below.** |
| **`@angular/*` in `dependencies`, not `peerDependencies`** | No wall, **and this is the worse outcome**: npm may install a nested Angular 17 under the package. Two Angular instances in one application breaks dependency injection at runtime while building cleanly. | Run `npm ls @angular/core` after install. **More than one version printed → STOP** and record it; this needs the other team, not a flag. |
| **No Angular in either** | Nothing happens | Proceed normally |

### Why `--force` here is acceptable, and where its limit is

Angular libraries publish in partial-Ivy compilation format, and the v18 linker consumes v17 partial declarations by design; 17→18 removed nothing a typical component library depends on. A `^17` peer range is conservative packaging convention, not a statement about actual runtime behaviour. `--force` bypasses a *declaration*, not a known defect. **`[UNVERIFIED]` for these specific packages** — the linker's forward-compatibility is the framework's documented contract, but nobody has run these three through it.

**The limit is that a peer bypass is only proven by running the application.** A build that succeeds tells you the linker was happy; it does not tell you DI is intact. Therefore:

- [ ] **After the hop, load the application and exercise at least one screen that renders `@other-team/core-web-angular` components.** This is a hard acceptance criterion for this run, not a nice-to-have. A bypass that builds and then breaks on a page nobody opened is the failure mode this whole exercise exists to catch early.
- [ ] Record the outcome in the field notes §6 either way.

### Why the scope is not expanding

Adding three projects × five rungs plus a dependency on another team's schedule converts a half-day experiment into a multi-week programme with an external blocker — the opposite of what a guinea-pig run is for. Three supporting facts:

- **No bundle change is needed under any outcome.** These packages come from Nexus, not from our pool. If the owning team upgrades them, they publish to Nexus themselves. Their `package.json` files would not change a single tarball we port.
- **Whether the bypass path works cleanly is itself among the most valuable findings available**, because it applies identically to all 10+ estate applications.
- If the check returns the nested-dependency case, that is a genuine finding that *should* stop the run and start a conversation with the owning team — which is a better outcome than discovering it on app #7.

### A related observation, logged not acted on

`@other-team/core-web-angular` pins `@angular/cli 17.0.9` in its own tooling, while the legacy apps run 17.3.12. **This is irrelevant to consumers** — a library's own devDependencies do not participate in your dependency resolution; only its `peerDependencies` reach you. What the skew *does* indicate is that the other team's upgrade cadence lags this one, which becomes a real coordination cost under [ADR-005](../../../context/governance/decisions/ADR-005-island-stack-sync.md) when both islands must move together. Worth carrying into that planning; not a factor in this hop.

---

## 2. Phase A — Build and port the pool (outside)

**A1. Build the full ladder.** On an internet-connected Linux x64 machine with the repo checked out:

```
legacy-shells/tools/build-transfer-bundle.sh ~/bundlework --cumulative
```

Output: `~/bundlework/pool/{tarballs/,SHA256SUMS,MANIFEST.json}` plus a `.tar`. **2,102 tarballs / 355.6 MB.** Runtime 5–15 minutes; needs ~500 MB free. The script verifies each tarball's sha512 against the committed lockfiles as it fetches, then verifies the whole pool against `legacy-shells/bundle/SHA256SUMS`. Registry tarballs are immutable, so the output is byte-identical to the verified pool — **if `sha256sum -c` reports anything but zero failures, stop and report it; that is not a normal condition.**

*(No `--delta-from`, per decision 2. No `--rung` — the whole ladder ports in one cycle, and the staging happens at the Nexus-upload step, not here.)*

**A2. Transfer** by whatever the island's approved mechanism is.

**A3. Verify on arrival, before uploading anything:**

```
tar -xf rr-legacy-v17-v22-bundle-<date>.tar
cd rr-legacy-v17-v22-bundle-<date>
sha256sum -c SHA256SUMS        # must report zero failures
```

---

## 3. Phase B — Stage the v18 surface into Nexus

Upload **only what the 17→18 hop needs** for now. The pool's `MANIFEST.json` carries per-rung tags; the v18 rung is 184 tarballs / 45.1 MB. If separating them is fiddly, uploading more is harmless — `409` responses are free — but staging is preferred (§decision 3).

Publish loop and its three known gotchas are in [`nexus_upload_instructions_v1.md`](../legacy-shell-bundle-01-design-packet/nexus_upload_instructions_v1.md):

- Always pass `--provenance=false` (9 tarballs carry `publishConfig.provenance` internally and fail without it).
- **`409 Conflict` = success.** Expected constantly under decision 2, since much of the v17 surface is already there. Count them, don't chase them.
- `@stencil/core` is 8.3 MB and may exceed a reverse-proxy body limit.

### Acceptance checks — from the workstation, not the Nexus UI

```
npm view @angular/core@18.2.14 version
npm view @angular/cli@18.2.21 version
npm view keycloak-angular@16.1.0 version
npm view @my-team/<a-workspace-package> version
npm view @other-team/core-web-angular@1.6.0 peerDependencies   # §1 — do this now
```

The `@my-team/*` check matters more than it looks: `ng update` reads metadata for **every** declared dependency, your own workspace packages included, before it will compute a plan. Confirmed present (Graham, 2026-09-03) — treat as a 30-second sanity check.

**When these pass, and §1's peer check has an answer, you are ready to hop.**

---

## 4. Phase C — Pre-flight on the chosen application

Full list: [`preflight_checklist_v0.md`](preflight_checklist_v0.md). The load-bearing parts:

- **Pick an app that builds clean today.** Non-negotiable — otherwise every later failure is ambiguous. Prefer the rehearsed shape (npm workspaces, `packages/client|common|server`, framework deps hoisted to the root `package.json`, `angular.json` in `packages/client/`, Jest on jsdom). **Deliberately avoid** the custom-webpack or custom-schematics app for run #1: it deserves its own plan and will teach the wrong lesson about the other nine.
- **Capture the baseline** — you cannot recover it afterwards. Git SHA, `node -v`/`npm -v`, every `package.json`, timed `ng build` with warnings verbatim, timed `jest` with counts, `tsc` per package, existing `npm ls` peer warnings, free disk.
- **Write down the `angular.json` production budgets**, especially `anyComponentStyle`. Doesn't bite on 17→18, but at v19 the rehearsal produced a budget *warning* (2.00 kB exceeded by 925 B) — and if the budget is configured as `maximumError`, the identical condition **fails the build**. Knowing the number now saves an hour of hunting a phantom code problem later.
- **Test the escape hatch before it matters:** `rm -rf node_modules packages/*/node_modules package-lock.json && npm install`, then rebuild. If that round trip doesn't reproduce the baseline *before* anything changes, stop — there is a reproducibility problem the upgrade would otherwise be blamed for.
- Work on a branch. Commit before every step (`ng update` refuses a dirty tree anyway — lean into it; `git reset --hard HEAD~1` is then always a precise undo).

---

## 5. Phase D — The 17→18 hop

Full detail with all ten STOP conditions: [`field_hop_procedure_v1.md`](field_hop_procedure_v1.md). The shape:

| Step | What | Notes |
|---|---|---|
| **0** | — | **Skipped on this rung.** The `jest-preset-angular` pre-step is 18→19 only; 14.1.0 is fine for ng18. |
| **1** | Temporary root `angular.json` | Your `angular.json` is in `packages/client/` but `ng update` needs it beside the `package.json` declaring `@angular/core` — the root, because deps are hoisted. There is **no supported client-dir path** (five approaches tried and documented). Generator script is inlined in the procedure; the island has no `legacy-shells/`. **Read the file it produces** — it does not prefix paths under `architect.*.configurations.*`, so production `fileReplacements` need doing by hand (STOP condition F-3). Commit. |
| **2** | `npx ng update @angular/core@18 @angular/cli@18` | From the app root. Temp CLI 18.2.21 fetched first (normal). TS 5.2.2 → 5.5.4, zone 0.14.2 → 0.14.10. Core migrations run — expect `HttpClientModule` → `provideHttpClient`. **Add `--force` if §1's peer wall appears.** |
| **3** | `npx ng update @angular/material@18 @angular/cdk@18 @ngrx/store@18 @ngrx/effects@18 @ngrx/signals@18 @ngrx/operators@18` | **Never combine with step 2** — the combined command computes a plan selecting a next-major `@angular/animations` and aborts. |
| **4** | Hand-bumps | Root `ng update` cannot see `packages/client/package.json` pins. Move `@angular-devkit/build-angular`, `@angular/cli`, `@angular/compiler-cli` → 18.2.21; `typescript` → 5.5.4 wherever declared; **`keycloak-angular` → 16.1.0** (its majors track Angular's; nothing moves it for you). |
| **5** | Teardown + lock regeneration | Verify the temp root `angular.json` is unchanged, delete it, then `rm -rf node_modules packages/*/node_modules package-lock.json && npm install` (add `--legacy-peer-deps` if §1 applies). **Mandatory** — the lock `ng update` leaves is poisoned with nested stale toolchain and fails `ERESOLVE` on constraints that are actually satisfied. Expected, not an emergency, not a bundle problem. |
| **6** | Validate | `ng build` · `tsc` per non-client package · `jest` · `npm ls`. **Plus, this run only: `npm ls @angular/core` must print exactly one version, and the app must actually load with an `@other-team` component on screen** (§1). |

**Read the migration diff at step 2 before committing it.** `git diff --stat`, then spot-read the largest files. This is the part the rehearsals could not simulate — the shells had almost no source, so migrations reported "no changes"; on a real app they edit code. That diff is the single most valuable artifact of the entire run.

**Landing versions:** Angular 18.2.14 · CLI/build-angular 18.2.21 · TS 5.5.4 · zone 0.14.10 · Material/CDK 18.2.14 · NgRx 18.1.1 · keycloak-angular 16.1.0. **No Node change** — 22.15 already satisfies ng18. Do not attach the Node bump to this change request; it is separately valuable ([S-13](https://github.com/gstookey/rr/issues/20)) and attaching it gives a reviewer reason to refuse both.

---

## 6. Then repeat, one rung at a time

For 18→19: stage the v19 surface into Nexus (155 tarballs / 42.2 MB), run **Step 0** (`jest-preset-angular` → 14.6.2 everywhere it is declared — 14.1.0 blocks the hop at the *plan* stage), then the same six steps. `keycloak-angular` → 19.0.2. TypeScript does **not** move on this rung. Expect the component-style budget warning.

**Stop at v19 and let the notes come back before considering v20+.** The pool for the stretch rungs is already on the island under decision 1, so continuing is a decision rather than a transfer — which is exactly the position worth being in. DR-04 should be decided *by* this run's evidence, not before it.

---

## 7. Time, and the failure worth having

Machine time across all six steps is perhaps 30–45 minutes. **Budget half a day.** Nearly all the real time is reading migration diffs and deciding whether an edit is right — which is the actual work, and the reason to do one application carefully rather than starting a rolling upgrade.

**If a test that passed at baseline fails after the hop, the run is succeeding.** Do not skip, disable, or quarantine it. Record the test, the failure, and what the migration changed nearby. A real migration defect found on one application is worth far more than a green branch — it is precisely what nine other applications would otherwise have hit blind.

Fill in the rung's section of [`field_notes_template_v0.md`](field_notes_template_v0.md) before starting the next one, while it is fresh. **The single most useful number to send back is not this app's elapsed time — it is your estimate for the second app.**

## What is still unknown going in

The real `angular.json` budgets · whether the temp-root generator handles this app's `configurations` block · how much source the migrations actually touch · `@other-team/core-web-angular`'s peer declaration and whether the bypass holds at runtime. All four are what this run exists to answer.
