/**
 * Public API of `@rr/markings` — marking RENDERERS, never marking strings.
 *
 * This package ships **no level names, no compartment names, no colours and no
 * banner strings**. The vocabulary (ACME's invented OPEN < PARTNER < INTERNAL <
 * RESTRICTED and its compartments) is served at runtime by `/api/config` and
 * arrives here as a signal input; the `--rr-*` colour SLOTS it names are given
 * values by the tenant's theme stylesheet (AW-D22). Baking a vocabulary in here
 * is the failure this package exists to prevent.
 *
 * FENCE (`type:ui`): it may not import `type:data-access`, which is why the
 * vocabulary is an input and not an injected store — see the note in
 * `marking-banner.ts`.
 */
export { RrMarkingBanner } from './lib/banner/marking-banner';
export { RrMarkingChip } from './lib/chip/marking-chip';
export {
  resolveMarking,
  type MarkingRendering,
  type ResolvedMarking,
  type UnresolvedMarking,
} from './lib/resolve-marking';
export { RR_MARKINGS_PACKAGE } from './lib/markings-package';
