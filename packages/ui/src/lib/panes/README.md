# `@rr/ui` panes

**Created:** 2026-09-25 | **Status:** built and verified; pending merge
**Guide:** [`docs/design/packets/ui-panes-01-design-packet/ui_panes_implementation_guide_v1.md`](../../../../../docs/design/packets/ui-panes-01-design-packet/ui_panes_implementation_guide_v1.md)

Collapsible, drag-resizable panes in any arrangement. Two components and one directive; no
dimension is ever passed in.

```ts
import { RrPane, RrPaneGroup } from '@rr/ui';
```

```html
<rr-pane-group orientation="inline" [resizable]="true" stateKey="status-grid">
  <rr-pane label="Units" basis="30%" [min]="200" [(collapsed)]="unitsCollapsed">…</rr-pane>

  <rr-pane-group orientation="block" [resizable]="true">
    <rr-pane label="Status Grid">…</rr-pane>
    <rr-pane label="Details">…</rr-pane>
  </rr-pane-group>
</rr-pane-group>
```

The group fills its container. Give the container a size and nothing else.

## `<rr-pane>`

| Input | Type | Default | |
|---|---|---|---|
| `label` | `string` | **required** | Header title, rail label, toggle's accessible name |
| `collapsed` | `model<boolean>` | `false` | User intent. `[(collapsed)]="signal"` for two-way |
| `forceCollapsed` | `boolean` | `false` | Overlay that never writes `collapsed`; disables the toggle |
| `collapsible` | `boolean` | `true` | `false` hides the toggle |
| `chevronPosition` | `'start' \| 'end'` | block → `start`, inline → `end` | |
| `basis` | `number \| string` | `'1fr'` | `280` / `'280px'` fixed · `'30%'` / `'1fr'` flex |
| `min` / `max` | `number` | config / none | px along the group axis |
| `paneId` | `string` | generated | For ARIA and `group.collapse(id)` |
| `orientation` | `'inline' \| 'block'` | `'block'` | Only used outside a group |
| `headerSize` / `railSize` | `number` | config | Per-pane override |

Output: `collapsedChange`. Methods: `toggle()`, `expand()`, `collapse()`. `exportAs: 'rrPane'`.
Slot: `<button rrPaneHeader>` puts extra content in the header.

## `<rr-pane-group>`

| Input | Type | Default | |
|---|---|---|---|
| `orientation` | `'inline' \| 'block'` | `'inline'` | Items side by side, or stacked. Panes inherit it |
| `resizable` | `boolean` | config (`false`) | Drag and keyboard splitters between items |
| `gap` | `number` | config (`8`) | px between items; the splitter's track when resizable |
| `stateKey` | `string` | none | Persist sizes to localStorage under this key. Changing it switches layouts |
| `basis` / `min` / `max` / `label` | | | As a nested item of a parent group |

Output: `resized` (size weights). Signal: `sizes`. `exportAs: 'rrPaneGroup'`:
`collapseAll()`, `expandAll()`, `collapse(id)`, `expand(id)`, `toggle(id)`, `resetSizes()` — all
reach into nested groups.

Sizes belong to panes, not positions: reorder the items and each size moves with its own. For that
to survive a reload, give panes a `paneId` and nested groups a `groupId`.

## Configuration — every number lives in one place

```ts
providers: [provideRrPanes({ gap: 6, headerSize: 32 })]                // static
providers: [provideRrPanes(() => inject(RuntimeConfig).panes)]          // from helm / env
```

Also usable in a component's own `providers` to re-theme one subtree.

## Theming

CSS custom properties, all read with fallbacks: `--rr-pane-surface`, `--rr-pane-header-surface`,
`--rr-pane-border`, `--rr-pane-radius`, `--rr-pane-text`, `--rr-pane-text-dim`,
`--rr-pane-text-muted`, `--rr-pane-control-hover`, `--rr-pane-focus`, `--rr-pane-handle-hover`,
`--rr-pane-handle-active`. `--rr-pane-header-size`, `--rr-pane-rail-size` and
`--rr-pane-duration` are set by the components from config — change them through config.

## Version support

Written to the API intersection of **Angular 17.3 and 22**, and verified on both: the packaged
library at 22 (zoneless) and the identical source at 17.3.12 (zone.js). An app on 17.3 copies
this folder; an app on 22 imports `@rr/ui`.
