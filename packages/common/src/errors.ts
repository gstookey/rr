import { z } from 'zod';

/**
 * The typed error codes the Building speaks (AW-D19).
 *
 * WHY THIS IS IN `@rr/common` AND NOT IN EITHER SIDE: the gateway produces these
 * strings and the shell renders them. Kept on one side only, the string the user
 * reads and the string the log records drift apart, and the first person to
 * debug a support call has to translate between two vocabularies. This union is
 * the seam: one list, parsed by both.
 *
 * S1 mints exactly three. Resist growing this list per-feature — an error code
 * is part of the published language, so adding one is a contract change.
 */
export const RR_ERROR_CODES = [
  /** `/api/config` could not be assembled. The Building fails CLOSED: no Floor list is guessed. */
  'CONFIG_UNAVAILABLE',
  /** There is no valid session (or it aged out). Returned by any `/api/*` read, never by a navigation. */
  'SESSION_EXPIRED',
  /** The OIDC round trip did not complete. Deliberately says nothing about which account or group. */
  'SIGN_IN_FAILED',
] as const;

export const RrErrorCodeSchema = z.enum(RR_ERROR_CODES);
export type RrErrorCode = z.infer<typeof RrErrorCodeSchema>;

/**
 * The body of every non-2xx `/api/*` response.
 *
 * `detail` is for the operator reading a log, never for the user reading a
 * screen: the no-leak contract (`mac_stores_brief_v0` §6) says forbidden and
 * non-existent must be indistinguishable, so nothing here may name a group, a
 * Floor or an account.
 */
export const ApiErrorSchema = z.strictObject({
  error: RrErrorCodeSchema,
  detail: z.string().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
