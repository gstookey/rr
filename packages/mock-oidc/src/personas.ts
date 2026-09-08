/**
 * The ACME Workshop dev personas — **fictional people, fictional employers**.
 *
 * This table is the single in-repo statement of the claim shape, and it is
 * mirrored by `infra/keycloak/realm-acme-workshop.json`. The mirroring is
 * deliberate duplication across a trust boundary: the realm is Keycloak's
 * source of truth, this table is the stub's, and the round-trip test below is
 * what catches them drifting.
 *
 * Group paths are FULL PATHS (`/ttw/nwl`), because the Keycloak group-membership
 * mapper is configured with `full.path: "true"` in the realm.
 *
 * Source of the roster: `docs/design/packets/acme-workshop-01-design-packet/
 * domain_model_v0.md` (Tenants and personas).
 */
export interface Persona {
  readonly username: string;
  readonly name: string;
  readonly email: string;
  /** What they do, so a failing proof reads like a sentence about people. */
  readonly role: string;
  readonly groups: readonly string[];
  readonly realmRoles: readonly string[];
  readonly handlingLevel: 'OPEN' | 'PARTNER' | 'INTERNAL' | 'RESTRICTED';
  readonly compartments: readonly string[];
}

export const PERSONAS: readonly Persona[] = [
  {
    username: 'ada',
    name: 'Ada Vance',
    email: 'ada@tick-tock.example',
    role: 'Tick-Tock Watchworks — inventory manager',
    groups: ['/ttw'],
    realmRoles: [],
    handlingLevel: 'INTERNAL',
    compartments: ['TTW'],
  },
  {
    username: 'bram',
    name: 'Bram Oduya',
    email: 'bram@tick-tock.example',
    role: 'Tick-Tock Watchworks — release engineer',
    groups: ['/ttw'],
    realmRoles: [],
    handlingLevel: 'INTERNAL',
    compartments: ['TTW'],
  },
  {
    username: 'cy',
    name: 'Cy Delacroix',
    email: 'cy@tick-tock.example',
    role: 'Tick-Tock Watchworks — group admin',
    groups: ['/ttw'],
    realmRoles: ['group-admin'],
    handlingLevel: 'INTERNAL',
    compartments: ['TTW', 'TTW/NWL'],
  },
  {
    username: 'dee',
    name: 'Dee Marchetti',
    email: 'dee@meridian.example',
    role: 'Meridian Wearables — inventory',
    groups: ['/mer'],
    realmRoles: [],
    handlingLevel: 'INTERNAL',
    compartments: ['MER'],
  },
  {
    username: 'eli',
    name: 'Eli Nakamura',
    email: 'eli@meridian.example',
    role: 'Meridian Wearables — group admin',
    groups: ['/mer'],
    realmRoles: ['group-admin'],
    handlingLevel: 'INTERNAL',
    compartments: ['MER'],
  },
  {
    username: 'fay',
    name: 'Fay Oyelaran',
    email: 'fay@northwind.example',
    role: 'Northwind Logistics — fleet supervisor (B2B customer of TTW)',
    groups: ['/ttw/nwl'],
    realmRoles: [],
    handlingLevel: 'PARTNER',
    compartments: ['TTW/NWL'],
  },
  {
    username: 'gus',
    name: 'Gus Almeida',
    email: 'gus@acme-workshop.example',
    role: 'ACME staff — platform operator',
    groups: ['/acme-staff'],
    realmRoles: ['platform-admin'],
    handlingLevel: 'RESTRICTED',
    compartments: ['TTW', 'TTW/NWL', 'MER'],
  },
];

/** The dev password every persona shares. Dev only; the realm carries the same. */
export const DEV_PASSWORD = 'changeme';

export function findPersona(username: string): Persona | undefined {
  return PERSONAS.find((p) => p.username === username.toLowerCase());
}
