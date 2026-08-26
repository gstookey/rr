---
schema: corpus-doc/v1
status: exploratory
title: Decision Register v0 — Isolated-Network Readiness
areas: [isolated-network, technology-stack, process-governance, planning]
related: ["docs/context/canonical/two_island_model.md", "docs/context/governance/contradictions/register.md", "docs/context/governance/decisions/ADR-004-package-manager-npm.md", "docs/context/canonical/isolated_network_constraints.md", "docs/design/packets/iso-net-readiness-01-design-packet/README.md"]
updated: 2026-08-26
---

# Decision Register v0

**Created:** 2026-08-25 | **Last updated:** 2026-08-26 | **Status:** `exploratory` — open decisions, none closed

Decisions this packet **raises but cannot close**. DR-01..DR-09 were raised on 2026-08-25; **DR-10 was added on 2026-08-26** with the two-island model, and DR-03/DR-04 were materially revised the same day. Each carries options, what it blocks, and Axium's lean. A lean is a recommendation with reasoning attached, not a decision — none of these is settled, and none should be treated as settled by any downstream document.

When one closes, it graduates to an ADR under `docs/context/governance/decisions/` (numbering continues at **ADR-005**) and is struck through here with a pointer.

| ID | Decision | Blocks | Who closes it |
|---|---|---|---|
| [DR-01](#dr-01) | Private registry: Verdaccio, existing Nexus/Artifactory, or cache-only | LOE-5 bundle shape, day-one runbook | Network owner (questionnaire A5), then Graham |
| [DR-02](#dr-02) | Transfer strategy: one complete delivery vs. iterative | how much contingency we pack | Network owner (A2–A4), then Graham |
| [DR-03](#dr-03) | Node ceiling vs. Angular ceiling | the v22 stretch only *(de-risked 2026-08-26)* | Legacy Island change control (B2/B3) |
| [DR-04](#dr-04) | Legacy estate target: v19 floor or v22 stretch | how far past Milestone 1 we go; conditional bundles | Graham, after the estate inventory + first real hop |
| [DR-05](#dr-05) | Monorepo layout: `apps/*`+`packages/*` vs `client/common/server` | LOE-8 scaffolds | Graham (C-001 layout half) |
| [DR-06](#dr-06) | Does `gstookey/rr` itself port up, or only an export? | how we write everything from now on | Governance (C1/C2), then Graham |
| [DR-07](#dr-07) | Zone.js or zoneless | one dependency; change-detection model | Graham, at scaffold time |
| [DR-08](#dr-08) | Express 5 vs. the blueprint's assumptions | gateway scaffolding | Graham/Marlow at LOE-8 |
| [DR-09](#dr-09) | Ship the npm cache alongside the registry seed? | bundle contents, day-one resilience | Graham |
| [DR-10](#dr-10) | How strictly must the two islands' stacks match, and when? | Desert Island pins; scaffold timing | Graham, with the deploy-topology owner |

---

## DR-01

### Private registry on the island: Verdaccio, an existing Nexus/Artifactory, or cache-only

**Why it is open:** we do not know whether the island already has a JavaScript package registry (questionnaire A5). The 10+ existing Angular applications must install their dependencies somehow, which is *suggestive* that one exists — but they might equally be built from checked-in `node_modules`, or from a file share, or on machines nobody has re-provisioned in three years. We should not infer.

**Options:**

| Option | For | Against |
|---|---|---|
| **A. Use an existing Nexus/Artifactory** | nothing to install or get approved; already integrated with the estate; someone already owns it | not ours to change; upload process and permissions unknown; a shared server's outage is not our outage to fix |
| **B. Stand up Verdaccio** | small, runs on the Node we are bringing anyway (`engines: node >=22`), ~11 MB of archives, config is one readable file | a new service to get approved, run, back up, and start on boot; a second registry on a network that may already have one is a smell |
| **C. Cache-only, no server** (`npm ci --offline --cache <dir>`) | zero infrastructure; nothing to approve | does not serve other machines or the legacy estate; unwieldy across many projects; not a foundation |

**Axium's lean: A if one exists, B if not, C never as the plan** — but C is worth *carrying* regardless (see DR-09). The runbook is written to branch on this at Step 0 precisely because we cannot pre-decide it.

**Note against my own lean:** if A turns out to be true, Verdaccio's ~11 MB stays in the bundle anyway as insurance until the day the existing registry is confirmed to actually accept our uploads. Eleven megabytes is cheaper than a blocked week.

---

## DR-02

### Transfer strategy: one complete delivery, or iterative deliveries

**Why it is open:** entirely determined by questionnaire A2 (size cap), A3 (lead time) and A4 (cadence). We do not have those numbers.

**Options:**

| Option | Implication |
|---|---|
| **A. One complete, heavily over-packed delivery** | pack every intermediate Angular toolchain, spare versions, the cache fallback, extra tooling. Bigger, slower to prepare, far more forgiving of omissions. |
| **B. Lean first delivery, iterate** | faster to prepare and to review; every omission costs one round trip. |
| **C. Lean delivery + a standing "additions" channel** | best of both, only if such a channel exists. |

**Axium's lean: A until proven otherwise.** The asymmetry is the whole argument — over-packing costs bytes and review time, under-packing costs a cycle of unknown length during which the team on the island is blocked and cannot ask anyone anything. If A3 comes back as "hours," revisit immediately; if it comes back as "weeks," A is not a preference, it is the only responsible answer.

---

## DR-03

### Node ceiling vs. Angular ceiling

**Status 2026-08-26: substantially de-risked, still open.**

Graham confirmed Legacy Island runs **Node 22.15**. Combined with the per-hop requirements verified on 2026-08-25 (full matrix: [`stack_dependency_manifest_v0.md`](stack_dependency_manifest_v0.md) Appendix B), the picture changed materially:

| Angular target | Node requirement | Runs on 22.15? |
|---|---|---|
| v18 | `^18.19.1 \|\| ^20.11.1 \|\| >=22.0.0` | ✅ |
| **v19 (Milestone 1)** | `^18.19.1 \|\| ^20.11.1 \|\| >=22.0.0` | ✅ |
| v20 | `^20.19.0 \|\| ^22.12.0 \|\| >=24.0.0` | ✅ |
| v21 | `^20.19.0 \|\| ^22.12.0 \|\| >=24.0.0` | ✅ |
| v22 | `^22.22.3 \|\| ^24.15.0 \|\| >=26.0.0` | ❌ needs ≥ 22.22.3 |

**What this changes:** the earlier framing — "Node may be a hard ceiling that invalidates the whole plan" — was too pessimistic. **Milestone 1 needs no Node change.** Neither do v20 or v21. Only v22 does, and only a **patch bump inside the same major line**.

**Why it stays open:** these are the *published requirements*. Unanswered: whether Legacy Island's change control permits even a patch bump, and on what timescale (questionnaire B2/B3). The risk has moved from "may invalidate everything" to "may complicate the v22 stretch only."

**Axium's lean: stop treating Node as the gating risk and start treating estate difficulty as the gating risk.** Concretely — the Node patch bump (22.15 → 22.23.2) should be pursued **on its own security merits**, decoupled from any Angular work ([S-06](https://github.com/gstookey/rr/issues/13) / [S-13](https://github.com/gstookey/rr/issues/20)). It is the cheapest risk reduction available, it closes the Node half of the security driver by itself, and as a side effect it removes v22's only runtime obstacle.

**Closes when:** questionnaire B2 confirms the Node version and B3 answers the change-control question.

## DR-04

### Legacy estate target: v19 floor, or v22 stretch

**Why it is open:** v19 minimum, v22 if the effort can be carried. Whether it can be carried depends on the estate inventory, which does not exist yet.

**Two things changed on 2026-08-26.** First, **v19 is now Milestone 1** — a named objective, not one end of a range, and the security driver makes "do nothing" not an option. Second, **the Node obstacle to v22 largely evaporated** (DR-03): v20 and v21 need no runtime change at all, and v22 needs only a patch bump. The decision is now almost purely about **estate difficulty**, which is exactly what the inventory measures. Graham's stated preference is v22; his stated decider is effort.

**The trade, stated honestly:**

| Option | For | Against |
|---|---|---|
| **A. Stop at v19** | three hops instead of five; a much smaller bundle; substantially less risk per app | leaves the estate on a version that will itself age out, and a second upgrade programme later costs more than continuing now |
| **B. Go to v22** | estate and new project on one version — one toolchain, one set of skills, one set of documentation; upgrade momentum is already paid for | five hops across 10+ apps; each `Hard`-band app can stall the whole push; Node ceiling (DR-03) may forbid it outright |
| **C. Split: v22 where cheap, v19 where expensive** | matches effort to reality | two toolchains coexisting in the estate indefinitely, which is its own ongoing tax |

**Axium's lean: do not decide this yet, and resist the pressure to.** Decide after the inventory returns and after the **first** app has actually been upgraded end to end — the first real hop is worth more than any estimate. If forced to state a lean today: **C, with a bias toward B**, because the operational cost of two Angular versions across a dozen applications on a network where help is hard to get is usually underestimated.

**A note on sequencing that makes this decision cheaper to defer:** the hops are sequential, so v20/v21/v22 are all *downstream* of Milestone 1 regardless. Deciding late costs nothing except bundle preparation lead time — which is why the conditional hop bundles ([S-09](https://github.com/gstookey/rr/issues/16), [S-10](https://github.com/gstookey/rr/issues/17), [S-11](https://github.com/gstookey/rr/issues/18)) are on the board now: prepared, not committed. If the answer turns out to be v19, they close as not-planned and nothing was lost but a little packing effort.

**What would change my mind quickly:** an inventory that comes back with several apps on custom webpack or custom schematics. That distribution, not the app count, is the deciding evidence.

---

## DR-05

### Monorepo layout: `apps/*` + `packages/*`, or `client/ common/ server/`

**Why it is open:** this is the surviving half of contradiction **C-001** (`governance/contradictions/register.md`). The package-manager half closed as npm (ADR-004); the layout half did not.

**This packet is proceeding on `apps/*` + `packages/*`** as a working assumption, per the session brief. It is load-bearing for exactly one thing — the wording of the LOE-8-adjacent story in [`story_decomposition_v0.md`](story_decomposition_v0.md) — and nothing else in this packet depends on it.

| Option | For | Against |
|---|---|---|
| **A. `apps/*` + `packages/*`** | LOE-8 will produce *several* app templates (TypeScript/Angular, some Python, some Java), not one client; the convention is widely recognized | diverges from the source blueprints, which say `client/ common/ server/` |
| **B. `client/ common/ server/`** | exactly what `docs/source-documents/` prescribes; less translation when reading them | assumes one client and one server, which contradicts the stated LOE-8 shape |

**Axium's lean: A.** As recorded in ADR-004's consequences, this is a taste call rather than a risk call — cheap to change while nothing is scaffolded, and increasingly expensive after. **It should be closed before LOE-8 begins, and it is cheap to close now.**

---

## DR-06

### Does `gstookey/rr` itself port up, or only an export of its contents?

**Why it is open:** questionnaire C1/C2. Also affects what may be written into this repo *starting now*, which makes it more urgent than it appears.

| Option | Implication |
|---|---|
| **A. The whole repository crosses** | all planning, rationale, contradiction history, and decision trail travel with the work. Optimize the repo to be self-contained and readable offline — no external links as load-bearing content. |
| **B. Only a curated export crosses** | design the export set deliberately now (which docs, in what structure) rather than discovering the constraint at transfer time. |
| **C. Nothing crosses; documents are re-created** | the worst outcome — the context system is this repo's most valuable asset (`AGENTS.md`). Argue hard against it. |

**Axium's lean: A, and write for A starting immediately** — meaning: keep every document self-contained, avoid relying on links to internet resources for meaning, and keep the corpus readable as plain files. That discipline costs almost nothing if B turns out to be true, and saves the whole trail if A does.

**Sub-question worth answering early (C1):** whether naming the legacy applications, their versions, and their owners is acceptable in an internet-hosted document. If it is not, we adopt placeholder naming *now* — retrofitting it later means rewriting history, and the inventory template already anticipates this.

---

## DR-07

### Zone.js or zoneless change detection

**Why it is open:** `technology_stack.md` lists it as an open stack question; the source blueprint shows `provideZoneChangeDetection` with a comment inviting its removal.

| Option | For | Against |
|---|---|---|
| **A. Keep Zone.js** (`0.16.2`) | conventional, matches what the legacy v17 estate does today, one less novelty on an island with no help available | an extra dependency and a change-detection model Angular is moving away from |
| **B. Zoneless** | Angular's forward direction; drops a dependency; signal-based state (NgRx Signals is already the intended choice) fits it naturally | fewer worked examples to consult offline; a class of subtle bugs the team would debug without internet access |

**Axium's lean: A for the first application, revisit at a named point.** The deciding factor is not technical merit, it is that debugging an unfamiliar change-detection model with no internet and no agent is a materially worse experience than debugging a familiar one.

**Expiration:** this lean applies **only through the first application's stand-up on the island**. It should be revisited deliberately once the team has a working build and a support rhythm — it is not a standing constraint on RR's architecture, and must not be cited as one.

---

## DR-08

### Express 5 vs. the source blueprints' assumptions

**Why it is open:** verified today — `express@latest` is **5.2.1**. The `docs/source-documents/` gateway blueprint predates Express 5 and its guidance has not been re-read against the v5 changes.

| Option | For | Against |
|---|---|---|
| **A. Express 5.2.1** | current, and pinning to an already-superseded major on a network we cannot easily update is a poor trade | blueprint guidance needs re-reading; middleware ecosystem compatibility unverified |
| **B. Express 4.x** | matches the blueprints as written | starting a brand-new project on a superseded major, on a network where upgrading later is expensive |
| **C. Something else** (Fastify, plain Node) | out of scope for this packet | out of scope |

**Axium's lean: A** — with the explicit caveat that the blueprint must be re-read against Express 5 before any gateway code is written. That re-read belongs to LOE-8, not here. Flagging it now so it does not surface as a surprise inside an implementation task.

---

## DR-09

### Ship the npm cache alongside the registry seed?

**Why it is open:** it is a cheap insurance policy nobody has decided to buy.

The day-one runbook's fallback path (`npm ci --offline --cache <dir>`) works **only if the cache directory was deliberately included in the bundle**. It duplicates content already present as archives, so it costs roughly the tarball footprint again — on the order of **90 MB** for the current stack, measured.

| Option | For | Against |
|---|---|---|
| **A. Ship both** | if the registry cannot be stood up on day one — no permission, port blocked, change control pending — the team can still install and work. Converts a blocked week into a productive one. | ~90 MB of duplication |
| **B. Registry seed only** | smaller, cleaner | a single point of failure on day one, on the day help is least available |

**Axium's lean: A**, unless DR-02 comes back with a tight size cap that makes 90 MB genuinely expensive. The whole argument is the asymmetry again: 90 MB versus a blocked team that cannot phone anyone.

---

## DR-10

### How strictly must the two islands' stacks match, and when?

**Why it is open:** new on 2026-08-26. Graham: *"It will need to match the target tech stack of Legacy Island, since the environments will be related at deploy time / in the cluster, so it all needs to be in sync."* That establishes **that** they must match; it does not establish **how exactly** or **at what point in time**.

The distinction matters because the two islands move at very different speeds. Desert Island is greenfield and could be built this month; Legacy Island has 10+ applications of accumulated constraint and will take as long as it takes.

| Option | Meaning | For | Against |
|---|---|---|---|
| **A. Exact lockstep** | same Angular major, same Node, same TS across both | zero cluster-time surprises; one set of docs and skills | Desert Island is held hostage to the estate's pace; nothing can be built until DR-04 closes |
| **B. Same major, patch drift allowed** | both on Angular 19 (say), patches independent | practical; matches how versions actually diverge in real estates | needs a stated tolerance so "drift" does not quietly become "mismatch" |
| **C. Converge by a deadline** | Desert Island builds on the intended stack now, both converge before first shared deploy | fastest progress on the greenfield half | the convergence work is real, unscheduled, and easy to defer past the point it is cheap |

**Axium's lean: B, with C's discipline for the interim.** Concretely: build Desert Island on the intended stack *provisionally*, re-pin to Legacy Island's achieved major the moment DR-04 closes, and **do not scaffold anything on the v22 pins before then** — re-pinning a plan is free, re-pinning a scaffolded monorepo is not. Same-major with patch drift is the realistic steady state; exact lockstep is a promise that will be broken quietly rather than deliberately.

**What I do not know and would want from whoever owns the cluster:** whether "related at deploy time" means shared runtime libraries, shared container base images, or simply co-residency. Those three imply very different strictness, and I am not going to guess which one applies. `[NEEDS GRAHAM]` / `[NEEDS DEPLOY-TOPOLOGY OWNER]`.

**Blocks:** [S-17](https://github.com/gstookey/rr/issues/24) (Desert Island target-stack sync spec), and the timing of anything in EP-05.

---

## How these close

1. Questionnaire and inventory return → they answer **DR-01, DR-02, DR-03, DR-06** largely as facts rather than choices. DR-03 is already half-answered by the hop matrix; what remains is a change-control question.
2. Graham closes **DR-05** at any time (cheap now, expensive after LOE-8 starts) and **DR-09** at bundle-build time.
3. **DR-04** waits deliberately for the first real upgrade hop.
4. **DR-07** and **DR-08** close at scaffold time, inside LOE-8, not here.
5. **DR-10** needs the deploy-topology owner as much as Graham, and should close before Desert Island is scaffolded rather than after.

Each closure gets an ADR (from **ADR-005**), a `docs/context/log.md` entry, and — where it resolves C-001 — an update to the contradiction register.
