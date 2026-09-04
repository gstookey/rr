import { z } from 'zod';
import { MarkingSchema } from './marking.js';

/**
 * Published language — **Vigilance** (Situational Awareness, a CORE context).
 * S3 fills it in.
 *
 * Lexicon: *fleet* = the devices a group operates · **health** = a device's
 * reported state — never "status", a word the lexicon deliberately leaves
 * generic · *last known* = the position an offline device was last seen at.
 */
export const DeviceHealthSchema = z.enum(['nominal', 'degraded', 'fault', 'unknown']);
export type DeviceHealth = z.infer<typeof DeviceHealthSchema>;

export const FleetDeviceSchema = z.strictObject({
  deviceId: z.string().min(1),
  operatorGroup: z.string().min(1),
  health: DeviceHealthSchema,
  online: z.boolean(),
  marking: MarkingSchema,
});
export type FleetDevice = z.infer<typeof FleetDeviceSchema>;
