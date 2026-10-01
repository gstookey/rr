import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { PermissionStore } from '@rr/auth';
import { DomainConfigStore } from '@rr/config';
import { RrMarkingBanner, RrMarkingChip } from '@rr/markings';
import { RrWordmark } from '@rr/ui';

/**
 * THE BUILDING — chrome, and nothing else.
 *
 * Read the four states in the template together; they are the deliverable.
 * The Building is assembled entirely from two runtime reads, and it refuses to
 * paint anything it cannot account for:
 *
 *  - **pre-hydration** — the banner band is reserved and blank, the elevator is
 *    skeletal. A shell that renders a default Floor list and corrects it a beat
 *    later has already leaked a Floor that may not be yours.
 *  - **manifest unavailable** — fail closed with the gateway's own typed code,
 *    no elevator, no cached Floor list, no guessed marking.
 *  - **signed in** — banner top and bottom, identity, and the Floor surface.
 *  - **unresolved marking** — handled inside `@rr/markings`, which never guesses.
 *
 * Nothing here enforces anything. The banner reports, the chip describes the
 * reader, the elevator lists. The gateway re-checks every request regardless
 * (`mac_stores_brief_v0` §6, ASVS 5.0 §8.3.1).
 */
@Component({
  selector: 'rr-building',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RrMarkingBanner, RrMarkingChip, RrWordmark],
  templateUrl: './building.html',
  styleUrl: './building.scss',
})
export class BuildingComponent {
  protected readonly permissions = inject(PermissionStore);
  protected readonly config = inject(DomainConfigStore);

  protected signOut(): void {
    void this.permissions.signOut();
  }

  protected retryConfig(): void {
    this.config.config.reload();
  }
}
