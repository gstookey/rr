---
schema: corpus-doc/v1
status: active
title: Current Priorities
areas: [planning, context-system]
related: ["docs/CURRENT_STATE.md", "docs/context/canonical/isolated_network_constraints.md", "docs/context/governance/contradictions/register.md"]
updated: 2026-08-25
---

# Current Priorities

**Created:** 2026-08-25 | **Last updated:** 2026-08-25 (Axium, repo initialization)

Compact operating context. Readable in one window. Standing truth lives in `docs/CURRENT_STATE.md`; this page is *sequencing and intent*.

## Goals (from AGENTS.md)

- **Short-term:** plan and prepare to stand up RR's software technology stack and dev environment on an isolated network.
- **Long-term:** execute the plan, get RR into development, release a version within ~12 months (from 2026-08).

## What matters now

1. **Get the context system merged and habitual.** This initialization PR. After it lands, every session opens from `bootstrap/START_HERE.md` and closes with the rollup checklist.
2. **Close the highest-leverage unknowns before designing anything else.** Two of them gate the entire plan:
   - the isolated-network constraints (`canonical/isolated_network_constraints.md` — mostly questions today);
   - the monorepo layout decision (contradiction C-001).
3. **Ingest Graham's project description** from the Claude project into `canonical/project_overview.md` so the fleet stops working from a partial picture.

## Recommended first line of effort (Axium's opinion, 2026-08-25)

Recommend **"Isolated-Network Readiness Packet"** as line of effort #1, ahead of any application scaffolding:

- *Why first:* every stack choice already on the table (Angular 22, TS 6, Vitest, AstroUXDS, npm workspaces, Helm) is only real if it can be **installed, mirrored, built, and tested on the isolated network**. A stack that is elegant on the internet and unbuildable offline is theater. Knowing the transfer mechanism (approved mirror? one-way media? vetted tarball?) changes how we vendor dependencies, whether we pin exact versions now, whether we can use Claude Code there at all, and whether the fleet workflow (PRs, board, `gh`) survives the move.
- *Shape:* a design packet under `docs/design/` with (a) a questionnaire Graham answers or routes to the network owners, (b) a dependency manifest for the intended stack with exact pinned versions and total artifact size, (c) a "day-one on the island" runbook draft, (d) a decision register for what we cannot answer yet.
- *Alternative if Graham disagrees:* "Monorepo Skeleton v0" — scaffold `client/common/server` (or `apps/*`) with Angular 22 + Vitest + AstroUXDS brand tokens, on the internet side, *provisionally*, with the explicit expiration that it gets re-validated once the network constraints are known. Faster dopamine, higher rework risk.

Graham chooses. Axium does not activate lanes.

## Not now

- Application feature design. No domain model exists yet for RR-the-product; anything written now would be invention.
- Multi-user / auth / deployment topology beyond what the Helm blueprint sketches.
- Porting Marin (orchestration coordinator) into `.claude/agents/` — only when a run needs it.
