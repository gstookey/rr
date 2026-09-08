import { z } from 'zod';
import { MarkingSchema } from './marking.js';

/**
 * Published language — **Command** (Device Tasking, a CORE context). S6 fills it in.
 *
 * Lexicon, pinned by Graham: **Command** capitalised is the Floor; *command*
 * lowercase is a CQRS write message; and the thing a Campaign delivers to a
 * device is an **instruction** — never a "command". Nothing in this module may
 * name a device payload `command`.
 */
export const CampaignSummarySchema = z.strictObject({
  campaignId: z.string().min(1),
  name: z.string().min(1),
  payloadKind: z.enum(['software-update', 'instruction', 'feature-activation']),
  marking: MarkingSchema,
});
export type CampaignSummary = z.infer<typeof CampaignSummarySchema>;
