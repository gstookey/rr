---
schema: corpus-doc/v1
status: active
title: Technology Stack — Intended (Design Direction)
areas: [technology-stack, system-architecture, monorepo, frontend, backend]
related: ["docs/context/canonical/isolated_network_constraints.md", "docs/context/governance/contradictions/register.md", "docs/context/evidence/raw/source_register.md"]
updated: 2026-08-25
---

# Technology Stack — Intended (Design Direction)

**Created:** 2026-08-25 | **Last updated:** 2026-08-25

**Implementation status:** nothing below is stood up. This is the synthesized *intended* stack from `docs/source-documents/`. It becomes truth only when `docs/CURRENT_STATE.md` says so.

## Client

| Concern | Intended choice | Source | Notes |
|---|---|---|---|
| Framework | Angular 22, standalone components, strict templates | `config-docs/example-config-files.md` | Upgrade guides v17→v22 kept under `docs/angular-upgrade-docs/` for the sibling app's benefit |
| Language | TypeScript ~6.0 | same | `moduleResolution: bundler`, `isolatedModules` |
| State | NgRx SignalStore (`@ngrx/signals`) | same | signal-first; zoneless is an open option |
| HTTP | `provideHttpClient(withFetch())` | same | |
| Testing | Vitest (jsdom) | `vitest/*` | replaces Karma/Jasmine |
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

- Zone.js vs zoneless (blueprint shows `provideZoneChangeDetection` with a comment inviting removal).
- Package manager: **decided — npm** (ADR-004).
- Whether any of this is installable on the isolated network — see `isolated_network_constraints.md`. Version pins must be frozen against what can actually be mirrored.
