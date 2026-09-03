---
schema: corpus-doc/v1
status: active
title: Technology Stack — Intended (Design Direction)
areas: [technology-stack, system-architecture, monorepo, frontend, backend]
related: ["docs/context/canonical/isolated_network_constraints.md", "docs/context/governance/contradictions/register.md", "docs/context/evidence/raw/source_register.md"]
updated: 2026-09-03
---

# Technology Stack — Intended (Design Direction)

**Created:** 2026-08-25 | **Last updated:** 2026-09-03 (Axium; three Angular lines corrected against the v22 changelog — surfaced by the DDD-ARCH-01 modernization pass)

**Implementation status:** nothing below is stood up. This is the synthesized *intended* stack from `docs/source-documents/`. It becomes truth only when `docs/CURRENT_STATE.md` says so.

## Client

| Concern | Intended choice | Source | Notes |
|---|---|---|---|
| Framework | Angular 22, standalone components, strict templates | `config-docs/example-config-files.md` | Upgrade guides v17→v22 kept under `docs/angular-upgrade-docs/` for the sibling app's benefit |
| Language | TypeScript ~6.0 | same | `moduleResolution: bundler`, `isolatedModules` |
| State | NgRx SignalStore (`@ngrx/signals`, peers strictly per Angular major) | same | signal-first. **Zoneless is not an option, it is the default from v21** (stable v20, per the Angular changelog 2025-08-20 / 2025-11-19); `OnPush` is the default change-detection strategy from v22 (2026-06-03). The blueprint's `provideZoneChangeDetection` line is what to delete. |
| HTTP | `provideHttpClient()` | same | fetch is the default backend in v22 and `withFetch()` is **deprecated** there (changelog 22.0.0); on a v19–v21 re-pin `withFetch()` is the opt-in. |
| Testing | Vitest (jsdom) | `vitest/*` | replaces Karma/Jasmine; the Angular CLI default in v22 (the legacy apps use Jest — two runners will coexist across the islands) |
| Design system | AstroUXDS (`@astrouxds/angular`, web components, tokens), dark theme | `styling/astro-uxds-*` | RR brand layered as CSS-custom-property overrides, never a fork |
| Brand tokens | `--rr-orange-500` etc. per style guide | `styling/project-rr-style-guide.md` | companion `_roadrunner-tokens.scss` referenced but **not present in repo** |

## Shared / server

| Concern | Intended choice | Notes |
|---|---|---|
| Shared library | `common/` TypeScript package (contracts, models) | consumed by client and server via workspace symlink |
| Gateway | Node 22 + Express, `tsc` build | serves `/api/config`, reads Helm ConfigMap at `/config/runtime-config.json` with `.env` fallback |
| Workspace tooling | **npm workspaces**, `@rr/*` package scope (ADR-004, accepted) | no Nx/Turborepo; layout half of C-001 still open |
| Runtime | Kubernetes via Helm chart; ConfigMap-driven runtime config | `mono-repo-helm-chart-setup.md` |

## Open stack questions

- ~~Zone.js vs zoneless~~ **Resolved by the framework (2026-09-03):** zoneless is the v21+ default; remove `provideZoneChangeDetection` from the blueprint.
- TypeScript drift: 7.0 is npm `latest` (2026-07) while the stack pins 6.0.x, the self-described transition release whose deprecations 7.0 removes — a deliberate lag to close before Angular 23 (R1 §7).
- Package manager: **decided — npm** (ADR-004).
- Whether any of this is installable on the isolated network — see `isolated_network_constraints.md`. Version pins must be frozen against what can actually be mirrored.
