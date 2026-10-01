---
schema: corpus-doc/v1
status: active
title: STATUS-GRID-02 — Status Grid v3 on the panes (packet charter)
areas: [frontend, ux, code]
related: ["docs/design/packets/status-grid-02-design-packet/guide_foundation_v1.md", "docs/design/packets/status-grid-02-design-packet/guide_unit_list_v1.md", "docs/design/packets/status-grid-02-design-packet/guide_status_grid_v1.md", "docs/design/packets/status-grid-02-design-packet/guide_details_deck_v1.md", "docs/design/packets/status-grid-02-design-packet/mockups_r3_design_note.md", "docs/design/packets/ui-panes-01-design-packet/README.md"]
updated: 2026-10-01
---

# STATUS-GRID-02: Status Grid v3, on the panes

**Created:** 2026-10-01 | **Author:** Axium | **Status:** `active`. Built and verified on branch
`feat/status-grid-v3`; waiting for Graham's merge. No board story was activated.

## What this packet is

This is the full Status Grid feature for Graham's work app: one utility window holding three
collapsible panes from `@rr/ui` (UI-PANES-01), each with one component.

- **Units:** a filterable list.
- **Status grid:** one unit's components × time.
- **Details:** the elements and attributes behind one sample.

The data is **synchronous** in this arc, served by deterministic fixtures. WebSockets are the next
arc, and the seam for them is built in (foundation guide §6).

**v1** was the single-feature build of 2026-09 (a guide delivered outside this repo). **v2** was the
panes primitive that came out of it (UI-PANES-01, PRs #53–#57). **v3** is the feature rebuilt on
v2, simplified, and with the list and deck designed and built for the first time.

| Doc | What |
|---|---|
| [`guide_foundation_v1.md`](guide_foundation_v1.md) | Domain, data source, clock, store, the window surface, tokens, running the specs |
| [`guide_unit_list_v1.md`](guide_unit_list_v1.md) | `<rr-sg-unit-list>`, the Units pane |
| [`guide_status_grid_v1.md`](guide_status_grid_v1.md) | `<rr-sg-status-grid>`, the Status grid pane |
| [`guide_details_deck_v1.md`](guide_details_deck_v1.md) | `<rr-sg-details-deck>` and `<rr-sg-sample-context>`, the Details pane |
| [`mockups_r3.html`](mockups_r3.html) · [`mockups_r3_design_note.md`](mockups_r3_design_note.md) | Cadence's R3 mockups (F1–F6) and their spec |
| `packages/status-grid/` | **The source of truth** |

## Graham's asks (2026-10-01)

1. Leave the pane primitive alone. *(Done: nothing in `packages/ui` changed.)*
2. Update the design to the new panes, and simplify the grid as far as modern Angular and
   enterprise conventions allow.
3. Design the other two components, the list and the deck.
4. Build all three for real on the panes, with sync data, fully tested, plus an implementation
   guide per component.

## Rulings carried from v1 (unchanged)

- **Six statuses:** VALID, PARTIAL, INVALID, ERROR and PENDING in Astro's colours, and NO_DATA as a
  hyphen. Astro `off` is never used.
- **Data beats the clock.**
- **Cell precedence:** a sample, then a failed component when elapsed (ERROR), then a future cell
  (NO_DATA), then PENDING.
- **Counts** cover elapsed cells only, never NO_DATA.
- **Time axis:** hour groups are consecutive runs; there is one uniform column per timestamp; time
  is Zulu.
- **Now-marker:** on the first future column's edge, and only inside the axis.
- **ERROR banner:** a flow row.
- **DayRibbon:** kept.
- **Tooltip:** 300 ms.
- **Re-click:** no toggle.

## v3 decisions to confirm (Axium)

| # | Decision | Why |
|---|---|---|
| 1 | **Own package `@rr/status-grid`**, four Sheriff modules (domain · data-access · ui · feature), `scope:status-grid` | It is a real feature, not an ACME Floor (ADR-007). The layering is enforced, not conventional |
| 2 | **The scroller is the CSS grid**: `minmax(18px, 32px)` bands, slack below an end rule | Removes the band ResizeObserver and all band arithmetic; the splitter reflows the grid with no JS |
| 3 | **Overlays are absolutely-positioned grid items**; lattice lines are 1px gaps over a background colour | The browser places the ring and markers at any band height |
| 4 | **Cells are plain `<div>`s drawn by CSS** from `data-status`; no component per cell | Up to 2,880 cells; no shadow roots for the pop-out to walk |
| 5 | **A light-DOM `<rr-sg-status-dot>` everywhere instead of `rux-status`** | `rux-status` is a shadow root, throws on NO_DATA, and NO_DATA needs a different shape |
| 6 | **A native ARIA tablist instead of `rux-tabs`** in the deck | Same reasons as 5; and the APG pattern is small |
| 7 | **`aria-activedescendant` on one focusable grid / listbox** instead of a roving tabindex | Nothing re-renders as the keyboard moves across 2,880 cells |
| 8 | **The tooltip is inside the component**, not a CDK overlay | Overlays attach to `document.body`, which the pop-out does not carry |
| 9 | **The store holds only underived state**; `activeElement` is a computed fallback | The 17.2 stand-in for `linkedSignal`: the operator's tab is kept by id, else the first |
| 10 | **The surface takes zero inputs** (a v1 rule, kept) | A window binds inputs once; a passed unit goes stale |
| 11 | **No Retry** on the ERROR banner or deck this arc | The synchronous source has nothing to refetch; Retry arrives with the WebSocket arc |

## Cadence's R3 forks, and what was built

| Fork | Built | Status |
|---|---|---|
| 1. Deck context in the **pane header** (`rrPaneHeader`), not a body strip | **Adopted.** `<rr-sg-sample-context rrPaneHeader>` | The strip would clip the second card row by 6 px at the default split; in the header it also survives collapse |
| 2. DayRibbon colours by worst **verdict**, with an amber underline for any ERROR (2-B) | **Not adopted.** The ribbon keeps worst-of-all | **Open: Graham to rule.** With one failed component every elapsed hour reads amber or worse |
| 3. **One accent**, the panes' `#67b9d4` | **Adopted** for selection and focus | Set `--rr-pane-focus` + `--rr-sg-accent` + `--rr-sg-focus` together to change it |
| 4. Roll-up precedence INVALID > ERROR > PARTIAL > VALID > PENDING | **Not adopted.** v1's INVALID > PARTIAL > ERROR > PENDING > VALID stands | **Open: Graham to rule.** Cadence's point: a running unit's PENDING tail turns every live unit's dot blue under v1's order |
| 5. INVALID/PARTIAL lexicon overlap | The UI renders the API's status and never derives it | **Open:** one sentence of definition is owed |
| 6. Cards fixed at 4 columns (container-query steps), attribute order | **Adopted** | |
| 7. NO_DATA hyphen `#62798e` (3.11:1) | **Adopted** | The old colour failed WCAG 1.4.11 |

## Verification

Everything below was run on the branch tip.

| Check | Result |
|---|---|
| Vitest, Angular 22.1 zoneless (`ng test status-grid`) | **165/165**, in 16 spec files |
| Jest 29, Angular 17.3.12, `@ngrx/signals` 17.2, zone.js (a scratch project matching the work app; the package copied byte-identical) | **165/165**, and **100% statements, branches, functions and lines** on every file (threshold enforced) |
| The same, with `fakeTimers: { enableGlobally: true }` | 165/165 |
| The same, with `resetMocks` + `restoreMocks` + `clearMocks` | 165/165 |
| Angular 17.3 AOT build with `strictTemplates` (the whole package, mounted in an app) | Clean. It caught one real 17-only error that Jest's JIT cannot: `track $index` beside a `let c = $index` alias (fixed: `track c`) |
| Browser: one Playwright flow (list keys, Enter, filter, empty filter, cell click, grid keys, deck tab arrows, future cell, collapse Units) against **both** builds | **Identical** observations on 22 and 17.3; zero console errors or warnings |
| Ribbon bracket after collapsing Units (grid 1127 → 1582 px wide) | 44% → 65% on **both**. Before the review fix it stayed at 44% on 17.3: an observer callback ran outside the zone |
| Measured at the 1618 × 773 window | Units 483 px; grid and details 1127 × 383; bands 32 px (29 px with the ERROR banner); cards 269 × 135; collapsing Units gives 26 / 1584 px. All match R3 |
| `bash scripts/local-ci.sh` | **EXIT=0** (lint + Sheriff, typecheck, every test suite, library builds, corpus check) |
| Verin review | Approve with should-fix, nothing blocking. Fixed: zone-safe measuring (confirmed on 17.3), `TimeSource` outside the zone, unit reset by id, samples matched by instant, detail fetched only for a verdict, `unitItems` emitting only on a phase change, modifier chords left to the browser, the observer following a re-created scroller, dead code removed, and guide drift. Recorded as streaming-arc work: foundation guide §6 |

## Design-note items not built in this arc

R3 specified these, and this arc leaves them out. Each is small and none blocks the feature:

- the hour tier as `columnheader[aria-colspan]` (the time tiers are `aria-hidden`; each cell's
  accessible name carries its time);
- the crosshair tint on the selected cell's hour, minute and row label, and forcing on a masked
  minute label for the selected column;
- the ribbon segment's own tooltip (`14:00–15:00Z · worst INVALID · click to scroll`): it has an
  accessible name, not a hover tooltip;
- "no data, not due yet" wording in a NO_DATA cell's name (it reads "No data yet");
- Retry, on the banner and in the deck (with the WebSocket arc).

## Conventions worth knowing

- **Repeat choices.** The list does not emit the unit that is already selected; the grid and the
  deck re-emit, and the store's methods are no-ops for a repeat. Either way nothing happens twice.
- **Names.** Selectors are prefixed (`rr-sg-*`); TypeScript names (`StatusGrid`, `Unit`,
  `TimeSource`, …) are not. If they collide in your app, import them under an alias
  (`import { Unit as SgUnit } from …`) rather than renaming the source.

## Open

- Forks 2, 4 and 5 above need Graham's ruling. Each is a few lines of change either way.
- WebSocket arc: the data source becomes push-based (foundation guide §6), and Retry arrives with it.
- Cadence verified the Astro token names (`--color-status-*`, etc.) from memory. Check them against
  `@astrouxds/angular` 7.20 before mapping the `--rr-sg-*` tokens onto them.
