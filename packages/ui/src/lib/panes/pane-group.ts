import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef,
  computed, contentChildren, forwardRef, inject, input, output, signal,
} from '@angular/core';
import { parseBasis } from './layout/basis';
import { buildTrackList, gapLine, itemLine } from './layout/tracks';
import { initialWeights, normalizeToPx, resetPair, resizePair } from './layout/weights';
import { RrPaneResizeHandle } from './pane-resize-handle';
import { RrPaneSizeStore } from './pane-size-store';
import { RR_PANES_CONFIG } from './panes.config';
import {
  RR_PANE_CONTAINER, RR_PANE_ITEM,
  type RrPaneContainer, type RrPaneItem, type RrPanePlacement,
} from './pane-item';
import type { RrPaneBasisInput, RrPaneOrientation } from './panes.types';

let nextGroupId = 0;

interface Boundary {
  readonly index: number;
  readonly line: string;
  readonly disabled: boolean;
  readonly label: string;
  readonly controls: string | null;
  readonly valueNow: number | null;
  readonly valueMin: number;
  readonly valueMax: number | null;
}

/**
 * `<rr-pane-group>` — arranges panes (and nested groups), and optionally lets the user
 * drag-resize them.
 *
 * Created: 2026-09-25
 *
 *   <rr-pane-group orientation="inline" resizable stateKey="status-grid">
 *     <rr-pane label="Units" basis="30%" [min]="240">…</rr-pane>
 *     <rr-pane-group orientation="block">
 *       <rr-pane label="Grid">…</rr-pane>
 *       <rr-pane label="Details">…</rr-pane>
 *     </rr-pane-group>
 *   </rr-pane-group>
 *
 * No dimension is ever passed in. The group fills its container, turns each item's basis
 * into a grid track, and lets CSS Grid do the arithmetic — so a container resize (including
 * PiP) needs no JavaScript. Nesting groups is how you get any arrangement.
 *
 * The group measures NOTHING until someone grabs a handle.
 */
@Component({
  selector: 'rr-pane-group',
  standalone: true,
  exportAs: 'rrPaneGroup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RrPaneResizeHandle],
  templateUrl: './pane-group.html',
  styleUrl: './pane-group.scss',
  providers: [
    { provide: RR_PANE_ITEM, useExisting: forwardRef(() => RrPaneGroup) },
    { provide: RR_PANE_CONTAINER, useExisting: forwardRef(() => RrPaneGroup) },
  ],
  host: {
    class: 'rr-pane-group',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-resizing]': 'resizingIndex() !== null ? "" : null',
    '[style.grid-template-columns]': 'isInline() ? trackList() : "minmax(0, 1fr)"',
    '[style.grid-template-rows]': 'isInline() ? "minmax(0, 1fr)" : trackList()',
    '[style.grid-column]': 'placement()?.column ?? null',
    '[style.grid-row]': 'placement()?.row ?? null',
    '[style.--rr-pane-duration.ms]': 'config.animationMs',
  },
})
export class RrPaneGroup implements RrPaneItem, RrPaneContainer {
  /** 'inline' = items side by side; 'block' = items stacked. Panes inherit it. */
  readonly orientation = input<RrPaneOrientation>('inline');
  /** Turn on drag / keyboard resizing between items. Defaults from config. */
  readonly resizable = input<boolean | null>(null);
  /** Px between items. Defaults from config. */
  readonly gap = input<number | null>(null);
  /** Persist sizes to localStorage under this key. Omit to keep sizes in memory only. */
  readonly stateKey = input<string | null>(null);

  // ── As an item of a parent group ──
  readonly basis = input<RrPaneBasisInput>('1fr');
  readonly min = input<number | null>(null);
  readonly max = input<number | null>(null);
  readonly label = input('');
  readonly groupId = input<string | null>(null);

  /** Emits the size weights when a resize settles. */
  readonly resized = output<readonly number[]>();

  protected readonly config = inject(RR_PANES_CONFIG);
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly parent = inject(RR_PANE_CONTAINER, { optional: true, skipSelf: true });
  private readonly generatedId = `rr-pane-group-${nextGroupId++}`;

  /** Direct items only — panes and nested groups, in declaration order. */
  protected readonly items = contentChildren(RR_PANE_ITEM);

  // ── RrPaneItem ──
  readonly itemId = computed(() => this.groupId() ?? this.generatedId);
  readonly itemLabel = computed(() => this.label());
  readonly regionId = computed<string | null>(() => null);
  readonly basisSpec = computed(() => parseBasis(this.basis()));
  readonly minSize = computed(() => this.min() ?? this.config.minPaneSize);
  readonly maxSize = computed(() => this.max());
  readonly isCollapsed = computed(() => false);
  readonly collapsedSize = computed(() => 0);

  protected readonly isInline = computed(() => this.orientation() === 'inline');
  protected readonly placement = computed(() => this.parent?.placementOf(this) ?? null);
  private readonly isResizable = computed(() => this.resizable() ?? this.config.resizable);
  private readonly gapPx = computed(() => this.gap() ?? this.config.gap);

  // ── Sizes ──
  /** Weights set by interaction. Null until the user resizes. */
  private readonly userWeights = signal<number[] | null>(null);
  /** True once weights are in px (after an interaction) — then valueNow is meaningful. */
  private readonly normalized = signal(false);
  protected readonly resizingIndex = signal<number | null>(null);
  private dragBase: number[] | null = null;

  private readonly store = computed(() => {
    const key = this.stateKey();
    return key ? new RrPaneSizeStore(this.config.storagePrefix + key) : null;
  });

  /** Restored layout. Read during the FIRST change detection, so a persisted layout paints
   *  on first render — no jump, and no transition animating the restore. */
  private readonly restored = computed(() => this.store()?.load(this.items().length) ?? null);

  private readonly declared = computed(() => initialWeights(this.items().map((i) => i.basisSpec())));

  /** Precedence: what the user did → what was persisted → what was declared. */
  readonly sizes = computed<readonly number[]>(() => {
    const count = this.items().length;
    const user = this.userWeights();
    if (user && user.length === count) return user;
    return this.restored() ?? this.declared();
  });

  protected readonly trackList = computed(() => {
    const weights = this.sizes();
    return buildTrackList(
      this.items().map((item, i) => ({
        basis: item.basisSpec(),
        weight: weights[i] ?? 1,
        collapsed: item.isCollapsed(),
        collapsedSize: item.collapsedSize(),
        min: item.minSize(),
      })),
      this.gapPx(),
    );
  });

  protected readonly boundaries = computed<Boundary[]>(() => {
    if (!this.isResizable()) return [];
    const items = this.items();
    const weights = this.sizes();
    const px = this.normalized();
    return items.slice(0, -1).map((item, i) => {
      const next = items[i + 1];
      return {
        index: i,
        line: String(gapLine(i)),
        // You cannot resize a rail: a handle beside a collapsed item is inert.
        disabled: item.isCollapsed() || next.isCollapsed(),
        label: `Resize ${item.itemLabel() || 'pane'}`,
        controls: item.regionId(),
        valueNow: px ? Math.round(weights[i]) : null,
        valueMin: item.minSize(),
        valueMax: item.maxSize(),
      };
    });
  });

  constructor() {
    // A drag end flushes explicitly; this catches a keyboard burst still inside the settle
    // window when the group is torn down.
    inject(DestroyRef).onDestroy(() => this.store()?.flush());
  }

  // ── RrPaneContainer ──
  placementOf(item: RrPaneItem): RrPanePlacement | null {
    const index = this.items().indexOf(item);
    if (index < 0) return null;
    const line = String(itemLine(index));
    return this.isInline() ? { column: line, row: '1' } : { column: '1', row: line };
  }

  // ── Imperative API — reachable as <rr-pane-group #g="rrPaneGroup"> ──
  collapseAll(): void {
    for (const item of this.items()) item.setCollapsed?.(true);
  }

  expandAll(): void {
    for (const item of this.items()) item.setCollapsed?.(false);
  }

  collapse(id: string): void {
    this.find(id)?.setCollapsed?.(true);
  }

  expand(id: string): void {
    this.find(id)?.setCollapsed?.(false);
  }

  toggle(id: string): void {
    const item = this.find(id);
    item?.setCollapsed?.(!item.isCollapsed());
  }

  /** Back to the declared bases, and forget any persisted layout. */
  resetSizes(): void {
    this.userWeights.set(null);
    this.normalized.set(false);
    this.store()?.clear();
  }

  // ── Handle events ──
  protected onResizeStart(index: number): void {
    this.dragBase = this.measure();
    if (this.dragBase) this.resizingIndex.set(index);
  }

  protected onResizeMove(index: number, delta: number): void {
    if (!this.dragBase) return;
    // Defensive (TrAIdit F3): if either neighbour collapsed mid-drag, stop resizing.
    const items = this.items();
    if (items[index]?.isCollapsed() || items[index + 1]?.isCollapsed()) {
      this.onResizeEnd();
      return;
    }
    this.userWeights.set(resizePair({ weights: this.dragBase, index, delta, ...this.bounds(index) }).weights);
  }

  protected onResizeEnd(): void {
    if (this.resizingIndex() === null && !this.dragBase) return;
    this.dragBase = null;
    this.resizingIndex.set(null);
    this.commit(true);
  }

  protected onResizeStep(index: number, delta: number): void {
    // Base on the STORED size, not re-measured DOM (TrAIdit F2): key-repeat outruns
    // rendering, and a stale measurement drops steps.
    const base = this.currentPx();
    if (!base) return;
    this.userWeights.set(resizePair({ weights: base, index, delta, ...this.bounds(index) }).weights);
    this.commit(false);
  }

  protected onResizeExtreme(index: number, to: 'min' | 'max'): void {
    const base = this.currentPx();
    if (!base) return;
    const bounds = this.bounds(index);
    const target = to === 'min' ? bounds.minBefore : Infinity;
    this.userWeights.set(resizePair({ weights: base, index, delta: target - base[index], ...bounds }).weights);
    this.commit(false);
  }

  protected onResizeReset(index: number): void {
    const base = this.currentPx();
    if (!base) return;
    this.userWeights.set(resetPair(base, this.items().map((i) => i.basisSpec()), index, this.bounds(index)));
    this.commit(true);
  }

  /** Measure on focus so aria-valuenow is correct even before any resize (TrAIdit F5). */
  protected onHandleFocus(): void {
    this.measure();
  }

  // ── Internals ──
  private find(id: string): RrPaneItem | undefined {
    return this.items().find((item) => item.itemId() === id);
  }

  private bounds(index: number) {
    const items = this.items();
    return {
      minBefore: items[index]?.minSize() ?? 0,
      maxBefore: items[index]?.maxSize() ?? null,
      minAfter: items[index + 1]?.minSize() ?? 0,
      maxAfter: items[index + 1]?.maxSize() ?? null,
    };
  }

  /** px weights for an interaction — measured once, then reused while they stay valid. */
  private currentPx(): number[] | null {
    const user = this.userWeights();
    return this.normalized() && user?.length === this.items().length ? user : this.measure();
  }

  /**
   * Re-express every weight in px from the rendered sizes. A visual no-op; it gives an
   * interaction a common unit. Returns null if the group is not laid out (hidden, detached,
   * server) — an interaction then simply does nothing rather than collapsing every item.
   */
  private measure(): number[] | null {
    const items = this.items();
    const axis = this.isInline() ? 'width' : 'height';
    const measured = items.map((item) => item.element.getBoundingClientRect()[axis]);
    const collapsed = items.map((item) => item.isCollapsed());
    if (!measured.some((px, i) => !collapsed[i] && px > 0)) return null;

    const weights = normalizeToPx(this.sizes(), items.map((i) => i.basisSpec()), collapsed, measured);
    this.userWeights.set(weights);
    this.normalized.set(true);
    return weights;
  }

  private commit(flush: boolean): void {
    const weights = this.userWeights();
    if (!weights) return;
    const store = this.store();
    store?.save(weights);
    if (flush) store?.flush();
    this.resized.emit(weights);
  }
}
