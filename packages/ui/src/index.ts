/**
 * Public API of `@rr/ui` — the unclassified base's presentational ring.
 *
 * FENCE (Sheriff `type:ui`): nothing exported here may import `type:data-access`
 * or `type:feature`. A `ui` component's only knowledge is its signal inputs and
 * the design system (`ddd_ui_ux_brief_v0.md` §4.2).
 *
 * S1 keeps this deliberately THIN. Two things live here and nothing else:
 *  - `src/styles/acme-theme.scss`, the tenant half of AW-D22 — the `--rr-*`
 *    slot VALUES the base library reads but never ships;
 *  - one shared chrome primitive, the wordmark, which appears on the Building,
 *    the Lobby and the signed-out surface.
 *
 * **AstroUXDS is NOT a dependency in S1, on purpose (DA-D11).** The façade wraps
 * Astro when there is something to wrap; adding the dependency before the first
 * Astro-backed primitive would put a design system in the lockfile to prove a
 * point rather than to render a screen. Tokens are the whole styling contract
 * until then, which is exactly what makes the swap possible later.
 */
export { RrWordmark } from './lib/wordmark/wordmark';
export { RR_UI_PACKAGE } from './lib/ui-package';
