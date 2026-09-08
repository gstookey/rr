import { join } from 'node:path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createGatewayApp } from './app.js';

describe('gateway (S0 skeleton)', () => {
  it('answers /healthz, so compose and the gate have a liveness signal to wait on', async () => {
    const res = await request(createGatewayApp()).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('serves the marking vocabulary and the four Floors from /api/config', async () => {
    // WHY: @rr/markings deliberately carries NO vocabulary — it renders what
    // this endpoint sends. If /api/config stops carrying the vocabulary, every
    // banner in the Building silently renders nothing, which looks like an
    // unmarked screen. That failure is worth a test on the day the route is born.
    const res = await request(createGatewayApp()).get('/api/config');
    expect(res.status).toBe(200);
    expect(res.body.markingVocabulary.levels.map((l: { id: string }) => l.id)).toEqual([
      'OPEN',
      'PARTNER',
      'INTERNAL',
      'RESTRICTED',
    ]);
    expect(res.body.floors.map((f: { id: string }) => f.id)).toEqual([
      'front-desk',
      'invent',
      'command',
      'vigilance',
    ]);
  });

  it('fails loudly when the manifest is missing rather than serving an empty Building', async () => {
    const app = createGatewayApp({ manifestPath: join(import.meta.dirname, 'no-such-manifest.json') });
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('CONFIG_UNAVAILABLE');
  });
});
