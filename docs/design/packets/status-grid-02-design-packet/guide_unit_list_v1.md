---
schema: corpus-doc/v1
status: active
title: Status Grid — Unit List implementation guide (v1)
areas: [frontend, ux, code]
governs: ["packages/status-grid/src/lib/ui/unit-list/**"]
related: ["docs/design/packets/status-grid-02-design-packet/mockups_r3_design_note.md", "docs/design/packets/ui-panes-01-design-packet/ui_panes_implementation_guide_v1.md"]
updated: 2026-10-01
---

# Status Grid — Unit List implementation guide (v1)

**Created:** 2026-10-01 | **Author:** Marlow | **Status:** `active`. Built and tested on Angular 22 and
17.3.12, and checked in Chromium on both. Pending Graham's merge.
**Source of truth:** `packages/status-grid/src/lib/ui/unit-list/` · **Design:** `mockups_r3_design_note.md`
§2 and §4–§7, frames F1 and F3 of `mockups_r3.html`.

**This guide explains the source. It does not copy it.** The code is the single source of truth: copy the files,
and read this alongside them. The excerpts below are there to show a decision, not to be pasted.

---

## 1. What it is, and where it lives

`<rr-sg-unit-list>` is the list of units under test. It has one 28px row per unit (status dot, name, test
window) under a sticky filter row. The component is presentational: its items and the selection come in as
inputs, and choosing a unit goes out as an output.

| File | What it is |
|---|---|
| `unit-list.ts` | The component, `UnitList` |
| `unit-list.html` / `unit-list.scss` | Its template and styles |
| `unit-window.ts` | Pure formatting: `unitWindowText`, `unitWindowSpeech`, `unitAccessibleName` |
| `unit-list.spec.ts` / `unit-window.spec.ts` | Specs, in plain Jest (§6) |

It sits in the **Units** pane of `<rr-sg-status-grid-surface>`, and that surface is the only thing that knows
about the store:

```html
<rr-pane label="Units" paneId="units" basis="30%" [min]="240">
  <rr-sg-unit-list
    [items]="store.unitItems()"
    [selectedId]="store.selectedUnitId()"
    (unitSelect)="store.selectUnit($event)" />
</rr-pane>
```

Two wiring lines sit outside this component's files, and both are already in the package: the `ui` barrel
exports it (`export * from './unit-list/unit-list';`), and the surface lists `UnitList` in its `imports`. Copy
the package and they come with it. The component is part of the `ui` Sheriff module and imports only `../../domain`
and `../status-dot`.

## 2. The contract

| | Name | Type | Default | Meaning |
|---|---|---|---|---|
| input | `items` | `readonly UnitListItem[]` | `[]` | `{ unit, phase }`, drawn **in the order given** |
| input | `selectedId` | `UnitId \| null` | `null` | The selected unit |
| output | `unitSelect` | `UnitId` | — | The operator chose a **different** unit |

- **The no-store rule.** The filter text and the keyboard position are local signals and never reach the store.
  What someone types in a field is not application state, and the deck and grid have no use for it. Only a
  selection leaves the component.
- **No toggle-off.** Choosing the unit that is already selected emits nothing. The store's `selectUnit` ignores
  a same-id call as well, but the guard sits in the component so that `unitSelect` always means "the selection
  changed", whichever host is listening. *This guard is list-only:* the grid's `cellSelect` and the deck's
  `elementSelect` re-emit on a repeat choice and rely on the store's no-op, because re-choosing a cell or a tab
  is harmless and a guard there would need the component to know what the store holds.
- **The phase comes in with the item.** The store computes `unitPhase(unit, now)`, so the list never reads a
  clock. It re-renders when the store's `unitItems` changes, which happens only when `now` moves a unit between
  phases: `unitItems` re-runs on every 30s tick but has an `equal` that compares each unit and phase, so it
  emits nothing until one changes.
- **No sorting.** The design note asks for natural order by ID. That order belongs to whoever serves the data.
  If the list sorted by itself, it would move rows out from under the pointer.

## 3. The source, file by file

### 3.1 `unit-window.ts`: formatting, nothing else

- **`+Nd` counts UTC midnights crossed, not elapsed time.** `22:00–04:00Z` lasts six hours and still reads
  `+1d`, so the code takes the difference of `Math.floor(ms / DAY_MS)` for stop and start, not a duration.
- **A window with no stop reads as running, whatever the phase says.** The type allows a `complete` unit with
  `stoppedAt: null`, and in that case there is no end time to print. The function shows the truthful text
  rather than throwing.
- **Speech is a separate function.** The visible `–`, `·` and `+1d` sound bad in a screen reader, so the
  accessible name uses `00:00 to 23:55 Zulu`, `…, next day`, `from 06:00 Zulu, running` and
  `scheduled 18:00 Zulu`.
- **`RUNNING` is exported** because the component splits that word off the visible text and draws it in
  primary ink (design §2). Both files use the same constant, so the split can't drift from the text.

### 3.2 `unit-list.ts`: a small signal graph

```
items ──► entries ──► rows ──► active ──► activeDescendant
query ──► needle ───┘     └──► count
activeUnitId ─────────────────┘
```

- **`entries` and `rows` are separate on purpose.** `entries` depends only on `items`, and it holds the
  accessible label, the window text and the lower-cased name. `rows` adds the filter. As a result, a keystroke
  costs one `indexOf` per unit, and nothing is formatted again while the operator types. Nothing is formatted
  in the template either.
- **The highlight is split in the computed.** Each row carries `before`, `match` and `after`, and the template
  only prints them.
- **The active option is derived, not synced.** This is the decision the rest of the component depends on:

  ```ts
  protected readonly active = computed(() => this.rows().find((row) => row.id === this.activeUnitId()) ?? null);
  ```

  `activeUnitId` remembers the unit even while a filter hides it. `active` is `null` for as long as the unit is
  hidden, and the same option comes back when the filter is cleared. No effect writes to anything, so there is
  no effect timing to differ between 17.3 and 19+.
- **Option ids are `rr-sg-units-<n>-option-<index>`.** `<n>` is a per-instance counter and `<index>` is the
  position in `items`. Unit ids are data: they can contain characters that are invalid in a CSS selector, and
  `moveTo` queries by id.
- **`onFocus` uses the selected unit if it is visible, otherwise the first one.** The listbox is rendered only
  while it has rows, so `rows[0]` always exists and needs no guard.
- **`moveTo` scrolls from the host, not from `document`.** After a pop-out, the list lives in another
  document. It calls `scrollIntoView?.({ block: 'nearest' })` because focus stays on the listbox under
  aria-activedescendant, so the browser does not scroll on its own. The `?.` is there because jsdom has no
  `scrollIntoView`.
- **`clearFilter` focuses the field before the next render removes the button.** That way focus moves to the
  field and is never dropped on `<body>`. The field query is `viewChild.required`, because the field is always
  rendered.
- **The filter is trimmed.** A query of only spaces counts as no filter, rather than showing "No units match ' '".

### 3.3 `unit-list.html`

- **`aria-controls` is `null` when there is no listbox.** Otherwise the field would reference an id that does
  not exist.
- **The interpolations in the name and window spans touch each other**, as in
  `{{ row.before }}@if (row.match) {<mark …>}{{ row.after }}`. Whitespace there would render as a space inside
  the unit's name (see §8).
- **The `<li (click)>` carries an `eslint-disable-next-line`** for `click-events-have-key-events` and
  `interactive-supports-focus`. The listbox pattern gives the *list* the focus and the keys, so an option is
  never focusable on its own. The rule cannot see that, and the comment above the line says why.
- **The empty state is `role=status`, outside the listbox.** It is either "No units match 'xyz'" with a Clear
  filter button, or "No units to show." when `items` is empty.

### 3.4 `unit-list.scss`

- **The host is a plain block with no overflow.** The pane body (`.rr-pane__body`, `overflow: auto`) is the
  scroller, so `position: sticky; inset-block-start: 0` on the filter row holds for the whole list. Checked in
  Chromium: with the pane body scrolled 600px, the filter row's top equals the body's top.
- **The soft shadow while scrolled** comes from a scroll-driven animation (`animation-timeline: scroll(nearest
  block)`, range 0–8px) inside `@supports`. No JavaScript watches the pane body, and where the feature is
  unsupported the row is just flat. The keyframes have a unique name (`rr-sg-unit-list-lift`), so they can't
  collide with anything whether or not the compiler scopes them.
- **The selected tint wins over hover** because `.option.option--selected` comes after `.option:hover` and is
  just as specific. Hover is always `--rr-sg-hover` and never the accent.
- **The dashed ring shows only under `.listbox:focus-visible`.** A mouse user never sees it (checked: a first
  click gives `:focus-visible` false). If the filter hides the active option while the list has focus, the
  listbox gets its own dashed outline (`:not([aria-activedescendant])`), so focus never disappears.

## 4. Keyboard and accessibility model

The field and the list are each one tab stop, in that order.

| Key (list focused) | Effect |
|---|---|
| (focus arrives) | The active option becomes the selected unit if visible, otherwise the first; scrolls into view |
| ↓ / ↑ | Move the active option by one, clamped at the ends. **Selects nothing** |
| Home / End | Move to the first or last option. Selects nothing |
| Enter / Space | Select the active option (`preventDefault`, so Space does not scroll the pane) |
| with Alt, Ctrl or Meta held | Left to the browser and the OS (Alt+↓ and friends are theirs) |
| anything else | Left to the browser |

A click selects and also makes that option active. Arrowing never fetches a unit, which follows the grid's rule
that focus never moves the selection.

- **Markup:** `ul[role=listbox][aria-label=Units][tabindex=0][aria-activedescendant]` holds
  `li[role=option][id][aria-selected][aria-label]`.
- **Option name:** "WTG-04, Invalid, 00:00 to 23:55 Zulu". The dot is `aria-hidden`, because the name already
  carries the status.
- **Field:** `input[type=search][aria-label="Filter units"][aria-controls=<listbox id>]`. It is a native input,
  not `rux-input`: ARIA id references don't cross a shadow root, so `aria-controls` from inside a shadow DOM
  would point at nothing.
- **Count:** `aria-live="polite"`. It reads "14 units" ("1 unit"), or "18 of 90" while filtered.
- **Focus styles:** dashed means "keyboard position inside a composite". The field and the Clear filter button
  get the solid 2px outline at offset 1 (design §6).

## 5. Tokens

Every value is `var(--rr-sg-*, <fallback>)`. To theme them, define the tokens at `:root` in the **global**
sheet, because a token set on a component host does not survive the pop-out. The design note's `--sg-*` names
correspond one to one to the names below.

| Token | Fallback | Used for |
|---|---|---|
| `--rr-sg-text` | `#e6ebef` | names, count number, "running", empty title |
| `--rr-sg-text-dim` | `#9aa4ad` | window text, count, match underline, empty hint |
| `--rr-sg-text-muted` | `#8a96a1` | field placeholder |
| `--rr-sg-surface` | `#1b2d3e` | filter row (so rows scroll under an opaque bar) |
| `--rr-sg-field` | `#132230` | search field |
| `--rr-sg-border` | `rgb(150 190 220 / 14%)` | filter row's bottom rule (the grid's token) |
| `--rr-sg-border-strong` | `rgb(150 190 220 / 26%)` | field and button borders |
| `--rr-sg-rule` | `rgb(150 190 220 / 8%)` | row separators |
| `--rr-sg-accent` | `#67b9d4` | selected row's 3px bar |
| `--rr-sg-accent-tint` | `rgb(103 185 212 / 16%)` | selected row fill |
| `--rr-sg-focus` | `#67b9d4` | dashed option ring; solid field/button outline |
| `--rr-sg-hover` | `rgb(255 255 255 / 6%)` | row and button hover |

The status colours come from `<rr-sg-status-dot>`'s own tokens.

## 6. The spec

There are **25 tests** in plain Jest (`describe`, `it`, `expect`, `jest.fn`). They don't switch timer modes
and don't depend on mock-reset settings. The only stub is `scrollIntoView`, which is assigned directly on each
option element because jsdom lacks it. Every change is followed by `fixture.detectChanges()`, and the inputs
are set with `fixture.componentRef.setInput`.

| Test | What it pins |
|---|---|
| **unit-window.spec.ts** | |
| closed window | `00:00–23:55Z` / `00:00 to 23:55 Zulu` |
| later UTC day | `+1d`, `+2d` and their speech; midnight-crossing, not duration |
| open window | `06:00Z · running` / `from 06:00 Zulu, running` |
| no stop, any phase | reads as running |
| future window | `scheduled 18:00Z` |
| accessible name | "WTG-04, Invalid, 00:00 to 23:55 Zulu" |
| **unit-list.spec.ts: rows** | |
| one option per unit | given order; dot status; window text per phase; "running" in its own span |
| names and selection | option name; `aria-selected` true/false; selected class; unique option ids |
| counts | "4 units", "1 unit" |
| no units | "No units to show.", no listbox, no Clear button, "0 units" |
| **filter** | |
| case-insensitive substring | survivors; "2 of 4"; `aria-controls` points at the listbox |
| matched run | `<mark>` holds the run in the name's own case; gone when cleared |
| spaces only | no filter |
| no match | `role=status` message outside a missing listbox; `aria-controls` removed; "0 of 4"; Clear filter empties and focuses the field |
| **keyboard** | |
| focus → selected | active = selected unit; nothing emitted |
| focus → first | when the selected unit is filtered out |
| arrows / Home / End | move and clamp; `preventDefault`; no emit; `scrollIntoView({block:'nearest'})`; active class |
| Enter / Space | emit the active unit; `preventDefault` |
| already selected | Enter emits nothing |
| other keys | not prevented, nothing moves |
| filtered-out active | `aria-activedescendant` removed; returns when the filter clears |
| no active | Enter does nothing; an arrow starts at the first |
| refocus | keeps the active option |
| **pointer** | |
| click | emits and makes the unit active |
| click selected | no toggle-off |

**Coverage on Jest (Angular 17.3.12):** `unit-list.ts` and `unit-window.ts` are both at 100% statements,
branches, functions and lines. The same files pass under Vitest in `rr`, where `test-setup.ts` maps `jest` to
`vi`.

## 7. Porting notes for 17.3

**Nothing in these files differs between 17.3 and 22.** Copy the folder as it is, specs included. If your app's
folders are laid out differently, the only lines to change are the two relative imports (`../../domain` and
`../status-dot`).

To stay inside 17.3 ∩ 22, the source uses `input()`, `output()`, `computed()`, `signal()`,
`viewChild.required()` (`input()` is 17.1+, `viewChild` 17.2+ and `output()` 17.3+), `@if`/`@for` (17.0), and `standalone: true` written
out, with a `host` object for the class. It does not use `linkedSignal`, `@let`, `effect`,
`afterRenderEffect`/`afterEveryRender`, `HostBinding`/`HostListener` or NgModules. `@for` tracks `row.id`, never
`$index`; the 17.3 AOT compiler rejects `$index` in `track` when it is also aliased.

**Verified:**
- Jest 29.7 + jest-preset-angular 14.1.1 on 17.3.12: 25/25 at 100%. Also passes with
  `fakeTimers: { enableGlobally: true }` and with `resetMocks`/`restoreMocks`/`clearMocks`.
- 17.3.12 AOT build with `strictTemplates` and `noUnusedLocals`: clean, and the component is in the bundle.
- Chromium on 17.3.12 + zone.js and on 22 zoneless gives the same results: Tab-in lands on the selected unit,
  arrows move without selecting, Space and Enter select, and a mouse click shows no ring. On 22, inside a real
  `<rr-pane>` with 90 units, the sticky row holds, the shadow shows only once scrolled, the row is 28px and the
  filter row 40px.

## 8. Pitfalls

| Symptom | Cause |
|---|---|
| The filter row scrolls away with the rows | Something between the pane body and the list got `overflow` (or a fixed height), which made it the scroller |
| A space appears inside highlighted names | A formatter broke `{{ row.before }}@if …{{ row.after }}` across lines |
| The active option jumps or flickers after filtering | Someone "synced" `activeUnitId` with an effect. Keep it derived (§3.2) |
| Arrow keys don't scroll the list in a popped-out window | A lookup through `document` instead of the host |
| Re-clicking the selected unit "does nothing" | That is the no-toggle-off rule. A "refresh" gesture would need its own output |
| The highlight is off by a character | `toLowerCase()` changed the name's length (e.g. `İ`). Unit names are ASCII IDs today; a name with such characters needs a locale-aware matcher |
| The dashed ring appears after a click | The list had already been keyboard-focused, and Chromium keeps `:focus-visible` once keys have been used. This is expected |
| Rows reorder as statuses tick | Something sorted the items. The list never sorts (§2) |
