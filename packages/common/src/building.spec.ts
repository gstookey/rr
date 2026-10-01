import { describe, expect, it } from 'vitest';
import { AppConfigSchema, FloorEntrySchema, MarkingVocabularySchema, MeSchema } from './building.js';
import { RR_ERROR_CODES, RrErrorCodeSchema } from './errors.js';

/**
 * These assert the CONTRACT, not the parser. Each one names a way the Building
 * could quietly stop being tailorable if the schema drifted.
 */

const vocabulary = {
  levels: [
    { id: 'OPEN', rank: 0, label: 'OPEN', colourToken: '--rr-marking-open' },
    { id: 'PARTNER', rank: 1, label: 'PARTNER', colourToken: '--rr-marking-partner' },
    { id: 'INTERNAL', rank: 2, label: 'INTERNAL', colourToken: '--rr-marking-internal' },
    { id: 'RESTRICTED', rank: 3, label: 'RESTRICTED', colourToken: '--rr-marking-restricted' },
  ],
  compartments: [{ id: 'TTW', label: 'Tick-Tock Watchworks' }],
  bannerSeparator: '//',
  unresolved: { label: 'UNRESOLVED MARKING', colourToken: '--rr-marking-unresolved' },
};

describe('the published language of the Building (S1)', () => {
  it('requires a Floor entry to carry its own label, route, blurb and order', () => {
    // WHY: if any of these could be omitted, the shell would have to supply a
    // default — and a default label for a Floor is a Floor list living in the
    // Building. AW-D15 says all of it is manifest data; the schema enforces it.
    expect(
      FloorEntrySchema.safeParse({ id: 'invent', label: 'Invent', route: '/invent', blurb: 'x', order: 10 }).success,
    ).toBe(true);
    expect(FloorEntrySchema.safeParse({ id: 'invent', label: 'Invent', route: '/invent' }).success).toBe(false);
  });

  it('makes the vocabulary name a --rr-* token SLOT, never a colour', () => {
    // WHY: AW-D22. The moment a hex value can travel in the vocabulary, a tenant
    // palette has entered the base library's data contract and `@rr/markings`
    // stops being theme-agnostic.
    expect(MarkingVocabularySchema.safeParse(vocabulary).success).toBe(true);
    const withColour = {
      ...vocabulary,
      levels: [{ id: 'OPEN', rank: 0, label: 'OPEN', colourToken: '#5f6b76' }],
    };
    expect(MarkingVocabularySchema.safeParse(withColour).success).toBe(false);
  });

  it('requires the manifest to carry the Building-level marking', () => {
    // WHY: AW-D16. Without it the banner has nothing to render on the Lobby, and
    // the shell would be tempted to derive a marking from the subject's
    // clearance — which is the one confusion the chrome is designed to prevent.
    const config = {
      schemaVersion: 'acme-config/1',
      building: { name: 'ACME Workshop' },
      marking: { level: 'INTERNAL', compartments: ['TTW'] },
      floors: [{ id: 'invent', label: 'Invent', route: '/invent', blurb: 'x', order: 10 }],
      markingVocabulary: vocabulary,
    };
    expect(AppConfigSchema.safeParse(config).success).toBe(true);
    const withoutMarking: Record<string, unknown> = { ...config };
    delete withoutMarking['marking'];
    expect(AppConfigSchema.safeParse(withoutMarking).success).toBe(false);
  });

  it('requires /api/me to carry the group display name already resolved', () => {
    // WHY: AW-D20. A group path with no label forces a path->label map into the
    // front end, and that map is a list of every tenant, shipped to every tenant.
    const me = {
      sub: 'mock|ada',
      username: 'ada',
      displayName: 'Ada Vance',
      group: { path: '/ttw', displayName: 'Tick-Tock Watchworks' },
      handlingLevel: 'INTERNAL',
      compartments: ['TTW'],
      roles: [],
      floors: ['invent'],
    };
    expect(MeSchema.safeParse(me).success).toBe(true);
    expect(MeSchema.safeParse({ ...me, group: { path: '/ttw' } }).success).toBe(false);
  });

  it('mints exactly the three S1 error codes', () => {
    // WHY: rule 8 — the error union is published truth. A fourth code appearing
    // without a ruling means one side started inventing vocabulary.
    expect([...RR_ERROR_CODES]).toEqual(['CONFIG_UNAVAILABLE', 'SESSION_EXPIRED', 'SIGN_IN_FAILED']);
    expect(RrErrorCodeSchema.safeParse('FORBIDDEN').success).toBe(false);
  });
});
