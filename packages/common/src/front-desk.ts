import { z } from 'zod';
import { MarkingSchema } from './marking.js';

/**
 * Published language — **Front Desk** (Identity & Access, a GENERIC context).
 * Keycloak owns users, groups and roles; this context owns only the read models
 * the delegated-admin Office needs. S7 fills it in.
 *
 * Lexicon: *member* = a person in a group · *group* = a tenant or B2B sub-tenant
 * (an organisational unit AND a compartment here, by construction — AW-D9) ·
 * *role* = a Keycloak role.
 */
export const GroupMemberSchema = z.strictObject({
  subjectId: z.string().min(1),
  displayName: z.string().min(1),
  groupPath: z.string().min(1),
  marking: MarkingSchema,
});
export type GroupMember = z.infer<typeof GroupMemberSchema>;
