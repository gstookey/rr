import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ElementAttribute } from '../../domain';

/**
 * `<rr-sg-attribute-card>` — one validated attribute: its name, a flag, and the EXPECTED and
 * ACTUAL values.
 *
 * Created: 2026-10-01
 *
 * Three looks, chosen by `attribute.match` and nothing else:
 *  • MATCH     quiet — no flag;
 *  • MISMATCH  a diff — red inset edge, the ACTUAL value in diff ink on a diff tint, `◄ MISMATCH`;
 *  • MISSING   muted, not alarming — flat, dashed, "value not received", `MISSING`.
 *
 * `match` is AUTHORITATIVE. The card never compares `expected` with `actual`: they are display
 * strings, and '0.130' vs '0.13' would lie.
 *
 * The flag is TEXT, so the card's accessible content says "mismatch" or "missing" — status never
 * depends on colour. The host is the `listitem`; the deck supplies the `list`.
 */
@Component({
  selector: 'rr-sg-attribute-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './attribute-card.html',
  styleUrl: './attribute-card.scss',
  host: {
    class: 'rr-sg-attribute-card',
    role: 'listitem',
    '[attr.data-match]': 'attribute().match',
  },
})
export class AttributeCard {
  readonly attribute = input.required<ElementAttribute>();
}
