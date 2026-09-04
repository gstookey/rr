import { noDependencies, type SheriffConfig } from '@softarc/sheriff-core';

/**
 * THE FENCE.
 *
 * This file is the machine-readable form of two doctrine paragraphs:
 *
 *  - `tier_model_exploration_v0.md` §4 — "Floors depend on L1 only, never on
 *    each other. Suites depend on their Floor's shared libraries and L1. Offices
 *    depend on nothing above them. Nothing in L1 imports from a Floor."
 *  - `ddd_ui_ux_brief_v0.md` §4.2 — the library taxonomy, whose types are
 *    defined by WHAT THEY MAY IMPORT, "which lint can enforce and a component
 *    kind never could". That is why there is no smart/dumb axis anywhere here.
 *
 * How Sheriff evaluates this (read from the source of
 * `check-for-dependency-rule-violation.js`, 0.19.6, verified 2026-09-04):
 * for EVERY tag of the importing module, the import must be permitted by some
 * rule keyed on that tag. Tags are therefore ANDed — a module tagged
 * `[type:domain, scope:invent]` must satisfy BOTH the type rule and the scope
 * rule. That AND is what makes one flat table express two independent axes.
 *
 * A module is a directory with a barrel `index.ts`, so the module paths below
 * end in `/src`, which is where each package's `index.ts` lives.
 */
export const config: SheriffConfig = {
  version: 1,
  autoTagging: true,

  modules: {
    // ---- L1 · The Building — the unclassified base (scope:platform) --------
    // The Building COMPOSES the Floors (the shell lazy-loads them; the gateway
    // mounts one router per Floor), so the two apps carry `scope:building`,
    // which may reach every Floor. The base library below stays
    // `scope:platform` and may reach none — that asymmetry is the doctrine.
    'apps/shell/src': ['type:app', 'scope:building'],
    'services/gateway/src': ['type:app', 'scope:building'],

    // The published language may import NOTHING (R7 §4.2: `common` "may
    // import: nothing"). Its own tag makes that a rule instead of a habit.
    'packages/common/src': ['type:common', 'scope:platform'],
    'packages/mock-oidc/src': ['type:util', 'scope:platform'],

    'packages/ui/src': ['type:ui', 'scope:platform'],
    'packages/markings/src': ['type:ui', 'scope:platform'],
    'packages/windows/src': ['type:ui', 'scope:platform'],

    'packages/auth/src': ['type:data-access', 'scope:platform'],
    'packages/config/src': ['type:data-access', 'scope:platform'],
    'packages/store-features/src': ['type:data-access', 'scope:platform'],

    // ---- L2 · Floors — one bounded context each ---------------------------
    // Placeholder patterns, so a Floor library added in S2..S7 is fenced the
    // moment it exists rather than the moment someone remembers to edit this
    // file. `<scope>` captures the Floor name from the directory itself.
    'packages/<scope>-domain/src': ['type:domain', 'scope:<scope>'],
    'packages/<scope>-data-access/src': ['type:data-access', 'scope:<scope>'],
    'packages/<scope>-ui/src': ['type:ui', 'scope:<scope>'],
    'packages/<scope>-feature-<suite>/src': ['type:feature', 'scope:<scope>'],
  },

  depRules: {
    // The implicit root module: eslint.config.js, sheriff.config.ts, scripts/*.
    // Tooling is allowed to reach anything; it is not part of the architecture.
    root: () => true,

    // Anything Sheriff could not tag is a fence hole, so it may import nothing.
    // If this fires, the answer is a `modules` entry, never a loosened rule.
    noTag: noDependencies,

    // ---- axis 1 · type (the layering) -------------------------------------
    // `type:app` is deliberately ABSENT from every value below: nothing
    // imports the shell, and nothing imports the gateway.
    'type:app': ['type:feature', 'type:ui', 'type:data-access', 'type:domain', 'type:util', 'type:common'],
    'type:feature': ['type:feature', 'type:ui', 'type:data-access', 'type:domain', 'type:util', 'type:common'],
    // A `ui` library may not reach for data. This is the rule that keeps a
    // presentational package from quietly becoming a screen.
    'type:ui': ['type:ui', 'type:domain', 'type:util', 'type:common'],
    'type:data-access': ['type:data-access', 'type:domain', 'type:util', 'type:common'],
    // A domain library sees its own scope's domain/util and the published
    // language — nothing else, in either direction.
    'type:domain': ['type:domain', 'type:util', 'type:common'],
    'type:util': ['type:util', 'type:common'],
    // The published language is a leaf: nothing internal, ever.
    'type:common': noDependencies,

    // ---- axis 2 · scope (the Floors) --------------------------------------
    // The base never reaches INTO a Floor. This is the rule that keeps the
    // unclassified base library unclassified.
    'scope:platform': 'scope:platform',
    // The Building composes every Floor; only the two apps carry this tag.
    'scope:building': ['scope:building', 'scope:platform', 'scope:invent', 'scope:command', 'scope:vigilance', 'scope:front-desk'],
    // A Floor sees itself and the base. Never another Floor: Command consumes
    // Invent's events through @rr/common, never Invent's types.
    'scope:invent': ['scope:invent', 'scope:platform'],
    'scope:command': ['scope:command', 'scope:platform'],
    'scope:vigilance': ['scope:vigilance', 'scope:platform'],
    'scope:front-desk': ['scope:front-desk', 'scope:platform'],
  },

  entryPoints: {
    shell: 'apps/shell/src/main.ts',
    common: 'packages/common/src/index.ts',
    ui: 'packages/ui/src/index.ts',
    auth: 'packages/auth/src/index.ts',
    config: 'packages/config/src/index.ts',
    markings: 'packages/markings/src/index.ts',
    windows: 'packages/windows/src/index.ts',
    'store-features': 'packages/store-features/src/index.ts',
    'invent-domain': 'packages/invent-domain/src/index.ts',
    'command-domain': 'packages/command-domain/src/index.ts',
  },
};
