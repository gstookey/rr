---
schema: corpus-doc/v1
status: active
title: Status Grid — Details Deck implementation guide (v1)
areas: [frontend, ux, code]
governs: ["packages/status-grid/src/lib/ui/details-deck/**"]
related: ["docs/design/packets/status-grid-02-design-packet/mockups_r3_design_note.md", "docs/design/packets/ui-panes-01-design-packet/ui_panes_implementation_guide_v1.md"]
updated: 2026-10-01
---

# Status Grid — Details Deck implementation guide (v1)

**Created:** 2026-10-01 | **Author:** Marlow | **Status:** `active`. Built and tested on Angular 22
(Vitest) and 17.3.12 (Jest 29), and checked in Chromium on both (see the packet README). Pending Graham's merge.
**Source of truth:** `packages/status-grid/src/lib/ui/details-deck/` · **Design:** `mockups_r3_design_note.md` §3–§8

**This guide explains the source. It does not copy it.** Copy the folder. The excerpts below are short
and exist to show a decision.

---

## 1. What it is, and where it lives

The **Details pane** of `<rr-sg-status-grid-surface>`. It shows the Elements (as tabs) and Attributes
(as cards) behind the one sample selected in the grid. There are three components, all in the `ui`
Sheriff layer, which means they take inputs, emit outputs, and import only `../../domain`, `../status-dot` and
`@angular/core`:

| File | Selector · class | Job |
|---|---|---|
| `sample-context.ts` (+ `.scss`) | `rr-sg-sample-context` · `SampleContext` | `Gearbox · 04:15Z` + status chip, **in the pane header** |
| `attribute-card.{ts,html,scss}` | `rr-sg-attribute-card` · `AttributeCard` | One attribute: name, flag, EXPECTED, ACTUAL |
| `details-deck.{ts,html,scss}` | `rr-sg-details-deck` · `DetailsDeck` | The pane body: a state message, or tabs + cards |

The surface wires them like this:

```html
<rr-pane label="Details" paneId="deck" [min]="140">
  <rr-sg-sample-context rrPaneHeader [sample]="store.selectedSample()" />
  <rr-sg-details-deck
    [state]="store.deckState()"
    [sample]="store.selectedSample()"
    [elements]="store.elements()"
    [activeElement]="store.activeElement()"
    (elementSelect)="store.selectElement($event)" />
</rr-pane>
```

The context goes in the header, not in a strip in the body (design note §8.1). The 28px header bar
already exists. Putting the context there leaves room in the body for two card rows at the default
split, and when the deck is collapsed it still names the selection. The deck cannot reach the header
from inside the pane body, so the context is a separate component.

---

## 2. The contract

**`SampleContext`**: `sample: SelectedSample | null` (default `null`).

**`AttributeCard`**: `attribute: ElementAttribute` (required).

**`DetailsDeck`**: all inputs have defaults.

| Input | Type | Default | Read for |
|---|---|---|---|
| `state` | `DeckState` | `'idle'` | which message, or tabs + cards |
| `sample` | `SelectedSample \| null` | `null` | the future message's time; the tablist's label |
| `elements` | `readonly ComponentElement[]` | `[]` | one tab each |
| `activeElement` | `ComponentElement \| null` | `null` | which tab is selected, **matched by id** |

| Output | Payload | When |
|---|---|---|
| `elementSelect` | `ElementId` | a tab is clicked, or an arrow/Home/End key lands on it |

The deck is **controlled**. It holds no tab state. The store keeps the operator's tab by element id and
falls back to the first element. The deck draws whatever comes back. Clicking the tab that is already
active emits again. That is harmless: `selectElement` writes the same id, and `activeElement`
recomputes to the same element.

The deck reads **nothing it could derive wrongly**. `state` comes from the store's `deckState`. A
card's look comes from `attribute.match` alone.

---

## 3. The source, file by file

### 3.1 `sample-context.ts`

An inline template: `@if (sample(); as s)` renders name, `· HH:MMZ` and the chip, and the `@else`
renders "No sample selected" in text-muted. The template calls `formatZuluTime` directly through a
`protected readonly zulu = formatZuluTime` field (it is a pure function, so no `computed` is needed). The
chip reuses `<rr-sg-status-dot>` with the `STATUS_LABEL` text. NO_DATA therefore reads "NO DATA YET"
beside the hyphen, never a verdict.

**Why the name has a `max-inline-size: 24ch`.** `<rr-pane>`'s `.rr-pane__actions` is `flex: 0 0 auto`.
It never shrinks, so an ellipsis on the host alone would never trigger, and a long name would squeeze
the pane title instead. The cap makes the name ellipsize on its own. The time and the chip are
`flex: none` and always show. The full name is in the `title` attribute.

### 3.2 `attribute-card.{ts,html,scss}`

The class is only an input. The host carries `role: 'listitem'` and `[attr.data-match]`, and the SCSS
does the rest with `:host([data-match='MISMATCH'])` and `:host([data-match='MISSING'])`. This follows
the same idea as the grid's `data-status` cells: state is an attribute, and CSS draws it.

- **The flag is text.** `@switch (attribute().match)` renders `◄ mismatch` or `missing`, and nothing
  for MATCH. The source text is lower case and drawn in caps by `text-transform`, so a screen reader
  says the word rather than spelling it out. The `◄` is in an `aria-hidden` span.
- **`match` decides ACTUAL too.** `@if (attribute().match === 'MISSING')` shows "value not received".
  It deliberately does not test `actual === null`. The model says null *implies* MISSING, but the
  card trusts `match` and nothing else (`models.ts`: '0.130' vs '0.13' would lie).
- **The values are a `<dl>`**: `div > dt + dd` per row, a 64px label column, and 14px mono on a 24px
  line. The value box reaches 6px left of its column (`margin-inline-start: -6px; padding: 0 6px`), so
  the tinted ACTUAL on a mismatch keeps its text aligned with EXPECTED.
- **`justify-content: space-between`** on the host pins the values to the bottom. EXPECTED and ACTUAL
  therefore sit at the same height in every card, whatever the name does.
- **MISSING is flat**: the pane surface rather than the raised one. That is also what makes text-muted
  legal on it, because text-muted is 4.66:1 on surface and fails on raised.

### 3.3 `details-deck.{ts,html,scss}`

**Two branches.** `@if (state() === 'ready')` draws tabs + panel, and `@else` draws the message. The
message `div[role=status]` sits **outside** the `@switch` that picks its text. Moving from one
non-ready state to another (pending → future, say) therefore changes the content of a live region
that already exists, and screen readers announce that reliably. A freshly inserted live region is
often not announced.

| state | message |
|---|---|
| `idle` | **Select a cell in the grid** + hint "Arrow keys move through the grid · Enter selects" |
| `future` | dot + **Not sampled yet — 18:30Z is in the future** (time from `sample.epochMs`) |
| `pending` | dot + **Awaiting validation** |
| `error` | dot + **Retrieval failed — no verdict for this sample** |
| `empty` | **No element detail for this sample** |

**No Retry on error.** The design note's `Retry Converter` button is deliberately absent. The data
source is synchronous and has no refetch, so the button would do nothing. Retry arrives with the
WebSocket arc, as one component refetch shared by the deck and the grid's ERROR banner.

**`activeIndex`, and why cards come from it:**

```ts
protected readonly activeIndex = computed(() => {
  const id = this.activeElement()?.id;
  return Math.max(0, this.elements().findIndex((element) => element.id === id));
});
protected readonly shown = computed((): ComponentElement | undefined => this.elements()[this.activeIndex()]);
```

The deck matches **by id**, not by reference, and falls back to index 0, which is the store's own
fallback. The cards render from `shown()`, the element at that index, not from `activeElement`
directly. The selected tab and the panel's contents therefore come from one number and cannot
disagree, whatever pair of inputs arrives.

**Ids** come from a module counter (`rr-sg-deck-N`), as the grid's `nextGridId` does. Tabs are
`…-tab-<index>` and the panel is `…-panel`. Element ids are not used in DOM ids: the fixture's
`gearbox:vibration-sensor-a` contains a colon, which breaks `#id` selectors.

**Tabs** are `<button role="tab">` elements in a `div[role=tablist]` that scrolls sideways
(`overflow-x: auto`, `flex: none` tabs, `white-space: nowrap`). Each tab holds a 12px
`<rr-sg-status-dot>`, the name, and a visually hidden `, Partial`. The dot is `aria-hidden`, and
without that text the tab's status would depend on colour. The selected tab's 2px underline is an
`::after` inset 8px. The dashed focus ring is a `::before`, shown on `:focus-visible`.

**The panel is both the scroller and the size container:**

```scss
.panel { overflow: auto; container-type: inline-size; }
.cards { grid-template-columns: repeat(4, minmax(0, 1fr)); grid-auto-rows: 135px; gap: 8px; }
@container (max-width: 1000px) { .cards { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
```

A container query cannot style its own container, so the container (`.panel`) and the grid
(`.cards`, which is also the `role=list`) have to be two separate elements. Columns are fixed at four
and step down to 3/2/1 below 1000/760/500px. The design deliberately avoids `auto-fill`, which gives
6+2 at full width and moves "Calibration Offset" between slots from sample to sample. Rows are a fixed
135px, so a short deck scrolls instead of squeezing a card. The panel has `tabindex="0"` because
nothing inside it is focusable, and a keyboard user must still be able to scroll it.

---

## 4. Keyboard and a11y model

- **Tab order:** the active tab, then the panel. Roving tabindex means only the selected tab has
  `tabindex="0"` and the rest have `-1`.
- **Arrow Right/Left** move to the next/previous tab and **wrap** (APG). **Home/End** go to the
  first/last tab. Each of these **activates**: it emits `elementSelect` and moves focus to the new tab.
  The payload is already loaded, so making the operator press Enter would gain nothing. Each also calls
  `preventDefault()`. Every other key, and any key with Alt, Ctrl or Meta held, is left alone. Enter and
  Space on a focused tab are native button clicks.
- **Moves count from the tab the key was pressed on**, which the template passes as `$index`, not from
  `activeIndex()`. Focus moves synchronously, but the new `activeElement` comes back through the store
  on the next render. Counting from `activeIndex` would make a held arrow key repeat from a stale tab.
- **ARIA:** `tablist[aria-label="Elements of Gearbox at 04:15Z"]` ("Elements" when no sample is
  given). Each `tab[id][aria-selected][aria-controls=<panel>]`. One
  `tabpanel[aria-labelledby=<active tab id>]` holds a `role=list` of `role=listitem` cards. State
  messages are `role=status`.
- **Status never depends on colour.** Tabs carry the status label in hidden text, cards carry their
  flag as text, and the chip has its label beside the dot.

---

## 5. Tokens

Every value is read as `var(--rr-sg-<name>, <fallback>)`. Theme them at **`:root` in the global
stylesheet**, because tokens set on a component host do not survive the pop-out.

| Token | Fallback | Used for |
|---|---|---|
| `text` | `#e6ebef` | primary ink, selected tab, values |
| `text-dim` | `#9aa4ad` | tabs at rest, labels, flag, MISSING name, hint |
| `text-muted` | `#8a96a1` | "No sample selected", "value not received" (surface only) |
| `surface` | `#1b2d3e` | MISSING card |
| `surface-raised` | `#21364a` | cards, chip |
| `border` | `rgb(150 190 220 / 14%)` | card border, tab rule |
| `border-strong` | `rgb(150 190 220 / 26%)` | chip, dashed MISSING border |
| `accent` | `#67b9d4` | selected-tab underline |
| `focus` | `#67b9d4` | dashed tab ring, panel focus ring |
| `hover` | `rgb(255 255 255 / 6%)` | tab hover (never cyan) |
| `status-invalid` | `#ff3838` | MISMATCH 3px inset edge |
| `diff-ink` / `diff-tint` / `diff-edge` | `#ff7a7a` / `rgb(255 56 56 / 12%)` / `rgb(255 56 56 / 55%)` | MISMATCH flag + ACTUAL, its tint, its border |
| `mono` | `ui-monospace, 'Roboto Mono', monospace` | values |

The status-dot colours are `<rr-sg-status-dot>`'s and are unchanged. The `rule` token is unused
here: the tab strip's 1px rule uses `border`, as the mockup does. The design note's Astro mappings
(§4) still need checking against 7.20.0.

---

## 6. The specs

These are plain Jest specs: `describe`/`it`/`it.each`/`expect` and nothing else. There are no fakes,
no spies, and no timers. Outputs are captured by subscribing into an array. They pass under the default
config, under `fakeTimers: { enableGlobally: true }`, and under
`restoreMocks/clearMocks/resetMocks: true`.

**`sample-context.spec.ts`** (3)
- with no sample: "No sample selected", and no chip
- with a sample: name, `· 04:15Z`, a chip reading "Partial", and a dot with `data-status=PARTIAL`
- NO_DATA: the chip says "No data yet", never a verdict

**`attribute-card.spec.ts`** (5)
- the host is a `listitem` with `data-match`
- MATCH: name, both values, no flag
- MISMATCH: the flag reads `◄ mismatch`, the arrow is `aria-hidden`, and ACTUAL shows
- MISSING: the flag reads `missing`, and ACTUAL is "value not received"
- **`match` is trusted.** '0.13' vs '0.130' marked MATCH gets no flag, identical strings marked
  MISMATCH get the flag, and a present value marked MISSING still reads "not received"

**`details-deck.spec.ts`** (26)
- idle by default: title and hint, no tablist
- `it.each` over future/pending/error/empty: exactly one `role=status` element with the exact text,
  and no tabs or cards
- future with no sample still reads "Not sampled yet"
- error renders no button
- the live region is the **same node** across a state change
- ready:
  - the tablist label, and one tab per element in order
  - each tab's dot status and hidden status text
  - `aria-selected` and the roving `tabindex`
  - tab ids are unique, every tab has `aria-controls` = panel, and the panel's `aria-labelledby` =
    the active tab
  - the cards are the active element's attributes, in order
  - the active element is matched by id, not by reference
  - falls back to the first tab for a null `activeElement`, or one that is not in the list
  - the tablist is labelled "Elements" when there is no sample
  - two decks get distinct ids
- clicking emits, including on the active tab
- `it.each` over Right, Right-wrap, Left, Left-wrap, Home and End: `preventDefault`, the emitted id,
  and focus on the target tab
- moves count from the tab the key was pressed on, before the store answers
- other keys: no emit, and no `preventDefault`

Coverage on the 17.3 harness is 100% statements/branches/functions/lines for all three `.ts` files.

---

## 7. Porting to 17.3

- **Copy the folder as it is**, specs included. Nothing needs editing. It uses only `input()`,
  `input.required()`, `output()` (17.3), `computed()`, `viewChildren()` (17.2), `@if`/`@for`/`@switch`,
  and a `host` object. It does not use `@let`, `linkedSignal`, effects, `HostBinding`/`HostListener`,
  or NgModules.
- **Already exported and wired.** The `ui` barrel exports all three, and the surface imports
  `SampleContext` and `DetailsDeck`. Copy the package and they come with it. The barrel lines are:
  ```ts
  export * from './details-deck/sample-context';
  export * from './details-deck/attribute-card';
  export * from './details-deck/details-deck';
  ```
- **No Astro components.** The tabs are native buttons, not `rux-tabs`, and the chip is not
  `rux-tag`. That keeps shadow roots out of the pop-out's relocation walk and makes the 32px geometry
  exact. `@astrouxds/angular` 7.20 is not involved.
- **`@container` under emulated encapsulation** is scoped by the 17.3.12 compiler: `@container` is in
  its `scopedAtRuleIdentifiers`. Container queries need Chromium 105+.
- **Jest:** the specs call `fixture.detectChanges()` after every input change, so they render under
  zone.js as well as zoneless. The focus assertions rely on TestBed attaching the fixture to
  `document.body`, which it does by default.

---

## 8. Pitfalls

| Symptom | Cause |
|---|---|
| The selected tab and the cards disagree | Cards rendered from `activeElement` instead of `shown()` |
| A held arrow key stutters, landing on the same tab twice | Moves counted from `activeIndex()` instead of the pressed tab's `$index` |
| Arrow keys move focus but no tab becomes selected | `(elementSelect)` is not bound to `store.selectElement`. The deck is controlled |
| Cards never step down from 4 columns | `container-type` was put on the grid itself. It has to be on its parent |
| A long component name pushes the "DETAILS" title off the header | The `24ch` cap on `.name` was dropped (the actions slot never shrinks) |
| A state change is not announced | The `role=status` element was moved inside the `@switch`, so it is recreated each time |
| `#gearbox:vibration…` selector errors | Element ids used in DOM ids. Use the index-based ids |
| A card shows MISMATCH where the API said MATCH | Someone compared `expected` with `actual`. `match` is authoritative |
| A spec renders nothing under Jest | It awaited `whenStable()` without `fixture.detectChanges()` |

**Known limitations:**
- Measured in Chromium at the 1618 × 773 window: cards 269 × 135, two rows fit the 383 px Details pane
  at the default split, and the context stays in the header when the deck collapses.
- Arrow keys are not mirrored in RTL.
- A `ready` state with no elements draws an empty tablist and panel. The store never produces it
  (that case is `'empty'`).
