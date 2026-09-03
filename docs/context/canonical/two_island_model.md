---
schema: corpus-doc/v1
status: active
title: The Two-Island Model — Legacy Island and Desert Island
areas: [isolated-network, dev-environment, planning, security]
related: ["docs/context/canonical/project_overview.md", "docs/context/canonical/isolated_network_constraints.md", "docs/context/canonical/technology_stack.md", "docs/context/canonical/current_priorities.md"]
updated: 2026-09-03
---

# The Two-Island Model — Legacy Island and Desert Island

**Created:** 2026-08-26 | **Last updated:** 2026-09-03 (ADR-005: islands must match)

## Why this page exists

Until 2026-08-26 the context system described RR's target as "a fully isolated network" — singular. That was wrong, and the error mattered: it collapsed two environments with different contents, different starting conditions, and different work into one. Graham corrected it:

> "the effort we're attacking is really two fold, on two DIFFERENT islands"

This page is the corrected model. It is **standing truth about the environments**, not design direction. Where earlier pages say "the isolated network," read them against this page.

## The two islands

| | **Island 1 — Legacy Island** | **Island 2 — Desert Island** |
|---|---|---|
| **What is there now** | 10+ Angular applications at **v17**, running on **Node 22.15** | **Literally nothing.** Greenfield. |
| **The work** | upgrade the estate: v17 → **v19 minimum**, v22 if effort allows | stand an entire environment up from scratch, then build the new system on it |
| **Primary LOEs** | LOE-6 (upgrade), with LOE-3/5 support | LOE-1/2/3 (plan, execute, set-up guides), LOE-4/8 (stack docs, scaffolds) |
| **Board epic** | [EP-03](https://github.com/gstookey/rr/issues/5) | [EP-04](https://github.com/gstookey/rr/issues/6), [EP-05](https://github.com/gstookey/rr/issues/7) |
| **Dominant unknown** | how hard each app is to upgrade (needs the estate inventory) | everything about the network itself (needs the questionnaire) |

Both islands share: no internet, **no agent access**, one-way compressed bundle transfer, and human-executable-from-the-document-alone as a hard authoring constraint.

## Why they are one programme and not two

**The two islands meet in the cluster at deploy time.** Graham:

> "It will need to match the target tech stack of Legacy Island, since the environments will be related at deploy time / in the cluster, so it all needs to be in sync."

That coupling is the reason a greenfield build and a legacy upgrade are one programme. Desert Island cannot simply take the newest of everything and let Legacy Island catch up later — if Legacy Island lands on Angular 19 and Desert Island is built on Angular 22, the two halves meet in a cluster with mismatched runtimes.

**Directional consequence, worth stating plainly:** *Legacy Island's achieved target sets Desert Island's target, not the other way round.* Desert Island has no legacy weight and could be built on anything; Legacy Island has 10+ applications of accumulated constraint and is the harder-to-move half. Planning Desert Island around a version Legacy Island cannot reach produces a synchronization failure that surfaces late, in a cluster, on a network where help is hard to get.

This is a **standing structural constraint with no expiration** for as long as the two environments deploy into a shared cluster. It is not a milestone-scoped rule. If the deployment topology ever separates them, this constraint should be revisited — and that revisit should be a deliberate decision, not a drift.

## Why the upgrade is not optional

Graham, 2026-08-26:

> "the security vulnerabilities of angular 17 / node.js 22.15 (current versions on legacy island) are just not ok, and node is no longer supporting 22.15, so we have to do this upgrade."

The driver is **security exposure**, not modernization appetite. That reframes the work: it is remediation with a deadline shaped by risk acceptance, not an improvement project that can be deferred indefinitely. It also means "do nothing" is not one of the options on the table when weighing DR-04.

### Node posture — a precision that changes the size of the ask

Verified against the official Node release index on 2026-08-25:

- **Node 22.15.0 shipped 2025-04-22** (22.15.1 on 2025-05-14). Legacy Island is roughly **15 months and 8 patch releases behind**.
- The **Node 22 line itself is still LTS** (codename *Jod*); its current patch is **22.23.2** (2026-07-28).
- The exact end-of-life date for the 22 line is **`UNVERIFIED`** — `nodejs.org/dist/schedule.json` was not reachable in-session. Confirm before quoting a date to anyone.

So the precise statement is: **the 22.15 *patch* is unsupported and carries known exposure; the 22 *line* is not yet end-of-life.** The remediation is therefore a **patch-level bump inside the same major** — 22.15 → 22.23.2 — not a major-version migration.

That distinction is worth real money in a change-controlled environment: a patch bump within an LTS line is a far smaller ask than a major upgrade, and it can proceed **independently of any Angular work** ([S-13](https://github.com/gstookey/rr/issues/20), bundle [S-06](https://github.com/gstookey/rr/issues/13)). It is probably the single cheapest risk reduction available in the whole programme.

## The finding that reshapes the upgrade plan

Every Angular version's Node and TypeScript requirements were read from the registry on 2026-08-25 (transcript: `docs/design/packets/iso-net-readiness-01-design-packet/stack_dependency_manifest_v0.md`, Appendix B).

| Hop target | `@angular/core` | Node requirement | TypeScript peer | **Runs on Node 22.15?** |
|---|---|---|---|---|
| v17 *(current)* | 17.3.12 | `^18.13.0 \|\| >=20.9.0` | `>=5.2 <5.5` | ✅ |
| v18 | 18.2.14 | `^18.19.1 \|\| ^20.11.1 \|\| >=22.0.0` | `>=5.4 <5.6` | ✅ |
| **v19 — the floor** | 19.2.25 | `^18.19.1 \|\| ^20.11.1 \|\| >=22.0.0` | `>=5.5 <5.9` | ✅ |
| v20 | 20.3.29 | `^20.19.0 \|\| ^22.12.0 \|\| >=24.0.0` | `>=5.8 <6.0` | ✅ |
| v21 | 21.2.21 | `^20.19.0 \|\| ^22.12.0 \|\| >=24.0.0` | `>=5.9 <6.1` | ✅ |
| **v22 — the stretch** | 22.1.3 | `^22.22.3 \|\| ^24.15.0 \|\| >=26.0.0` | `>=6.0 <6.1` | ❌ **needs ≥ 22.22.3** |

**Read the last column carefully. It is the most useful thing this session produced.**

1. **Milestone 1 needs no Node change at all.** Node 22.15 already satisfies Angular 18 and 19. The v19 floor is reachable on the runtime Legacy Island runs today — the Node upgrade and the Angular upgrade are **decoupled**, and neither blocks the other.
2. **v20 and v21 also need no Node change** — 22.15 satisfies `^22.12.0`.
3. **Only v22 requires a Node bump**, and even then only to **22.22.3+ within the same major line** — the very bump security already demands (S-13). There is no major-version Node migration anywhere in this plan.

The earlier working assumption — that the island's Node was a plausible hard ceiling on the Angular target (DR-03) — is **substantially weakened by these numbers**. The Node ceiling is not the binding constraint on reaching v22; **estate difficulty is**, and that remains unknown until the inventory returns.

**This does not close DR-03.** These are the *published requirements*; what Legacy Island's change-control process will actually permit, and whether the machines can take a new Node at all, are still unanswered (questionnaire B2/B3). What has changed is the shape of the risk: DR-03 has gone from "may invalidate the whole plan" to "may complicate the v22 stretch only."

## Milestone 1

> "We know this, though: we HAVE to get legacy to 19 at minimum, so that's our first real goal, I think. That's our first objective." — Graham, 2026-08-26

**Milestone 1 — Legacy Island to Angular 19 minimum.**

Chosen because it is the smallest target that discharges the security driver, it is a **hard floor rather than a preference** (unlike v22), and — per the table above — it is reachable on the existing runtime. Everything currently on the board is either directly on its path or is discovery work that sizes it.

The v22 question is deliberately **not** folded into Milestone 1. Bundles for the v19→v20→v21→v22 hops exist on the board ([S-09](https://github.com/gstookey/rr/issues/16), [S-10](https://github.com/gstookey/rr/issues/17), [S-11](https://github.com/gstookey/rr/issues/18)) so the shape of the stretch is visible and can be prepared for — but they are marked conditional on DR-04, which should be decided after the first real hop teaches us the true cost, not before.

## Stack synchronization

> **Governing fact since 2026-09-03 — [ADR-005](../governance/decisions/ADR-005-island-stack-sync.md) (closes DR-10):** the two islands' stacks **must match** (Graham: shared deployment environments). Matching is an ongoing operating commitment — every future upgrade is a coordinated two-island event. Granularity (exact versions vs. same-major) is still `[NEEDS GRAHAM]`; the strictest reading governs until answered.

Desert Island's stack target is **whatever Legacy Island actually achieves**, resolved when DR-04 closes. Until then:

- Desert Island planning proceeds on the **intended** stack in `technology_stack.md` (Angular 22 line), because it is greenfield and re-pinning downward is cheap while nothing is built.
- **That is a working assumption with an explicit expiration:** it holds only until DR-04 closes. If Legacy Island stops at v19, Desert Island's pins move to the v19 line and `technology_stack.md` is re-pinned. Nothing should be scaffolded on the v22 pins before then ([S-17](https://github.com/gstookey/rr/issues/24)).
- The version-pinned manifest is per-target, not universal: expect **two** pin sets to exist simultaneously for a period — Legacy Island's achieved target and Desert Island's build target — and expect them to converge, not to have been identical all along.

## What is now known vs. still unknown

**Newly known (Graham, 2026-08-26 — treat as fact, not inference):**

- There are two distinct isolated environments, named Legacy Island and Desert Island.
- Legacy Island runs Angular v17 and Node 22.15 today.
- Desert Island is entirely greenfield.
- They deploy into a related cluster and must stay stack-synchronized.
- The driver is security exposure; v19 is a hard floor; v22 is a preference decided by effort.

**Still unknown** — routed through `isolated_network_constraints.md` and the packet questionnaires:

- Whether Legacy Island's other tooling (registry, git, CI) exists — and the same questions asked separately of Desert Island, where the answer is probably "no" but must not be assumed.
- Per-app upgrade difficulty across the estate (the inventory).
- Whether the two islands share a transfer mechanism or each has its own — **not yet asked**, and it changes bundle logistics materially. Added to the Legacy Island questionnaire's follow-ups.
- Whether Legacy Island's change control will permit the Node patch bump, and on what timescale.
