/**
 * Public API of `@rr/ui` — the unclassified base's presentational ring.
 *
 * FENCE (Sheriff `type:ui`): nothing exported here may import `type:data-access`
 * or `type:feature`. A `ui` component's only knowledge is its signal inputs and
 * the design system (ddd_ui_ux_brief_v0.md §4.2).
 *
 * S0: AstroUXDS is NOT wired yet — that is S1 after Cadence's mockup pass.
 */
export { RR_UI_PACKAGE } from './lib/ui-package';
