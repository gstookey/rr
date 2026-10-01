import { createServer, type RequestListener, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { markingBanner } from '@rr/common';
import { createMockOidc } from '@rr/mock-oidc';
import request from 'supertest';
import type TestAgent from 'supertest/lib/agent.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type Gateway, createGateway } from './app.js';

/**
 * S1's PROOF, run end to end with no Docker.
 *
 * "Sign in as Ada → the Lobby shows Invent · Command · Vigilance · Front Desk;
 *  as Fay → Vigilance only; a banner renders from /api/config's vocabulary; no
 *  token in the browser." (slice_decomposition_v0, the S1 row.)
 *
 * The identity provider here is `@rr/mock-oidc`, which emits the SAME claim
 * shape Keycloak's mappers emit — a parity the realm spec asserts field by
 * field. Keycloak itself is unverified in this environment (no Docker daemon);
 * what IS proven is that the gateway's behaviour depends only on the claims.
 */

let provider: Server;
let issuer: string;
let gateway: Gateway;

beforeAll(async () => {
  // The stub must know its own issuer URL, and the URL needs a port — so listen
  // first behind a one-slot holder, then build the provider around the port it
  // was given and drop it in.
  const mounted: { app?: RequestListener } = {};
  provider = createServer((req, res) => mounted.app?.(req, res));
  await new Promise<void>((resolve) => provider.listen(0, '127.0.0.1', resolve));
  issuer = `http://127.0.0.1:${(provider.address() as AddressInfo).port}`;
  mounted.app = (await createMockOidc({ issuer })).app;

  gateway = createGateway({
    oidc: { issuer, allowInsecure: true },
    gatewayBaseUrl: 'http://127.0.0.1:3000',
  });
});

afterAll(async () => {
  await gateway.close();
  await new Promise<void>((resolve) => provider.close(() => resolve()));
});

/**
 * Drive the full authorization-code flow the way a browser would, one hop at a
 * time, so that every redirect is observable. The supertest agent is the cookie
 * jar; the `fetch` in the middle is the hop that leaves the application.
 */
async function signIn(persona: string): Promise<{ agent: TestAgent; callback: request.Response }> {
  const agent = request.agent(gateway.app);

  const login = await agent.get(`/auth/login?persona=${persona}&returnTo=/`);
  expect(login.status, 'sign-in is a redirect out of the application, not an API call').toBe(302);
  const authorizeUrl = login.headers['location'] as string;
  expect(authorizeUrl.startsWith(issuer), 'the browser is sent to the identity provider').toBe(true);

  const authorized = await fetch(authorizeUrl, { redirect: 'manual' });
  const back = new URL(authorized.headers.get('location')!);
  expect(back.pathname).toBe('/auth/callback');

  const callback = await agent.get(`${back.pathname}${back.search}`);
  expect(callback.status).toBe(302);
  return { agent, callback };
}

describe('S1 · the Building, served', () => {
  it('gives Ada four Floors, in the manifest order, with Front Desk last', async () => {
    // WHY THIS ORDER: AW-D15 makes order manifest data and forbids a client-side
    // sort. If the gateway ever served them unordered, the shell would have to
    // hold an opinion about Floor order — a Floor fact in the Building.
    const { agent } = await signIn('ada');

    const config = await agent.get('/api/config');
    expect(config.status).toBe(200);
    expect(config.body.floors.map((floor: { id: string }) => floor.id)).toEqual([
      'invent',
      'command',
      'vigilance',
      'front-desk',
    ]);
    // Every Floor carries its own label, route and blurb — the Lobby invents none of it.
    expect(config.body.floors[0]).toMatchObject({ label: 'Invent', route: '/invent' });
    expect(config.body.floors[0].blurb.length).toBeGreaterThan(0);
  });

  it('resolves Ada`s group display name server-side (AW-D20)', async () => {
    // WHY: a path->label map in the front end is a list of every tenant, shipped
    // to every tenant. `/api/me` answering `Tick-Tock Watchworks` is what makes
    // that map unnecessary.
    const { agent } = await signIn('ada');
    const me = await agent.get('/api/me');
    expect(me.status).toBe(200);
    expect(me.body.group).toEqual({ path: '/ttw', displayName: 'Tick-Tock Watchworks' });
    expect(me.body.displayName).toBe('Ada Vance');
    expect(me.body.handlingLevel).toBe('INTERNAL');
    expect(me.body.compartments).toEqual(['TTW']);
  });

  it('gives Fay exactly one Floor — the other three are ABSENT, not disabled', async () => {
    // WHY: this is the S1 deliverable. There is no `enabled: false`, no reason
    // string, no placeholder entry. Nothing Fay receives mentions Invent,
    // Command or Front Desk, so nothing in the browser could render them even
    // by accident (ddd_ui_ux_brief_v0 §4.5).
    const { agent } = await signIn('fay');

    const config = await agent.get('/api/config');
    expect(config.body.floors.map((floor: { id: string }) => floor.id)).toEqual(['vigilance']);
    const served = JSON.stringify(config.body);
    for (const absent of ['invent', 'command', 'front-desk', 'Invent', 'Command', 'Front Desk']) {
      expect(served, `Fay's Building must not mention ${absent} in any form`).not.toContain(absent);
    }

    const me = await agent.get('/api/me');
    expect(me.body.floors).toEqual(['vigilance']);
  });

  it('keeps the Floor claim on /api/me and the manifest on /api/config in step', async () => {
    // WHY: the CanMatch guard reads the claim and the Lobby reads the manifest.
    // If those two could disagree, a Floor would be listed but unreachable (or
    // reachable but unlisted) — and the reader would learn the wrong lesson
    // about what tailoring is.
    for (const persona of ['ada', 'fay', 'dee', 'gus']) {
      const { agent } = await signIn(persona);
      const me = await agent.get('/api/me');
      const config = await agent.get('/api/config');
      expect(me.body.floors, `${persona}: claim vs manifest`).toEqual(
        config.body.floors.map((floor: { id: string }) => floor.id),
      );
    }
  });

  it('already contains S4`s asymmetry: MER has no Vigilance, Northwind has only Vigilance', async () => {
    // WHY: S4's proof is "a third manufacturer appears with zero code changes".
    // That is only a proof if tailoring is already load-bearing in S1 — i.e. if
    // two existing tenants ALREADY differ in the data. Dee and Fay are that.
    const dee = await signIn('dee');
    const deeFloors = (await dee.agent.get('/api/config')).body.floors.map((f: { id: string }) => f.id);
    expect(deeFloors).toEqual(['invent', 'command', 'front-desk']);
    expect(deeFloors).not.toContain('vigilance');

    const fay = await signIn('fay');
    expect((await fay.agent.get('/api/config')).body.landingFloor).toBe('vigilance');
  });

  it('serves the marking vocabulary the banner string is built from', async () => {
    // WHY: `@rr/markings` ships no level names, no compartment names and no
    // colours (AW-D22). If this endpoint stopped carrying the vocabulary, every
    // banner in the Building would render nothing — which looks exactly like an
    // unmarked screen, the one failure a marking system may not have.
    const { agent } = await signIn('ada');
    const config = (await agent.get('/api/config')).body;

    expect(config.markingVocabulary.levels.map((l: { id: string }) => l.id)).toEqual([
      'OPEN',
      'PARTNER',
      'INTERNAL',
      'RESTRICTED',
    ]);
    // Token SLOTS, not colours: the theme supplies the value.
    for (const level of config.markingVocabulary.levels) {
      expect(level.colourToken).toMatch(/^--rr-/);
    }
    expect(config.marking).toEqual({ level: 'INTERNAL', compartments: ['TTW'] });
    expect(markingBanner(config.marking)).toBe('INTERNAL//TTW');

    const fay = await signIn('fay');
    expect(markingBanner((await fay.agent.get('/api/config')).body.marking)).toBe('PARTNER//TTW/NWL');
  });
});

describe('S1 · no token reaches the browser', () => {
  it('hands the browser an HttpOnly, SameSite session cookie and nothing else', async () => {
    const { callback } = await signIn('ada');
    const cookies = callback.headers['set-cookie'] as unknown as string[];
    const sessionCookie = cookies.find((cookie) => cookie.startsWith('acme.sid='))!;

    expect(sessionCookie, 'a session cookie was set on the callback').toBeDefined();
    expect(sessionCookie).toContain('HttpOnly');
    expect(sessionCookie).toContain('SameSite=Lax');
    // The cookie value is a signed session id. If a JWT ever appeared here the
    // BFF pattern would have silently degraded into the token-mediating pattern.
    expect(sessionCookie).not.toMatch(/eyJ[A-Za-z0-9_-]+\./);
    // A redirect carries no body for a token to hide in.
    expect(callback.text).not.toMatch(/eyJ[A-Za-z0-9_-]+\./);
  });

  it('never puts an access or ID token in a body the SPA reads', async () => {
    // WHY: this is the assertion that keeps the pattern honest as the gateway
    // grows. Every response the browser can read is searched for both the token
    // FIELD NAMES and the JWT shape itself.
    const { agent } = await signIn('gus');
    for (const path of ['/api/me', '/api/config', '/healthz']) {
      const body = JSON.stringify((await agent.get(path)).body);
      expect(body, `${path} leaked a JWT`).not.toMatch(/eyJ[A-Za-z0-9_-]+\./);
      for (const field of ['access_token', 'id_token', 'refresh_token', 'accessToken', 'idToken', 'refreshToken']) {
        expect(body, `${path} leaked ${field}`).not.toContain(field);
      }
    }
  });
});

describe('S1 · fail closed', () => {
  it('answers 401 SESSION_EXPIRED to an unauthenticated read, never a partial subject', async () => {
    // WHY: a `{}` or a `{ floors: [] }` for an anonymous caller is a Building
    // with no Floors, which is indistinguishable on screen from a tenant who
    // legitimately has none.
    for (const path of ['/api/me', '/api/config']) {
      const res = await request(gateway.app).get(path);
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'SESSION_EXPIRED' });
    }
  });

  it('ends the session on sign-out, so the same cookie stops working', async () => {
    const { agent } = await signIn('ada');
    expect((await agent.get('/api/me')).status).toBe(200);
    expect((await agent.post('/auth/logout')).status).toBe(200);
    expect((await agent.get('/api/me')).status).toBe(401);
  });

  it('refuses to send the browser somewhere else after sign-in (open redirect)', async () => {
    // WHY: `returnTo` is attacker-controllable and an open redirect on a sign-in
    // endpoint is a phishing primitive. `//evil.example` is the case a naive
    // `startsWith('/')` waves through.
    const agent = request.agent(gateway.app);
    const login = await agent.get('/auth/login?persona=ada&returnTo=//evil.example/harvest');
    const authorized = await fetch(login.headers['location'] as string, { redirect: 'manual' });
    const back = new URL(authorized.headers.get('location')!);
    const callback = await agent.get(`${back.pathname}${back.search}`);
    expect(callback.headers['location']).toBe('/');
  });

  it('reports a failed sign-in as SIGN_IN_FAILED without naming anything', async () => {
    // A callback with no in-flight authorization request in the session.
    const res = await request(gateway.app).get('/auth/callback?code=nope&state=nope');
    expect(res.status).toBe(302);
    expect(res.headers['location']).toBe('/sign-in?error=SIGN_IN_FAILED');
  });
});
