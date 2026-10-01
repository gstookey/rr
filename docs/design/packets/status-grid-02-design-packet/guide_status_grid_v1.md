---
schema: corpus-doc/v1
status: active
title: Status Grid v3 — Status Grid component implementation guide (v1)
areas: [frontend, ux, code]
governs: ["packages/status-grid/src/lib/ui/status-grid/**", "packages/status-grid/src/lib/ui/status-dot.*"]
related: ["docs/design/packets/status-grid-02-design-packet/guide_foundation_v1.md", "docs/design/packets/status-grid-02-design-packet/mockups_r3_design_note.md"]
updated: 2026-10-01
---

# `<rr-sg-status-grid>`: implementation guide

**Created:** 2026-10-01 | **Author:** Axium | **Status:** `active`
**Source of truth:** `packages/status-grid/src/lib/ui/status-grid/` (`status-grid.{ts,html,scss,spec.ts}`) and
`ui/status-dot.*`. Read the [foundation guide](guide_foundation_v1.md) first: it covers the domain
and the store this component draws from.

---

## 1. What it is

One unit's components (rows) × sample times (columns), with one dot per sample. It also shows:

- a header with the unit, its window, the time now and the elapsed counts (which double as the
  legend);
- a **day ribbon** with each hour's worst status, plus a bracket showing where the grid is scrolled;
- the ERROR banner;
- the now-marker, hour rules, the selection ring, the keyboard focus ring, hover and a tooltip.

It lives in the **Status grid** pane of the surface:

```html
<rr-sg-status-grid
  [unit]="store.selectedUnit()" [axis]="store.axis()" [rows]="store.rows()"
  [elapsedCount]="store.elapsedCount()" [counts]="store.counts()" [hourWorst]="store.hourWorst()"
  [selected]="store.selectedPosition()" [nowMs]="time.now()"
  (cellSelect)="store.selectCell($event)" />
```

| Input | Type | Default |
|---|---|---|
| `unit` | `Unit \| null` | `null` |
| `axis` | `TimeAxis` | `EMPTY_AXIS` |
| `rows` | `readonly GridRow[]` | `[]` |
| `elapsedCount` | `number`: the index of the first future column | `0` |
| `counts` | `StatusCounts` | all zero |
| `hourWorst` | `readonly ValidationStatus[]`, one per hour group | `[]` |
| `selected` | `GridPosition \| null` | `null` |
| `nowMs` | `number` | `0` |
| **Output** `cellSelect` | `CellCoordinate` | emitted on click, Enter or Space |

It decides nothing about status. Every cell arrives decided, from `buildGridRows`.

---

## 2. The design move: the scroller *is* the CSS grid

v1 measured the pane, computed a band height, and positioned overlays in pixels. v3 hands all of
that to the browser:

```scss
.grid {                     // one element: the scroller AND the grid container
  display: grid;
  overflow: auto;
  gap: var(--rr-sg-gap);    // 1px, and the gaps ARE the lattice lines…
  background: var(--rr-sg-lattice);   // …because this colour shows through them
  align-content: start;     // spare height collects at the bottom, never centred
}
```

```ts
columnsTemplate = `${SG_GUTTER_PX}px repeat(${columns}, ${SG_CELL_PX}px)`;
rowsTemplate    = `20px 18px repeat(${rows}, minmax(18px, 32px)) auto`;   // hour · minute · bands · end rule
```

- **Its height is definite** (it fills the pane), so the `minmax(18px, 32px)` bands share whatever
  height the pane has. They stay between 18 and 32 px, any slack sits below an "end of components
  · n of n" rule, and anything beyond scrolls. **There is no ResizeObserver for band height** and no
  band arithmetic. When you drag the splitter, the bands reflow with no JavaScript.
- **Sticky regions are plain CSS.** The hour and minute tiers are `position: sticky; top`, the
  component labels are `position: sticky; left`, and the corner sits above both.
- **Every cell is a plain `<div>`** with a `data-status`. Its disc or hyphen is drawn by
  `.cell::before` from that attribute. There is no component per cell, which matters across up to
  2,880 of them, and no shadow root for the pop-out to walk.
- **The geometry numbers live once**, as `SG_CELL_PX` / `SG_GAP_PX` / `SG_GUTTER_PX` in the `.ts`.
  The host hands them to CSS as `--rr-sg-cell` / `-gap` / `-gutter`. The ribbon's scroll arithmetic
  reads the same constants.

### 2.1 Overlays are absolutely-positioned grid items

The selection ring, focus ring, hover tint, now-marker and hour rules are each **one element**,
placed by `grid-row` / `grid-column`. An absolutely-positioned grid item uses its grid area as its
containing block, so the browser puts it over the right cell at any band height, and it takes no
part in auto-placement.

> **Pitfall, which cost a debugging round.** For an absolutely-positioned grid item, an omitted end
> line means *the container's padding edge*, not "one track". `grid-row: 5` alone stretches the
> ring to the bottom of the grid. Always give the span:
> `areaOf(p) = \`${p.row + 3} / ${p.column + 2} / span 1 / span 1\``.
> The `+3` skips the two header rows (grid lines are 1-based), and the `+2` skips the gutter.

---

## 3. Header, ribbon, banner, now

- **Window label:** `10-01 00:00Z → running` or `10-01 00:00Z → 10-01 23:55Z`.
- **Counts:** these are the legend, one dot, label and number per counted status, over **elapsed
  cells only**.
- **Day ribbon:** one `<button>` per hour group, `flex-grow` set to the group's column span, and
  coloured by `hourWorst[i]`. If `hourWorst` is shorter than the groups, the extra hours fall back
  to NO_DATA. A click scrolls that hour's first column to the left edge
  (`scrollTo({ left: column × 19 })`). The smoothness comes from `scroll-behavior: smooth` on the
  grid, which a `prefers-reduced-motion: reduce` media query turns off.
- **Bracket:** shows which share of the day is in view, from the scroller's `scrollLeft` and
  `clientWidth`. It is measured on scroll and by a `ResizeObserver` on the scroller, which reports
  once when it starts observing and again on every resize (a splitter drag, a collapse, the window).
  Two details matter:
  - **The observer follows the scroller.** The scroller is re-created whenever the grid comes back
    from its empty state, so an `effect` re-points the observer at whatever `viewChild('scroller')`
    currently holds. The effect writes no signal, so it is legal and behaves the same on 17.3 and 22.
  - **The measurement runs inside `NgZone`.** An observer's callback runs outside Angular's zone.
    On a zone.js app (17.3), a signal written there is not rendered until some unrelated event, so
    the bracket would stay put after a collapse. **This was observed on the 17.3 build and fixed**
    with `zone.run(() => this.measure(...))`. Zoneless (22), `run` just calls through.
- **Banner:** shown while `counts.ERROR > 0`. It is a **flow row** that pushes the grid down, never
  an overlay, which would paint over the sticky time tiers.
- **Now-marker:** a 2 px line at the left edge of the first future column (`grid-column:
  elapsedCount + 2`). It is drawn only when `0 < elapsedCount < columns`, never when the whole
  window is past or the whole of it is in the future.
- **Hour rules:** one per hour group, brighter (`--anchor`) every six hours.
- **Empty states:** "Select a unit to see its status grid." (no unit) and "This unit has no
  components to show." (a unit with no rows).

---

## 4. Pointer: one listener, all local

`(click)` and `(pointerover)` are bound **once, on the grid**. `cellOf(event)` finds the cell with
`closest('[data-c]')`, and the cell's `data-r` / `data-c` give its position.

- **Click** selects (emits `cellSelect`) and moves the keyboard position there. A click that misses
  the cells (a label or a header) does nothing. Re-clicking the selected cell is a no-op in the
  store, **not a toggle**.
- **Hover** is a local signal, so pointer motion never reaches the store. The tint shows at once.
  The tooltip follows after **300 ms** (Astro's 800 ms default reads as broken on a surface you
  scan). Moving within one cell does not restart the delay. Leaving the cells, leaving the grid,
  scrolling, or changing unit drops both the tint and the tooltip.
- **The tooltip is in the component** (one absolutely-positioned element in the host), not a CDK
  overlay. An overlay attaches to the document body, which the pop-out window does not carry with
  it. It sits above the cell, or below it when the cell is within 80 px of the top.

---

## 5. Keyboard: one tab stop, `aria-activedescendant`

The grid is **one focusable element** (`role=grid`, `tabindex=0`). The keyboard position (`active`,
a local signal) is named by `aria-activedescendant`. Every cell has a stable id,
`rr-sg-grid-<n>-<row>-<col>`. Compared with a roving tabindex, nothing is focused or re-rendered as
you move, which suits 2,880 cells.

| Key | Moves to |
|---|---|
| ← → ↑ ↓ | the neighbour, clamped to the grid |
| Home / End | the first / last column of the row |
| PageUp / PageDown | 10 columns left / right, clamped |
| Enter / Space | **selects** the active cell (`cellSelect`) |
| with Alt, Ctrl or Meta held | left to the browser and the OS (Alt+← is Back) |
| anything else | left to the browser (Tab leaves the grid) |

- **Focus never moves selection.** Arrows move the dashed ring, and only Enter, Space or a click
  select. The list and the deck follow the same contract.
- **On first focus** the ring starts on the selected cell, or else on the latest elapsed cell of the
  first row. When focus returns, the ring keeps its place.
- After each move the active cell is scrolled into view with
  `scrollIntoView({ block: 'nearest', inline: 'nearest' })`. The browser does not do this for
  `aria-activedescendant`.
- The dashed ring shows only under `.grid:focus-visible`, so a mouse user never sees it.
- **A different unit resets** the keyboard position, hover and tooltip (`ngOnChanges` on `unit`).
  They index rows and columns that may not exist in the new grid. The comparison is **by id**: a
  fresh object for the same unit (a reload of the unit list) keeps the operator's place. Other
  input changes (the clock ticking, new counts) leave them alone.

Accessible names (`Gearbox, 04:15Z, Partial`) are built **once per data change** in a `computed`,
not formatted in the template on every check of every cell.

---

## 6. `<rr-sg-status-dot>`

This is the feature's one status symbol, used in the grid's legend and labels, the list and the
deck. It is light DOM with an empty template, so the host element *is* the symbol: a 12 px disc
coloured from `data-status`, or an 8×2 hyphen for NO_DATA. It is always decorative
(`aria-hidden`): the row, cell, tab or chip around it carries the status in text or in its
accessible name, so status never depends on colour alone. It replaces Astro's
`rux-status` for three reasons:

- every `rux-status` is a shadow root, which the pop-out would have to walk;
- `rux-status` throws on any value outside its six, so NO_DATA could never be passed to it;
- NO_DATA needs a different shape.

---

## 7. Tokens it reads

`--rr-sg-text` / `-text-dim` / `-text-muted` · `--rr-sg-surface` / `-surface-sunken` (the time
tiers) · `--rr-sg-border` · `--rr-sg-lattice` / `-lattice-hour` / `-lattice-anchor` ·
`--rr-sg-accent` (the ring) · `--rr-sg-focus` (the dashed ring) · `--rr-sg-hover` · `--rr-sg-now` ·
`--rr-sg-banner` · `--rr-sg-tooltip` · `--rr-sg-status-*` · `--rr-sg-nodata`. All have R3 fallbacks;
see the foundation guide §5.

---

## 8. The spec (`status-grid.spec.ts`, 37 tests)

The fixture is six columns over two hours and two components, one of them failed, with four
columns elapsed. A comment at the top of the spec draws the expected grid.

| Group | Pins |
|---|---|
| header | name, window (open and closed), now, counts; the no-unit and no-component empty states; the banner appears only with ERROR, and says "1 sample" / "4 samples" |
| cells | 12 cells with the projected statuses and accessible names; `aria-rowcount`/`colcount`; the selected cell's `aria-selected` and ring area; the now-marker's column and its two bounds; the hour rules and anchor |
| day ribbon | status per hour with the NO_DATA fallback; spans; a click scrolls 4 × 19 px; a click with no grid is harmless; the bracket at 50% / 50% |
| pointer | click selects, a missed click does nothing; hover area; the tooltip only after the delay, with its text; below near the top and above further down (with position); no restart within a cell; leaving clears; scroll hides it; destroy drops a pending tooltip |
| keyboard | keys ignored before focus; the three starting positions; position kept on refocus; every movement key and its clamping; `scrollIntoView` when supported; Enter and Space select; other keys, and Alt/Ctrl/Meta chords, pass through |
| a different unit | resets keyboard, hover and pending tooltip; a fresh object for the same unit doesn't, nor do other input changes |
| resize observation | observes the scroller, re-measures, and disconnects on destroy; follows a re-created scroller; not on the server; renders without `ResizeObserver` |

The tooltip delay is held by `holdTooltipTimers()`. It spies on `setTimeout`, holds only the
300 ms callbacks, and runs them by hand, so no test depends on the timer mode.

---

## 9. Porting to 17.3

**Nothing differs.** The same files ran on Angular 17.3.12 + Jest 29 at 100%, built AOT with
`strictTemplates`, and behaved identically in Chromium (see the README). These are the 17.3 ∩ 22
features it relies on:

- signal `input()` / `output()` (17.1 / 17.3), with `fixture.componentRef.setInput` in specs;
- `ngOnChanges` firing for signal inputs;
- `viewChild()` (17.2);
- one `effect()` that **writes no signal** (it only re-points the observer), so effect timing,
  which moved in 19, cannot change what it does;
- `NgZone.run` for the one callback that arrives outside Angular (the observer);
- `@if` / `@for` (17.0). In a `@for` that aliases `$index` (`let c = $index`), 17 requires
  `track c`: `track $index` there fails AOT with NG9. JIT under Jest does not catch it.

It uses no `linkedSignal`, no `@let`, and no signal-writing effect.

---

## 10. Pitfalls

1. **The overlay span** (§2.1). Leave out `span 1 / span 1` and the ring becomes a line down the
   whole grid.
2. **Nesting an overlay inside a cell.** Overlays are grid items of `.grid` (which is
   `position: relative`); placed inside a cell, a ring would be clipped and scroll with it.
3. **A CDK overlay for the tooltip.** It works until the window pops out.
4. **Observing the scroller once.** It is re-created with the empty state; re-point the observer
   (the effect) or it watches a discarded element.
5. **Writing signals from a callback Angular did not start** (an observer, a third-party listener)
   without `NgZone.run`. Fine on 22; on a 17.3 zone.js app nothing repaints.
6. **Formatting labels in the template.** That is 2,880 string builds per check. Keep the
   `cellLabels` computed.
7. **Forgetting `scrollIntoView` after a key move.** The ring walks off-screen.
