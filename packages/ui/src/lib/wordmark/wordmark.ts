import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * The Building's wordmark. A `type:ui` component in the strictest sense: signal
 * inputs and nothing else — no store, no HTTP, no knowledge of which Building it
 * is naming. The name arrives from `/api/config`, so a second tenant renames the
 * Building without touching this file.
 */
@Component({
  selector: 'rr-wordmark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './wordmark.html',
  styleUrl: './wordmark.scss',
})
export class RrWordmark {
  readonly name = input.required<string>();
  /** The tier line — 'Building · L1', 'Building · L1 · Lobby'. */
  readonly tier = input<string>('');

  /** Purely typographic: the first word carries the weight, the rest do not. */
  protected readonly lead = computed(() => this.name().split(' ')[0] ?? '');
  protected readonly rest = computed(() => this.name().split(' ').slice(1).join(' '));
}
