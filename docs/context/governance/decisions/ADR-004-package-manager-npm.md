---
schema: corpus-doc/v1
status: accepted
title: ADR-004 — Package manager and workspace tooling for RR (proposed: npm)
areas: [technology-stack, monorepo, isolated-network, dev-environment]
related: ["docs/context/governance/contradictions/register.md", "docs/context/canonical/technology_stack.md", "docs/context/canonical/isolated_network_constraints.md"]
updated: 2026-08-25
---

# ADR-004 — Package manager and workspace tooling for RR

**Date:** 2026-08-25 | **Status:** **accepted** by Graham 2026-08-25 ("npm it is. Lock it in.") | Resolves C-001 (package-manager half)

## Context

Graham uses pnpm in TrAIdit; his island team is more used to npm. The island: no agent access, one-way bundle transfer, and a legacy estate of 10+ Angular v17 apps to be upgraded in place (LOE-6). Both tools are supported by the Angular CLI (`cli.packageManager`). The source-document blueprints assume npm workspaces; the inherited fleet docs assume pnpm + corepack.

## Decision

**npm** (bundled with Node, npm workspaces for the monorepo) for RR and for the legacy estate. No pnpm on the island.

## Reasoning

1. **The island team must be self-sufficient without me.** LOE-7 says troubleshooting happens by description across a fence. Every tool that the team already knows removes one class of "it works for Graham" failures. npm is that tool.
2. **One toolchain across 13+ codebases.** The 10+ legacy apps are almost certainly npm today. Migrating them to pnpm *during* a major Angular version upgrade doubles the risk of each hop (pnpm's strict, non-hoisted `node_modules` surfaces phantom-dependency bugs that hoisting has been hiding). Keep the upgrade variable count at one.
3. **Transfer mechanics are tool-neutral once a registry exists.** The robust way to move packages onto the island is a private registry (Verdaccio/Nexus/Artifactory) seeded from tarballs — needed for the legacy estate regardless. Against a registry, npm's lockfile-driven `npm ci` is fully reproducible. This is the strategy I recommend in the readiness packet.
4. **What we give up is real, and named:** pnpm's content-addressable store (portable as a single directory, deduped across 13 apps), faster installs, disk savings, and strictness that prevents phantom deps in a *new* codebase. Mitigations: use `npm ci` with committed lockfiles; run `npm ls`/`depcheck` in CI to catch phantom deps; ship a seeded registry rather than `node_modules` trees.
5. **Cheap to reverse.** Switching a workspace between npm and pnpm is a lockfile regeneration, not an architecture change.

## Consequences

- pnpm/corepack references swept from `.claude/launch.json`, `vera-tester.md`, `marlow-coder.md`, coder docs (2026-08-25). Workspace package names use the `@rr/*` scope.
- Monorepo layout is the *other* half of C-001 and remains open: the blueprint's `client/ common/ server/` vs `apps/* packages/*`. Axium's lean: **`apps/*` + `packages/*`**, because LOE-8 will produce multiple app templates, not one client — but this is a layout taste call, not a risk call; decide alongside this ADR.
- Pin Node LTS and npm versions explicitly in the readiness packet; the island's Node version is an unknown that may constrain the Angular ceiling.

## Expiration

None as a decision; **revisit only** if the island already runs an artifact server with a pnpm-store workflow the team owns (then the "team knows npm" premise weakens).
