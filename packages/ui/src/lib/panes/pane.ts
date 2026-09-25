import {
  ChangeDetectionStrategy, Component, ElementRef, PLATFORM_ID,
  computed, effect, forwardRef, inject, input, model, viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { parseBasis } from './layout/basis';
import { RR_PANES_CONFIG } from './panes.config';
import { RR_PANE_CONTAINER, RR_PANE_ITEM, type RrPaneItem } from './pane-item';
import type { RrChevronPosition, RrPaneBasisInput, RrPaneOrientation } from './panes.types';

let nextPaneId = 0;
/** The pane's border. Part of its collapsed size, so it lives next to the arithmetic. */
const BORDER_PX = 1;

/**
 * `<rr-pane>` — a collapsible pane: header bar, toggle, body.
 *
 * Created: 2026-09-25
 *
 *   <rr-pane label="Filters">…</rr-pane>                          uncontrolled — just works
 *   <rr-pane label="Units" [(collapsed)]="unitsCollapsed">…       two-way, with a signal
 *   <rr-pane label="Log" [forceCollapsed]="narrow()">…             forced shut, intent kept
 *
 * THE INVARIANT: a pane never DECIDES its own size or position. Inside a group it reflects
 * the track and placement its group assigns; on its own it takes whatever its container
 * gives it. That is what keeps it content- and layout-agnostic.
 *
 * COLLAPSED STATE is two things, deliberately kept apart:
 *   `collapsed`       — a model(): the USER's intent. Two-way bindable. Survives everything.
 *   `forceCollapsed`  — an overlay, e.g. "the container is too narrow". Forcing a pane shut
 *                       does NOT write `collapsed`, so when the force lifts the pane returns
 *                       to exactly what the user last chose.
 * What renders is their union: `isCollapsed = forceCollapsed || collapsed`.
 *
 * Presentation follows orientation (inherited from the group when there is one):
 *   block  → collapses to its header bar; the title stays in the bar.
 *   inline → collapses to a narrow rail carrying the label, rotated.
 */
@Component({
  selector: 'rr-pane',
  standalone: true,
  exportAs: 'rrPane',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pane.html',
  styleUrl: './pane.scss',
  providers: [{ provide: RR_PANE_ITEM, useExisting: forwardRef(() => RrPane) }],
  host: {
    class: 'rr-pane',
    '[attr.data-orientation]': 'resolvedOrientation()',
    '[attr.data-collapsed]': 'isCollapsed() ? "" : null',
    '[attr.data-chevron]': 'chevronAt()',
    '[style.grid-column]': 'placement()?.column ?? null',
    '[style.grid-row]': 'placement()?.row ?? null',
    '[style.--rr-pane-header-size.px]': 'headerPx()',
    '[style.--rr-pane-rail-size.px]': 'railPx()',
  },
})
export class RrPane implements RrPaneItem {
  /** Text for the header, the rail and the toggle's accessible name. Plain text. */
  readonly label = input.required<string>();
  /** Stable id for ARIA and for the group's imperative API. Generated if omitted. */
  readonly paneId = input<string | null>(null);
  /** User intent. Two-way bindable: `[(collapsed)]="signal"`. */
  readonly collapsed = model(false);
  /** Forces the pane shut without touching `collapsed`. Disables the toggle while on. */
  readonly forceCollapsed = input(false);
  /** False hides the toggle and keeps the pane open. */
  readonly collapsible = input(true);
  /** Which end of the header the toggle sits at. Defaults by orientation:
   *  block → 'start', inline → 'end'. */
  readonly chevronPosition = input<RrChevronPosition | null>(null);
  /** Used only when the pane is NOT in a group; inside one, the group's orientation wins. */
  readonly orientation = input<RrPaneOrientation>('block');
  /** Initial size along the group axis: `280` / `'280px'` (fixed) · `'30%'` / `'1fr'` (flex). */
  readonly basis = input<RrPaneBasisInput>('1fr');
  readonly min = input<number | null>(null);
  readonly max = input<number | null>(null);
  readonly headerSize = input<number | null>(null);
  readonly railSize = input<number | null>(null);

  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly config = inject(RR_PANES_CONFIG);
  private readonly container = inject(RR_PANE_CONTAINER, { optional: true });
  private readonly generatedId = `rr-pane-${nextPaneId++}`;

  readonly itemId = computed(() => this.paneId() ?? this.generatedId);
  readonly itemLabel = computed(() => this.label());
  readonly regionId = computed<string | null>(() => this.bodyId());
  readonly resolvedOrientation = computed(() => this.container?.orientation() ?? this.orientation());
  readonly isCollapsed = computed(
    () => this.forceCollapsed() || (this.collapsible() && this.collapsed()),
  );
  readonly basisSpec = computed(() => parseBasis(this.basis()));
  readonly minSize = computed(() => this.min() ?? this.config.minPaneSize);
  readonly maxSize = computed(() => this.max());

  protected readonly headerPx = computed(() => this.headerSize() ?? this.config.headerSize);
  protected readonly railPx = computed(() => this.railSize() ?? this.config.railSize);
  /** Derived from the SAME value that sizes the header/rail — the group's collapsed track
   *  and the pane's own chrome cannot disagree. */
  readonly collapsedSize = computed(
    () =>
      (this.resolvedOrientation() === 'inline' ? this.railPx() : this.headerPx()) + 2 * BORDER_PX,
  );

  protected readonly chevronAt = computed<RrChevronPosition>(
    () => this.chevronPosition() ?? (this.resolvedOrientation() === 'inline' ? 'end' : 'start'),
  );
  protected readonly canToggle = computed(() => this.collapsible() && !this.forceCollapsed());
  protected readonly showRail = computed(
    () => this.isCollapsed() && this.resolvedOrientation() === 'inline',
  );
  protected readonly placement = computed(() => this.container?.placementOf(this) ?? null);
  protected readonly bodyId = computed(() => `${this.itemId()}-body`);
  protected readonly titleId = computed(() => `${this.itemId()}-title`);
  protected readonly toggleId = computed(() => `${this.itemId()}-toggle`);

  // Refs are named `…Btn` / `…El`, never the same as a member: a template reference variable
  // SHADOWS a component member of the same name, so `#toggle` + `(click)="toggle()"` would
  // call the <button> element — a runtime TypeError with no compile error.
  private readonly toggleRef = viewChild<ElementRef<HTMLButtonElement>>('toggleBtn');
  private readonly headerRef = viewChild<ElementRef<HTMLElement>>('headerEl');
  private readonly bodyRef = viewChild<ElementRef<HTMLElement>>('bodyEl');

  constructor() {
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    // FOCUS RESCUE. When the pane collapses with focus inside its body, move focus to the
    // toggle before the inert body can drop the operator on <body>. Built to avoid the three
    // holes v1's version had:
    //  • view queries are NON-required, so an early run (v19+ runs input-triggered effects
    //    before the template) finds `undefined` and returns, instead of throwing;
    //  • the active element is read from the host's ROOT NODE, so it works inside a
    //    shadow root — `document.activeElement` stops at the shadow host;
    //  • nothing runs on the server.
    // It writes no signals, so it needs no allowSignalWrites at 17.x and behaves the same at 22.
    effect(() => {
      if (!this.isCollapsed() || !isBrowser) return;
      const body = this.bodyRef()?.nativeElement;
      if (!body) return;
      const root = this.element.getRootNode() as Document | ShadowRoot;
      const active = root.activeElement;
      if (!(active instanceof HTMLElement) || !body.contains(active)) return;
      const toggle = this.toggleRef()?.nativeElement;
      (toggle && !toggle.disabled ? toggle : this.headerRef()?.nativeElement)?.focus();
    });
  }

  toggle(): void {
    if (this.canToggle()) this.collapsed.set(!this.collapsed());
  }

  expand(): void {
    this.setCollapsed(false);
  }

  collapse(): void {
    this.setCollapsed(true);
  }

  /** Writes user intent. Ignored for a non-collapsible pane. */
  setCollapsed(collapsed: boolean): void {
    if (this.collapsible()) this.collapsed.set(collapsed);
  }
}
