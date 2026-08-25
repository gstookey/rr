---
schema: corpus-doc/v1
status: exploratory
title: Decision Register v0 — Isolated-Network Readiness
areas: [isolated-network, technology-stack, process-governance, planning]
related: ["docs/context/governance/contradictions/register.md", "docs/context/governance/decisions/ADR-004-package-manager-npm.md", "docs/context/canonical/isolated_network_constraints.md", "docs/design/packets/iso-net-readiness-01-design-packet/README.md"]
updated: 2026-08-25
---

# Decision Register v0

**Created:** 2026-08-25 | **Last updated:** 2026-08-25 | **Status:** `exploratory` — open decisions, none closed

Decisions this packet **raises but cannot close**. Each carries options, what it blocks, and Axium's lean. A lean is a recommendation with reasoning attached, not a decision — none of these is settled, and none should be treated as settled by any downstream document.

When one closes, it graduates to an ADR under `docs/context/governance/decisions/` (numbering continues at **ADR-005**) and is struck through here with a pointer.

| ID | Decision | Blocks | Who closes it |
|---|---|---|---|
| [DR-01](#dr-01) | Private registry: Verdaccio, existing Nexus/Artifactory, or cache-only | LOE-5 bundle shape, day-one runbook | Network owner (questionnaire A5), then Graham |
| [DR-02](#dr-02) | Transfer strategy: one complete delivery vs. iterative | how much contingency we pack | Network owner (A2–A4), then Graham |
| [DR-03](#dr-03) | Node ceiling vs. Angular ceiling | whether Angular 22 is reachable at all | Island reality (B2/B3) — not a preference |
| [DR-04](#dr-04) | Legacy estate target: v19 floor or v22 stretch | LOE-6 size, bundle size | Graham, after the estate inventory |
| [DR-05](#dr-05) | Monorepo layout: `apps/*`+`packages/*` vs `client/common/server` | LOE-8 scaffolds | Graham (C-001 layout half) |
| [DR-06](#dr-06) | Does `gstookey/rr` itself port up, or only an export? | how we write everything from now on | Governance (C1/C2), then Graham |
| [DR-07](#dr-07) | Zone.js or zoneless | one dependency; change-detection model | Graham, at scaffold time |
| [DR-08](#dr-08) | Express 5 vs. the blueprint's assumptions | gateway scaffolding | Graham/Marlow at LOE-8 |
| [DR-09](#dr-09) | Ship the npm cache alongside the registry seed? | bundle contents, day-one resilience | Graham |

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

**Why it is open:** verified fact — Angular 22 requires Node `^22.22.3 || ^24.15.0 || >=26.0.0`. Unknown — what Node the island runs and whether it can be upgraded (B2/B3).

**This is not really a decision we make.** It is a fact we discover, which then decides for us. It is registered here because it is the constraint most likely to invalidate the rest of the plan, and it should be visible rather than assumed away.

**Outcomes:**

| If the island's Node is… | Then |
|---|---|
| already in range | nothing changes |
| older but upgradable | a Node upgrade becomes an early, change-controlled task; carry the installer; sequence it before everything |
| older and **not** upgradable | Angular 22 is off the table for both the new project and the legacy estate. The target drops to whatever the achievable Node supports, `technology_stack.md` gets re-pinned downward, and the dependency manifest is rebuilt from scratch. |

**Axium's lean: treat "Node is upgradable" as an assumption to be *tested early*, not planned around.** Concretely: B2 and B3 should be asked first and chased hardest, before any bundle is built, because a bundle built against the wrong Node ceiling is entirely wasted work.

---

## DR-04

### Legacy estate target: v19 floor, or v22 stretch

**Why it is open:** `project_overview.md` states v19 minimum, v22 if the effort can be carried. Whether it can be carried depends on the estate inventory, which does not exist yet.

**The trade, stated honestly:**

| Option | For | Against |
|---|---|---|
| **A. Stop at v19** | three hops instead of five; a much smaller bundle; substantially less risk per app | leaves the estate on a version that will itself age out, and a second upgrade programme later costs more than continuing now |
| **B. Go to v22** | estate and new project on one version — one toolchain, one set of skills, one set of documentation; upgrade momentum is already paid for | five hops across 10+ apps; each `Hard`-band app can stall the whole push; Node ceiling (DR-03) may forbid it outright |
| **C. Split: v22 where cheap, v19 where expensive** | matches effort to reality | two toolchains coexisting in the estate indefinitely, which is its own ongoing tax |

**Axium's lean: do not decide this yet, and resist the pressure to.** Decide after the inventory returns and after the **first** app has actually been upgraded end to end — the first real hop is worth more than any estimate. If forced to state a lean today: **C, with a bias toward B**, because the operational cost of two Angular versions across a dozen applications on a network where help is hard to get is usually underestimated.

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

## How these close

1. Questionnaire and inventory return → they answer **DR-01, DR-02, DR-03, DR-06** largely as facts rather than choices.
2. Graham closes **DR-05** at any time (cheap now, expensive after LOE-8 starts) and **DR-09** at bundle-build time.
3. **DR-04** waits deliberately for the first real upgrade hop.
4. **DR-07** and **DR-08** close at scaffold time, inside LOE-8, not here.

Each closure gets an ADR (from **ADR-005**), a `docs/context/log.md` entry, and — where it resolves C-001 — an update to the contradiction register.
