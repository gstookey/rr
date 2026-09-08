import { type Me, MeSchema } from '@rr/common';
import { type ManifestFile, floorClaimsForGroup, groupDisplayName } from '../config/manifest.js';

/**
 * Turn an ID Token's claims into the server's view of the subject.
 *
 * THE SEAM: everything the browser will ever know about who it is talking to is
 * decided here, on the server, from claims the identity provider signed. The
 * browser never decodes a token; there is nothing for it to decode.
 *
 * Two resolutions happen here on purpose, both of which a front end would be
 * wrong to do:
 *  - the GROUP DISPLAY NAME (AW-D20) — a path-to-label map in the browser is a
 *    list of every tenant, shipped to every tenant;
 *  - the FLOOR CLAIM SET — derived from the same manifest the Lobby is built
 *    from, so "the route matches" and "the Lobby lists it" cannot disagree.
 */

/** The claim names are Keycloak mapper output; `@rr/mock-oidc` mirrors them exactly. */
export interface IdTokenClaims {
  readonly sub?: unknown;
  readonly preferred_username?: unknown;
  readonly name?: unknown;
  readonly groups?: unknown;
  readonly handling_level?: unknown;
  readonly compartments?: unknown;
  readonly realm_access?: unknown;
}

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];

/**
 * Fail-closed by construction: every path that cannot produce a COMPLETE subject
 * returns `undefined`, and the caller turns that into `SIGN_IN_FAILED` with no
 * session created. There is deliberately no partial `Me` — a subject missing its
 * clearance or its group would render a Building nobody can reason about.
 */
export function resolveSubject(claims: IdTokenClaims, manifest: ManifestFile): Me | undefined {
  const groups = asStringArray(claims.groups);
  const known = groups.filter((path) => groupDisplayName(manifest, path) !== undefined);

  // Exactly one, or nothing. A subject in two tenants would make "acting as"
  // ambiguous, and resolving the ambiguity by picking the first is how a person
  // ends up acting as a tenant they did not choose. No seed persona holds two
  // groups; if one ever does, this is the line that must be ruled on, not
  // silently softened.
  if (known.length !== 1) {
    return undefined;
  }
  const groupPath = known[0]!;

  const roles =
    typeof claims.realm_access === 'object' && claims.realm_access !== null
      ? asStringArray((claims.realm_access as { roles?: unknown }).roles)
      : [];

  const candidate = {
    sub: claims.sub,
    username: claims.preferred_username,
    displayName: claims.name,
    group: { path: groupPath, displayName: groupDisplayName(manifest, groupPath) },
    handlingLevel: claims.handling_level,
    compartments: asStringArray(claims.compartments),
    roles,
    floors: floorClaimsForGroup(manifest, groupPath),
  };

  // Parsed, not cast. The gateway holds itself to the same published language it
  // asks the browser to parse against — an unexpected claim shape from the IdP
  // fails here, at the boundary, rather than downstream as a rendering oddity.
  const parsed = MeSchema.safeParse(candidate);
  return parsed.success ? parsed.data : undefined;
}
