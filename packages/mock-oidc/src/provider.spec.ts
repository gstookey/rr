import { createLocalJWKSet, jwtVerify } from 'jose';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createMockOidc } from './provider.js';

const ISSUER = 'http://localhost:9100';

describe('mock OIDC provider (AW-D7)', () => {
  it('round-trips authorize -> token -> a JWT verifiable against its own JWKS, carrying the Keycloak claim shape', async () => {
    // WHY this is the assertion: the stub only earns its place if a token it
    // issues is indistinguishable, IN CLAIM SHAPE, from one Keycloak's mappers
    // would issue. A test that merely checked "a token came back" would let the
    // two drift and every later access-control proof would be proving nothing.
    const { app, jwks } = await createMockOidc({ issuer: ISSUER });

    const authorize = await request(app)
      .get('/authorize')
      .query({ persona: 'fay', redirect_uri: 'http://localhost:3000/auth/callback', state: 'xyz' });
    expect(authorize.status).toBe(302);

    const location = new URL(authorize.headers['location'] as string);
    expect(location.searchParams.get('state')).toBe('xyz');
    const code = location.searchParams.get('code');
    expect(code).toBeTruthy();

    const token = await request(app).post('/token').type('form').send({ code: code as string });
    expect(token.status).toBe(200);

    const { payload } = await jwtVerify(
      token.body.access_token as string,
      createLocalJWKSet(jwks as never),
      { issuer: ISSUER, audience: 'acme-workshop-gateway' },
    );

    // Fay is Northwind's fleet supervisor: a B2B customer of TTW, so her group
    // is the SUBGROUP path and her compartment is the sub-compartment only.
    expect(payload['preferred_username']).toBe('fay');
    expect(payload['groups']).toEqual(['/ttw/nwl']);
    expect(payload['handling_level']).toBe('PARTNER');
    expect(payload['compartments']).toEqual(['TTW/NWL']);
  });

  it('will not mint a token twice for one authorization code', async () => {
    const { app } = await createMockOidc({ issuer: ISSUER });
    const authorize = await request(app)
      .get('/authorize')
      .query({ persona: 'ada', redirect_uri: 'http://localhost:3000/auth/callback' });
    const code = new URL(authorize.headers['location'] as string).searchParams.get('code') as string;

    expect((await request(app).post('/token').type('form').send({ code })).status).toBe(200);
    expect((await request(app).post('/token').type('form').send({ code })).status).toBe(400);
  });

  it('refuses an unknown persona rather than inventing one', async () => {
    const { app } = await createMockOidc({ issuer: ISSUER });
    const res = await request(app)
      .get('/authorize')
      .query({ persona: 'nobody', redirect_uri: 'http://localhost:3000/auth/callback' });
    expect(res.status).toBe(400);
  });
});
