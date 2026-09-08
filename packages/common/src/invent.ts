import { z } from 'zod';
import { MarkingSchema } from './marking.js';

/**
 * Published language — **Invent** (Inventory, a CORE context). S2 fills it in.
 *
 * Lexicon traps this module exists to keep straight:
 *  - *product* = a device MODEL; *device* = a serialised UNIT of a product.
 *  - *device class* is DATA (wearable, fitness, …), never a TypeScript enum —
 *    Boundary-Test rung 1 lives in the spec bag, so a new class needs no code.
 *  - *update* here would be ambiguous (software update vs record edit), so this
 *    module never uses the bare word.
 */
export const DeviceClassSchema = z.string().min(1).max(64);

export const ProductSummarySchema = z.strictObject({
  productId: z.string().min(1),
  name: z.string().min(1),
  deviceClass: DeviceClassSchema,
  marking: MarkingSchema,
});
export type ProductSummary = z.infer<typeof ProductSummarySchema>;
