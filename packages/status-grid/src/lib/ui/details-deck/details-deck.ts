import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  viewChildren,
  type ElementRef,
} from '@angular/core';
import {
  STATUS_LABEL,
  formatZuluTime,
  type ComponentElement,
  type DeckState,
  type ElementId,
  type SelectedSample,
} from '../../domain';
import { StatusDot } from '../status-dot';
import { AttributeCard } from './attribute-card';

let nextDeckId = 0;

/**
 * `<rr-sg-details-deck>` — the Details pane's body: one tab per Element of the selected sample,
 * and one card per Attribute of the active Element.
 *
 * Created: 2026-10-01
 *
 * Presentational and CONTROLLED: everything arrives as inputs (from the store, via the window
 * surface), and choosing a tab leaves as `elementSelect`. The deck holds no tab state of its own —
 * the store keeps the operator's tab by element id and falls back to the first, so the choice
 * survives moving between samples.
 *
 * Unless `state` is 'ready' the deck shows ONE centred `role=status` message instead of tabs and
 * cards. The message element stays mounted across the non-ready states, so a change from, say,
 * "Awaiting validation" to "Not sampled yet" is announced as a live-region update.
 *
 * The tablist follows the ARIA APG tabs pattern with roving tabindex: only the active tab is in
 * the tab order, and Arrow Left/Right, Home and End move AND activate — the payload is already
 * loaded, so there is nothing to wait for and no reason to make the operator press Enter.
 */
@Component({
  selector: 'rr-sg-details-deck',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusDot, AttributeCard],
  templateUrl: './details-deck.html',
  styleUrl: './details-deck.scss',
  host: { class: 'rr-sg-details-deck' },
})
export class DetailsDeck {
  readonly state = input<DeckState>('idle');
  readonly sample = input<SelectedSample | null>(null);
  readonly elements = input<readonly ComponentElement[]>([]);
  readonly activeElement = input<ComponentElement | null>(null);

  /** The element the operator chose — by click, or by arrow key. Re-choosing the active tab
   *  emits again; the store writes the same id, which changes nothing. */
  readonly elementSelect = output<ElementId>();

  protected readonly statusLabel = STATUS_LABEL;
  protected readonly id = `rr-sg-deck-${nextDeckId++}`;
  protected readonly panelId = `${this.id}-panel`;

  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  /**
   * Which tab is selected: `activeElement` matched BY ID among `elements`, else the first — the
   * store's own fallback. The cards are drawn from the same index, so the selected tab and the
   * panel's content can never disagree, whatever pair of inputs arrives.
   */
  protected readonly activeIndex = computed(() => {
    const id = this.activeElement()?.id;
    return Math.max(0, this.elements().findIndex((element) => element.id === id));
  });
  protected readonly shown = computed((): ComponentElement | undefined => this.elements()[this.activeIndex()]);

  /** The sample's time is the point of the future message; without a sample it still reads. */
  protected readonly futureMessage = computed(() => {
    const sample = this.sample();
    return sample === null ? 'Not sampled yet' : `Not sampled yet — ${formatZuluTime(sample.epochMs)} is in the future`;
  });

  protected readonly tablistLabel = computed(() => {
    const sample = this.sample();
    return sample === null ? 'Elements' : `Elements of ${sample.componentName} at ${formatZuluTime(sample.epochMs)}`;
  });

  protected tabId(index: number): string {
    return `${this.id}-tab-${index}`;
  }

  protected select(index: number): void {
    this.elementSelect.emit(this.elements()[index].id);
  }

  /**
   * Arrows wrap (APG), Home and End jump. Moves are counted from the tab the key was pressed ON,
   * not from `activeIndex`: focus moves at once, but the input that marks the new tab active comes
   * back through the store on the next render — a held arrow key must not repeat from a stale tab.
   */
  protected onKeydown(event: KeyboardEvent, from: number): void {
    const count = this.elements().length;
    const moves: Partial<Record<string, number>> = {
      ArrowRight: (from + 1) % count,
      ArrowLeft: (from - 1 + count) % count,
      Home: 0,
      End: count - 1,
    };
    const to = moves[event.key];
    if (to === undefined) return;
    event.preventDefault();
    this.select(to);
    this.tabButtons()[to].nativeElement.focus();
  }
}
