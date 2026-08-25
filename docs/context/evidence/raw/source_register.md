---
schema: corpus-doc/v1
status: active
title: Source Register
areas: [context-system]
updated: 2026-08-25
---

# Source Register

**Created:** 2026-08-25 | **Last updated:** 2026-08-25

| ID | Source | Location | Kind | Ingested | Synthesized into | Notes |
|---|---|---|---|---|---|---|
| SRC-001 | Project Roadrunner Enterprise Brand Guidelines v1.0 (Grok, 2026-08-25) | `docs/source-documents/monorepo-set-up-docs/angular-application-stand-up-docs/styling/project-rr-style-guide.md` | AI-generated brand guide | 2026-08-25 | `docs/design/brand/README.md`, `canonical/project_overview.md` | References a missing `_roadrunner-tokens.scss` (C-005). "Military/aerospace" framing is brand voice, unverified as function. |
| SRC-002 | AstroUXDS custom branding transcript (Grok, 2026-08-25) | `.../styling/astro-uxds-how-to-add-custom-branding-styling.md` | AI chat transcript | 2026-08-25 | `canonical/technology_stack.md` | Token-override approach; never fork Astro. |
| SRC-003 | AstroUXDS mockup & wireframing tools | `.../styling/astro-uxds-mockup-and-wireframing-tools.md` | AI chat transcript | registered only | — | For Cadence. |
| SRC-004 | Angular 22 / TS 6 / Vitest / SignalStore config blueprints | `.../config-docs/example-config-files.md` | AI-generated blueprint | 2026-08-25 | `canonical/technology_stack.md` | Versions unverified against real registries. |
| SRC-005 | Vitest examples + config files | `.../vitest/*.md` | AI-generated blueprint | registered only | — | |
| SRC-006 | npm-workspaces monorepo setup (client/common/server) | `docs/source-documents/monorepo-set-up-docs/mono-repo-orchestration-docs/mono-repo-setup-example.md` | AI-generated blueprint | 2026-08-25 | `canonical/technology_stack.md`, C-001 | Conflicts with inherited pnpm/`apps/*` fleet docs. |
| SRC-007 | Helm chart + ConfigMap runtime config | `.../mono-repo-helm-chart-setup.md` | AI-generated blueprint | registered only | `canonical/technology_stack.md` (one line) | |
| SRC-008 | Monorepo Vitest workspace | `.../mono-repo-vitest-setup.md` | AI-generated blueprint | registered only | — | |
| SRC-009 | Angular upgrade guides v17→v22 (ripped) | `docs/angular-upgrade-docs/` | ripped vendor docs | registered only | — | For the sibling app / migration reference. Excluded from corpus graph. |
| SRC-010 | RR logo candidates (57 JPGs) | `images/rr_logos/` | generated images | registered only | `docs/design/brand/README.md` | Zip + `__MACOSX` removed 2026-08-25; originals kept. |
| SRC-011 | TrAIdit context root example | `docs/context.root-files.example/` | reference copy | n/a | `canonical/context_system.md` | Read-only exemplar; excluded from corpus graph. |
| SRC-012 | Graham's Claude-project description of RR | **not in repo** | founder-source | **pending** | `canonical/project_overview.md` | C-006. |
