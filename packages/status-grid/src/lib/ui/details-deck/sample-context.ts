import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { STATUS_LABEL, formatZuluTime, type SelectedSample } from '../../domain';
import { StatusDot } from '../status-dot';

/**
 * `<rr-sg-sample-context>` — what the Details pane is showing: `Gearbox · 04:15Z` and a status
 * chip, or "No sample selected".
 *
 * Created: 2026-10-01
 *
 * It lives in the PANE HEADER, projected through `<rr-pane>`'s `rrPaneHeader` slot (design note
 * R3 §8.1), not in the deck's body: the header is a 28px bar that is paid for anyway, so the body
 * keeps room for two card rows, and a COLLAPSED deck still names the selection. That placement is
 * why it is its own component — the deck renders inside the pane body and cannot reach the header.
 *
 * One line, never wraps: the component name is the part that ellipsizes; the time and the chip
 * always show.
 */
@Component({
  selector: 'rr-sg-sample-context',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusDot],
  template: `
    @if (sample(); as s) {
      <span class="name" [title]="s.componentName">{{ s.componentName }}</span>
      <span class="time">· {{ zulu(s.epochMs) }}</span>
      <span class="chip"><rr-sg-status-dot [status]="s.status" />{{ statusLabel[s.status] }}</span>
    } @else {
      <span class="none">No sample selected</span>
    }
  `,
  styleUrl: './sample-context.scss',
  host: { class: 'rr-sg-sample-context' },
})
export class SampleContext {
  readonly sample = input<SelectedSample | null>(null);

  protected readonly statusLabel = STATUS_LABEL;
  protected readonly zulu = formatZuluTime;
}
