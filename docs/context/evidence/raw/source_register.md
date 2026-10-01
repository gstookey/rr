---
schema: corpus-doc/v1
status: active
title: Source Register
areas: [context-system]
updated: 2026-10-01
---

# Source Register

**Created:** 2026-08-25 | **Last updated:** 2026-10-01 (SRC-013..015 — the Desert Island dev-environment stack sources, Axium)

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
| SRC-012 | Graham's description of RR (program stand-up on an isolated network, 8 lines of effort) | `docs/context/evidence/raw/project-road-runner-description.txt` | founder-source | 2026-08-25 | `canonical/project_overview.md`, `canonical/isolated_network_constraints.md`, `canonical/current_priorities.md` | Landed on `main` 9852e23. C-006 resolved. |
| SRC-013 | Front-end tech stack for the Desert Island dev environment (37-row table + example package.json; "not vetted for compatibility, feasibility, or US-made software") | `docs/source-documents/desert-island-setup-docs/front-end-tech-stack.md` | Graham-authored proposal | 2026-10-01 | `docs/design/packets/desert-island-devenv-01-design-packet/` (stack list, reconciliation), `desert-island-devenv/stack/frontend/package.json` | Vetted against npm 2026-10-01: 4 nonexistent versions, 1 peer conflict, 1 builder incompatibility, 53 advisories. Proposes pnpm + Nx (C-011, C-012) and Angular 22.2.0 (C-013). |
| SRC-014 | Back-end tech stack from the team's architect (Java 25, Spring Boot 4.1.1, Gradle 9.7.1, Testcontainers, tools, images) | `docs/source-documents/desert-island-setup-docs/back-end-tech-stack.md` | architect's list (relayed by Graham) | 2026-10-01 | same packet; `desert-island-devenv/stack/backend/`, `stack/backend.env`, `stack/images.txt` | First Java back end in the corpus (C-014). Testcontainers 1.20.1 → 2.0.5, JaCoCo 0.8.12 → 0.8.15, Ryuk 0.9.0 → 0.14.0, `kubectl 5.0.4` does not exist. Open questions A-1..A-5. |
| SRC-015 | Air-gapped dev-environment setup guidance (Gemini session: config matrix + staging/install scripts) | `docs/source-documents/desert-island-setup-docs/air-gapped-dev-env-setup-guidence.md` | AI chat transcript | 2026-10-01 | same packet (reconciliation §Workstation) | Treated as intent, not code: its scripts do not run as pasted (truncated URLs, fused lines). Its pnpm-store strategy contradicts ADR-004 and is unnecessary once Nexus exists. |
