import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { UnitId, UnitListItem, ValidationStatus } from '../../domain';
import { StatusDot } from '../status-dot';
import { RUNNING, unitAccessibleName, unitWindowText } from './unit-window';

let nextListId = 0;

/** One option, everything the template prints, built once per `items` change. */
interface UnitEntry {
  readonly id: UnitId;
  readonly optionId: string;
  readonly status: ValidationStatus;
  readonly name: string;
  /** `name` lower-cased once, for the filter. */
  readonly needle: string;
  /** The window text, minus a trailing "running" — which is `windowTail`, lit in primary ink. */
  readonly windowLead: string;
  readonly windowTail: string;
  readonly label: string;
}

/** An entry that passed the filter, its name split around the matched run. */
interface UnitRow extends UnitEntry {
  readonly before: string;
  readonly match: string;
  readonly after: string;
}

/**
 * `<rr-sg-unit-list>` — the units under test, one 28px row each, with a filter on top.
 *
 * Created: 2026-10-01
 *
 * Presentational: the items and the selection arrive as inputs (from the store, via the window
 * surface); choosing a unit leaves as `unitSelect`. The FILTER and the keyboard position are
 * local signals and never reach the store — typing in a field is not application state.
 *
 * Selection follows the grid's contract: arrows, Home and End move the ACTIVE option
 * (aria-activedescendant) and select nothing; Enter, Space or a click selects. So holding an
 * arrow key never fetches a unit per repeat.
 *
 * NO TOGGLE-OFF: choosing the unit that is already selected emits nothing. The store's
 * `selectUnit` ignores a same-id call too; guarding here keeps the output meaning "the selection
 * changed" for any host, not only that store.
 */
@Component({
  selector: 'rr-sg-unit-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusDot],
  templateUrl: './unit-list.html',
  styleUrl: './unit-list.scss',
  host: { class: 'rr-sg-unit-list' },
})
export class UnitList {
  /** Shown in the order given. Never sorted here: a list that reorders as statuses tick moves
   *  rows out from under the pointer. */
  readonly items = input<readonly UnitListItem[]>([]);
  readonly selectedId = input<UnitId | null>(null);

  readonly unitSelect = output<UnitId>();

  protected readonly id = `rr-sg-units-${nextListId++}`;
  protected readonly listboxId = `${this.id}-listbox`;

  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** What is typed in the filter field. */
  protected readonly query = signal('');
  /** The unit the keyboard is on. Kept even while filtered out — see `active`. */
  private readonly activeUnitId = signal<UnitId | null>(null);

  /** The filter as matched: trimmed and lower-cased. Empty = no filter. */
  private readonly needle = computed(() => this.query().trim().toLowerCase());

  /** Labels and window text are formatted here, once per `items` change — never per check, and
   *  never again on a keystroke in the filter. */
  private readonly entries = computed((): readonly UnitEntry[] =>
    this.items().map((item, index) => {
      const text = unitWindowText(item);
      const running = text.endsWith(RUNNING);
      return {
        id: item.unit.id,
        optionId: `${this.id}-option-${index}`,
        status: item.unit.status,
        name: item.unit.name,
        needle: item.unit.name.toLowerCase(),
        windowLead: running ? text.slice(0, -RUNNING.length) : text,
        windowTail: running ? RUNNING : '',
        label: unitAccessibleName(item),
      };
    }),
  );

  /** The visible options, each name split before / match / after for the highlight. */
  protected readonly rows = computed((): readonly UnitRow[] => {
    const needle = this.needle();
    const rows: UnitRow[] = [];
    for (const entry of this.entries()) {
      const at = entry.needle.indexOf(needle);
      if (at < 0) continue;
      const end = at + needle.length;
      rows.push({ ...entry, before: entry.name.slice(0, at), match: entry.name.slice(at, end), after: entry.name.slice(end) });
    }
    return rows;
  });

  /** "14 units", or "18 of 90" while a filter is applied. */
  protected readonly count = computed(() => {
    const total = this.items().length;
    if (this.needle() !== '') return { lead: String(this.rows().length), tail: ` of ${total}` };
    return { lead: String(total), tail: total === 1 ? ' unit' : ' units' };
  });

  /** The active option — DERIVED, not synced: null whenever the filter hides the active unit,
   *  and the same option again if the filter is cleared. No effect writes to anything. */
  protected readonly active = computed(() => this.rows().find((row) => row.id === this.activeUnitId()) ?? null);
  protected readonly activeDescendant = computed(() => this.active()?.optionId ?? null);

  /** For the empty-result message: the filter as the operator typed it, minus outer spaces. */
  protected readonly typed = computed(() => this.query().trim());

  // ── Filter ─────────────────────────────────────────────────────────────────

  protected onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected clearFilter(): void {
    this.query.set('');
    this.field().nativeElement.focus();
  }

  // ── Listbox ────────────────────────────────────────────────────────────────

  /** Entering the list puts the keyboard on the selected unit if it is visible, else the first.
   *  The listbox only exists while it has rows, so there is always a first. */
  protected onFocus(): void {
    if (this.active() !== null) return;
    const rows = this.rows();
    this.moveTo(rows.find((row) => row.id === this.selectedId()) ?? rows[0]);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const active = this.active();
    if (event.key === 'Enter' || event.key === ' ') {
      if (active === null) return;
      event.preventDefault(); // Space would scroll the pane
      this.select(active.id);
      return;
    }
    const rows = this.rows();
    const index = active === null ? -1 : rows.indexOf(active);
    const last = rows.length - 1;
    const targets: Record<string, number> = {
      ArrowDown: Math.min(last, index + 1),
      ArrowUp: Math.max(0, index - 1),
      Home: 0,
      End: last,
    };
    const target = targets[event.key];
    if (target === undefined) return;
    event.preventDefault();
    this.moveTo(rows[target]);
  }

  protected onOptionClick(id: UnitId): void {
    this.activeUnitId.set(id);
    this.select(id);
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  /** Move the keyboard position — never the selection — and bring the option into view: with
   *  aria-activedescendant, focus stays on the listbox, so the browser will not scroll for us. */
  private moveTo(row: UnitRow): void {
    this.activeUnitId.set(row.id);
    this.host.querySelector(`#${row.optionId}`)?.scrollIntoView?.({ block: 'nearest' });
  }

  private select(id: UnitId): void {
    if (id !== this.selectedId()) this.unitSelect.emit(id);
  }
}
