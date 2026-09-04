---
schema: corpus-doc/v1
status: exploratory
title: Field Notes Template v0 — what to capture during the first real hop
areas: [frontend, isolated-network, planning, risk-gates]
related: ["docs/design/packets/first-app-hop-01-design-packet/field_hop_procedure_v1.md", "docs/design/packets/iso-net-readiness-01-design-packet/legacy_estate_inventory_template_v0.md", "docs/design/packets/iso-net-readiness-01-design-packet/decision_register_v0.md"]
updated: 2026-09-03
---

# Field Notes Template v0

**Created:** 2026-09-03 | **Status:** `exploratory` — the capture instrument for a run that has not happened.

Copy this into a working file on the island and fill it in **as you go**, not afterwards. Everything here is either a number that cannot be recovered later or a judgement that decays within a day.

**Write `unknown` freely. An honest `unknown` routes to a follow-up question; a confident guess routes to a wrong plan across ten applications.**

---

## 0 — Run identity

| | |
|---|---|
| App name (or placeholder) | |
| Date(s) of run | |
| Who ran it | |
| Workstation OS / arch | |
| Rungs attempted | 17→18 · 18→19 · *(stopped at: )* |
| Branch name | |

**Does this app match the rehearsed shape?** (npm workspaces, `packages/client|common|server`, framework deps hoisted to root `package.json`, `angular.json` in `packages/client/`, Jest on jsdom)

- [ ] Yes, matches
- [ ] Differs — how: _______________

---

## 1 — Baseline (pre-flight Part 3, captured before touching anything)

| | |
|---|---|
| `git rev-parse HEAD` | |
| `node -v` / `npm -v` | |
| `@angular/core` version | |
| `typescript` version(s), and where declared | |
| Baseline `ng build` — wall time / exit code | |
| Baseline build warnings (verbatim) | |
| Baseline `jest` — pass/fail counts / wall time | |
| Baseline `tsc` results per package | |
| Pre-existing `npm ls` peer warnings | |
| Free disk at start | |

**`angular.json` production budgets** — this is the one that bites at v19:

| Budget `type` | `maximumWarning` | `maximumError` |
|---|---|---|
| `anyComponentStyle` | | |
| `initial` | | |
| *(others)* | | |

---

## 2 — Registry readiness (pre-flight Part 2)

- Nexus package listing exported? · `--delta-from` run on the outside? · measured delta size: ______
- Did every spot-check resolve from Nexus? **yes / no** — if no, which: ______
- Did `@my-team/*` metadata resolve? **yes / no**
- **Anything Nexus did NOT serve, exact name@version:**

---

## 3 — Per rung

> Duplicate this whole section for each rung attempted.

### Rung: ____ → ____

**Timings** (wall clock, honestly — including the time you spent reading diffs and being confused):

| Step | Time | Notes |
|---|---|---|
| 0 — jest-preset-angular pre-step | | *(18→19 only)* |
| 1 — temp root `angular.json` | | Did you need the manual `configurations` fix? **yes / no** |
| 2 — Phase 1 (framework) | | |
| 3 — Phase 2 (third parties) | | |
| 4 — hand-bumps | | |
| 5 — teardown + lock regeneration | | |
| 6 — validation | | |
| **Total for the rung** | | |

**Did the versions land where the table said?**

- [ ] Yes, exactly
- [ ] No — differences: _______________

**What the migrations actually edited — THE most valuable field in this document.** The shells had almost no source, so migrations reported "no changes." On real code they do not. This is the evidence DR-04 has been waiting for.

| | |
|---|---|
| Files changed by Phase 1 migrations (`git diff --stat`) | |
| Lines added / removed | |
| **Kinds of change** (e.g. `HttpClientModule` → `provideHttpClient`, standalone conversion, NgRx `concatLatestFrom`) | |
| Did any migration edit something whose intent was unclear from the diff? | |
| Did any migration produce a change you had to **revert or correct by hand**? | |
| Files changed by Phase 2 migrations | |

**Hand-bumps needed beyond the procedure's Step 4 list:**

| Package | From | To | Why you noticed |
|---|---|---|---|
| | | | |

**Validation results:**

| Check | Result | vs. baseline |
|---|---|---|
| `ng build` | | |
| Build warnings — new ones only | | |
| Budget warning at v19? warning or **error**? | | |
| `tsc` per package | | |
| `jest` pass/fail | | |
| New `npm ls` peer warnings | | |

**STOP conditions hit** (F-1 … F-10, plus anything unlisted):

| Code | What happened | How you resolved it (or that you stopped) |
|---|---|---|
| | | |

**Deviations from the written procedure** — anything you did that the document did not say to do. These become v3 of the procedure:

---

## 4 — Judgement (fill in at the end of the run)

**Effort band for this application** — feeds the [estate inventory](../iso-net-readiness-01-design-packet/legacy_estate_inventory_template_v0.md) bands, replacing Axium's first-order guesses with one measured row:

- [ ] **Straightforward** — mechanical, procedure worked as written, no surprises worth a paragraph
- [ ] **Moderate** — worked, but needed judgement calls or unlisted hand-bumps; each rung needs its own verification pass
- [ ] **Hard** — needed an individual plan, or something is still unresolved

**Total elapsed for 17→19, all rungs and reading time included:** ______

**Your honest estimate for the *second* application of similar shape:** ______
*(The first is an experiment; the second is the number that actually multiplies across the estate. This is the single most useful figure you can send back.)*

**Would you attempt v20/v21/v22 on this estate?** — the direct input to DR-04. Not "is it possible" (it is, rehearsed) but "is it worth it, at this cost, across 10+ apps":

**What would you want to exist before doing app #2?**

---

## 5 — Questions you could not answer from the island

List them plainly. This is the return channel — anything here becomes work on the outside.

1.
2.
3.

---

## 6 — For the record

- **The `@other-team/*` peer check (pre-flight) — record the literal output:**

  | Package | `peerDependencies` as declared | Wall hit? | Bypass used |
  |---|---|---|---|
  | `@other-team/core-web-angular@1.6.0` | | | |
  | `@other-team/core-common@1.2.0` | | | |
  | `@other-team/core-node@1.2.0` | | | |

  - `npm ls @angular/core` after install — **how many versions printed?** ______ *(more than one = F-12, stop)*
  - **Did you load the app and exercise a screen using `@other-team/core-web-angular` components? What happened?** *(the only real proof a peer bypass held)*
- Anything else about the **`@other-team/*`** packages that surfaced (declined migrations, version pressure) — Graham coordinates these separately, but pressure observed here sizes that conversation:
- Anything about **AstroUXDS** (rode both Milestone-1 hops untouched in rehearsal — did it here?):
- Anything about **change control** — what approval was needed, how long it took, what was asked:
- **Was the documentation wrong anywhere?** Be blunt. A procedure that reads well and misleads on the island is worse than no procedure.
