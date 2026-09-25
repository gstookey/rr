---
schema: corpus-doc/v1
status: active
title: UI-PANES-01 — Collapsible, resizable panes for @rr/ui (packet charter)
areas: [frontend, ux, code]
related: ["docs/design/packets/ui-panes-01-design-packet/ui_panes_implementation_guide_v1.md"]
updated: 2026-09-25
---

# UI-PANES-01 — Collapsible, resizable panes for `@rr/ui`

**Created:** 2026-09-25 | **Author:** Axium | **Status:** `active` — built and verified on branch
`feat/ui-panes-v2`; pending Graham's merge. No board story activated.

## What this packet is

A reusable pane primitive for `@rr/ui`: collapsible panes, arranged side by side or stacked in any
nesting, optionally drag-resizable, persistable, and configurable from runtime configuration.

It is **v2** of a primitive first built inside a single feature — a Status Grid in a 1620×810 utility
window, for Graham's work application (Angular 17.3). v1 worked but was feature-coupled: every
consumer had to write track arithmetic, and one window height was copied into many places. v2 is the
library version.

| Doc | What |
|---|---|
| [`ui_panes_implementation_guide_v1.md`](ui_panes_implementation_guide_v1.md) | The implementation guide — bottom-up, ending with the utility window |
| `packages/ui/src/lib/panes/README.md` | API reference |
| `packages/ui/src/lib/panes/` | **The source of truth** |

## Graham's rulings (2026-09-25)

| # | Question | Ruling |
|---|---|---|
| **A** | `model()` two-way collapse, or v1's input + output? | **`model()`.** Force-collapse is kept as a separate overlay input that never writes intent — the precedence rule that makes `model()` safe |
| **B** | Who owns collapse state? | **Each pane owns its own**, with group-level escape hatches (`collapseAll()`, `expand(id)`, …) |
| **C** | What does a centred chevron mean with a title? | **No centre option at all.** `'start' \| 'end'` only — a collapse affordance belongs at an edge |
| **D** | Anticipate drag-to-resize? | **Build it now**, behind a flag (`[resizable]`). Modelled on TrAIdit's workstation resize |
| **E** | Scope of the deliverable | **Buildable source + tests** in a library, plus the guide — also a template for standing up the common library |

Graham's standing requirements for v2: chevron position as an input; block-collapsed keeps its title
in the bar with the body shrinking to nothing; an arranger that is simple to use; and sizes that are
dynamic rather than static values copied into many places.

## Decisions made while building (Axium)

- **Lives in `@rr/ui`**, as its own Sheriff `type:ui` module (it has a barrel), so the rest of the
  package reaches it only through its public API. Required one line in `sheriff.config.ts`.
- **Written to the Angular 17.3 ∩ 22 API intersection.** `rr` is on 22; the first consumer is on 17.3,
  and a v22-built package cannot be consumed by 17.3. Same files serve both: copied today, imported
  after the upgrade. Verified by building and browser-testing both.
- **CSS Grid does the layout arithmetic.** Each item is one track; the library measures nothing until
  a handle is grabbed. No `ResizeObserver`, so container and PiP resizes run no JavaScript.
- **Fixed (`px`) and flex (`%`/`fr`) items**, chosen by the unit written. An early draft made every item
  proportional; corrected before anything depended on it (own commit), because it broke the fixed-
  sidebar layout.
- **The splitter moves instantly; only collapse animates.** Found by browser verification.
- **The shell app was not touched.** `apps/shell` is frozen at S0 by its own comments; the demo and
  its browser verification ran in a throwaway consumer app outside the repo.

## Verification

61 unit tests (Vitest/jsdom); ng-packagr, typecheck, ESLint and Sheriff green; and one Playwright
suite run against **both** the packaged library on Angular 22 (zoneless) and the byte-identical source
on Angular 17.3.12 (zone.js) — every check passing on both. Verin's review found no blockers and
three real gaps (an uncancelled frame on destroy, an orphaned write on a `stateKey` change, sizes
keyed by position rather than pane), all fixed with tests shown failing first. Detail: guide §10.

## Open

- Drag-to-collapse snap, and a `max` that holds for flex panes as a container grows — see guide §13.
- Whether `rr` wants a runnable demo app for the panes. The shell is S0-frozen, so one was not added.
