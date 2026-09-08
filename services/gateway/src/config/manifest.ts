import { readFileSync } from 'node:fs';
import {
  type AppConfig,
  AppConfigSchema,
  FloorEntrySchema,
  MarkingSchema,
  MarkingVocabularySchema,
} from '@rr/common';
import { z } from 'zod';

/**
 * THE TAILORING MECHANISM, in one file (practical_picture_v0 §3).
 *
 * A group does not describe its Floors — it SELECTS them from one catalog by id.
 * That is why S4's proof (a third manufacturer, zero code changes) is possible:
 * a new tenant is a new entry in `groups`, and the catalog it draws from is
 * already there. If a group could carry its own labels or routes, "add a tenant"
 * would become "restate the Building", and the variation would have climbed a
 * rung it does not belong on.
 */

/** The on-disk shape. Keys beginning with `$` are comments and are ignored. */
const GroupManifestSchema = z.strictObject({
  displayName: z.string().min(1),
  /** The group's own marking — the SURFACE's marking, never the subject's clearance (AW-D16). */
  marking: MarkingSchema,
  floors: z.array(z.string()),
  landingFloor: z.string().optional(),
});

const ManifestFileSchema = z
  .object({
    schemaVersion: z.literal('acme-config/1'),
    building: z.strictObject({ name: z.string().min(1), host: z.string().min(1) }),
    floorCatalog: z.array(FloorEntrySchema).min(1),
    markingVocabulary: MarkingVocabularySchema,
    groups: z.record(z.string().startsWith('/'), GroupManifestSchema),
  })
  .loose();

export type ManifestFile = z.infer<typeof ManifestFileSchema>;

/**
 * Read and VALIDATE the manifest file. Validation happens here, once, against
 * the same schemas the browser parses with — so a typo in this file is a
 * gateway-start error naming the field, not a blank Lobby three layers later.
 */
export function loadManifestFile(path: string): ManifestFile {
  return ManifestFileSchema.parse(JSON.parse(readFileSync(path, 'utf8')));
}

/**
 * Assemble one subject's Building.
 *
 * Returns `undefined` when the group is not in the manifest — the caller then
 * fails CLOSED (`CONFIG_UNAVAILABLE`) rather than serving an empty Floor list,
 * because "no Floors" and "we could not tell" look identical on screen and mean
 * opposite things to the person reading it.
 */
export function configForGroup(file: ManifestFile, groupPath: string): AppConfig | undefined {
  const group = file.groups[groupPath];
  if (!group) {
    return undefined;
  }

  const byId = new Map(file.floorCatalog.map((floor) => [floor.id, floor]));
  const floors = group.floors
    .map((id) => byId.get(id))
    .filter((floor) => floor !== undefined)
    // Sorted HERE, once, so the client can render as served (AW-D15). A sort in
    // the browser would be the Building holding an opinion about Floor order,
    // which is exactly the thing the manifest exists to own.
    .sort((a, b) => a.order - b.order);

  return AppConfigSchema.parse({
    schemaVersion: file.schemaVersion,
    building: { name: file.building.name },
    marking: group.marking,
    floors,
    ...(group.landingFloor === undefined ? {} : { landingFloor: group.landingFloor }),
    markingVocabulary: file.markingVocabulary,
  });
}

/** The Floor claim set for a group — the same derivation the manifest uses. */
export function floorClaimsForGroup(file: ManifestFile, groupPath: string): string[] {
  const config = configForGroup(file, groupPath);
  return config ? config.floors.map((floor) => floor.id) : [];
}

/** Every group path the manifest knows. Used to fail sign-in closed on an unknown group. */
export function knownGroupPaths(file: ManifestFile): string[] {
  return Object.keys(file.groups);
}

export function groupDisplayName(file: ManifestFile, groupPath: string): string | undefined {
  return file.groups[groupPath]?.displayName;
}
