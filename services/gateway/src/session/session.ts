import connectPgSimple from 'connect-pg-simple';
import session, { type SessionOptions, type Store } from 'express-session';
import type { RequestHandler } from 'express';
import type { Me } from '@rr/common';
import pg from 'pg';

/**
 * THE PROOF THIS FILE EXISTS FOR: no token ever reaches the browser.
 *
 * Under the BFF pattern (BCP 212 pattern 1, `identity_stores_brief_v0` §4.1) the
 * gateway performs the authorization-code exchange, keeps the tokens on the
 * server, and hands the browser one opaque `HttpOnly` cookie. The cookie is a
 * key into this store and carries no claims at all — so an XSS on the SPA finds
 * nothing to steal, and a stolen cookie is only usable from the origin.
 *
 * The tokens below are therefore in SERVER memory or in Postgres, and the shape
 * of `SessionData` is the whole statement of what the browser does not get.
 */
declare module 'express-session' {
  interface SessionData {
    /** The server's resolved view of the subject. This — and only this — is what `/api/me` echoes. */
    subject?: Me;
    /** Tokens. Never serialised to any response body, in any code path. */
    tokens?: {
      accessToken: string;
      idToken?: string;
      refreshToken?: string;
      expiresAt?: number;
    };
    /** In-flight authorization request: PKCE verifier, state, nonce, and where to land. */
    pending?: {
      state: string;
      codeVerifier: string;
      nonce: string;
      returnTo: string;
    };
  }
}

export interface SessionSetup {
  readonly middleware: RequestHandler;
  /** Which store was actually used, so the gate and the logs never have to guess. */
  readonly storeKind: 'postgres' | 'memory';
  /** Release the pool, if there is one. Tests call this; the service runs until it is killed. */
  readonly close: () => Promise<void>;
}

export interface SessionConfig {
  readonly secret: string;
  /** Postgres connection string. Absent ⇒ the in-memory store, which is DEV/TEST ONLY. */
  readonly databaseUrl?: string;
  readonly secureCookie: boolean;
  readonly maxAgeMs?: number;
}

/** The cookie name is deliberately opaque: it names a session, not a product or a tenant. */
export const SESSION_COOKIE = 'acme.sid';

export function createSession(config: SessionConfig): SessionSetup {
  let pool: pg.Pool | undefined;
  let store: Store | undefined;
  let storeKind: SessionSetup['storeKind'] = 'memory';

  if (config.databaseUrl) {
    const PgStore = connectPgSimple(session);
    pool = new pg.Pool({ connectionString: config.databaseUrl });
    store = new PgStore({
      pool,
      tableName: 'session',
      // The gateway owns its session table. `createTableIfMissing` keeps the dev
      // stack single-command; a real deployment runs the DDL as a migration.
      createTableIfMissing: true,
    });
    storeKind = 'postgres';
  }

  const options: SessionOptions = {
    name: SESSION_COOKIE,
    secret: config.secret,
    // Nothing is written until there is something to write: an anonymous visitor
    // gets no cookie and no row. A store full of empty sessions is a store whose
    // size tells an attacker how much traffic you have.
    saveUninitialized: false,
    resave: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      // `lax`, not `strict`: the OIDC provider sends the browser back to
      // /auth/callback as a top-level GET, and a `strict` cookie is withheld on
      // exactly that navigation — the session would be invisible at the one
      // moment it is needed.
      sameSite: 'lax',
      secure: config.secureCookie,
      path: '/',
      maxAge: config.maxAgeMs ?? 60 * 60 * 1000,
    },
    ...(store ? { store } : {}),
  };

  return {
    middleware: session(options),
    storeKind,
    close: async () => {
      await pool?.end();
    },
  };
}
