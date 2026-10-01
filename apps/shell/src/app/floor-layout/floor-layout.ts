import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DomainConfigStore } from '@rr/config';

/**
 * THE FLOOR LAYOUT — the elevator rail, plus the room the Floor mounts into.
 *
 * It exists as a separate layout route so the rail appears on Floors and not in
 * the Lobby (AW-D23) without any component needing to ask the router where it
 * is. Structure answers the question; no URL signal, no `activate` handler, no
 * router-event subscription.
 *
 * **THE PROOF LIVES IN THIS TEMPLATE'S `@for`.** It iterates the manifest and
 * nothing else — so an unentitled Floor is not dimmed, padlocked or captioned
 * "request access": it is never rendered, its route does not match, and its
 * chunk is never fetched. There is deliberately no disabled Floor affordance
 * anywhere in this application to copy from.
 */
@Component({
  selector: 'rr-floor-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './floor-layout.html',
  styleUrl: './floor-layout.scss',
})
export class FloorLayoutComponent {
  protected readonly config = inject(DomainConfigStore);
}
