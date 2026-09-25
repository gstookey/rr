---
schema: corpus-doc/v1
status: active
title: UI-PANES-01 — Collapsible, resizable panes (v2) — implementation guide
areas: [frontend, ux, code]
governs: ["packages/ui/src/lib/panes/**"]
related: ["docs/design/packets/ui-panes-01-design-packet/README.md"]
updated: 2026-09-25
---

# Collapsible, resizable panes — v2 implementation guide

**Created:** 2026-09-25 | **Author:** Axium | **Status:** `active` — built, tested and browser-verified on
Angular 22 and 17.3; pending Graham's merge
**Source of truth:** `packages/ui/src/lib/panes/` · **API reference:** that folder's `README.md`

---

## How to read this guide

It is written **bottom-up**. Each layer depends only on the ones before it, so you can build — or
review — in the same order, and every layer is usable and tested on its own:

| § | Layer | What it is | Depends on |
|---|---|---|---|
| 2 | **L0** | Types, config, the two DI contracts | — |
| 3 | **L1** | Pure layout math | L0 |
| 4 | **L2** | Size persistence | L1 |
| 5 | **L3** | The resize handle | L0 |
| 6 | **L4** | `<rr-pane>` | L0, L1 |
| 7 | **L5** | `<rr-pane-group>` | L0–L4 |
| 8 | **L6** | Your utility window, composed | L5 |

**This guide explains the source; it does not copy it.** v1's guide and its companion spec drifted
apart on eight figures because the same content lived in two places. Here the code is the single
source of truth. Excerpts below are short and exist to show a decision, not to be pasted.

---

## 1. What you are building

Three pieces:

- **`<rr-pane>`** — a header bar, a toggle and a body. Collapses.
- **`<rr-pane-group>`** — arranges panes side by side or stacked, and optionally lets the user
  drag-resize them. **Nest groups to get any arrangement.**
- **`[rrPaneResizeHandle]`** — the splitter the group places between items. You never write it.

The whole model in one sentence:

> **Each item becomes one CSS Grid track, and the browser does the arithmetic.**

An expanded flexible pane is the track `minmax(<min>px, <weight>fr)`; a fixed one is
`minmax(<min>px, <weight>px)`; a collapsed one is its collapsed size with a zero growth factor. CSS
Grid distributes the space. So:

- **No dimension is ever passed in.** The root group fills its container.
- **A container resize — including a PiP relocation — runs no JavaScript.** There is no
  `ResizeObserver`, which also dissolves v1's open question about observers surviving relocation.
- **Collapse needs no redistribution math.** A collapsed track stops growing; Grid hands its space to
  the siblings, and returns it on expand.
- **The group measures nothing until someone grabs a handle.**

### Your four v2 asks, and where each is answered

| Ask | Answer | § |
|---|---|---|
| Chevron position as an input | `chevronPosition: 'start' \| 'end'`. No `'center'` — ruled out (C) | 6.4 |
| Block-collapsed keeps its title in the bar | Block collapses to its header bar; only the body goes | 6.5 |
| Merge or separate the arranger | Separate, but the **group** does all the work | 7 |
| No sizes duplicated across places | Grid does the math; every number lives once, in config | 9 |
| *(D)* Drag-to-resize, built from day one | `[resizable]="true"` on any group | 5, 7 |

---

## 1.1 Where it lives, and the version fence

It lives in **`@rr/ui`** (`packages/ui/src/lib/panes/`), which `rr` charters as *presentational
primitives only*. It is its own Sheriff module (`type:ui`), so the rest of `@rr/ui` reaches it only
through its public API.

**Two consumers, one set of files.** `rr` is Angular 22; your work app is 17.3.12. A package built
by v22's ng-packagr cannot be consumed by 17.3 — partial compilation links forward, not backward. So
the source is written strictly to the **API intersection of 17.3 and 22**:

- **Today, on 17.3:** copy `packages/ui/src/lib/panes/` into the app (skip `*.spec.ts` — they use
  `rr`'s Vitest runner). Nothing needs editing.
- **After the upgrade:** delete the copy and `import { RrPane, RrPaneGroup } from '@rr/ui'`.

What the intersection rules out, and what the source does instead:

| Not available at 17.3 | Instead |
|---|---|
| `<ng-content>` fallback content (18) | No slot needs a default — the title always comes from `label` |
| `@let` (18.1), `linkedSignal` (19/20) | Plain `computed()` |
| Timing-dependent `effect()` (v19 moved input-triggered effects before the template) | The one effect uses **non-required** view queries, so an early run returns instead of throwing |
| `standalone` default (19) | `standalone: true` written explicitly — legal and silent at 22 |

**Verified, not asserted** — see §10.

---

## 2. L0 — contracts and configuration

### 2.1 Types · `panes.types.ts`

`RrPaneOrientation = 'inline' | 'block'` names **the axis that collapses**, in logical-property
words: `inline` panes sit side by side and collapse to a vertical rail; `block` panes stack and
collapse to their header bar. "Horizontal pane" was rejected: it is ambiguous whether the pane, the
collapse direction or the resulting rail is horizontal.

`RrChevronPosition = 'start' | 'end'`. There is deliberately no `'center'` (ruling C): a collapse
affordance belongs at the edge the pane collapses toward.

### 2.2 Configuration · `panes.config.ts`

**Every number the panes need exists exactly once** — in `RR_PANES_CONFIG`:

| Key | Default | Used for |
|---|---|---|
| `gap` | `8` | px between items; the splitter's track when resizable |
| `headerSize` | `28` | header height, **and** the block-collapsed size (+ border) |
| `railSize` | `24` | inline-collapsed rail width (+ border) |
| `minPaneSize` | `80` | default `min` for an expanded pane |
| `resizable` | `false` | default for groups |
| `keyboardStep` / `keyboardStepLarge` | `16` / `64` | arrow / Shift+arrow |
| `animationMs` | `160` | collapse transition; `prefers-reduced-motion` always wins |
| `storagePrefix` | `'rr-panes:'` | localStorage key prefix |

Why this fixes v1's drift: the pane sizes its header from `headerSize`, and reports its collapsed
size as `headerSize + border` — so the **group's collapsed track and the pane's header come from
one value and cannot disagree.** In v1 the rail width lived in component CSS *and* in parent
arithmetic, and they drifted.

Override it at whatever level fits:

```ts
// app-wide, at bootstrap
providers: [provideRrPanes({ gap: 6, headerSize: 32 })]

// from runtime configuration (helm values, env, a config service) — a factory runs in an
// injection context, so nothing is hard-coded
providers: [provideRrPanes(() => inject(RuntimeConfig).panes)]

// for one subtree only — it returns a plain Provider, not EnvironmentProviders
@Component({ providers: [provideRrPanes({ gap: 4 })], … })
```

…or per instance: `<rr-pane-group [gap]="4">`, `<rr-pane [min]="200" [headerSize]="32">`.

### 2.3 The two DI contracts · `pane-item.ts`

A group must arrange **panes and nested groups** without either file importing the other:

- **`RR_PANE_ITEM`** — anything a group can arrange. Both `<rr-pane>` and `<rr-pane-group>` provide
  themselves under it; a group finds its children with `contentChildren(RR_PANE_ITEM)`.
- **`RR_PANE_CONTAINER`** — anything that arranges. A child finds its parent with
  `inject(RR_PANE_CONTAINER)`; a nested group uses `skipSelf` so it finds its parent, not itself.

Tokens rather than classes: no import cycle, and nesting to any depth needs no new API.

---

## 3. L1 — the layout math · `layout/`

Pure, Angular-free functions. **All of the sizing behaviour is decided here**, which is why it has
the most tests.

### 3.1 Two kinds of item, chosen by the unit you write

| You write | Kind | Track | On container resize |
|---|---|---|---|
| `basis="280px"` (or `280`) | **fixed** | `minmax(<min>px, <w>px)` | holds its width |
| `basis="30%"` or `"1fr"` | **flex** | `minmax(<min>px, <w>fr)` | shares what fixed items leave |

That is the ordinary desktop layout — a fixed sidebar beside a flexible main area. An early draft
made every item proportional, including `280px`; it was corrected before anything depended on it,
because it broke exactly that layout and made `max` unenforceable as a container grew. The
correction is its own commit, so the reasoning stays in the log.

### 3.2 Initial weights need no measurement · `initialWeights()`

```
[30%, 1fr]    → [30, 70]     the fr item takes what the % items leave
[1fr, 3fr]    → [25, 75]
[280px, 1fr]  → [280, 100]   fixed stays px; the lone flex item takes all flex space
```

So **the first render — and server rendering — is already the final layout.** No measure-then-swap,
no flash.

### 3.3 Why a track never changes type · `itemTrack()`

A grid track list only animates if both sides have the same number of tracks **and** each track
pair is interpolable. Browser-verified:

| Transition | Animates? |
|---|---|
| `minmax(px, fr)` ↔ `minmax(px, 0fr)` — flex collapse | **yes** (298 → 175 → 26) |
| `minmax(px, px)` ↔ `minmax(px, 0px)` — fixed collapse | **yes** (280 → 140 → 26) |
| `minmax(px, fr)` ↔ plain `px` | **no — snaps, silently, with no error** |

So a flex item is `minmax(px, fr)` whether collapsed or not, and a fixed item is `minmax(px, px)`
whether collapsed or not. A spec pins this: *"never changes a track type between collapsed and
expanded."*

Gaps are tracks too — `item gap item gap item` — because a splitter has to be **placed** in the gap,
and a grid item cannot be placed inside the CSS `gap` property.

### 3.4 Resizing moves space between exactly two neighbours · `resizePair()`

A drag or key press moves the boundary between item *k* and *k+1*. Their **combined size is
conserved**, so no third item moves. The delta is clamped so that *neither* item leaves its own
`[min, max]`; if both sets of constraints cannot be met, nothing moves rather than violating either.

Before an interaction the group **normalises** every weight to px (`normalizeToPx()`) — a visual
no-op that gives both kinds of item a common unit. A collapsed flex item's remembered weight is
rescaled with its siblings, so it returns at the size it left at.

### 3.5 Reset · `resetPair()`

Double-click or Enter restores one pair to its declared proportions, still conserving the pair — so
resetting one splitter never moves another pane. Between two **fixed** items the one *before* the
handle returns to its declared px and the other takes the rest; both are exact only if the pair
still sums to both bases, which a resize at a neighbouring handle may have changed.

---

## 4. L2 — persistence · `pane-size-store.ts`

Set `stateKey` on a group and its sizes survive reloads. The rules were each paid for once in
TrAIdit's workstation:

- **Writes settle** (200 ms) instead of hitting storage on every pointermove; **a drag end flushes**,
  so the final position is never lost to the debounce.
- **A stored layout is validated** — wrong length, zero, `NaN`, foreign shape → discarded, not rendered.
- **Storage failure is a silent no-op** (private mode, quota, disabled).
- **Nothing runs on the server.**
- **A size is saved with its item's id**, so it follows its pane if the order changes. That needs
  ids that are stable across reloads: give panes a `paneId`, and nested groups a `groupId`. Without
  them, generated ids are assigned in render order and restore degrades to exactly positional.
- **Changing `stateKey` switches layouts.** Anything still settling for the old key is written under
  the old key at once, and the new key's saved sizes (or the declared ones) apply. The same flush
  runs when the group is destroyed.

Weights are unitless, so a layout saved on a large monitor restores proportionally on a laptop.

A persisted layout is read **during the first change detection**, so it paints on the first frame —
no jump, and no transition animating the restore (verified: first frame = settled size).

---

## 5. L3 — the resize handle · `pane-resize-handle.ts`

WAI-ARIA **window splitter**: `role="separator"`, focusable, with `aria-valuenow/min/max` and
`aria-orientation`. It emits intent; the group owns sizes.

| Input | Action |
|---|---|
| Drag | Moves the boundary. Pointer capture keeps a fast drag working off the handle |
| ← → (inline) / ↑ ↓ (block) | Step `keyboardStep` px. Arrows follow the screen, including RTL |
| Shift + arrow | Step `keyboardStepLarge` px |
| Home / End | Item before the handle to its min / max |
| Enter, double-click | Reset the pair to its declared split |

Carried from TrAIdit: the delta is measured from the **drag start**, not accumulated per event, so it
cannot drift; a handle beside a collapsed pane is inert (you cannot resize a rail); keyboard steps
work from the **stored** size, because key-repeat outruns rendering and a stale measurement drops
steps; `aria-valuenow` is measured on focus so it is correct before any resize.

**The splitter moves instantly; only collapse animates.** Found in the browser: keyboard steps first
ran through the collapse transition, so a held arrow key rubber-banded and for 160 ms the screen
disagreed with the value a screen reader had just announced.

**Zone.js and zoneless, identically.** Listeners are host bindings, not `addEventListener`, which is
what makes them trigger change detection under zone.js (17.3) and work zoneless (22) with no code
difference.

---

## 6. L4 — the pane · `pane.ts`

### 6.1 Collapsed state: intent and force, kept apart

```ts
readonly collapsed = model(false);                                  // the user's intent
readonly forceCollapsed = input(false);                             // an overlay
readonly isCollapsed = computed(() => this.forceCollapsed() || (this.collapsible() && this.collapsed()));
```

`model()` is a signal that is simultaneously an input and an output. One declaration gives four ways in:

```html
<rr-pane label="A">                                  <!-- uncontrolled: owns its state -->
<rr-pane label="B" [collapsed]="true">               <!-- seeded -->
<rr-pane label="C" [(collapsed)]="isCollapsed">      <!-- two-way, with a WritableSignal -->
<rr-pane label="D" (collapsedChange)="log($event)">  <!-- listen only -->
```

With `[(collapsed)]` bound to a signal there is only **one value**, so parent and pane cannot
disagree. `forceCollapsed` is the precedence rule: forcing a pane shut — say, a narrow container —
does **not** write `collapsed`, so when the force lifts the pane returns to exactly what the user last
chose. The group's `collapseAll()` / `expand(id)` *do* write `collapsed`, because those are user actions.

### 6.2 Size, as an item of a group

`basis`, `min` and `max`, per §3.1. The pane never **decides** its own size or position: in a group it
reflects the track and grid line its group assigns; alone, it takes what its container gives it.

### 6.3 Header slot

```html
<rr-pane label="Units">
  <button rrPaneHeader (click)="openFilter()">Filter</button>
  …body…
</rr-pane>
```

`select="[rrPaneHeader]"` matches the attribute structurally — **there is no directive to import**, so
no NG8113 "unused import" warning and no forgotten-import footgun (both of which v1's marker
directives had).

### 6.4 Chevron position

`chevronPosition: 'start' | 'end'`, defaulting to `start` for block and `end` for inline. The chevron
always **points where the pane will go**: block ⌃ to collapse, ⌄ to expand; an inline pane with its
chevron at the end (a left sidebar) ‹ to collapse, › to expand — mirrored at the start (a right
sidebar). `end` moves only the toggle; title and actions keep their order.

The rotations were **browser-verified** because reasoning gets them 90° wrong: with
`border-inline-end` + `border-block-end`, `45°→⌄  135°→‹  225°→⌃  315°→›`.

### 6.5 Collapsed presentation follows orientation

- **Block** — only the body goes. The header — title, toggle, actions — is unchanged, so the chevron
  does not move. Collapsed height is exactly `headerSize + 2` (verified: 30 px, chevron x unchanged).
- **Inline** — a rail of `railSize + 2`, the toggle centred on top and the label rotated below.

The rotation is on the rail **container**, not the label: `writing-mode` is inherited, and inheritance
crosses Angular's view encapsulation where selector matching cannot. `flex-direction: row` on it is
deliberate — under `vertical-rl` a row runs top-to-bottom.

### 6.6 Focus rescue

Collapsing while focus is inside the body would drop a keyboard user to `<body>` once the body goes
inert, so focus moves to the toggle first. Rebuilt to close all three holes v1's audit found:

| v1 hole | v2 |
|---|---|
| `viewChild.required` in an input-triggered effect throws at v19+ | non-required queries; an early run returns |
| `document.activeElement` stops at a shadow host | reads the host's **root node** |
| ran on the server | browser-only |

The body stays **mounted** while collapsed — destroying it loses scroll offsets, focus, and the state
of anything inside it (tabs, iframes, canvases).

### 6.7 Template-ref naming

Refs are `#toggleBtn`, `#headerEl`, `#bodyEl` — never a member's name. A template reference variable
**shadows** a component member, so `#toggle` + `(click)="toggle()"` calls the `<button>` element: a
runtime `TypeError` with no compile error (v1 shipped this).

---

## 7. L5 — the group · `pane-group.ts`

### 7.1 What it does

1. Finds its **direct** items with `contentChildren(RR_PANE_ITEM)` — panes, nested groups, and
   panes produced by `@if` / `@for` (verified). A nested group is **one** item; its panes are its own.
2. Turns their bases into one grid track each (§3), placing item *i* on line `2i+1`.
3. When `resizable`, places a splitter in each gap track.
4. Owns every size. Precedence: **what the user did → what was persisted → what was declared.**
   What the user did is recorded against the items it was done *to*: if the items reorder, each
   size moves with its own pane; if one is added or removed, the user sizes lapse and the
   persisted or declared ones apply.

### 7.2 Imperative API

`exportAs: 'rrPaneGroup'`:

```html
<rr-pane-group #layout="rrPaneGroup" …>…</rr-pane-group>
<button (click)="layout.collapseAll()">Collapse all</button>
```

`collapseAll()`, `expandAll()`, `collapse(id)`, `expand(id)`, `toggle(id)`, `resetSizes()`. **All of
them reach into nested groups** — "collapse all" on a layout root means every pane in it. (Found in
the browser: it originally stopped at direct children.)

`sizes` is a readable signal and `resized` emits when a resize settles, for apps that want to persist
layouts themselves.

### 7.3 What it measures, and when

Nothing, until a handle is grabbed or focused. Then it reads each item's rendered size **once** and
works from that. If the group is hidden or detached (everything measures zero), the interaction does
nothing — rather than normalising every pane down to its minimum.

---

## 8. L6 — your utility window

This is the Status Grid window, composed. It was built and run against the packaged library (Angular
22) and the identical source (Angular 17.3.12, zone.js) — §10.

```ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RrPane, RrPaneGroup } from '@rr/ui';   // on 17.3: the path you copied the folder to

@Component({
  selector: 'app-status-grid-window',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RrPane, RrPaneGroup],
  template: `
    <rr-pane-group #layout="rrPaneGroup" orientation="inline" [resizable]="true" stateKey="status-grid">

      <rr-pane label="Units" paneId="units" basis="30%" [min]="200" [(collapsed)]="unitsCollapsed">
        <button rrPaneHeader (click)="openFilter()">Filter</button>
        <app-unit-list />
      </rr-pane>

      <rr-pane-group orientation="block" [resizable]="true" label="Grid and details">
        <rr-pane label="Status Grid" paneId="grid" [(collapsed)]="gridCollapsed">
          <app-status-grid />
        </rr-pane>
        <rr-pane label="Details" paneId="deck" [(collapsed)]="deckCollapsed">
          <app-details-deck />
        </rr-pane>
      </rr-pane-group>

    </rr-pane-group>
  `,
  styles: [`:host { display: block; height: 100%; }`],
})
export class StatusGridWindow {
  protected readonly unitsCollapsed = signal(false);
  protected readonly gridCollapsed = signal(false);
  protected readonly deckCollapsed = signal(false);
  protected openFilter(): void { /* … */ }
}
```

**What is absent is the point.** No `1618`, no `773`, no track arithmetic, no `ResizeObserver`, no
rail constant. The only size in the whole feature is the utility window's own, which your window
system owns. The one line of CSS — `:host { height: 100% }` — lets the root group fill the window's
content box.

### 8.1 Wiring it to your app store

The collapse signals above are local for clarity. To keep them in your signal store, bind store
signals instead — `[(collapsed)]` needs a `WritableSignal`, or split it:

```html
<rr-pane label="Units" [collapsed]="store.unitsCollapsed()" (collapsedChange)="store.setUnitsCollapsed($event)">
```

One v1 rule still applies to the window surface itself: **`selectedUnitId` comes from the store, never
a surface `input()`** — the window host binds inputs once. Nothing about the panes changes that.

### 8.2 What the verification measured on this exact window

At 1620×810: Units at 30% (478 px), grid and details 379 px each; collapsing Units animated
478 → 179 → 26 px and gave the space to the right-hand stack; collapsing the grid produced a 30 px
bar with the title kept and the chevron unmoved; at 800×500 the same layout reflowed to 232 / 542 with
no code running.

---

## 9. Sizing: the answer to "where is 773?"

v1 made you edit `773` in every place the window's height had been copied. In v2 there are exactly
three kinds of number, and each lives in one place:

| Number | Lives in | You change it by |
|---|---|---|
| The window's size | your window system | nothing in this feature |
| Pane intent (`basis`, `min`, `max`) | the template, per pane | editing that pane |
| Chrome (`gap`, `headerSize`, `railSize`, …) | `RR_PANES_CONFIG` | `provideRrPanes()` — from helm/env if you like |

Everything else is computed by the browser at render time. Change the window height and **nothing in
the feature changes**.

---

## 10. Verification record

**Unit tests — 61, Vitest/jsdom, in `rr`:** layout math (27), persistence (7), pane (9), group (18,
incl. `@for` panes, nested discovery, first-frame restore, sizes following a reorder, switching
`stateKey`, and destroy cancelling a pending frame). jsdom has **no layout engine** — grid tracks
don't compute and sizes are zero — so these cover behaviour, state and accessibility, stubbing sizes
where a test needs them.

**Browser — Chromium, Playwright, the same script against both builds:**

| Check | Angular 22 · zoneless · packaged | Angular 17.3.12 · zone.js · copied source |
|---|---|---|
| 30% / 50–50 initial layout | ✓ | ✓ |
| Drag ±120 / ±80, pair conserved, third pane untouched | ✓ | ✓ |
| Clamp at the 80 px minimum | ✓ | ✓ |
| Keyboard 16 / Shift −64; `aria-valuenow` = rendered width | ✓ | ✓ |
| Double-click reset to exactly 30.0% | ✓ | ✓ |
| Persist → reload → identical on the first frame | ✓ | ✓ |
| Collapse-all reaches nested panes; expand-all restores sizes | ✓ | ✓ |
| Reflow at 800×500 with no code running | ✓ | ✓ |

The 17.3 run confirmed zone.js was genuinely loaded (`Zone.current`, `ng-version 17.3.12`), and the
copied source was checked byte-identical to `rr`'s.

**Gates:** `ng build ui` (ng-packagr, partial compilation), typecheck, ESLint (incl. angular-eslint
selector prefixes), Sheriff — all green.

**Review round (Verin).** No blockers; three real gaps fixed, each with a test shown **failing
against the pre-fix source** before it passed: (1) the keyboard resize's two chained animation
frames were not cancelled on destroy; (2) changing `stateKey` left the old key's settling write to
an orphaned timer; (3) user and persisted sizes were positional, so reordering panes moved a size
onto the wrong pane — now keyed by identity in memory and by id in storage. The fixes added an
`effect()` cleanup, so both browser suites were re-run: identical results on 22 and 17.3.12, and
17.3's effect source was read to confirm the cleanup runs before a re-run and on destroy.

---

## 11. Invariants — do not lose these

1. **A pane never decides its own size or position.** The group assigns; the pane reflects.
2. **Every number lives once, in config.** The collapsed track derives from the header's own size.
3. **A track never changes type** between collapsed and expanded — or collapse silently stops animating.
4. **A resize conserves the pair.** No third pane ever moves.
5. **The splitter moves instantly; only collapse animates.**
6. **`forceCollapsed` never writes `collapsed`.** Force is an overlay; intent survives it.
7. **The body stays mounted** while collapsed.
8. **Focus moves before the body goes inert**, read from the root node, never on the server.
9. **Template refs never share a member's name.**
10. **Anything imposed on projected content is an inherited property on a container** — never a
    selector aimed at the projected node.
11. **No deep imports.** Everything a consumer needs is on the public API.
12. **Source stays inside the 17.3 ∩ 22 API intersection** until the 17.3 app has upgraded.

---

## 12. Troubleshooting

| Symptom | First suspect |
|---|---|
| The group renders at zero height | Its container has no height. `:host { display: block; height: 100% }` on the host, and a sized ancestor |
| Collapse snaps instead of animating | A track changed type — check a custom `basis` isn't mixing kinds mid-life; or `prefers-reduced-motion` is on |
| A drag does nothing | A neighbour is collapsed (the handle is inert), or the group is not laid out yet |
| "Collapse all" misses a pane | The pane is not an item — wrapped in a plain `<div>` rather than direct, `@if` or `@for` |
| Persisted sizes ignored | Item count changed since they were saved (deliberately discarded), or a different `stateKey` |
| A saved size restores onto the wrong pane after reordering | The items have no stable ids — give each pane a `paneId` and each nested group a `groupId` |
| `TypeError: <x>_rN is not a function` | A template ref shadows a member — rename the ref |

---

## 13. Known limitations

- **A flex pane's `max` is enforced during resizing, not as the container grows** — `fr` has no cap.
  Use a fixed (`px`) basis for anything that must never exceed a width.
- **Reset between two fixed items** restores only the one before the handle exactly (§3.5).
- **No drag-to-collapse snap** (dragging a pane below its minimum does not collapse it). A natural
  next feature; the pairwise model has room for it.
- **`content-visibility`** is Baseline since September 2024. Where unsupported the body still
  collapses (size 0 + `inert`); only the rendering saving is lost.
- **RTL:** drag and keyboard follow the screen; horizontal chevrons flip via `:host-context([dir=rtl])`.
  Not browser-verified in an RTL document.
