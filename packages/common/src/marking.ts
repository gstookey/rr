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
 * Does `held` satisfy the row compartment `required`?
 *
 * Yes when they are the same compartment, and yes when `held` is a PREFIX of
 * `required` — holding `TTW` satisfies a row marked `TTW/NWL`. The relation is
 * deliberately one-way: `TTW/NWL` does NOT satisfy `TTW`, because a B2B
 * customer is inside its manufacturer's compartment, not beside it.
 *
 * The `/` test matters. Without it, `TTW` would also satisfy `TTWX`, and a
 * compartment could be widened by choosing a name.
 */
function satisfies(held: string, required: string): boolean {
  return held === required || required.startsWith(`${held}/`);
}

/**
 * The R5 dominance rule, on invented data: a subject may see a row when its
 * level dominates the row's level AND every compartment on the row is
 * satisfied by some compartment the subject holds.
 *
 * Compartments nest, by AW-D13 (ruled 2026-09-04): dominance uses **prefix
 * subsumption**, so a manufacturer sees the devices its B2B customers operate
 * and the customer sees only its own. Ada (`TTW`) reads a `TTW/NWL` row; Fay
 * (`TTW/NWL`) does not read a `TTW` row.
 *
 * This is the reference implementation of the rule. It is NOT the enforcement
 * point — Postgres RLS is (S2), and its SQL predicate must mirror `satisfies`
 * exactly, prefix test and all. This function exists so the UI, the seed
 * validator, the BFF and that policy all agree on what the rule MEANS.
 */
export function dominates(subject: SubjectClearance, row: Marking): boolean {
  if (RANK[subject.level] < RANK[row.level]) {
    return false;
  }
  return row.compartments.every((required) =>
    subject.compartments.some((held) => satisfies(held, required)),
  );
}

/**
 * The banner string ACME renders at the top of a screen. Colours live in the UI.
 *
 * Compartments are joined with `, ` and NOT with `/`, because a B2B
 * sub-compartment already contains a `/` — `TTW/TTW/NWL` would be unreadable and,
 * worse, re-parseable into the wrong set.
 *
 * The separator defaults to ACME's `//` and is overridable because the served
 * marking vocabulary carries it (`MarkingVocabulary.bannerSeparator`): a second
 * island spells its banners differently, and the UI must never compose the
 * string itself — it passes the vocabulary's separator to this one function.
 *
 * Note that the string is built from the marking's canonical IDs, never from the
 * vocabulary's human labels. `TTW` is the compartment; "Tick-Tock Watchworks" is
 * a tenant's name, and a tenant's name does not belong in a banner.
 */
export function markingBanner(marking: Marking, separator = '//'): string {
  return marking.compartments.length === 0
    ? marking.level
    : `${marking.level}${separator}${[...marking.compartments].sort().join(', ')}`;
}
