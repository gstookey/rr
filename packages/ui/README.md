# @rr/ui

The presentational ring of the unclassified base. Presentational primitives only — **must not** import data-access or feature (Sheriff `type:ui`).

**S1 status:** deliberately thin.

| What | Why it is here |
|---|---|
| `src/styles/acme-theme.scss` | the tenant half of AW-D22: the base library owns the `--rr-*` slot NAMES, this file owns the VALUES. Cadence's S1 token sketch, reproduced exactly. Consumed by the shell through `stylePreprocessorOptions.includePaths` |
| `RrWordmark` | the one chrome primitive shared by the Building, the Lobby and the signed-out surface |

**AstroUXDS is not a dependency in S1, on purpose (DA-D11).** The façade wraps Astro when there is something to wrap; adding a design system to the lockfile before the first Astro-backed primitive would be proving a point rather than rendering a screen. Until then tokens are the whole styling contract — which is exactly what makes the swap possible later. Astro's own classification-marking component will **not** be used: it carries a fixed classification enum, and `@rr/markings` renders from the runtime vocabulary.
