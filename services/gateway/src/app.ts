import { join } from 'node:path';
import express, { type Express } from 'express';
import { createApiRoutes } from './api/routes.js';
import { createAuthRoutes } from './auth/routes.js';
import { type OidcConfig } from './auth/oidc.js';
import { type ManifestFile, loadManifestFile } from './config/manifest.js';
import { type SessionSetup, createSession } from './session/session.js';

/**
 * The ACME Workshop BFF — one Building, assembled here and nowhere else.
 *
 * This file is COMPOSITION ONLY, on purpose: sessions, the OIDC dance, subject
 * resolution and the two reads each live in their own module so a reader can
 * follow one seam at a time. If logic accumulates in this file, the seams have
 * started to blur.
 */

const PACKAGE_ROOT = join(import.meta.dirname, '..');
const env = (key: string, fallback: string): string => process.env[key] ?? fallback;

export interface GatewayOptions {
  readonly manifestPath?: string;
  readonly oidc?: Partial<OidcConfig>;
  readonly sessionSecret?: string;
  /** Absent ⇒ in-memory sessions (DEV/TEST ONLY — see `session.ts`). */
  readonly databaseUrl?: string;
  readonly appBaseUrl?: string;
  readonly gatewayBaseUrl?: string;
}

export interface Gateway {
  readonly app: Express;
  readonly sessionStoreKind: SessionSetup['storeKind'];
  readonly close: () => Promise<void>;
}

export function createGateway(options: GatewayOptions = {}): Gateway {
  const manifestPath = options.manifestPath ?? join(PACKAGE_ROOT, 'config', 'manifest.json');
  const gatewayBaseUrl = options.gatewayBaseUrl ?? env('GATEWAY_BASE_URL', 'http://localhost:3000');
  const appBaseUrl = options.appBaseUrl ?? env('APP_BASE_URL', '');

  const oidc: OidcConfig = {
    issuer: options.oidc?.issuer ?? env('OIDC_ISSUER', 'http://localhost:8080/realms/acme-workshop'),
    clientId: options.oidc?.clientId ?? env('OIDC_CLIENT_ID', 'acme-workshop-gateway'),
    clientSecret: options.oidc?.clientSecret ?? env('OIDC_CLIENT_SECRET', 'dev-only-not-a-secret'),
    redirectUri: options.oidc?.redirectUri ?? `${gatewayBaseUrl}/auth/callback`,
    scope: options.oidc?.scope ?? env('OIDC_SCOPE', 'openid profile email'),
    allowInsecure: options.oidc?.allowInsecure ?? env('OIDC_ALLOW_INSECURE', 'true') === 'true',
  };

  const session = createSession({
    secret: options.sessionSecret ?? env('SESSION_SECRET', 'dev-only-not-a-secret'),
    ...(options.databaseUrl ?? process.env['DATABASE_URL']
      ? { databaseUrl: options.databaseUrl ?? process.env['DATABASE_URL']! }
      : {}),
    secureCookie: process.env['NODE_ENV'] === 'production',
  });

  const app = express();
  app.disable('x-powered-by');
  app.use(session.middleware);

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', service: '@rr/gateway', slice: 'S1', sessionStore: session.storeKind });
  });

  // Re-read per request: the manifest is the tailoring surface, and editing it
  // during `npm start` should show up without a restart. When it becomes big
  // enough to matter, this is the one line that becomes a cache.
  const manifest = (): ManifestFile => loadManifestFile(manifestPath);

  app.use(createAuthRoutes({ oidc, manifest, appBaseUrl, gatewayBaseUrl }));
  app.use(createApiRoutes({ manifest }));

  return { app, sessionStoreKind: session.storeKind, close: session.close };
}
