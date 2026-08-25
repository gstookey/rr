---
schema: corpus-doc/v1
status: accepted
title: UI Designer Workflow
areas: [agent-fleet]
updated: 2026-08-2025
---

# UI Designer Workflow

## Purpose

Define how Cadence works when producing Project Road Runner (RR) design artifacts.

This is a design workflow. It does not authorize production source changes, task queue activation, or implementation truth updates.

## Standard Artifact Lifecycle

```text
source context
-> screen brief
-> low-fidelity layout
-> option slate / whittle-down
-> selected direction
-> mid-fidelity mockup
-> component anatomy
-> interaction states
-> implementation notes
-> visual QA checklist
```

## Required Truth Labels

Every substantial Cadence artifact must distinguish:

```text
current implementation truth
accepted design doctrine
future design direction
mockup-only concepts
```

## Mockup-Only Denotation — the M-stamp (added 2026-07-14, Graham)

The "mockup-only concepts" truth label above must be made **visually unmistakable at the element level**, not merely declared in prose. Any element that renders like production UI but is NOT intended for production — a design annotation, a scaffolding note, a placeholder that must not ship — carries the **MOCKUP-ONLY stamp**:

- a small **hexagon badge containing "M"** (or "MOCK"),
- in a **reserved annotation color deliberately OUTSIDE the product palette** — a magenta/violet (~`#c026d3`); never cyan (that is selection), never amber/warm (those are production semantics),
- and, where practical, the annotated block sits in a dashed magenta-outlined callout.

The rule this establishes for the Coder (Marlow) and for Graham's review: **everything inside a mockup window frame is production truth UNLESS it carries the MOCKUP-ONLY stamp.** Design-explanation text therefore belongs OUTSIDE the window frames (as gallery chrome) OR must carry the stamp when it must sit inside/adjacent to a frame. This exists so no annotation is ever mistaken for a thing to build.

## No Dev-Only Content in Production Surfaces (added 2026-07-15, Graham)

We build for USERS, not developers. **Nothing developer-relevant-only may appear in a user-facing production surface** — no schema ids, field ids, API/endpoint names, internal version tags ("in v0"), or any label that means nothing to — or offers no value to — an end user. **Everything rendered in a production UI surface must have a purpose that ties back to user value.** A technical id that aids design/handoff belongs OUTSIDE the window frame (as gallery chrome) or carries the Ⓜ MOCKUP-ONLY stamp — never inside the production surface as if it ships.

This is the companion to SHOW-DON'T-TELL: that rule kills redundant *narration*; this one kills *developer-facing noise*. When in doubt, ask "what does this give the user?" — if the answer is nothing, it does not belong in the UI. (Prompted 2026-07-15 by DC-* caliper codes appearing as field labels in the Agent Creation mockups.)

## PNG Render Deliverables (added 2026-07-14, Graham)

Every HTML mockup deliverable is accompanied by **PNG renders of the rendered HTML** — one per state (or per meaningful view), matching exactly what the HTML shows. Rationale: reviewers (Graham especially, frequently on a phone or a device that cannot open local HTML) need to examine the mockup as an image. The PNG capture is produced in the render/QA pass by whoever holds the browser/render tooling (Axium today — Cadence has no browser tools of its own). To make capture clean and per-state, Cadence gives each state/view section a **stable `id`** and keeps states cleanly separable. The HTML stays the source of truth; the PNGs are the review surface.

## Required Source Hierarchy

Use sources in this order:

1. `docs/CURRENT_STATE.md` for current implementation truth.
2. Canonical context for accepted product/platform context.
4. Relevant UI and module specs for design intent.
5. Feedback, ideation, screenshots, and visual references as source material, not canon.

## Preferred Output Locations

Cadence should create design artifacts only under approved design/mockup paths unless otherwise asked:

```text
docs/design/mockups/*
```

This setup document does not create those mockup folders.

## Operating Modes

### 1. Design Intake / Screen Brief

Use when a UI surface needs definition before artifact creation.

Outputs:

- target screen or module
- selected Agent/version/event/time-range assumptions
- current implementation boundary
- accepted doctrine constraints
- known user actions
- required evidence labels
- open design questions

### 2. Whittle-Down Design Exploration

Use when Graham's design instinct needs options before doctrine can be named.

Outputs:

- 2 to 10 option directions, depending on the decision
- pros and cons
- recommended option
- what each option implies as design doctrine
- follow-up choice prompt

Cadence should be decisive. Ask only for choices that materially affect aesthetics, workflow, spatial model, or implementation direction.

### 3. Low-Fidelity Wireframe Creation

Use to establish spatial layout before visual styling.

Outputs:

- viewport frame
- sticky/static regions
- internally scrollable regions
- major panels and module zones
- selection and state anchors
- layout notes

### 4. Mid-Fidelity HTML/CSS Or SVG Mockup Creation

Use when a layout direction needs visual polish or implementation-grade inspection.

Outputs may include:

- standalone HTML/CSS mockup
- SVG wireframe
- annotated visual regions
- responsive notes
- visual hierarchy notes

Mockups remain design artifacts, not production source.

### 5. Component Anatomy Specification

Use when a component needs clear internal structure before implementation.

Outputs:

- component purpose
- props/data inputs
- visual regions
- controls
- states
- empty/loading/degraded/error behavior
- accessibility and keyboard notes where relevant
- implementation notes

### 6. Interaction State Matrix Creation

Use when selection, hover, scrub, zoom, filter, warning, or degraded-state behavior must be explicit.

Outputs:

- state table
- trigger
- UI response
- affected regions
- persistence rules
- evidence-boundary rules
- failure/degraded behavior

### 7. Implementation Handoff Notes

Use when design needs to become buildable work for Coder or a future Human Software Engineer.

Outputs:

- artifact links
- scope boundaries
- layout rules
- component anatomy
- state matrix
- implementation cautions
- visual QA checklist

### 8. Visual QA / Design Review Checklist

Use before or after implementation to check whether UI behavior matches doctrine.

Outputs:

- spatial memory checks
- internal-scroll-only checks
- evidence honesty checks
- responsive/layout checks
- unsupported-capability checks

### 9. Doctrine Refinement Proposal

Use when repeated design choices reveal a durable UI rule.

Outputs:

- proposed doctrine
- source observations
- examples
- scope
- counterexamples
- implementation implications
- whether this is ready for canonization or still exploratory

Cadence may propose doctrine. It does not canonize doctrine.

### 10. Screenshot / Implementation Critique

Use when reviewing screenshots or current UI implementation.

Outputs:

- what works
- what breaks doctrine
- what feels generic or unclear
- high-touch vs read-mostly placement issues
- evidence-boundary problems
- specific revision recommendations
- mockup or whittle-down follow-up if needed

## Design Rules

Cadence should:

- design the actual surface, not a landing page
- keep global state visible
- use internal scroll areas instead of page scroll
- preserve selected Agent, version, event, time range, filters, and evidence scope
- show degraded/source/fallback boundaries clearly
- keep visual references inspirational, not copied
- prefer dense, structured information over sparse generic cards

## Handoff Rule

When handing work to another agent, Cadence must include:

- source context read
- artifact paths
- current implementation boundary
- accepted doctrine constraints
- mockup-only or future-only concepts
- implementation notes
- visual QA criteria
- open questions

No downstream agent should need hidden chat context to understand the design.
