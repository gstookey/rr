import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Marking, MarkingVocabulary } from '@rr/common';
import { resolveMarking } from '../resolve-marking';

/**
 * The marking band. Rendered at the TOP and BOTTOM of every marked screen
 * (`mac_stores_brief_v0` §6) — the bottom band may collapse on a small viewport,
 * which is a layout decision the Building makes, not this component.
 *
 * FENCE NOTE, and it is a load-bearing one: the vocabulary arrives as a signal
 * INPUT, not from an injected store. `@rr/markings` is tagged `type:ui`, and a
 * `ui` library may not import `type:data-access` — so the Sheriff fence
 * physically prevents this component from fetching its own vocabulary. The
 * result is a marking renderer that is pure with respect to its data, which is
 * exactly what "the UI is never the enforcement point" looks like in a file.
 */
@Component({
  selector: 'rr-marking-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './marking-banner.html',
  styleUrl: './marking-banner.scss',
  host: {
    '[class.rr-banner--foot]': 'placement() === "bottom"',
    '[class.rr-banner--unresolved]': 'rendering()?.resolved === false',
    '[style.--rr-marking]': 'colour()',
    role: 'note',
  },
})
export class RrMarkingBanner {
  /** The SURFACE's marking (AW-D16) — never the reader's clearance. */
  readonly marking = input<Marking | undefined>(undefined);
  readonly vocabulary = input<MarkingVocabulary | undefined>(undefined);
  readonly placement = input<'top' | 'bottom'>('top');
  /** What to say while nothing can be painted. Kept as copy, not a hard-coded string. */
  readonly pendingLabel = input<string>('no marking painted yet');

  protected readonly rendering = computed(() => resolveMarking(this.marking(), this.vocabulary()));
  protected readonly colour = computed(() => {
    const rendering = this.rendering();
    return rendering ? `var(${rendering.colourToken})` : null;
  });
}
