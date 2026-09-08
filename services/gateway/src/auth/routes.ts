import { Router } from 'express';
import type { ManifestFile } from '../config/manifest.js';
import { SESSION_COOKIE } from '../session/session.js';
import { type OidcConfig, client, createRelyingParty } from './oidc.js';
import { resolveSubject } from './subject.js';

/**
 * The three browser NAVIGATIONS of the sign-in dance (AW-D18: deliberately not
 * under `/api`, because they are navigations, not data).
 *
 * Read the mockup `sign-in.html` beside this file: the SPA's entire contribution
 * is an ordinary `<a href="/auth/login">`. There is no credential form, no
 * identity-provider SDK and no `fetch` — the redirect chain belongs to the
 * gateway, and the browser's reward at the end of it is one HttpOnly cookie.
 */

export interface AuthRoutesOptions {
  readonly oidc: OidcConfig;
  readonly manifest: () => ManifestFile;
  /** Where the SPA lives. Sign-in outcomes are reported by landing on its routes. */
  readonly appBaseUrl: string;
  /** Absolute base of THIS service, used to reconstruct the callback URL. */
  readonly gatewayBaseUrl: string;
}

/**
 * An open-redirect is a phishing primitive, so `returnTo` is accepted only as a
 * same-site absolute PATH. `//evil.example` is a protocol-relative URL that
 * `startsWith('/')` would happily wave through — hence the second test.
 */
function safeReturnTo(raw: unknown): string {
  const value = typeof raw === 'string' ? raw : '/';
  return value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') ? value : '/';
}

export function createAuthRoutes(options: AuthRoutesOptions): Router {
  const rp = createRelyingParty(options.oidc);
  const router = Router();

  router.get('/auth/login', (req, res) => {
    void (async () => {
      try {
        const configuration = await rp.configuration();
        const codeVerifier = client.randomPKCECodeVerifier();
        const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
        const state = client.randomState();
        const nonce = client.randomNonce();

        req.session.pending = {
          state,
          codeVerifier,
          nonce,
          returnTo: safeReturnTo(req.query['returnTo']),
        };

        const parameters: Record<string, string> = {
          redirect_uri: options.oidc.redirectUri,
          scope: options.oidc.scope,
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
          state,
          nonce,
        };
        // A standard OIDC prefill. Keycloak treats it as a username hint; the CI
        // stub uses it to choose which fictional persona signs in, which is how
        // the S1 proofs run seven different people with no browser.
        const loginHint = req.query['login_hint'] ?? req.query['persona'];
        if (typeof loginHint === 'string' && loginHint.length > 0) {
          parameters['login_hint'] = loginHint;
          parameters['persona'] = loginHint;
        }

        const authorizationUrl = client.buildAuthorizationUrl(configuration, parameters);

        // Save explicitly: the PKCE verifier must be durable BEFORE the browser
        // leaves, or the callback has nothing to prove the exchange with.
        req.session.save((error) => {
          if (error) {
            res.redirect(302, `${options.appBaseUrl}/sign-in?error=SIGN_IN_FAILED`);
            return;
          }
          res.redirect(302, authorizationUrl.href);
        });
      } catch {
        // The identity provider is unreachable. Say so as a sign-in failure and
        // name nothing about it — see the no-leak note in `@rr/common/errors`.
        res.redirect(302, `${options.appBaseUrl}/sign-in?error=SIGN_IN_FAILED`);
      }
    })();
  });

  router.get('/auth/callback', (req, res) => {
    void (async () => {
      const pending = req.session.pending;
      const failed = () => res.redirect(302, `${options.appBaseUrl}/sign-in?error=SIGN_IN_FAILED`);
      if (!pending) {
        failed();
        return;
      }

      try {
        const configuration = await rp.configuration();
        const currentUrl = new URL(req.originalUrl, options.gatewayBaseUrl);
        const tokens = await client.authorizationCodeGrant(configuration, currentUrl, {
          pkceCodeVerifier: pending.codeVerifier,
          expectedState: pending.state,
          expectedNonce: pending.nonce,
          idTokenExpected: true,
        });

        const subject = resolveSubject(tokens.claims() ?? {}, options.manifest());
        if (!subject) {
          failed();
          return;
        }

        // Regenerate before elevating: a session id issued to an anonymous
        // visitor must not survive into an authenticated one (session fixation).
        req.session.regenerate((error) => {
          if (error) {
            failed();
            return;
          }
          req.session.subject = subject;
          req.session.tokens = {
            accessToken: tokens.access_token,
            ...(tokens.id_token === undefined ? {} : { idToken: tokens.id_token }),
            ...(tokens.refresh_token === undefined ? {} : { refreshToken: tokens.refresh_token }),
            ...(tokens.expires_in === undefined ? {} : { expiresAt: Date.now() + tokens.expires_in * 1000 }),
          };
          req.session.save(() => {
            // The ONLY thing that crosses back to the browser is a 302 and a
            // Set-Cookie. No token is in this response, in any header or body.
            res.redirect(302, `${options.appBaseUrl}${pending.returnTo}`);
          });
        });
      } catch {
        failed();
      }
    })();
  });

  router.post('/auth/logout', (req, res) => {
    void (async () => {
      const idToken = req.session.tokens?.idToken;

      // RP-initiated logout, when the provider advertises it: ending the local
      // session while the IdP session survives teaches the wrong lesson — the
      // next "sign in" would complete silently and look like it never signed out.
      let endSessionUrl: string | undefined;
      try {
        const configuration = await rp.configuration();
        if (configuration.serverMetadata().end_session_endpoint) {
          endSessionUrl = client
            .buildEndSessionUrl(configuration, {
              post_logout_redirect_uri: `${options.appBaseUrl}/sign-in`,
              ...(idToken === undefined ? {} : { id_token_hint: idToken }),
            })
            .href;
        }
      } catch {
        // Provider unreachable: the local session still ends. Signing out must
        // never depend on something else being up.
      }

      req.session.destroy(() => {
        res.clearCookie(SESSION_COOKIE, { path: '/' });
        // A URL, never a token. The shell navigates to it if present.
        res.status(200).json(endSessionUrl === undefined ? {} : { endSessionUrl });
      });
    })();
  });

  return router;
}
