import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEV_PASSWORD, PERSONAS } from './personas.js';

/**
 * The stub and the real realm are two statements of one claim shape, on
 * opposite sides of a boundary the fleet cannot cross (no Docker daemon here).
 * Nothing stops them drifting except this file.
 *
 * WHY it matters more than it looks: every access-control proof from S1 on runs
 * against the stub in CI and against Keycloak on Graham's machine. If the two
 * disagree about what a token contains, CI goes green on a claim shape the real
 * system never emits — and the failure surfaces slices later, as "auth is
 * broken", far from the cause.
 */
const REALM = JSON.parse(
  readFileSync(join(import.meta.dirname, '../../../infra/keycloak/realm-acme-workshop.json'), 'utf8'),
) as {
  realm: string;
  users: {
    username: string;
    groups: string[];
    realmRoles: string[];
    credentials: { value: string }[];
    attributes: { handling_level: string[]; compartments: string[] };
  }[];
  clientScopes: { name: string; protocolMappers: { protocolMapper: string; config: Record<string, string> }[] }[];
  clients: { clientId: string; publicClient: boolean; redirectUris: string[] }[];
  groups: { path: string; subGroups: { path: string }[] }[];
  roles: { realm: { name: string }[] };
};

describe('realm <-> mock-oidc parity', () => {
  it('has one realm user per stub persona, with the same groups, level and compartments', () => {
    expect(REALM.realm).toBe('acme-workshop');
    expect(REALM.users).toHaveLength(PERSONAS.length);

    for (const persona of PERSONAS) {
      const user = REALM.users.find((u) => u.username === persona.username);
      expect(user, `realm is missing persona '${persona.username}'`).toBeDefined();
      expect(user?.groups).toEqual([...persona.groups]);
      expect(user?.realmRoles).toEqual([...persona.realmRoles]);
      expect(user?.attributes.handling_level).toEqual([persona.handlingLevel]);
      expect(user?.attributes.compartments).toEqual([...persona.compartments]);
      expect(user?.credentials[0]?.value).toBe(DEV_PASSWORD);
    }
  });

  it('emits the three claims the stub emits, from mappers of the right kind', () => {
    const scope = REALM.clientScopes.find((s) => s.name === 'acme-workshop');
    expect(scope).toBeDefined();
    const byClaim = new Map(scope!.protocolMappers.map((m) => [m.config['claim.name'], m]));

    expect(byClaim.get('groups')?.protocolMapper).toBe('oidc-group-membership-mapper');
    // Full paths, or /ttw/nwl is indistinguishable from /ttw and Fay sees TTW's fleet.
    expect(byClaim.get('groups')?.config['full.path']).toBe('true');

    expect(byClaim.get('handling_level')?.protocolMapper).toBe('oidc-usermodel-attribute-mapper');
    expect(byClaim.get('handling_level')?.config['multivalued']).toBe('false');

    expect(byClaim.get('compartments')?.protocolMapper).toBe('oidc-usermodel-attribute-mapper');
    expect(byClaim.get('compartments')?.config['multivalued']).toBe('true');

    for (const mapper of scope!.protocolMappers) {
      expect(mapper.config['access.token.claim']).toBe('true');
    }
  });

  it('declares the two custom attributes in the user profile, or Keycloak 24+ drops them silently', () => {
    const components = (REALM as unknown as {
      components: Record<string, { config: Record<string, string[]> }[]>;
    }).components['org.keycloak.userprofile.UserProfileProvider'];
    const profile = JSON.parse(components![0]!.config['kc.user.profile.config']![0]!) as {
      unmanagedAttributePolicy: string;
      attributes: { name: string }[];
    };
    const declared = profile.attributes.map((a) => a.name);
    expect(declared).toContain('handling_level');
    expect(declared).toContain('compartments');
    expect(profile.unmanagedAttributePolicy).toBe('ENABLED');
  });

  it('keeps the gateway a CONFIDENTIAL client with the callback the BFF pattern needs', () => {
    const client = REALM.clients.find((c) => c.clientId === 'acme-workshop-gateway');
    expect(client).toBeDefined();
    // Public client = a token in the browser = the forbidden idiom.
    expect(client?.publicClient).toBe(false);
    expect(client?.redirectUris).toContain('http://localhost:3000/auth/callback');
  });

  it('carries the four groups (nwl as a SUBgroup of ttw) and the two realm roles', () => {
    expect(REALM.groups.map((g) => g.path).sort()).toEqual(['/acme-staff', '/mer', '/ttw']);
    const ttw = REALM.groups.find((g) => g.path === '/ttw');
    expect(ttw?.subGroups.map((s) => s.path)).toEqual(['/ttw/nwl']);
    expect(REALM.roles.realm.map((r) => r.name).sort()).toEqual(['group-admin', 'platform-admin']);
  });
});
