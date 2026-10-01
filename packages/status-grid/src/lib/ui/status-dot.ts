import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ValidationStatus } from '../domain';

/**
 * `<rr-sg-status-dot>` — the feature's one status symbol: a 12px disc, or a hyphen for NO_DATA.
 *
 * Created: 2026-10-01
 *
 * Light DOM, no template: the host element IS the symbol. Used for every status in the feature —
 * grid cells, unit rows, tab markers, chips — instead of Astro's `rux-status`, because:
 *  • each rux-status is a shadow-DOM component, and the utility window's pop-out (PiP) walks every
 *    shadow root it relocates; up to 2,880 grid cells would make that walk the dominant cost;
 *  • rux-status throws on a value outside its six, so NO_DATA could never be passed to it;
 *  • NO_DATA is a different CATEGORY (not yet, rather than a verdict), so it gets a different SHAPE.
 * Colours are Astro's status palette, read as tokens with fallbacks.
 *
 * Always decorative (aria-hidden): the row, cell, tab or chip around it carries the status in text
 * or in its accessible name, so status never depends on colour alone.
 */
@Component({
  selector: 'rr-sg-status-dot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  styleUrl: './status-dot.scss',
  host: {
    class: 'rr-sg-status-dot',
    '[attr.data-status]': 'status()',
    'aria-hidden': 'true',
  },
})
export class StatusDot {
  readonly status = input.required<ValidationStatus>();
}
