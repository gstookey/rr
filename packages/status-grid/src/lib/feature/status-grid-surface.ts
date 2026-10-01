import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RR_PANES } from '@rr/ui';
import { StatusGridStore, TimeSource } from '../data-access';
import { StatusGrid } from '../ui';

/**
 * `<rr-sg-status-grid-surface>` — the utility window's content: the three panes, wired to the store.
 *
 * Created: 2026-10-01
 *
 * The only component that knows about the store. It reads signals and hands them to the three
 * presentational components as inputs, and turns their outputs into store calls.
 *
 * ZERO INPUTS, deliberately: a utility window binds a surface's inputs once, at mount. A unit
 * passed that way would be right the first time and silently stale every time after.
 */
@Component({
  selector: 'rr-sg-status-grid-surface',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RR_PANES, StatusGrid],
  templateUrl: './status-grid-surface.html',
  styleUrl: './status-grid-surface.scss',
})
export class StatusGridSurface {
  protected readonly store = inject(StatusGridStore);
  protected readonly time = inject(TimeSource);
}
