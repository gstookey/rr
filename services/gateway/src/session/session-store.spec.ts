import { createServer, type RequestListener, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createMockOidc } from '@rr/mock-oidc';
import pg from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type Gateway, createGateway } from '../app.js';

/**
 * The Postgres-backed session store, against a REAL database.
 *
 * This suite is OPT-IN (`RR_TEST_DATABASE_URL`) and reports itself as skipped
 * when there is none, because the fleet's gate must stay runnable on a laptop
 * with no database and the island's must not silently pass a claim it never
 * checked (contract rule 11). A skipped line in the gate output is the honest
 * signal; a green tick over an unrun store would not be.
 *
 *   RR_TEST_DATABASE_URL=postgres://acme:acme@127.0.0.1:5432/acme npm run test -w @rr/gateway
 */
const DATABASE_URL = process.env['RR_TEST_DATABASE_URL'];

if (!DATABASE_URL) {
  console.warn(
    '[gateway] session-store.spec: SKIPPED — no RR_TEST_DATABASE_URL. The Postgres-backed session store is NOT verified by this run.',
  );
}

describe.skipIf(!DATABASE_URL)('S1 · sessions live in Postgres, not in the browser', () => {
  let provider: Server;
  let gateway: Gateway;
  let pool: pg.Pool;

  beforeAll(async () => {
    const mounted: { app?: RequestListener } = {};
    provider = createServer((req, res) => mounted.app?.(req, res));
    await new Promise<void>((resolve) => provider.listen(0, '127.0.0.1', resolve));
    const issuer = `http://127.0.0.1:${(provider.address() as AddressInfo).port}`;
    mounted.app = (await createMockOidc({ issuer })).app;

    gateway = createGateway({
      oidc: { issuer, allowInsecure: true },
      gatewayBaseUrl: 'http://127.0.0.1:3000',
      databaseUrl: DATABASE_URL,
    });
    pool = new pg.Pool({ connectionString: DATABASE_URL });
  });

  afterAll(async () => {
    await gateway.close();
    await pool.end();
    await new Promise<void>((resolve) => provider.close(() => resolve()));
  });

  it('uses the Postgres store, not the in-memory one', () => {
    // WHY: the memory store is a silent downgrade — everything still works until
    // the gateway restarts, or until there are two of them. The store kind is
    // therefore surfaced, asserted, and printed on `/healthz`.
    expect(gateway.sessionStoreKind).toBe('postgres');
  });

  it('writes the session row server-side and the cookie carries no claims', async () => {
    const agent = request.agent(gateway.app);
    const login = await agent.get('/auth/login?persona=ada&returnTo=/');
    const authorized = await fetch(login.headers['location'] as string, { redirect: 'manual' });
    const back = new URL(authorized.headers.get('location')!);
    const callback = await agent.get(`${back.pathname}${back.search}`);
    expect(callback.status).toBe(302);

    const me = await agent.get('/api/me');
    expect(me.body.username).toBe('ada');

    // The tokens are in a row in this table; the browser holds a key to it.
    const rows = await pool.query<{ sess: unknown }>(
      "select sess from session where sess::text like '%\"username\":\"ada\"%'",
    );
    expect(rows.rowCount, 'the session was persisted to Postgres').toBeGreaterThan(0);
    const stored = JSON.stringify(rows.rows[0]?.sess);
    expect(stored, 'the tokens really are on the server side of the seam').toContain('accessToken');

    const cookie = (callback.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('acme.sid='))!;
    expect(cookie).not.toContain('accessToken');
    expect(cookie).not.toMatch(/eyJ[A-Za-z0-9_-]+\./);
  });
});
