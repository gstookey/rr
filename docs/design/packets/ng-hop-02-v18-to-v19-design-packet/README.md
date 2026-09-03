---
schema: corpus-doc/v1
status: exploratory
title: Angular Hop Packet 02 — v18 to v19 (ng-hop-02) — Milestone 1's floor
areas: [frontend, dev-environment, isolated-network, technology-stack]
related: ["docs/context/canonical/two_island_model.md", "docs/design/packets/ng-hop-01-v17-to-v18-design-packet/README.md", "docs/design/packets/iso-net-readiness-01-design-packet/stack_dependency_manifest_v0.md"]
updated: 2026-08-28
---

# Angular Hop Packet 02 — v18 → v19 (`ng-hop-02`)

**Created:** 2026-08-28 | **Author:** Axium | **Status:** `exploratory` — rehearsed on a bare app, not yet run against real estate code

## Why this hop matters more than the last one

**This is the hop that reaches Milestone 1's floor.** Legacy Island's hard requirement is Angular v19 minimum; an application that completes this hop has discharged the security driver that started the programme. Everything past it (v20, v21, v22) is the stretch, conditional on DR-04.

| Document | What it is |
|---|---|
| [`v18_to_v19_hop_runbook_v1.md`](v18_to_v19_hop_runbook_v1.md) | the procedure, rehearsed, with a verbatim transcript appendix |
| [`v19_hop_bundle_manifest_v0.md`](v19_hop_bundle_manifest_v0.md) | what the registry needs, measured — **including the combined v18+v19 cost**, which is the number that actually matters for a staged estate |

## Continuity with hop 1

The rehearsal continued **the same throwaway application** produced by [`ng-hop-01`](../ng-hop-01-v17-to-v18-design-packet/README.md), rather than starting fresh. Two things fall out of that:

1. **It validates hop 1's output.** The v18 app built cleanly before hop 2 began (`Initial total 241.04 kB`, identical to the figure hop 1 recorded), which is evidence that the v17→v18 runbook produces a durable result and not merely one that compiles once.
2. **It mirrors what the island will actually do** — the same application taken through consecutive hops, carrying whatever the previous hop left behind.

## The headline: hop 2 is a *different shape* of hop than hop 1

This is the most useful thing in this packet, and it is the reason rehearsing each hop separately is worth the effort rather than writing one generic "ng update" runbook:

| | **hop 1 (v17→v18)** | **hop 2 (v18→v19)** |
|---|---|---|
| TypeScript | **unchanged** (`5.4.x`) | **bumped** `5.4.5` → `5.8.3` |
| zone.js | **unchanged** (`0.14.x`) | **bumped** `0.14.10` → `0.15.1` |
| Source files edited by migrations | **none** | **1** (`app.component.ts`) |
| Optional migrations offered | 1 | **2** |
| Build warnings introduced | none | **1** (component style budget) |
| Bundle size change | +6.0% | +0.65% |

Hop 1 was a version bump. **Hop 2 rewrites your source, moves your language version, and can introduce build warnings that a stricter budget configuration would turn into failures.** An estate plan that assumes both hops cost the same will under-estimate the second one.

## What the rehearsal does and does not prove

**Proves:** the command sequence; the exact version transitions; which migrations run and which of them touch source; that a v18 app builds as v19 with the migration's edits and no manual work *in the bare case*.

**Does not prove anything about the real estate.** A default `ng new` app — no custom webpack, no custom schematics, no third-party UI or state libraries, no meaningful source. The standalone-components migration touched **one** file here; on an estate application with a hundred components it will touch a hundred, and each is a diff someone has to read. **Read "1 file modified" as "1 file out of the 1 file that existed."**

**The tests still never ran.** No browser binary was available on the rehearsal machine — the same gap hop 1 found, now confirmed across both hops. Neither hop has ever been validated by a passing test suite.

**The offline path remains unrehearsed.** Both rehearsals used the public registry.

## Board

- [S-15](https://github.com/gstookey/rr/issues/22) — this runbook, under [EP-03](https://github.com/gstookey/rr/issues/5).
- [S-08](https://github.com/gstookey/rr/issues/15) — the v19 bundle manifest, under [EP-02](https://github.com/gstookey/rr/issues/4). Delivered here, with the same "floor, not estimate" caveat as [S-07](https://github.com/gstookey/rr/issues/14).
- Raw upstream guidance: `docs/angular-upgrade-docs/v18-to-v19/`.

**With this packet, both hops needed to reach Milestone 1's floor are rehearsed and written.** What stands between the runbooks and the milestone is the estate itself: the inventory ([S-03](https://github.com/gstookey/rr/issues/10)), the registry ([S-05](https://github.com/gstookey/rr/issues/12)), and an offline rehearsal ([S-16](https://github.com/gstookey/rr/issues/23)).
