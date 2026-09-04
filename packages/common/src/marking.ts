import { z } from 'zod';

/**
 * ACME Workshop's **fictional** marking vocabulary. Every string here is
 * invented; no real classification, program name or compartment appears in this
 * repo, by construction (packet README, "Everything in it is invented").
 *
 * Handling levels are ORDERED — OPEN < PARTNER < INTERNAL < RESTRICTED — and the
 * order is the dominance lattice's first axis. The second axis is the
 * compartment set: manufacturer codes (`TTW`, `MER`) and B2B sub-compartments
 * (`TTW/NWL`).
 *
 * The vocabulary is duplicated at runtime by `/api/config` for `@rr/markings` to
 * render from. This module owns the SHAPE and the RULE; it does not own how
 * anything is drawn.
 */
export const HANDLING_LEVELS = ['OPEN', 'PARTNER', 'INTERNAL', 'RESTRICTED'] as const;

export const HandlingLevelSchema = z.enum(HANDLING_LEVELS);
export type HandlingLevel = z.infer<typeof HandlingLevelSchema>;

/** `TTW` or `TTW/NWL` — a manufacturer code, optionally with one B2B sub-compartment. */
export const CompartmentSchema = z
  .string()
  .regex(/^[A-Z]{2,6}(\/[A-Z]{2,6})?$/, 'compartment must be CODE or CODE/SUBCODE in upper case');
export type Compartment = z.infer<typeof CompartmentSchema>;

/** The value object that rides on every row, every event envelope and every DTO. */
export const MarkingSchema = z.strictObject({
  level: HandlingLevelSchema,
  compartments: z.array(CompartmentSchema).max(8),
});
export type Marking = z.infer<typeof MarkingSchema>;

/** The subject side of the lattice: what a signed-in person's claims amount to. */
export const SubjectClearanceSchema = z.strictObject({
  level: HandlingLevelSchema,
  compartments: z.array(CompartmentSchema).max(32),
});
export type SubjectClearance = z.infer<typeof SubjectClearanceSchema>;

const RANK: Readonly<Record<HandlingLevel, number>> = {
  OPEN: 0,
  PARTNER: 1,
  INTERNAL: 2,
  RESTRICTED: 3,
};

/**
 * The R5 dominance rule, on invented data: a subject may see a row when its
 * level dominates the row's level AND its compartment set contains every
 * compartment on the row.
 *
 * This is the reference implementation of the rule. It is NOT the enforcement
 * point — Postgres RLS is (S2). It exists so the UI, the seed validator and the
 * BFF all agree on what the rule MEANS.
 */
export function dominates(subject: SubjectClearance, row: Marking): boolean {
  if (RANK[subject.level] < RANK[row.level]) {
    return false;
  }
  const held = new Set(subject.compartments);
  return row.compartments.every((c) => held.has(c));
}

/**
 * The banner string ACME renders at the top of a screen. Colours live in the UI.
 *
 * Compartments are joined with `, ` and NOT with `/`, because a B2B
 * sub-compartment already contains a `/` — `TTW/TTW/NWL` would be unreadable and,
 * worse, re-parseable into the wrong set.
 */
export function markingBanner(marking: Marking): string {
  return marking.compartments.length === 0
    ? marking.level
    : `${marking.level}//${[...marking.compartments].sort().join(', ')}`;
}
