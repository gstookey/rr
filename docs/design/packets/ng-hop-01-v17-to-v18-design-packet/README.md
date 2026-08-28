---
schema: corpus-doc/v1
status: exploratory
title: Angular Hop Packet 01 — v17 to v18 (ng-hop-01)
areas: [frontend, dev-environment, isolated-network, technology-stack]
related: ["docs/context/canonical/two_island_model.md", "docs/design/packets/iso-net-readiness-01-design-packet/stack_dependency_manifest_v0.md", "docs/design/packets/iso-net-readiness-01-design-packet/legacy_estate_inventory_template_v0.md"]
updated: 2026-08-26
---

# Angular Hop Packet 01 — v17 → v18 (`ng-hop-01`)

**Created:** 2026-08-26 | **Author:** Axium | **Status:** `exploratory` — rehearsed on a bare app, not yet run against real estate code

## What this packet is

The first of the sequential hops that take **Legacy Island** from Angular v17 to at least v19 (Milestone 1). It exists because the hop is going to be performed **10+ times, by hand, on a network with no internet and no agent** — so the procedure needs to be known-good before it is repeated, not discovered per application.

| Document | What it is |
|---|---|
| [`v17_to_v18_hop_runbook_v1.md`](v17_to_v18_hop_runbook_v1.md) | the procedure, written from an actual rehearsal, with a verbatim transcript appendix |
| [`v18_hop_bundle_manifest_v0.md`](v18_hop_bundle_manifest_v0.md) | what must be in the island's registry **before** the hop starts, with a measured footprint |

## Why it says v1, not v0

Everything else in `docs/design/packets/` so far is `v0` — drafted from documentation. **This runbook was rehearsed**: an Angular 17.3 application was created, built, tested, upgraded with `ng update @angular/core@18 @angular/cli@18`, and rebuilt, on 2026-08-26. Every command, version transition and error message in it was observed, not predicted.

That distinction is the whole point. The rehearsal found **three things the upgrade guides do not tell you** and that would each have cost a transfer cycle to discover on the island — they are in the runbook's §"What the rehearsal found."

## What the rehearsal does and does not prove

**Proves:** the command sequence works; the exact version transitions; which migrations run; which tooling reaches for the network and when; that a v17 app builds as v18 without source changes *in the bare case*.

**Does not prove anything about the real estate.** The rehearsal app was a default `ng new` — no custom webpack, no custom schematics, no third-party UI library, no state library, no real components. The estate's difficulty lives in exactly those things ([`legacy_estate_inventory_template_v0.md`](../iso-net-readiness-01-design-packet/legacy_estate_inventory_template_v0.md)). **Read every "no changes were made" in the transcript as "no changes were made *to an app with no code in it*."** On real applications the same migrations will make real edits.

The runbook is therefore **a known-good spine plus honest unknowns**, not a guarantee. It gets upgraded to a confident procedure after the first real application goes through it.

## Status of the surrounding work

- Board: [S-14](https://github.com/gstookey/rr/issues/21) (this runbook) under [EP-03](https://github.com/gstookey/rr/issues/5). The bundle side is [S-07](https://github.com/gstookey/rr/issues/14) under [EP-02](https://github.com/gstookey/rr/issues/4) — **partially delivered here**, since the rehearsal produced the measurement for free.
- Next hop: v18 → v19 ([S-15](https://github.com/gstookey/rr/issues/22)) reaches Milestone 1's floor and should be rehearsed the same way, continuing the same throwaway application.
- Raw upstream guidance: `docs/angular-upgrade-docs/v17-to-v18/`.
