---
schema: corpus-doc/v1
status: exploratory
title: First App Hop Packet 01 — the field kit for the first real application upgrade
areas: [frontend, isolated-network, dev-environment, planning]
related: ["docs/design/packets/legacy-shell-bundle-01-design-packet/monorepo_hop_procedure_v2.md", "docs/design/packets/iso-net-readiness-01-design-packet/legacy_estate_inventory_template_v0.md", "docs/design/packets/iso-net-readiness-01-design-packet/decision_register_v0.md", "docs/context/canonical/two_island_model.md"]
updated: 2026-09-03
---

# First App Hop Packet 01 (`first-app-hop-01`)

**Created:** 2026-09-03 | **Author:** Axium | **Status:** `exploratory` — the instrument for an experiment that has not been run yet. It becomes `accepted` only after the first real application has been through it and the field notes have come back.

## What this packet is

Everything the rehearsals produced was written for **this side of the water**: a machine with internet, a scratch repo, an agent to ask, and no consequences. This packet is the same knowledge rewritten for the other side — **one person, on a RHEL 9 workstation, on an isolated network, with a real application that other people depend on, no internet, no agent, and a change-control process.**

It covers the first application only. The first one is an experiment; the tenth is a routine.

| Document | What it is | When you use it |
|---|---|---|
| [`preflight_checklist_v0.md`](preflight_checklist_v0.md) | choosing the app, proving the registry is ready, capturing the baseline, and the escape hatch | **before** touching anything — the day before, ideally |
| [`field_hop_procedure_v1.md`](field_hop_procedure_v1.md) | the hop itself, step by step, with expected observations and explicit STOP conditions | during the hop, one pass per rung |
| [`field_notes_template_v0.md`](field_notes_template_v0.md) | what to write down as you go | during and immediately after |

## Why this exists as its own packet

`legacy-shell-bundle-01/monorepo_hop_procedure_v2.md` is the *authoritative* procedure and stays that way — this packet does not replace it, it **operationalizes** it. The two differ in three ways that matter on the island:

1. **The rehearsal procedure assumes tooling that will not be there.** It calls `legacy-shells/tools/make-root-angular-json.mjs`; there is no `legacy-shells/` on Legacy Island. The field procedure inlines what is needed.
2. **The rehearsal procedure reports what happened; the field procedure says what to do when something else happens.** On this side an unexpected result was a finding. On the island it is a person stuck with no one to ask, so every step here carries its expected observation and a named branch when reality differs.
3. **The rehearsal produced no evidence about real code.** The field notes template exists to capture exactly the evidence the shells could not produce.

## The honest limit of what we know

State this plainly to anyone who asks how confident we are:

**Proven** — the dependency graph resolves at every rung on the estate's real dependency surface; the toolchain survives each hop; the temp-root-`angular.json` bracket works; the bundle installs with no internet; the version pairings in the procedure's table are measured, not guessed.

**Not proven** — anything about real application source. The shells have almost no code, so the Angular migrations reported "no changes" where on a real app they will rewrite components, templates, modules and NgRx usage. The `@other-team/*` packages were never exercised. Real `angular.json` build budgets were never seen. **The supply-chain half of this upgrade is de-risked; the source-migration half is not.**

That asymmetry is the entire reason to run one application carefully and instrument it, rather than starting a rolling upgrade across the estate.

## What comes back, and where it goes

The field notes are not paperwork. Each section feeds something specific:

| Field-notes section | Feeds |
|---|---|
| Timings per rung | the LOE-6 estimate and its spread |
| What the migrations actually edited | **DR-04** — the v19-floor vs v22-stretch decision |
| Deviations from the procedure | `monorepo_hop_procedure_v2.md` v3 |
| Packages that needed hand-bumping beyond the table | the next bundle's contents |
| Anything Nexus did not serve | the `--delta-from` payload and [`nexus_upload_instructions_v1.md`](../legacy-shell-bundle-01-design-packet/nexus_upload_instructions_v1.md) |
| The band assignment | the [estate inventory](../iso-net-readiness-01-design-packet/legacy_estate_inventory_template_v0.md) bands — replacing Axium's first-order guesses with one measured row |

## Scope

**In:** one Legacy Island application, rungs 17→18 and 18→19 (Milestone 1's floor). **Out:** the v20/v21/v22 stretch rungs (rehearsed but conditional on DR-04, which this run is meant to inform), the rest of the estate, the `@other-team/*` upgrade (its owning team's work — Graham coordinates separately), and the AstroUXDS 7→9 move.

## Open items this packet cannot close

- **Real `angular.json` build budgets** are still unseen from this side. At v19 the shells produced a component-style budget **warning**; if a real app configures that budget as `maximumError` the same condition **fails the build**. The pre-flight captures the budget values before the hop for exactly this reason. `[NEEDS GRAHAM / island check]`
- **The temp-root-`angular.json` generator does not rewrite paths inside `architect.*.configurations.*`** — only `options`. An app with `fileReplacements` (the usual `environment.prod.ts` swap) or configuration-level asset paths will need those prefixed by hand. Unexercised on the shells, which had no such configuration. Called out as STOP condition F-3.
- **What the `@ngrx/*@22.0.0` migrations would have edited** is `[UNVERIFIED]` — their schematics crash the v22 CLI. Only relevant if the stretch rungs are attempted.
