import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
  type OnChanges,
  type SimpleChanges,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  COUNTED_STATUSES,
  EMPTY_AXIS,
  STATUS_LABEL,
  emptyCounts,
  formatZuluDayTime,
  formatZuluTime,
  type CellCoordinate,
  type GridPosition,
  type GridRow,
  type StatusCounts,
  type TimeAxis,
  type Unit,
  type ValidationStatus,
} from '../../domain';
import { StatusDot } from '../status-dot';

/** Column geometry — the one place these numbers live. The template hands them to CSS as
 *  custom properties; the ribbon's scroll arithmetic reads them here. */
export const SG_CELL_PX = 18;
export const SG_GAP_PX = 1;
export const SG_GUTTER_PX = 140;
const PITCH = SG_CELL_PX + SG_GAP_PX;
/** Header tiers. Rows below them flex between these two band heights. */
const HOUR_TIER_PX = 20;
const MINUTE_TIER_PX = 18;
const BAND_MIN_PX = 18;
const BAND_MAX_PX = 32;
/** Hover tooltip delay. Astro's 800ms default reads as broken on a surface you scan. */
export const SG_TOOLTIP_DELAY_MS = 300;
const PAGE_COLUMNS = 10;

let nextGridId = 0;

/** The cell an event happened on, if any. One listener on the grid serves every cell, so the
 *  target is always an element inside the grid — a cell, or a header, label or overlay. */
function cellOf(event: Event): HTMLElement | null {
  return (event.target as Element).closest<HTMLElement>('[data-c]');
}

function positionOf(cell: HTMLElement): GridPosition {
  return { row: Number(cell.dataset['r']), column: Number(cell.dataset['c']) };
}

interface Tooltip {
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly below: boolean;
}

/**
 * `<rr-sg-status-grid>` — one unit's components × time, one dot per sample.
 *
 * Created: 2026-10-01
 *
 * Presentational: everything arrives as inputs (from the store, via the window surface) and the
 * one thing it does — selecting a cell — leaves as an output.
 *
 * THE DESIGN MOVE: the scroller IS the CSS grid. Its height is definite (it fills the pane), so
 * the component rows' `minmax(18px, 32px)` tracks share the height the browser has — clamped to
 * 18–32px with any slack left at the bottom — and overflow scrolls. No ResizeObserver, no band
 * arithmetic. The selection ring, the now-marker, the hover tint and the hour rules are each ONE
 * absolutely-positioned grid item placed by grid-row / grid-column, so the browser does their
 * geometry too, whatever the band height is. Cells are plain elements drawn by CSS from a
 * `data-status` attribute — no component per cell across up to 2,880 of them.
 */
@Component({
  selector: 'rr-sg-status-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusDot],
  templateUrl: './status-grid.html',
  styleUrl: './status-grid.scss',
  host: {
    class: 'rr-sg-status-grid',
    '[style.--rr-sg-cell.px]': 'cellPx',
    '[style.--rr-sg-gap.px]': 'gapPx',
    '[style.--rr-sg-gutter.px]': 'gutterPx',
  },
})
export class StatusGrid implements OnChanges {
  readonly unit = input<Unit | null>(null);
  readonly axis = input<TimeAxis>(EMPTY_AXIS);
  readonly rows = input<readonly GridRow[]>([]);
  /** Index of the first FUTURE column. */
  readonly elapsedCount = input(0);
  readonly counts = input<StatusCounts>(emptyCounts());
  /** Worst elapsed status per hour group, for the day ribbon. */
  readonly hourWorst = input<readonly ValidationStatus[]>([]);
  readonly selected = input<GridPosition | null>(null);
  readonly nowMs = input(0);

  readonly cellSelect = output<CellCoordinate>();

  protected readonly cellPx = SG_CELL_PX;
  protected readonly gapPx = SG_GAP_PX;
  protected readonly gutterPx = SG_GUTTER_PX;
  protected readonly legend = COUNTED_STATUSES;
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly id = `rr-sg-grid-${nextGridId++}`;

  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Keyboard position (aria-activedescendant), hover position, and the tooltip — all local:
   *  pointer motion never reaches the store. */
  protected readonly active = signal<GridPosition | null>(null);
  protected readonly hovered = signal<GridPosition | null>(null);
  protected readonly tooltip = signal<Tooltip | null>(null);
  private tooltipTimer: ReturnType<typeof setTimeout> | null = null;

  /** Scroll state, for the ribbon's viewport bracket. */
  private readonly scrollLeft = signal(0);
  private readonly viewportWidth = signal(0);

  protected readonly columnsTemplate = computed(
    () => `${SG_GUTTER_PX}px repeat(${this.axis().columns.length}, ${SG_CELL_PX}px)`,
  );
  protected readonly rowsTemplate = computed(
    () =>
      `${HOUR_TIER_PX}px ${MINUTE_TIER_PX}px repeat(${this.rows().length}, minmax(${BAND_MIN_PX}px, ${BAND_MAX_PX}px)) auto`,
  );

  protected readonly windowLabel = computed(() => {
    const unit = this.unit();
    if (unit === null) return '';
    const start = formatZuluDayTime(Date.parse(unit.startedAt));
    return unit.stoppedAt === null ? `${start} → running` : `${start} → ${formatZuluDayTime(Date.parse(unit.stoppedAt))}`;
  });
  protected readonly nowLabel = computed(() => formatZuluTime(this.nowMs()));

  /** The now-marker's grid column: the left edge of the first future column, and only when now
   *  falls inside the axis — never when the whole window is past, or the whole of it future. */
  protected readonly nowColumn = computed(() => {
    const elapsed = this.elapsedCount();
    return elapsed > 0 && elapsed < this.axis().columns.length ? elapsed + 2 : null;
  });

  /** Each hour's rule: one element per hour, brighter every six hours. */
  protected readonly hourRules = computed(() =>
    this.axis().hourGroups.map((group) => ({
      id: group.id,
      column: group.startIndex + 2,
      anchor: Number(group.label.slice(0, 2)) % 6 === 0,
    })),
  );

  /** Accessible names, built once per data change rather than on every check of 2,880 cells. */
  protected readonly cellLabels = computed(() => {
    const columns = this.axis().columns;
    return this.rows().map((row) =>
      row.cells.map((status, c) => `${row.component.name}, ${formatZuluTime(columns[c].epochMs)}, ${STATUS_LABEL[status]}`),
    );
  });

  protected readonly activeId = computed(() => {
    const position = this.active();
    return position === null ? null : this.cellId(position.row, position.column);
  });

  protected readonly ribbon = computed(() => {
    const groups = this.axis().hourGroups;
    const worst = this.hourWorst();
    return groups.map((group, i) => ({ id: group.id, label: group.label, span: group.span, startIndex: group.startIndex, status: worst[i] ?? 'NO_DATA' }));
  });

  /** The ribbon's bracket: which share of the day the grid is scrolled to, in percent. */
  protected readonly bracket = computed(() => {
    const total = this.axis().columns.length * PITCH; // > 0: the ribbon only exists when the axis has hours
    const visible = Math.max(0, this.viewportWidth() - SG_GUTTER_PX);
    const start = Math.min(100, (this.scrollLeft() / total) * 100);
    return { left: start, width: Math.min(100 - start, (visible / total) * 100) };
  });

  constructor() {
    // The ribbon's bracket follows the scroller's width. The observer reports once on observe and
    // again on every resize (a splitter drag, a collapse, the window itself). Its callback runs
    // outside Angular's zone, so on a zone.js app (17.3) the measurement is brought back IN, or the
    // bracket would not repaint until some unrelated event. Zoneless (22), run() just calls through.
    const zone = inject(NgZone);
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    const observer =
      browser && typeof ResizeObserver === 'function' ? new ResizeObserver(([entry]) => zone.run(() => this.measure(entry.target))) : null;
    if (observer) {
      // The scroller is re-created whenever the grid comes back from its empty state: follow it.
      // (No signal is written here — the effect only re-points the observer.)
      effect(() => {
        const scroller = this.scroller()?.nativeElement;
        observer.disconnect();
        if (scroller) observer.observe(scroller);
      });
    }
    inject(DestroyRef).onDestroy(() => {
      observer?.disconnect();
      this.clearTooltipTimer();
    });
  }

  /** A different unit is a different grid: drop the keyboard, hover and tooltip positions — they
   *  index rows and columns that may not exist any more. Compared by id, so a fresh object for the
   *  same unit (a reload of the unit list) keeps the operator's place. */
  ngOnChanges(changes: SimpleChanges): void {
    const change = changes['unit'];
    if (!change || change.previousValue?.id === change.currentValue?.id) return;
    this.active.set(null);
    this.onPointerLeave();
  }

  protected cellId(row: number, column: number): string {
    return `${this.id}-${row}-${column}`;
  }

  /**
   * The grid area of ONE cell, for an overlay. The explicit `span 1`s matter: for an
   * absolutely-positioned grid item an omitted end line means the container's padding edge, not
   * "one track" — `grid-row: 5` alone stretches the overlay to the bottom of the grid.
   */
  protected areaOf(position: GridPosition): string {
    return `${position.row + 3} / ${position.column + 2} / span 1 / span 1`;
  }

  protected rowLabelId(row: number): string {
    return `${this.id}-rh-${row}`;
  }

  // ── Pointer ────────────────────────────────────────────────────────────────

  protected onClick(event: MouseEvent): void {
    const cell = cellOf(event);
    if (cell === null) return;
    const position = positionOf(cell);
    this.active.set(position);
    this.select(position);
  }

  protected onPointerOver(event: Event): void {
    const cell = cellOf(event);
    const position = cell === null ? null : positionOf(cell);
    const current = this.hovered();
    if (position?.row === current?.row && position?.column === current?.column) return;
    this.hovered.set(position);
    this.tooltip.set(null);
    this.clearTooltipTimer();
    if (cell !== null) this.tooltipTimer = setTimeout(() => this.showTooltip(cell), SG_TOOLTIP_DELAY_MS);
  }

  protected onPointerLeave(): void {
    this.hovered.set(null);
    this.tooltip.set(null);
    this.clearTooltipTimer();
  }

  protected onScroll(event: Event): void {
    this.measure(event.target as Element);
    this.tooltip.set(null);
  }

  /** Scroll so an hour group starts at the left edge of the cells. */
  protected scrollToColumn(column: number): void {
    // Smooth unless the operator asked for reduced motion: `scroll-behavior` in the SCSS decides.
    this.scroller()?.nativeElement.scrollTo({ left: column * PITCH });
  }

  // ── Keyboard: one focusable grid, the active cell named by aria-activedescendant ─────────────

  protected onFocus(): void {
    if (this.active() !== null) return;
    const columns = this.axis().columns.length;
    this.active.set(this.selected() ?? { row: 0, column: Math.max(0, Math.min(this.elapsedCount(), columns) - 1) });
  }

  protected onKeydown(event: KeyboardEvent): void {
    const position = this.active();
    // Alt/Ctrl/Meta chords belong to the browser and the OS (Alt+← is Back).
    if (position === null || event.altKey || event.ctrlKey || event.metaKey) return;
    const lastRow = this.rows().length - 1;
    const lastColumn = this.axis().columns.length - 1;
    const move: Record<string, () => GridPosition> = {
      ArrowRight: () => ({ ...position, column: Math.min(lastColumn, position.column + 1) }),
      ArrowLeft: () => ({ ...position, column: Math.max(0, position.column - 1) }),
      ArrowDown: () => ({ ...position, row: Math.min(lastRow, position.row + 1) }),
      ArrowUp: () => ({ ...position, row: Math.max(0, position.row - 1) }),
      Home: () => ({ ...position, column: 0 }),
      End: () => ({ ...position, column: lastColumn }),
      PageDown: () => ({ ...position, column: Math.min(lastColumn, position.column + PAGE_COLUMNS) }),
      PageUp: () => ({ ...position, column: Math.max(0, position.column - PAGE_COLUMNS) }),
    };
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.select(position);
      return;
    }
    const next = move[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const target = next();
    this.active.set(target);
    this.host.querySelector(`#${this.cellId(target.row, target.column)}`)?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  private select(position: GridPosition): void {
    const row = this.rows()[position.row];
    this.cellSelect.emit({ componentId: row.component.id, timestamp: this.axis().columns[position.column].timestamp });
  }

  private showTooltip(cell: HTMLElement): void {
    this.tooltipTimer = null;
    const { row, column } = positionOf(cell);
    const gridRow = this.rows()[row];
    const host = this.host.getBoundingClientRect();
    const rect = cell.getBoundingClientRect();
    const below = rect.top - host.top < 80;
    this.tooltip.set({
      text: `${gridRow.component.name} · ${formatZuluTime(this.axis().columns[column].epochMs)} · ${STATUS_LABEL[gridRow.cells[column]]}`,
      x: rect.left - host.left + rect.width / 2,
      y: below ? rect.bottom - host.top + 4 : rect.top - host.top - 4,
      below,
    });
  }

  private clearTooltipTimer(): void {
    if (this.tooltipTimer !== null) clearTimeout(this.tooltipTimer);
    this.tooltipTimer = null;
  }

  /** Read the scroller's position and width for the ribbon's bracket. */
  private measure(scroller: Element): void {
    this.scrollLeft.set(scroller.scrollLeft);
    this.viewportWidth.set(scroller.clientWidth);
  }
}
