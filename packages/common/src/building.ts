import { z } from 'zod';
import { CompartmentSchema, HandlingLevelSchema, MarkingSchema } from './marking.js';

/**
 * The Building's two read contracts — `GET /api/me` and `GET /api/config` — as
 * schemas. The gateway validates what it is about to send; the shell validates
 * what it just received (`httpResource`'s `parse`). Same file, both sides.
 *
 * The load-bearing idea, and the one S1 exists to demonstrate: **everything that
 * differs between two tenants is in here as DATA.** There is no Floor list, no
 * label map, no colour and no group name compiled into the shell, so the day a
 * third manufacturer arrives (S4) nothing in this file changes either.
 */

/**
 * One row of the Floor directory (AW-D15). All five fields are manifest data,
 * including `blurb` — a Floor fact held by the Building would be a Floor fact in
 * the wrong tier.
 *
 * `order` is meaningful. The gateway serves the array already ordered and the
 * shell renders it as served; a client-side sort would quietly reintroduce a
 * Building-side opinion about which Floor matters most.
 */
export const FloorEntrySchema = z.strictObject({
  /** Matches the Floor claim on `Me.floors` and the route segment. */
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  label: z.string().min(1),
  route: z.string().startsWith('/'),
  blurb: z.string().min(1),
  order: z.number().int(),
  /**
   * STUDY SCAFFOLDING, not a product field: which slice builds this Floor's
   * interior. It exists so the Lobby can be honest that a Floor is not built
   * yet, and it leaves with the last placeholder.
   */
  arrivesIn: z.string().optional(),
});
export type FloorEntry = z.infer<typeof FloorEntrySchema>;

/**
 * A level in the served vocabulary. `colourToken` names a CSS custom property
 * SLOT (`--rr-*`) — never a colour (AW-D22). `@rr/markings` reads the slot name;
 * the tenant's theme stylesheet supplies the value. That split is the reason the
 * base library can ship with no palette and no level names.
 */
export const MarkingLevelEntrySchema = z.strictObject({
  id: HandlingLevelSchema,
  rank: z.number().int().nonnegative(),
  label: z.string().min(1),
  colourToken: z.string().startsWith('--rr-'),
});
export type MarkingLevelEntry = z.infer<typeof MarkingLevelEntrySchema>;

export const CompartmentEntrySchema = z.strictObject({
  id: CompartmentSchema,
  label: z.string().min(1),
});
export type CompartmentEntry = z.infer<typeof CompartmentEntrySchema>;

/**
 * Everything needed to RENDER a marking, and nothing needed to DECIDE one.
 * Dominance is `dominates()` in `marking.ts` and, from S2, Postgres RLS; this
 * object never reaches an enforcement point.
 */
export const MarkingVocabularySchema = z.strictObject({
  levels: z.array(MarkingLevelEntrySchema).min(1),
  compartments: z.array(CompartmentEntrySchema),
  /** `//` in ACME. The separator is data because a second island spells it differently. */
  bannerSeparator: z.string().min(1),
  /** What a marking the vocabulary cannot resolve renders as. Never a guess, never OPEN. */
  unresolved: z.strictObject({
    label: z.string().min(1),
    colourToken: z.string().startsWith('--rr-'),
  }),
});
export type MarkingVocabulary = z.infer<typeof MarkingVocabularySchema>;

/**
 * `GET /api/config` — the per-group manifest. One subject, one Building.
 */
export const AppConfigSchema = z.strictObject({
  schemaVersion: z.literal('acme-config/1'),
  building: z.strictObject({ name: z.string().min(1) }),
  /**
   * The Building-level marking (AW-D16): the marking of the SURFACE — the Lobby,
   * and any Floor with no rows loaded. It is not the subject's clearance; the
   * two are drawn in different places on purpose (banner vs chip).
   */
  marking: MarkingSchema,
  /** Already in render order, Front Desk last. Render as served. */
  floors: z.array(FloorEntrySchema),
  /**
   * Optional (AW-D17). When present the elevator opens on this Floor after
   * sign-in. The Lobby exists regardless — a Building whose front door teleports
   * its single-Floor tenants leaves them nowhere to stand when the Floor fails.
   */
  landingFloor: z.string().optional(),
  markingVocabulary: MarkingVocabularySchema,
});
export type AppConfig = z.infer<typeof AppConfigSchema>;

/**
 * `GET /api/me` — the server's view of the subject. The browser holds no token
 * and decodes no JWT; this is the only identity it ever sees.
 *
 * Fail-closed: there is no partial `Me`. Either the gateway can answer all of
 * this from a valid session, or it answers 401 `SESSION_EXPIRED`.
 */
export const MeSchema = z.strictObject({
  sub: z.string().min(1),
  username: z.string().min(1),
  displayName: z.string().min(1),
  /**
   * The group, WITH ITS DISPLAY NAME ALREADY RESOLVED (AW-D20). A path-to-label
   * map in the front end is a tenant list in disguise, so the resolution happens
   * where the tenant list legitimately lives.
   */
  group: z.strictObject({
    path: z.string().startsWith('/'),
    displayName: z.string().min(1),
  }),
  handlingLevel: HandlingLevelSchema,
  compartments: z.array(CompartmentSchema),
  roles: z.array(z.string()),
  /**
   * The Floor claim set, resolved server-side from the subject's group.
   *
   * This is what the `CanMatch` guard reads, and it is deliberately the same
   * derivation the manifest's `floors` comes from — so "the route matches" and
   * "the Lobby lists it" can never disagree. The guard is UX; the gateway
   * re-checks every request regardless (ASVS 5.0 §8.3.1).
   */
  floors: z.array(z.string()),
});
export type Me = z.infer<typeof MeSchema>;
