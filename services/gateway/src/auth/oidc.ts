import * as client from 'openid-client';

/**
 * The OIDC relying party — `openid-client` 6.x, authorization code + PKCE,
 * CONFIDENTIAL client (`identity_stores_brief_v0` §4.1; implicit flow is
 * prohibited and PKCE is mandatory, RFC 10017).
 *
 * The issuer is CONFIGURATION, which is the whole reason the S1 proofs can run
 * with no Docker: the fleet points this at `@rr/mock-oidc`, Graham's machine
 * points it at Keycloak in `docker compose`, and not one line of gateway code
 * knows the difference (AW-D7).
 */
export interface OidcConfig {
  readonly issuer: string;
  readonly clientId: string;
  readonly clientSecret: string;
  /** Absolute `/auth/callback` URL. Must match a registered redirect URI. */
  readonly redirectUri: string;
  readonly scope: string;
  /**
   * Permit `http://` issuers. DEV/TEST ONLY — the mock provider and the local
   * Keycloak both run without TLS. It is an explicit flag rather than a silent
   * fallback so that "we turned off transport security" can never be an accident.
   */
  readonly allowInsecure: boolean;
}

/**
 * Discovery is LAZY and memoised: the gateway must be able to start, answer
 * `/healthz` and fail a sign-in honestly when the identity provider is down.
 * Discovering at construction time would make an IdP restart look like a
 * gateway crash.
 */
export function createRelyingParty(config: OidcConfig): {
  configuration: () => Promise<client.Configuration>;
} {
  let discovered: Promise<client.Configuration> | undefined;

  return {
    configuration: () => {
      discovered ??= client
        .discovery(
          new URL(config.issuer),
          config.clientId,
          config.clientSecret,
          undefined,
          config.allowInsecure ? { execute: [client.allowInsecureRequests] } : undefined,
        )
        .catch((error: unknown) => {
          // Do not cache a failure: the next sign-in attempt should re-discover
          // rather than inherit a dead provider for the process's lifetime.
          discovered = undefined;
          throw error;
        });
      return discovered;
    },
  };
}

export { client };
