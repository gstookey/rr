---
schema: corpus-doc/v1
status: exploratory
title: Status Grid R3 — design note (panes v2, unit list, details deck)
areas: [frontend, ux]
related: ["docs/design/packets/ui-panes-01-design-packet/ui_panes_implementation_guide_v1.md"]
updated: 2026-10-01
---

# Status Grid R3: design note

**Artifact:** `mockups_r3.html` (self-contained, opens from disk). **Author:** Cadence. **Round:** 3, design-only.
**Frames:** F1 Ready · F2 Units railed + splitter drag · F3 Dense (20 rows, 90 units) · F4 Deck states · F5
Interaction detail · F6 Forks. Every frame is the real content box, **1618 × 773**, at 100%.
**Grounded in:** the R2 visual spec and annex, the rulings addenda D (`01e`) and E (`01f`), packet §1–§3, and
`ui_panes_implementation_guide_v1` §1, §6.4–6.5, §8. The pane chrome is transcribed from
`packages/ui/src/lib/panes/pane.scss` and `pane-group.scss`.
**Doctrine consulted:** `node scripts/corpus-graph.mjs lookup` found no rr corpus docs for the panes packet or
for status-grid. The doctrine actually used is listed on the line above.

**Measured in Chromium, scrollbars on:** Units 483, right column 1127. Grid and Details panes 1127 × 383 each.
Grid body 54 columns visible with Units expanded, 80 with Units railed. Cards 269 × 135. Band is 29px with the
ERROR banner showing and 32px (capped) without it. At 20 rows the band sits at the 18px floor.

---

## 1. What changed from R2, and why

| R2 | R3 | Why |
|---|---|---|
| Bespoke collapsible pane, 44px rails, rails with roll-ups | `<rr-pane>`/`<rr-pane-group>` exactly as in guide §8: 28px header, 24px (+2) rail, 8px gap with splitter | The primitive exists and fixes the drift. R2's custom rail components (R6) are **withdrawn**: v2's rail takes no projected content, and the grid header already names the unit |
| Accent `#4DACFF` (Astro stand-in) | **`#67b9d4`**, one token (fork 3) | The panes already paint focus and splitter in `#67b9d4`. Two blues in one window is drift |
| Metadata: 2 rows of counts + "of N elapsed" prose + 300px ribbon | Row 1: unit · window · now · **counts as the legend**. Row 2: **full-width DayRibbon**, 24 hour segments | Axium's D-grid. The legend and counts were saying the same thing twice |
| Ghost lattice rows, row micro-bars, RETRY pill, NOW flag, skew outline | **Dropped** | Simplification. None of them was a ruling. The end rule (B5) and the banner as a flow row (R13) are kept |
| Unit list: 44px two-line rows with % pill | 28px one-line rows: dot · id · window | D-list. The extra line repeated information the grid already shows |
| Deck: meta band 48px + `rux-tabs` + cards with a provenance foot | Context **in the pane header** + native 32px tabs + cards without a foot | Header placement is fork 1. Native tabs per D-dots. The foot cost height and said nothing per card |
| NO_DATA hyphen `#51687D` | **`#62798E`** | `#51687D` is 2.43:1 on the surface, which fails WCAG 1.4.11 (3:1). `#62798E` is 3.11:1 and still reads quieter than any disc |
| Text-3 (my eye) | **`#8A96A1`** (4.66:1) | The panes' `#77828B` is 3.59:1. It passes as an icon colour, not as text |

Every R2 ruling still holds. That covers six statuses, NO_DATA as a hyphen, data beating the clock, the now
marker on a column boundary, roll-ups counted over elapsed samples, the minute mask (10px, ≥ 2-column pitch,
hour starts always labelled), the lattice tiers T0–T3 with the dense tier shedding T3, the ERROR banner as a
flow row, a 300ms tooltip, one solid selection ring and one dashed focus ring.

## 2. Unit List

- **Anatomy.** A sticky filter row (40px) holds a search field and a count. Below it, a listbox of 28px rows,
  each `[18px dot] [id] [window, right-aligned]`. The pane body is the scroller, so `position: sticky; top: 0`
  works without a wrapper. The filter row gains a soft bottom shadow only while the list is scrolled.
- **Window text.** A closed window reads `00:00–23:55Z`. An open window reads `06:00Z · running`, with "running"
  in text-1. A future window reads `scheduled 18:00Z`, and its dot is the hyphen because the unit has no
  elapsed samples. All tabular numerals. A window that crosses midnight is `22:00–04:00Z +1d`.
- **Count.** Unfiltered: `14 units`. Filtered: `18 of 90`. It is `aria-live="polite"`.
- **Filter.** Case-insensitive substring match on the ID. The matched run is drawn bold with a 2px underline
  (no colour, because colour is spent on statuses and selection). Empty result: "No units match 'xyz'" plus a
  Clear filter button, and the count reads `0 of 90`.
- **Order.** Natural by ID, no grouping. Sorting by status reorders the list under the operator as statuses
  tick, and grouping costs headers that 14 rows don't need. If 90-unit sites turn out to be common, revisit
  grouping by run state (running / done / scheduled). That is the one grouping I would consider.
- **Roll-up dot.** Worst status over the unit's elapsed samples, using the precedence in §8.4.
- **Selection model.** Arrow keys move the active option and do not select. Enter, Space or a click selects.
  This is the grid's contract (focus never moves selection), and it avoids fetching a unit on every key repeat.
- **Collapsed.** The panes' 24px rail with the rotated label "Units". Nothing else, by design of v2.

## 3. Details Deck

- **Context: in the pane header** (`rrPaneHeader` slot), right-aligned, reading `Gearbox · 04:15Z` followed by
  a status chip. This is fork 1 and a flagged deviation, argued in §8.1.
- **Tabs.** Native small tabs, 32px plus a 1px rule, one per Element. Each tab is a 12px dot and the name. The
  selected tab has text-1 at weight 500 and a 2px cyan underline inset 8px. If 7 long names don't fit, the
  strip scrolls horizontally and never wraps.
- **Tab persistence.** The active tab is kept by **element id** when the new sample has that element (F2 shows
  it). Otherwise it falls back to the **first tab, not the worst one**. The tab dots already point at the
  problem, and a deck that jumps on its own breaks the operator's arrow-key rhythm.
- **Cards.** Always **4 columns** (`repeat(4, minmax(0,1fr))`, rows 135px, gap 8, padding 10/12). A container
  query steps down to 3, 2 and 1 below roughly 1000, 760 and 500px. I did not use `auto-fill`: at 1582px it
  gives 6+2, and a fixed 4×2 keeps "Calibration Offset" in the same slot in every layout. **Cards stay in
  attribute order** (not mismatches first) for the same reason. When the deck is shorter than two rows, the card
  area scrolls (F2). It never squeezes a card.
- **Card anatomy.** Name (12px/500), with the flag right-aligned. EXPECTED and ACTUAL rows are pinned to the
  bottom, each with a 64px label (10px caps) and the value in 14px mono on a 24px line.
  **MISMATCH:** 3px critical inset edge, border `rgb(255 56 56/55%)`, the ACTUAL value in `#FF7A7A` on a 12% red
  tint (4.9:1 on the card), flag `◄ MISMATCH`. Expected stays neutral, so the change reads as a diff without
  borrowing VALID's green for "the old value".
  **MISSING:** flat (pane surface, not raised), dashed border, name in text-2, ACTUAL in italic text-3 reading
  "value not received", flag `MISSING`. It is muted rather than alarming.
- **States** (F4). Each state replaces the tabs and cards with one centred message.

  | State | Header context | Message |
  |---|---|---|
  | nothing selected | "No sample selected" in text-3 | **Select a cell in the grid**, then "Arrow keys move through the grid · Enter selects" |
  | future NO_DATA | `Gearbox · 18:30Z` + hyphen chip | **Not sampled yet — 18:30Z is in the future** |
  | PENDING | `Pitch System · 15:30Z` + blue chip | **Awaiting validation** |
  | ERROR | `Converter · 13:15Z` + amber chip | **Retrieval failed — no verdict for this sample**, plus a `Retry Converter` button |
  | ready | sample + chip | tabs + cards |

  No fetch happens for NO_DATA or ERROR (R2 annex R8 stands). The deck's Retry and the banner's Retry trigger
  the same component refetch. A loading skeleton was not asked for this round. Use the R2 one.
- **Collapsed.** The block pane collapses to its 30px header, and **the context stays visible**.

## 4. Token table: ship these as fallbacks

Pattern: `--sg-x: var(<Astro or panes token>, <fallback>)`. The Astro names are from memory, so **verify them
against 7.20.0**. The fallbacks are the values the mockup renders.

| Token | Reads (verify) | Fallback | Use |
|---|---|---|---|
| `--sg-base` | `--color-background-base-default` | `#101923` | behind the panes (gaps) |
| `--sg-surface` | `--rr-pane-surface` → `--color-background-surface-default` | `#1b2d3e` | pane body (measured) |
| `--sg-surface-sunken` | — | `#172735` | sticky time tiers (= panes header wash `rgb(0 0 0/14%)` composited) |
| `--sg-surface-raised` | — | `#21364a` | cards, chips |
| `--sg-field` | — | `#132230` | search field |
| `--sg-border` | `--rr-pane-border` | `rgb(150 190 220 / 14%)` | pane, card, row rules under bands |
| `--sg-border-strong` | — | `rgb(150 190 220 / 26%)` | gutter edge, field, chip, dashed MISSING card |
| `--sg-rule` | — | `rgb(150 190 220 / 8%)` | list row separators, hour-tier rule |
| `--sg-text-1` | `--rr-pane-text` | `#e6ebef` | primary (11.7:1) |
| `--sg-text-2` | `--rr-pane-text-dim` | `#9aa4ad` | secondary, card labels (5.6:1, 4.9:1 on raised) |
| `--sg-text-3` | — | `#8a96a1` | tertiary, surface only (4.66:1) |
| `--sg-accent` | `--rr-pane-focus` | `#67b9d4` | selection ring, list bar, tab underline, crosshair |
| `--sg-accent-tint` | — | `rgb(103 185 212 / 16%)` | selected row, crosshair cells |
| `--sg-focus` | `--rr-pane-focus` | `#67b9d4` | dashed focus rings (composite widgets), solid 2px outline (plain controls) |
| `--sg-hover` | `--rr-pane-control-hover` | `rgb(255 255 255 / 6%)` | hover everywhere; **never cyan** |
| `--sg-normal` / `caution` / `critical` / `serious` / `standby` | `--color-status-*` | `#56f000` / `#fce83a` / `#ff3838` / `#ffb302` / `#2dccff` | VALID / PARTIAL / INVALID / ERROR / PENDING |
| `--sg-nodata` | — | `#62798e` | the 8×2 hyphen (3.11:1) |
| `--sg-diff-ink` / `-tint` / `-edge` | — | `#ff7a7a` / `rgb(255 56 56/12%)` / `rgb(255 56 56/55%)` | MISMATCH |
| `--sg-serious-tint` | — | `rgb(255 179 2 / 10%)` | ERROR banner |
| `--sg-now` | — | `#dbe7f0` | now-marker, ribbon now tick |
| `--sg-lat-cell` / `-row` / `-row5` / `-hour` / `-anchor` | — | α 7.5% / 11.5% / 19% / 22% of `rgb(150 190 220)`; `#4e7392` | lattice T3 / T2 / dense 5-row / T1 / T0 (6h, 2px) |

Placement rule (annex A3) unchanged: static tokens go at `:root` in the global sheet so they survive PiP.

## 5. Exact sizes

| Part | Size |
|---|---|
| Pane header / rail / gap | 28 (border included) / 24 + 2 / 8, all from `RR_PANES_CONFIG`, never restated |
| Unit filter row | 40 high, padding 0 10, field 26 high, radius 3, 12px text; count 11px |
| Unit row | 28 high, padding 0 12 0 10, columns `18px 1fr auto`, gap 8; id 12px/500 (600 when selected); window 11px tabular |
| Grid meta row 1 / ribbon row | 28 / 22, padding 0 10; unit 13px/600; label/value 11px; legend gap 12 |
| DayRibbon | track 14 high, segments 6 high, 1px gaps, +3px before 06/12/18; bracket = track height, 1px; now tick 2px |
| ERROR banner | min 26, padding 2 10, 3px amber inset edge, 11px text, Retry 22 high |
| Hour tier / minute tier | 22 / 20; 10px tabular; hour label `04:00Z` (`04` if span < 3); tick on unlabelled columns 1×4 |
| Gutter / column / dot | 140 sticky / 18 / 12 disc in an 18 cell; hyphen 8×2 |
| Band | `clamp(18, floor((scrollerClientH − 22 − 20 − 16) / rows), 32)`; dense tier below 20 |
| End rule | 16, dashed top border, 10px label sticky at 8px |
| Selection ring / focus ring | 20×20 solid 2px, radius 3 / 26×26 dashed 2px, radius 4 (both centred on the dot) |
| Tooltip | 24 high, 11px, one line, 300ms delay, placed below the cell |
| Deck tab | 32 + 1 rule; padding 0 12 0 8; 12px; underline 2px inset 8 |
| Card | 135 high (≈269 wide at 1127), padding 10 12, radius 4; name 12/500; flag 10/600 caps; label column 64; value 14px mono / 24 line |
| Context chip | 20 high, radius 10, 10px/600 caps |

## 6. Interaction states

| Element | Hover | Focus | Selected | Selected + focus | Other |
|---|---|---|---|---|---|
| Grid cell | band fill `--sg-hover`; tooltip at 300ms | dashed 2px ring 26×26 (active descendant, only while the grid has focus) | solid 2px ring 20×20 + crosshair tint on hour, minute and row label; masked minute label forced on | both, nested | NO_DATA is focusable and selectable |
| Unit row | `--sg-hover` | dashed 2px inset ring | 3px cyan bar + 16% tint + id at 600 | both | filtered-out rows are removed, never disabled |
| Deck tab | text-1 + `--sg-hover` | dashed 2px ring | text-1/500 + 2px underline | both | arrows activate (payload already loaded) |
| Ribbon segment | 1px text-1 outline + tooltip `14:00–15:00Z · worst INVALID · click to scroll` | solid 2px outline | — | — | click scrolls the hour's first column to the left edge |
| Splitter | 45% cyan line | solid cyan | — | drag: solid cyan + resize cursor | inert beside a collapsed pane (no line, no cursor) |
| Field / buttons | — | **solid** 2px outline, offset 1 | — | — | — |

**Rule:** dashed means the keyboard position inside a composite widget that also has a solid selection. Solid
means ordinary control focus, which matches the panes. Only collapse animates (160ms). `prefers-reduced-motion`
removes it.

## 7. Accessibility

- **List:** `input[type=search][aria-controls=units-listbox]`, then
  `ul[role=listbox][aria-label=Units][tabindex=0][aria-activedescendant]` containing
  `li[role=option][id][aria-selected]`. Accessible name: "WTG-04, Invalid, 00:00 to 23:55 Zulu". The empty
  message is `role=status` outside the listbox.
- **Grid:** `div[role=grid][tabindex=0][aria-activedescendant][aria-rowcount][aria-colcount]`. The hour tier is
  `columnheader[aria-colspan=group.span]`. Rows contain a `rowheader` and `gridcell[id][aria-selected]`. Cell
  name: "Gearbox, 04:15 Zulu, Partial" or "Gearbox, 18:30 Zulu, no data, not due yet". With activedescendant
  (replacing R2's roving tabindex), three things follow. Every cell needs a stable id (`sg-{componentId}-{epoch}`,
  ≤ 2,880, fine without virtualisation). The dashed ring is drawn from state as `:focus-visible` on the grid
  plus an `.is-active` cell. `scrollIntoView({block:'nearest',inline:'nearest'})` has to be called on the
  active cell after each move, because the browser won't do it.
- **Deck:** `div[role=tablist][aria-label="Elements of Gearbox at 04:15Z"]` with `role=tab[aria-selected]
  [aria-controls]` and roving tabindex. `div[role=tabpanel][aria-labelledby]` holds `role=list` cards. Each
  card's text carries its flag ("mismatch" / "missing"), so status never depends on colour. State messages are
  `role=status`.
- **Contrast:** all text ≥ 4.5:1 (text-3 only on surface or sunken, never on raised cards). Hyphen, discs,
  rings and splitter ≥ 3:1.
- **Focus order:** Units toggle → filter → list → Grid toggle → ribbon → banner Retry → grid → Details toggle
  → tabs → cards region.

## 8. Where I disagree with, or extend, Axium's decisions

1. **The deck context belongs in the pane header, not a body strip.** *(Rendered as B; fork 1.)* Measured, the
   deck body is 353px and the strip version needs 359 (28 strip + 33 tabs + 270 cards + 8 gap + 20 padding).
   At the default split the second card row clips by 6px. In the header the body has 22px spare, and a
   collapsed deck still names the selection. Same content, and the slot already exists (§6.3).
2. **A DayRibbon segment showing the hour's worst status degenerates when a component fails.** *(F1 renders
   Axium's rule; fork 2-B is my recommendation.)* With one ERROR row, every elapsed hour is at least amber, so
   the ribbon repeats the banner and stops finding the INVALID/PARTIAL clusters. B colours by the worst
   **verdict** and adds a 3px amber underline to any hour containing ERROR. Related, and not fixed by B: at 20
   rows a max over about 80 samples per hour saturates whenever background incident rates are non-trivial (F3).
   If real data does that, the next step is a density encoding. I am not proposing it until the data says so.
3. **One accent token.** *(Fork 3.)* `#67b9d4` (the panes' value) is rendered. If the work app wants Astro
   `#4DACFF`, set `--rr-pane-focus` and `--sg-accent` together at `:root`. The thing to avoid is two blues.
4. **Roll-up precedence is unspecified. Proposed:** INVALID > ERROR > PARTIAL > VALID > PENDING, which is
   Astro's critical > serious > caution > normal > standby. This drives the unit dot, the ribbon and the tab
   dots. PENDING ranks lowest on purpose: a running unit's latest sample is almost always PENDING, and ranking it
   above VALID would turn every live unit blue. **Needs a ruling.**
5. **Lexicon overlap.** INVALID is "one or more attributes mismatched" and PARTIAL is "mixed / incomplete". A
   sample with 2 mismatches and 1 missing satisfies both, and F1's brief calls it PARTIAL. The feature must
   **render the API's status and never derive it**. Packet §1 needs one sentence on precedence.
6. **Cards: 4 fixed columns, not `auto-fill`.** This deviates slightly from "responsive grid". It protects
   spatial memory, and `auto-fill` at full width produces 6+2.
7. **Simplifications to confirm:** ghost rows, row micro-bars, the gutter RETRY pill and the NOW flag are all
   gone. The rails carry only the label. List selection does not follow focus.

## 9. Fidelity

Measured: footprint, disc, `#56F000`, `#1B2D3E`. Published, but unverified against 7.20.0: the other four
status fills. From the panes source: header, rail, gap, radius, header wash, border, pane text greys,
`#67b9d4`. My eye: the sunken, raised and field surfaces, the lattice alphas, the diff colours, the hyphen,
text-3, all type sizes inside the panes, and the tab and card geometry. Roboto isn't embedded, so line lengths
will shift a few px. Render-verified in headless Chromium with scrollbars on (Playwright hides them by default,
which skews the band by 12px): zero console errors, geometry as in the header above.
