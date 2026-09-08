import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

/**
 * The Building's root component.
 *
 * S0 scope: this renders ONE line and nothing else. The lobby, the elevator,
 * sign-in/out and the Floor chrome are S1 (slice_decomposition_v0.md); do not
 * grow this component to meet them — it is the seam, not the surface.
 *
 * `changeDetection: OnPush` is written explicitly even though it is the v22
 * default, so the file still says what it means after a Legacy-Island re-pin
 * to v19–v21 where the default is different (C-008, currency contract §1).
 */
@Component({
  selector: 'rr-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>{{ headline() }}</h1>`,
})
export class App {
  protected readonly headline = signal('ACME Workshop — Foundation');
}
