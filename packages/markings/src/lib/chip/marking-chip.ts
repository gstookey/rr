import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Compartment, HandlingLevel, MarkingVocabulary } from '@rr/common';

/**
 * The clearance chip — what describes the READER, beside their name.
 *
 * It is deliberately NOT the banner. The banner describes the data on screen;
 * this describes the person looking at it, and the two are drawn differently
 * (chip vs band) so that a reader never mistakes their own clearance for the
 * marking of what they are seeing. It is a display convenience only: nothing is
 * filtered by it, because the API never sent the rows in the first place.
 *
 * AW-D21: two compartments plus `+n`, the full set on hover/focus. Never a
 * scrollbar in chrome.
 */
@Component({
  selector: 'rr-marking-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './marking-chip.html',
  styleUrl: './marking-chip.scss',
  host: { '[style.--rr-marking]': 'colour()', '[attr.title]': 'full()' },
})
export class RrMarkingChip {
  readonly level = input.required<HandlingLevel>();
  readonly compartments = input.required<readonly Compartment[]>();
  readonly vocabulary = input<MarkingVocabulary | undefined>(undefined);
  /** How many compartments to show before collapsing to `+n` (AW-D21). */
  readonly visibleCompartments = input<number>(2);

  private readonly entry = computed(() => this.vocabulary()?.levels.find((l) => l.id === this.level()));

  protected readonly colour = computed(() => {
    const token = this.entry()?.colourToken ?? this.vocabulary()?.unresolved.colourToken;
    return token ? `var(${token})` : null;
  });

  /** The level as the vocabulary names it; the raw id when it cannot name it. */
  protected readonly levelLabel = computed(() => this.entry()?.label ?? this.level());

  protected readonly shown = computed(() => this.compartments().slice(0, this.visibleCompartments()));
  protected readonly overflow = computed(() => Math.max(0, this.compartments().length - this.visibleCompartments()));
  protected readonly full = computed(() => [this.levelLabel(), ...this.compartments()].join(' · '));
}
