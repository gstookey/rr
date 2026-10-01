---
schema: corpus-doc/v1
status: active
title: Status Grid v3 — foundation guide (domain, data, store, surface)
areas: [frontend, ux, code]
governs: ["packages/status-grid/src/lib/domain/**", "packages/status-grid/src/lib/data-access/**", "packages/status-grid/src/lib/feature/**"]
related: ["docs/design/packets/status-grid-02-design-packet/README.md", "docs/design/packets/status-grid-02-design-packet/guide_status_grid_v1.md", "docs/design/packets/status-grid-02-design-packet/guide_unit_list_v1.md", "docs/design/packets/status-grid-02-design-packet/guide_details_deck_v1.md", "docs/design/packets/ui-panes-01-design-packet/ui_panes_implementation_guide_v1.md"]
updated: 2026-10-01
---

# Status Grid v3: foundation guide

**Created:** 2026-10-01 | **Author:** Axium | **Status:** `active`. Built, tested and browser-verified on
Angular 22 and 17.3. Waiting for Graham's merge.
**Source of truth:** `packages/status-grid/src/` (`@rr/status-grid`)

---

## How to read the four guides

The feature is one utility window holding three panes, each with one presentational component, plus
one store and a domain shared by all three. This guide covers the shared part. Each pane has its
own guide:

| Guide | Covers | Lives in |
|---|---|---|
| **This one** | Domain, data source, clock, store, the window surface, tokens, running the specs | `domain/` · `data-access/` · `feature/` |
| [`guide_unit_list_v1.md`](guide_unit_list_v1.md) | `<rr-sg-unit-list>`, the **Units** pane | `ui/unit-list/` |
| [`guide_status_grid_v1.md`](guide_status_grid_v1.md) | `<rr-sg-status-grid>`, the **Status grid** pane | `ui/status-grid/` |
| [`guide_details_deck_v1.md`](guide_details_deck_v1.md) | `<rr-sg-details-deck>` + `<rr-sg-sample-context>`, the **Details** pane | `ui/details-deck/` |

Like the panes guide, **these guides explain the source rather than copy it.** You copy the files.
Excerpts here exist only to show a decision.

---

## 1. What you are building

```
 StatusGridDataSource ──► StatusGridStore (state: what can't be derived)
   (sync, this arc)          │  computeds: axis · elapsedCount · rows · counts · hourWorst ·
 TimeSource.now ────────────►│             selectedPosition · selectedSample · deckState · …
                             ▼
                   <rr-sg-status-grid-surface>   ← ZERO inputs; the only store-aware component
                      ├─ Units pane    <rr-sg-unit-list>      inputs ◄ store │ (unitSelect)    ► store.selectUnit
                      ├─ Grid pane     <rr-sg-status-grid>    inputs ◄ store │ (cellSelect)    ► store.selectCell
                      └─ Details pane  <rr-sg-details-deck>   inputs ◄ store │ (elementSelect) ► store.selectElement
```

Three rules hold the design together:

1. **One store, and state holds only what cannot be derived:** the raw data (units, the selected
   unit's grid, the selected sample's elements) and the operator's choices (unit, cell, tab).
   Everything a pane draws is a `computed`, so no two panes can disagree.
2. **The three pane components are presentational:** inputs in, one output each. None injects the
   store. This keeps each one testable with plain inputs, and portable.
3. **The surface takes zero inputs.** A utility window binds a surface's inputs once, when it mounts.
   A unit passed that way is right the first time and silently stale afterwards. The surface
   reads the store, which is `providedIn: 'root'`, so your app can call `store.selectUnit(...)`
   before or while the window is open.

## 1.1 Where it lives, and the version fence

`@rr/status-grid` is its own package (`packages/status-grid`). It is **not** an ACME Workshop Floor:
ACME is `rr`'s learning instrument (ADR-007), and this is a real feature for your work app. Inside
the package, four Sheriff modules enforce the layering:

| Module | Tag | May import |
|---|---|---|
| `domain/` | `type:domain` | nothing (pure TypeScript, no Angular) |
| `data-access/` | `type:data-access` | `domain` · `@angular/core` · `@ngrx/signals` |
| `ui/` | `type:ui` | `domain` · `@angular/*` (never the store) |
| `feature/` | `type:feature` | everything above · `@rr/ui` (the panes) |

All four carry `scope:status-grid`, which may depend only on itself and `scope:platform`.

**One source, two Angulars.** `rr` runs Angular 22 and your app runs 17.3.12 with
`@ngrx/signals` 17.2, so the source is written to the API they share, as the panes were:

| Not used (newer than 17.3) | Instead |
|---|---|
| `linkedSignal` (19/20) | The store's `activeElement` is a `computed` fallback. See §3.3 |
| `withProps`, `withLinkedState` (ngrx 19+) | `withState` · `withComputed` · `withMethods` · `withHooks` only |
| `@let` (18.1) | Plain `computed()` in the class |
| `effect()` that writes signals | No effects at all. Resets happen in event handlers or `ngOnChanges` |
| `standalone` as default (19) | `standalone: true` written explicitly |
| `afterEveryRender` (20) | `afterNextRender`, which exists in 17.3 |

**Copying it into your app today:** copy `packages/status-grid/src/lib/` with its specs. One import
changes: `feature/status-grid-surface.ts` imports `RR_PANES` from `@rr/ui`. Point it at your copy
of the panes folder. Nothing else imports outside the folder except `@angular/*` and
`@ngrx/signals`. After your upgrade, delete the copy and import `@rr/status-grid`.

---

## 2. Domain (`domain/`): pure, no Angular, no clock

### 2.1 Statuses (`status.ts`)

Six statuses. Five are verdicts or states that colour a disc; `NO_DATA` ("not yet") is a different
category, so it gets a different shape (a hyphen):

| Status | Meaning | Colour (Astro) |
|---|---|---|
| `VALID` | every attribute matched | `#56F000` normal |
| `PARTIAL` | mixed / incomplete | `#FCE83A` caution |
| `INVALID` | one or more attributes mismatched | `#FF3838` critical |
| `ERROR` | retrieval failed: no verdict could be obtained | `#FFB302` serious |
| `PENDING` | past or present, expected, not yet validated | `#2DCCFF` standby |
| `NO_DATA` | the sample's time has not come yet | hyphen, never a disc |

`COUNTED_STATUSES` (every status except NO_DATA) drives the legend and counts. `NO_DATA` is never
counted. `worstOf()` rolls a set up by `ROLLUP_PRECEDENCE`, which is INVALID > PARTIAL > ERROR >
PENDING > VALID ("a known failure outranks an unknown one"), falling back to NO_DATA when there is
nothing to judge. *(Cadence proposes a different order. It is an open ruling; see the README.)*

### 2.2 Models (`models.ts`)

Unit → Component → Element → Attribute. `UnitGrid` is everything the grid needs for one unit, in a
plain serialisable shape (what a REST response or a socket message would carry):

```ts
interface UnitGrid {
  unitId; components; timestamps /* a LIST, not a stride */; samples; failedComponentIds;
}
```

A timestamp with no sample for a component is simply absent. `ElementAttribute.match` is
**authoritative**: the client never re-derives a match by comparing `expected` with `actual`
(`'0.130'` vs `'0.13'` would lie). `unitPhase(unit, now)` gives `scheduled` / `running` /
`complete`.

### 2.3 The time axis (`time-axis.ts`)

`buildTimeAxis(timestamps)` makes one column per **instant**. It sorts by epoch, not by string. It
drops duplicate instants whatever their spelling, and drops unparseable entries rather than
poisoning the axis with NaN. Hour groups are **consecutive runs** of the same UTC hour, with id
`hour#startIndex`. The minute mask labels a column only with two columns of clearance, and always
labels an hour's first column. All time is **Zulu**: `formatZuluTime` → `04:15Z`,
`formatZuluDayTime` → `10-01 04:15Z`.

`elapsedColumnCount(axis, now)` (a binary search) is **the key for everything time-dependent**.
`now` ticks every 30 s, but this integer changes only when the boundary crosses a column. Signals
compare by value, so the grid recomputes when something visible changes, not on every tick.

### 2.4 The projection (`grid-projection.ts`)

`buildGridRows` is **the only place a cell's status is decided**, in this order:

1. a real sample always wins (**data beats the clock**: a unit reporting slightly ahead of this
   app's clock still shows its results);
2. an elapsed cell of a failed component → `ERROR`;
3. a future cell → `NO_DATA`;
4. otherwise → `PENDING` (due, not arrived).

`countElapsed` counts elapsed cells only (a half-finished day is not half-failing) and zeroes
NO_DATA. `worstByHour` gives the ribbon's colour per hour. `locate` maps a `CellCoordinate`
(component id + timestamp: what a cell *means*) to a `GridPosition` (row + column: where it is
*drawn*).

### 2.5 Read models (`read-models.ts`)

These are the shapes the store computes and the panes draw: `UnitListItem`, `SelectedSample`,
`DeckState`, `GridPosition`. They live in the domain so both `data-access` and `ui` can name them
without importing each other.

---

## 3. Data access (`data-access/`)

### 3.1 The data source port (`status-grid.data-source.ts`)

```ts
interface StatusGridDataSource {
  units(): readonly Unit[];
  unitGrid(unitId): UnitGrid | null;
  sampleDetail(unitId, coordinate): readonly ComponentElement[];
}
providers: [provideStatusGridData(() => inject(MyStatusApi))]   // or an instance
```

It is **synchronous in this arc**: every call answers immediately. The store calls it in exactly
three methods, and each puts what it gets back into state with one `patchState`. That containment
is the WebSocket arc's seam (§6).

### 3.2 The clock (`time-source.ts`)

`TimeSource.now` is a **signal**, updated every 30 s and only in the browser. On a server, an
interval would hold the process open. Why not call `Date.now()` in a computed? A computed that calls
`Date.now()` captures no dependency, so it never invalidates: the NO_DATA boundary would freeze at
first render. Override it in tests and demos:

```ts
{ provide: TimeSource, useValue: { now: signal(Date.parse('2026-10-01T14:05:00Z')) } }
```

### 3.3 The store (`status-grid.store.ts`)

`signalStore({ providedIn: 'root' }, withState, withComputed, withMethods, withHooks)`. `onInit`
calls `loadUnits()`.

| State | Why it is state |
|---|---|
| `units` | raw data |
| `selectedUnitId` | operator choice |
| `grid` (the selected unit's `UnitGrid`) | raw data |
| `selectedCell` (`CellCoordinate`) | operator choice, by **meaning**, so it survives a re-projection |
| `elements` (the selected sample's detail) | raw data |
| `activeElementId` | operator choice (the tab). `null` means "first tab" |

| Computed | Feeds |
|---|---|
| `axis` · `elapsedCount` · `rows` · `counts` · `hourWorst` · `selectedPosition` | the grid |
| `unitItems` · `selectedUnit` | the list and the grid's header |
| `selectedSample` · `deckState` · `activeElement` | the deck and its header context |

| Method | Does |
|---|---|
| `loadUnits()` | reads units; keeps the selection if it still exists, else selects the first |
| `selectUnit(id)` | no-op if unchanged; else loads that unit's grid and clears cell and detail |
| `selectCell(coord)` | no-op without a unit, or for the same cell (**no toggle-off**); else loads the detail |
| `selectElement(id)` | records the tab |

Two notes:

- **`activeElement` is how you get `linkedSignal` without `linkedSignal`.** It returns the operator's
  tab if the new sample has that element, else the first. Because it is derived, it heals itself
  when the element list changes. Nothing has to reset it.
- **`deckState` decides what the deck says**: `idle` (nothing selected), `future` (NO_DATA),
  `pending`, `error`, `empty` (judged, no detail), or `ready`. No detail is fetched for a NO_DATA
  or ERROR sample in the real backend either.

### 3.4 Fixtures (`turbine-fixtures.ts`)

`createTurbineFixtures({ now, seed })` is a deterministic wind farm. It is structurally identical
to the real feature and carries nothing proprietary. It covers every state the UI must render:

- WTG-01…10 are running today, with a PENDING tail (samples arrive 25 min late) and a NO_DATA future.
- WTG-04's Converter has a failed retrieval, which gives an ERROR row and the banner.
- WTG-07 is dense, with 20 components.
- WTG-11 and WTG-12 are complete (yesterday).
- WTG-13 is scheduled (all NO_DATA).
- WTG-14 has a window that crosses midnight.

Detail is 7 elements × 8 attributes, with MISMATCH and MISSING placed deterministically. The same
`now` and `seed` give identical data, so specs and screenshots are stable.

---

## 4. The surface (`feature/status-grid-surface.*`)

`<rr-sg-status-grid-surface>` is the window's content. It is the panes from `@rr/ui` (an inline
group: Units | a block group of Grid over Details), with each pane holding one component. It binds
store signals in and store methods out, and that is all it does. There is no logic in it to test
beyond the wiring, and its spec checks exactly that, including that it declares **no inputs**.

Host it in your utility window and provide the data:

```ts
// app config (or the window's providers)
providers: [provideStatusGridData(() => inject(StatusGridApi))]

// your window's template
<rr-sg-status-grid-surface />
```

Selecting a unit from elsewhere in the app:
`inject(StatusGridStore).selectUnit('WTG-04')`, then open the window.

---

## 5. Tokens

Every colour is a `--rr-sg-*` custom property with the R3 value as its fallback, so the feature
renders correctly with no theme at all. To theme it, define the tokens **at `:root` in your global
stylesheet**: tokens set on a component host do not survive the pop-out (PiP) relocation. The full
table, with each value's purpose, is the R3 design note §4. The ones every component shares:

| Token | Fallback | Token | Fallback |
|---|---|---|---|
| `--rr-sg-text` | `#e6ebef` | `--rr-sg-accent` | `#67b9d4` |
| `--rr-sg-text-dim` | `#9aa4ad` | `--rr-sg-focus` | `#67b9d4` |
| `--rr-sg-text-muted` | `#8a96a1` | `--rr-sg-hover` | `rgb(255 255 255 / 6%)` |
| `--rr-sg-surface` | `#1b2d3e` | `--rr-sg-border` | `rgb(150 190 220 / 14%)` |
| `--rr-sg-status-valid` … `-pending` | the Astro hexes in §2.1 | `--rr-sg-nodata` | `#62798e` |

The accent is the panes' `#67b9d4`, so there is one blue in the window. If you want Astro's
`#4DACFF`, set `--rr-pane-focus`, `--rr-sg-accent` and `--rr-sg-focus` together.

---

## 6. The WebSocket arc: what changes, and what doesn't

The next arc makes the data push-based. The seam is the data source and the three store methods
that call it:

- `units()`, `unitGrid()` and `sampleDetail()` become subscriptions or async requests. Each arriving
  message lands in state with the same single `patchState`. New samples append to `grid.samples`
  (and `timestamps`).
- Loading and error flags join the state (`deckState` gains `loading`; the ERROR banner and deck
  gain the Retry that R3 drew and this arc deliberately omits).
- **Nothing in `domain/`, `ui/` or the surface changes.** The projection already treats any sample
  as authoritative over the clock, and every pane is already a pure function of its inputs.

---

## 7. Running the specs in your app (Jest)

Copy the folder **with** its specs. They are plain Jest: `jest.fn`, `jest.spyOn`,
`fixture.componentRef.setInput`, `fixture.detectChanges()`. In `rr` they run under Vitest because
`packages/status-grid/test-setup.ts` sets `globalThis.jest = vi`. That file is never copied. Like
the panes specs:

- **They render with `fixture.detectChanges()`**, never `whenStable()` alone (zone.js does not
  render on `whenStable`). After-render hooks are flushed with
  `TestBed.inject(ApplicationRef).tick()`.
- **They never switch the timer mode.** The intervals and the tooltip delay are captured with
  `jest.spyOn(globalThis, 'setInterval' | 'setTimeout')` and run by hand, so they pass with real
  timers and with `fakeTimers: { enableGlobally: true }`.
- **They clean up their own spies** (`afterEach(() => jest.restoreAllMocks())`), and pass with
  `resetMocks` / `restoreMocks` / `clearMocks` on.
- **Clock and platform are injected:** `TimeSource` is overridden with a fixed signal, and the
  server path is tested with `{ provide: PLATFORM_ID, useValue: 'server' }`.

```js
// jest.config.js, alongside your existing preset: 'jest-preset-angular'
collectCoverageFrom: ['<status-grid folder>/**/*.ts', '!**/*.spec.ts', '!**/index.ts'],
coverageThreshold: { global: { statements: 100, branches: 100, functions: 100, lines: 100 } },
moduleNameMapper: { '^@rr/ui$': '<your panes folder>/index.ts' },   // only if you keep the import
```

The verification record (counts, coverage and browser runs on both versions) is in the
[README](README.md#verification).

---

## 8. Invariants: do not lose these

1. A cell's status is decided **only** in `buildGridRows`, in the order of §2.4.
2. Everything time-dependent keys off `elapsedCount`, never off `now`.
3. Store state holds only what cannot be derived. A new pane need is a new `computed`.
4. Pane components never inject the store. The surface never takes an input.
5. `match` is authoritative. Never compare `expected` with `actual`.
6. Tokens live at `:root` in the global stylesheet.
7. No effects that write signals, and nothing newer than the 17.3 ∩ 22 intersection (§1.1).
