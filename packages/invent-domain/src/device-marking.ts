import { type Marking, MarkingSchema } from '@rr/common';

/**
 * The one ALLOWED cross-package edge this stub exercises: a Floor's `type:domain`
 * library may import `@rr/common` (the published language) and nothing else
 * outside its own scope. Sheriff permits exactly this edge; the same file
 * reaching for `@rr/command-domain` is what `scripts/prove-fence.sh` makes fail.
 */
export function deviceRegistryMarking(owner: string): Marking {
  return MarkingSchema.parse({ level: 'INTERNAL', compartments: [owner] });
}
