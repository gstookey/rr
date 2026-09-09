import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { PermissionStore } from '@rr/auth';
import { type RrErrorCode, RrErrorCodeSchema } from '@rr/common';
import { RrWordmark } from '@rr/ui';

/**
 * THE SIGNED-OUT SURFACE — and the absence on it is the design.
 *
 * There is no username field and no password field, because sign-in is a
 * full-page navigation AWAY: the gateway runs the authorization-code + PKCE
 * flow with the identity provider and returns the browser holding nothing but an
 * HttpOnly session cookie. This application never receives a credential, never
 * receives a token, and carries no identity-provider SDK — so there is nothing
 * on this page for a script to steal.
 *
 * There is also **no marking banner**: nothing is on screen to mark, and no
 * vocabulary is served to an anonymous caller.
 *
 * Error copy names what happened to YOU and never what exists on the other side.
 * "No such group", "you lack the Vigilance claim" and "wrong tenant" are all the
 * same absence to a signed-out visitor (`mac_stores_brief_v0` §6).
 */
@Component({
  selector: 'rr-sign-in',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RrWordmark],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.scss',
})
export class SignInPage {
  private readonly permissions = inject(PermissionStore);

  /** Bound from the query string by `withComponentInputBinding()`. */
  readonly error = input<string | undefined>(undefined);
  readonly returnTo = input<string | undefined>(undefined);

  /** Only the codes the published language mints are ever rendered. */
  protected readonly code = computed<RrErrorCode | undefined>(() => {
    const parsed = RrErrorCodeSchema.safeParse(this.error());
    return parsed.success ? parsed.data : undefined;
  });

  /**
   * A named hand-off state rather than a blank flash — a redirect that fails
   * silently is the worst way to learn that a gateway is down.
   */
  protected readonly leaving = signal(false);

  protected readonly loginHref = computed(
    () => `/auth/login?returnTo=${encodeURIComponent(this.returnTo() ?? '/')}`,
  );

  protected signIn(event: Event): void {
    event.preventDefault();
    this.leaving.set(true);
    this.permissions.signIn(this.returnTo() ?? '/');
  }
}
