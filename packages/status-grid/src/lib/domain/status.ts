/**
 * The six validation statuses — the feature's whole vocabulary of "how is this sample doing".
 *
 * Created: 2026-10-01
 *
 * Each distinction was argued for in design (R1/R2 rulings) and must not be collapsed:
 *  • INVALID vs ERROR — INVALID means the validation FAILED; ERROR means it COULD NOT BE PERFORMED
 *    (retrieval failed). Different operational facts, different colours.
 *  • PENDING vs NO_DATA — PENDING is a sample that is DUE and has not arrived; NO_DATA is a sample
 *    that is NOT DUE YET (its time is in the future). The future must never be the loudest thing
 *    on screen, so NO_DATA draws a hyphen, never a disc.
 *  • Astro's `off` is never used: it means powered-down, a claim about the hardware. Absence is
 *    not a power state.
 */
export type ValidationStatus = 'VALID' | 'PARTIAL' | 'INVALID' | 'ERROR' | 'PENDING' | 'NO_DATA';

/** Every status, in legend order. */
export const VALIDATION_STATUSES: readonly ValidationStatus[] = [
  'VALID',
  'PARTIAL',
  'INVALID',
  'ERROR',
  'PENDING',
  'NO_DATA',
];

/** Statuses that count as a verdict on an ELAPSED sample. NO_DATA is "not yet", never counted. */
export const COUNTED_STATUSES: readonly ValidationStatus[] = ['VALID', 'PARTIAL', 'INVALID', 'ERROR', 'PENDING'];

/**
 * Roll-up precedence, worst first: a KNOWN failure outranks an UNKNOWN one, and anything outranks
 * "all good". A row, an hour or a unit takes the first of these present among its elapsed samples.
 */
export const ROLLUP_PRECEDENCE: readonly ValidationStatus[] = ['INVALID', 'PARTIAL', 'ERROR', 'PENDING', 'VALID'];

/** Human label for legends, chips and accessible names. */
export const STATUS_LABEL: Readonly<Record<ValidationStatus, string>> = {
  VALID: 'Valid',
  PARTIAL: 'Partial',
  INVALID: 'Invalid',
  ERROR: 'Error',
  PENDING: 'Pending',
  NO_DATA: 'No data yet',
};

/** The worst status present, by ROLLUP_PRECEDENCE; NO_DATA when there is nothing to judge. */
export function worstOf(statuses: Iterable<ValidationStatus>): ValidationStatus {
  const present = new Set(statuses);
  return ROLLUP_PRECEDENCE.find((status) => present.has(status)) ?? 'NO_DATA';
}

/** A per-status tally. */
export type StatusCounts = Record<ValidationStatus, number>;

export function emptyCounts(): StatusCounts {
  return { VALID: 0, PARTIAL: 0, INVALID: 0, ERROR: 0, PENDING: 0, NO_DATA: 0 };
}
