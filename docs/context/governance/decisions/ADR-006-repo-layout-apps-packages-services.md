---
schema: corpus-doc/v1
status: accepted
title: ADR-006 — Repository layout: apps/ + packages/ + services/ npm workspaces (closes C-001)
areas: [monorepo, technology-stack, process-governance, system-architecture]
related: ["docs/context/governance/decisions/ADR-004-package-manager-npm.md", "docs/context/governance/contradictions/register.md", "docs/design/packets/acme-workshop-01-design-packet/README.md", "docs/design/packets/ddd-arch-01-design-packet/practical_picture_v0.md"]
updated: 2026-09-04
---

# ADR-006 — Repository layout: `apps/` + `packages/` + `services/`

**Date:** 2026-09-04 | **Status:** accepted (Graham, 2026-09-03: "in-repo skeleton", ACME Workshop built in the real layout; recorded at S-18 closeout as the register promised) | **Closes** C-001's layout half

## Context
C-001 left the monorepo layout open between the source blueprints' `client/ common/ server/` and the fleet's `apps/* + packages/*`. The DDD-ARCH-01 practical picture (§1) and R7 §4.2 need a layout that can hold many Floors as fenced library sets, several deployables, and a published-language package, with module boundaries enforceable by lint.

## Decision
npm workspaces with three roots: **`apps/*`** (deployable front ends — the shell; a Floor promoted to its own app lands here), **`packages/*`** (the `@rr/*` unclassified base library and every Floor's library set: `<floor>-domain`, `<floor>-data-access`, `<floor>-feature-<suite>`, `<floor>-ui`), **`services/*`** (Node deployables — the gateway BFF, telemetry-sim). `legacy-shells/` stays outside the workspace globs. Boundaries are enforced by Sheriff (`sheriff.config.ts`) on two tag axes (`type:*`, `scope:*`); the Building's apps carry `scope:building` and may reach every Floor, the base carries `scope:platform` and may reach none, and `@rr/common` is a `type:common` leaf.

## Consequences
- The blueprint's `client/common/server` names map to `apps/shell`, `packages/common`, `services/gateway`; the blueprint is not wrong, just less granular.
- A new Floor is a library set plus a route and a router — no new workspace root.
- Every island app that adopts this layout must also adopt the fence; the layout without the fence is the Big Ball of Mud with nicer folders.

## Expiration
None as a decision. Revisit only if Nx is adopted (DA-D12), which changes tooling, not the roots.
