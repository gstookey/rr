---
schema: corpus-doc/v1
status: exploratory
title: DDD-ARCH-01 — Diagramming approach v0 (how we stand up and keep the architecture diagrams)
areas: [system-architecture, planning, process-governance]
related: ["docs/design/packets/ddd-arch-01-design-packet/README.md", "docs/design/packets/ddd-arch-01-design-packet/decision_register_v0.md", "docs/context/canonical/isolated_network_constraints.md"]
updated: 2026-09-04
---

# Diagramming approach v0

**Created:** 2026-09-03 | **Last updated:** 2026-09-03 | **Author:** Axium | **Status:** proposal — fork DA-D8 in the register

## The requirement

Graham needs **visio-esque system-architecture diagrams as we go**: legible to non-engineers, editable by humans on both sides of the fence (this side has the fleet; the islands have neither internet nor agents), versioned with the docs, and cheap to redraw after every ruling round — because a diagram that is expensive to change is a diagram that lies within a month.

## The frame: C4, one model at four zoom levels

The C4 model (Simon Brown) gives four nested views that map almost exactly onto Graham's tiers, which is the main reason to adopt it as the *organising frame* regardless of tool:

| C4 level | View | RR tier it draws | Audience |
|---|---|---|---|
| 1 | **System Context** — the system as one box, its users and neighbouring systems | the Building in its environment: identity, legacy apps, event bus, cross-domain guard, data fabric | leadership, security, the island owners |
| 2 | **Container** — the deployable units | shell, Floor apps, BFFs, gateway, IdP, bus, stores | engineers, DevOps |
| 3 | **Component** — inside one container | one Floor: its Suites, Offices, base-library use, its store and BFF endpoints | the Floor team |
| 4 | **Code** | rarely drawn; generated when needed | the coder |

Plus two supplementary kinds we already know we need: **deployment** (what runs where in the cluster, per island) and **dynamic / sequence** (a sign-in, an event crossing a guard, a delegated-admin action).

## The tools, and the lean (DA-D8 lean **D**: Mermaid first, draw.io for boards)

| Tool | Format | Strengths | Costs | Verdict |
|---|---|---|---|---|
| **Mermaid in Markdown** | text, in the doc | renders natively on GitHub, in this corpus's viewer, and in session artifacts; diffs in PRs; agents write it fluently; has a C4 syntax (`C4Context`, `C4Container`, `C4Component`, `C4Dynamic`, `C4Deployment`) | layout is automatic and sometimes ugly; the C4 syntax is documented as **experimental** `[UNVERIFIED in-session — mermaid.js.org egress-blocked]`; no hand placement | **default** for every diagram in the packet; the TrAIdit precedent (12-diagram set) already proved the habit |
| **draw.io / diagrams.net** | `.drawio.svg` (SVG with the diagram XML embedded) | visio-like hand layout; the SVG renders on GitHub as an image *and* re-opens for editing in draw.io; desktop app and VS Code extension work offline, so the island team can edit the same file `[UNVERIFIED in-session — drawio.com egress-blocked; from prior knowledge]`; draw.io XML is plain text an agent can generate | two sources of truth if the same diagram also exists in Mermaid; manual layout costs time on every change | **for boards Graham will present** — the L1/L2 map, the deployment view — once their shape has stabilised past a ruling round |
| **Structurizr DSL** (C4 as code) | `.dsl` text; Structurizr Lite runs locally from a container/JAR | one model, many views, auto-consistent; exports to Mermaid/PlantUML `[UNVERIFIED in-session]` | another tool to bundle and learn; Java runtime | **hold** — adopt only if the set grows past ~15 diagrams and drift between them becomes real |
| **PlantUML + C4-PlantUML** | text | mature C4 stdlib | Java + Graphviz; no native GitHub render | not adopted |
| **Session artifacts (HTML)** | rendered pages during a session | fastest way to *look at* a diagram together and iterate | not durable; not portable to the island | for review moments only; the durable copy is always in the repo |

## Rendering pipeline (verified on this side, 2026-09-03)

- **GitHub renders Mermaid fences directly** — no pipeline needed for reading.
- **`@mermaid-js/mermaid-cli` (`mmdc`)** exports SVG/PNG for slides or for embedding where Markdown is not rendered. It drives a headless Chromium: on this side it ran against the pre-installed Chromium (see the packet's `diagrams/` for the exported seed); **on the islands a browser binary is not an npm package** — the same B9 finding as Karma — so treat `mmdc` export as an *outside-the-fence* convenience and rely on GitHub/GitLab/VS Code native Mermaid rendering on the island `[which island git host renders Mermaid is an open questionnaire item]`.
- **draw.io files need no pipeline**: the `.drawio.svg` *is* the rendered image.

## Conventions (binding for `diagrams/`)

1. **Numbering:** `NN-<c4-level>-<subject>.md` (Mermaid, in Markdown with a purpose + interpretation section, the TrAIdit pattern), e.g. `01-context-desert-island.md`, `02-container-building-floors.md`. draw.io boards sit beside them as `NN-<subject>.drawio.svg`.
2. **Every diagram carries a date stamp and a status** (`hypothesis` · `ruled DA-Dn` · `implementation truth`) in its heading. A diagram is design direction until `CURRENT_STATE.md` says otherwise (rule 8).
3. **Redraw after each ruling round, not each conversation.** The register is the trigger.
4. **Future/unruled elements are dashed** (Mermaid `classDef future … stroke-dasharray`), the TrAIdit convention, so a reader never mistakes a lean for a decision.
5. **No classified content, ever**: no real hostnames, IPs, program names, or marking strings in a diagram. Diagrams are exactly the artifact most likely to be pasted into a slide.
6. **One meaning per word** — labels use the packet lexicon (Building / Floor / Suite / Office / group / overlay), which the lexicon pass will freeze.

## What exists now (2026-09-04)

- **`architecture-description/`** — the 42010-structured AD with views V1..V8 and rendered SVGs; the organising frame from this doc applied. Lesson recorded there as KI-9: Mermaid's native C4 renderer places boundaries last and collides labels, so V1/V2 are drawn as styled flowcharts carrying C4 semantics; V7 uses UML deployment stereotypes as `classDef`s.

## What was seeded on 2026-09-03 (now superseded by V1 and V8)

- `diagrams/01-context-desert-island.md` — C4 level 1, hypothesis.
- `diagrams/02-tier-model-building-floors.md` — the Building/Floor/Suite/Office structure with the group overlay, hypothesis (the same picture as `tier_model_exploration_v0.md` §4, kept here as the canonical copy once the packet moves).
