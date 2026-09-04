import express, { type Express } from 'express';
import { SignJWT, exportJWK, generateKeyPair, type JWK, type KeyObject } from 'jose';
import { DEV_PASSWORD, PERSONAS, findPersona } from './personas.js';

const ALG = 'RS256';
const KID = 'acme-workshop-mock-dev';

export interface MockOidcOptions {
  /** The issuer URL the provider claims. Must match what the relying party expects. */
  readonly issuer: string;
  /** The one client the stub knows. Mirrors the realm's confidential client. */
  readonly clientId?: string;
  readonly tokenTtlSeconds?: number;
}

export interface MockOidc {
  readonly app: Express;
  readonly jwks: { keys: JWK[] };
}

interface PendingCode {
  readonly username: string;
  readonly nonce?: string;
}

/**
 * Build the stub. Keys are generated per call and live only in memory — there is
 * no key material in this repo, and there never will be.
 */
export async function createMockOidc(options: MockOidcOptions): Promise<MockOidc> {
  const issuer = options.issuer.replace(/\/$/, '');
  const clientId = options.clientId ?? 'acme-workshop-gateway';
  const ttl = options.tokenTtlSeconds ?? 300;

  const { publicKey, privateKey } = await generateKeyPair(ALG, { extractable: true });
  const publicJwk: JWK = { ...(await exportJWK(publicKey as KeyObject)), alg: ALG, use: 'sig', kid: KID };
  const jwks = { keys: [publicJwk] };

  const codes = new Map<string, PendingCode>();
  const app = express();
  app.use(express.urlencoded({ extended: false }));

  app.get('/.well-known/openid-configuration', (_req, res) => {
    res.json({
      issuer,
      authorization_endpoint: `${issuer}/authorize`,
      token_endpoint: `${issuer}/token`,
      jwks_uri: `${issuer}/jwks`,
      response_types_supported: ['code'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: [ALG],
      grant_types_supported: ['authorization_code'],
      scopes_supported: ['openid', 'profile', 'email', 'acme-workshop'],
      claims_supported: ['sub', 'preferred_username', 'email', 'groups', 'handling_level', 'compartments'],
    });
  });

  app.get('/jwks', (_req, res) => res.json(jwks));

  /** The roster, so a test can enumerate personas without importing this module. */
  app.get('/dev/personas', (_req, res) =>
    res.json(PERSONAS.map((p) => ({ username: p.username, role: p.role, password: DEV_PASSWORD }))),
  );

  /**
   * Auto-login. There is no password check and no consent screen: the persona is
   * chosen by query parameter, which is the entire reason this file may never be
   * reachable outside a test.
   */
  app.get('/authorize', (req, res) => {
    const username = String(req.query['persona'] ?? req.query['login_hint'] ?? '');
    const redirectUri = String(req.query['redirect_uri'] ?? '');
    const persona = findPersona(username);
    if (!persona) {
      res.status(400).json({ error: 'invalid_request', error_description: `unknown persona '${username}'` });
      return;
    }
    if (!redirectUri) {
      res.status(400).json({ error: 'invalid_request', error_description: 'redirect_uri is required' });
      return;
    }
    const code = `code_${persona.username}_${Math.random().toString(36).slice(2, 10)}`;
    const nonce = req.query['nonce'];
    codes.set(code, { username: persona.username, nonce: nonce === undefined ? undefined : String(nonce) });

    const target = new URL(redirectUri);
    target.searchParams.set('code', code);
    const state = req.query['state'];
    if (state !== undefined) {
      target.searchParams.set('state', String(state));
    }
    res.redirect(302, target.toString());
  });

  app.post('/token', async (req, res) => {
    const body = req.body as Record<string, string | undefined>;
    const code = body['code'] ?? '';
    const pending = codes.get(code);
    if (!pending) {
      res.status(400).json({ error: 'invalid_grant' });
      return;
    }
    codes.delete(code);
    const persona = findPersona(pending.username);
    if (!persona) {
      res.status(500).json({ error: 'server_error' });
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    /**
     * THE CLAIM SHAPE. Every name below is produced by a mapper declared in
     * `infra/keycloak/realm-acme-workshop.json`:
     *   groups          <- oidc-group-membership-mapper (full.path true)
     *   handling_level  <- oidc-usermodel-attribute-mapper (single valued)
     *   compartments    <- oidc-usermodel-attribute-mapper (multivalued)
     * Change one side and the round-trip test below stops agreeing.
     */
    const claims = {
      preferred_username: persona.username,
      name: persona.name,
      email: persona.email,
      groups: [...persona.groups],
      handling_level: persona.handlingLevel,
      compartments: [...persona.compartments],
      realm_access: { roles: [...persona.realmRoles] },
    };

    const sign = (audience: string, extra: Record<string, unknown> = {}) =>
      new SignJWT({ ...claims, ...extra })
        .setProtectedHeader({ alg: ALG, kid: KID, typ: 'JWT' })
        .setIssuer(issuer)
        .setSubject(`mock|${persona.username}`)
        .setAudience(audience)
        .setIssuedAt(now)
        .setExpirationTime(now + ttl)
        .sign(privateKey);

    res.json({
      token_type: 'Bearer',
      expires_in: ttl,
      access_token: await sign(clientId),
      id_token: await sign(clientId, pending.nonce === undefined ? {} : { nonce: pending.nonce }),
    });
  });

  return { app, jwks };
}
