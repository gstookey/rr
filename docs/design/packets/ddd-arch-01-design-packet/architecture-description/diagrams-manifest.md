---
schema: corpus-doc/v1
status: exploratory
title: AD diagrams manifest — the eight views, their notations, statuses and redraw triggers
areas: [system-architecture, planning, process-governance]
related: ["docs/design/packets/ddd-arch-01-design-packet/architecture-description/README.md", "docs/design/packets/ddd-arch-01-design-packet/architecture-description/V1-system-context.md", "docs/design/packets/ddd-arch-01-design-packet/architecture-description/V2-container.md", "docs/design/packets/ddd-arch-01-design-packet/architecture-description/V3-context-map.md", "docs/design/packets/ddd-arch-01-design-packet/architecture-description/V4-runtime-dynamic.md", "docs/design/packets/ddd-arch-01-design-packet/architecture-description/V5-information-security.md", "docs/design/packets/ddd-arch-01-design-packet/architecture-description/V6-development-module.md", "docs/design/packets/ddd-arch-01-design-packet/architecture-description/V7-deployment-evolution.md", "docs/design/packets/ddd-arch-01-design-packet/architecture-description/V8-tier-information-architecture.md", "docs/design/packets/ddd-arch-01-design-packet/diagramming_approach_v0.md", "docs/design/packets/ddd-arch-01-design-packet/diagrams/01-context-desert-island.md", "docs/design/packets/ddd-arch-01-design-packet/diagrams/02-tier-model-building-floors.md"]
updated: 2026-09-03
---

# Diagrams manifest

**Created:** 2026-09-03 | **Last updated:** 2026-09-03 | **Author:** Trestle (Architect) under Axium | **Status:** `exploratory`

One row per diagram. The **redraw trigger** column is the operative part: it says which ruling forces which picture to change, so a ruling round produces a bounded redraw instead of a full pass (`diagramming_approach_v0.md` convention 3 — redraw after each ruling round, not each conversation).

## The AD's views

| View | File | Rendered | Mermaid type | Notation family | Status | Redraw trigger (forks/questions that would force it) |
|---|---|---|---|---|---|---|
| **V1** System Context | [`V1-system-context.md`](V1-system-context.md) | `V1-system-context.svg` | `flowchart LR` (styled, KI-9) | C4 model L1 | `hypothesis` (leans DA-D5 A, AW-D3 A, AW-D2 A) | DA-D5 · AW-D3 · Q7 · Q8 · Q11 |
| **V2** Container | [`V2-container.md`](V2-container.md) | `V2-container.svg` | `flowchart LR` (styled, KI-9) | C4 model L2 (+ L3 inside the SPA) | `hypothesis` (leans DA-D2 A, DA-D9 A, DA-D17 A, AW-D3 A, AW-D6 A, AW-D7 A) | **DA-D2** · AW-D3 · DA-D16 · slice S0 landing |
| **V3** Domain / Context Map | [`V3-context-map.md`](V3-context-map.md) | `V3-context-map.svg` | `flowchart TB` | Evans context-map stereotypes | `hypothesis` | **Q1** (the EventStorming) · a Boundary Test run returning "2+ checks different" · Vigilance gaining its first command |
| **V4a** Runtime — one screen | [`V4-runtime-dynamic.md`](V4-runtime-dynamic.md) | `V4a-runtime-screen.svg` | `sequenceDiagram` | UML 2.5 sequence | `hypothesis` (leans AW-D6 A, DA-D17 A) | AW-D6 · DA-D16 (a PDP lifeline) · slice S2 landing |
| **V4b** Runtime — one event | [`V4-runtime-dynamic.md`](V4-runtime-dynamic.md) | `V4b-runtime-event.svg` | `sequenceDiagram` | UML 2.5 sequence | `hypothesis` (leans AW-D3 A, AW-D4 A) | **AW-D3** (a broker changes replay semantics) · AW-D4 · KI-5 ruling · slice S3 landing |
| **V5** Information & Security | [`V5-information-security.md`](V5-information-security.md) | `V5-information-security.svg` | `flowchart TB` | PEP/PDP enforcement chain | `hypothesis` (leans DA-D6 D, DA-D16 C, AW-D9 A) | **Q3** · **Q6** · DA-D16 (PEP 4 turns solid) · Q11 (PEP 5 turns solid) · OC-2/KI-5 |
| **V6** Development / Module | [`V6-development-module.md`](V6-development-module.md) | `V6-development-module.svg` | `flowchart LR` | Module dependency (allowed edges only) | `hypothesis` (leans DA-D4 A, DA-D2 A, DA-D12/13 A, DA-D14 A, AW-D1 A, AW-D7 A) | DA-D2 (a Floor moves to `apps/`) · DA-D11 · DA-D12/13 · **slice S0 landing → implementation truth** |
| **V7** Deployment & Evolution | [`V7-deployment-evolution.md`](V7-deployment-evolution.md) | `V7-deployment-evolution.svg` | `flowchart LR` | UML 2.5 deployment stereotypes | `hypothesis` (leans DA-D2 A, AW-D8 A, AW-D11 A, AW-D12 A; conditional on Q8) | **Q8** · DA-D2 · AW-D3 · ADR-005 granularity · slice S0 landing |
| **V8** Tier / Information Architecture | [`V8-tier-information-architecture.md`](V8-tier-information-architecture.md) | `V8-tier-information-architecture.svg` | `flowchart LR` | IA hierarchy + runtime overlay | `hypothesis` (leans DA-D1 A, DA-D2 A, DA-D3 A, DA-D10 A) | **Q1** · **Q2** (a group switcher / URL prefix) · a fifth Floor · slices S1–S7 landing |

**Nothing in this set is `ruled` or `implementation truth`.** Every diagram is design direction until `CURRENT_STATE.md` says otherwise (operating-contract rule 8). Slice **S0 (story S-18)** is activated and on a branch awaiting review; it is not on `main`, so V6 and V7 — the views it will be the first to touch — stay `hypothesis` (AD §8, KI-10).

## Superseded predecessors

| Old diagram | Superseded by | What changed |
|---|---|---|
| [`diagrams/01-context-desert-island.md`](../diagrams/01-context-desert-island.md) | **V1** | Generic "Building / Floors" placeholders replaced by ACME Workshop and its four named Floors; the conditional neighbours (bus, fabric, guard, second domain) given explicit fork and question ids; the telemetry feed and the directory added; the Legacy relationship named as «Separate Ways». |
| [`diagrams/02-tier-model-building-floors.md`](../diagrams/02-tier-model-building-floors.md) | **V8** | Lettered Floors (`floor-a`, `floor-b`) replaced by Front Desk / Invent / Command / Vigilance with real routes; all nine Suites and twelve Offices drawn; the overlay's four sources (claims · manifest · labels · tokens) separated and shown as applied at runtime; the variation ladder added. |

Both files remain in place with `status: superseded` and a `superseded_by` pointer, per the corpus-graph schema — they are the record of what was drawn before the reference application existed.

## Rendering

Every fence in this AD was extracted and rendered with `@mermaid-js/mermaid-cli@11` driving a local Chromium, and the SVG committed beside its view file. On the islands there is no browser binary to drive `mmdc` (the same B9 finding as Karma), so **the durable copy is always the Mermaid source in Markdown** and the SVGs are an outside-the-fence convenience for slides and for viewers that do not render Mermaid.

## Diagram numbering

The seeded set used `NN-<subject>.md` in `diagrams/`. This AD uses `Vn-<subject>.md` in `architecture-description/`, because a **view** is a 42010 artefact with a viewpoint behind it while a numbered diagram is just a picture. The two numbering schemes coexist: `diagrams/` holds the superseded seeds and is where any future stand-alone board (draw.io, DA-D8 option B) will live; `architecture-description/` holds the AD.
