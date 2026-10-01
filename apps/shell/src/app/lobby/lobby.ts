import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PermissionStore } from '@rr/auth';
import { DomainConfigStore } from '@rr/config';

/**
 * THE LOBBY — the Building's directory, at `/`.
 *
 * It lists only the Floors this subject may enter, and that list is not a
 * constant anywhere in this application: it is `/api/config`'s per-group
 * manifest, rendered in the order it was served (AW-D15). There is no
 * `if (group === …)` and no label map here, which is precisely what makes Ada's
 * four cards and Fay's one card the SAME component.
 *
 * The Lobby always exists, even for a single-Floor tenant (AW-D17). A Building
 * whose front door silently teleports its one-Floor tenants into their Floor
 * leaves them nowhere to sign out from and nowhere to stand when that Floor
 * fails to load.
 *
 * Full width, with no elevator rail: at `/` the directory IS the page (AW-D23).
 */
@Component({
  selector: 'rr-lobby',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './lobby.html',
  styleUrl: './lobby.scss',
})
export class LobbyPage {
  private readonly permissions = inject(PermissionStore);
  protected readonly config = inject(DomainConfigStore);

  protected readonly actingAs = computed(() => this.permissions.actingAs() ?? '');
  protected readonly count = computed(() => this.config.floors().length);
}
