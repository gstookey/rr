---
schema: corpus-doc/v1
status: exploratory
title: Isolated-Network Readiness Packet (iso-net-readiness-01)
areas: [isolated-network, dev-environment, technology-stack, planning]
related: ["docs/context/canonical/isolated_network_constraints.md", "docs/context/canonical/project_overview.md", "docs/context/canonical/technology_stack.md", "docs/context/governance/decisions/ADR-004-package-manager-npm.md", "docs/context/canonical/current_priorities.md"]
updated: 2026-08-25
---

# Isolated-Network Readiness Packet — `iso-net-readiness-01`

**Created:** 2026-08-25 | **Last updated:** 2026-08-25 | **Author:** Axium | **Status:** `exploratory` — design direction, not implementation truth, not activated work

## Why this packet exists

Every stack choice on the table for RR — Angular 22, TypeScript 6, Vitest, NgRx Signals, AstroUXDS, Express, npm workspaces — is only real if it can be **installed, mirrored, built, and tested on a network with no inbound internet and no agent access**. A stack that is elegant on the open internet and unbuildable offline is theater.

This packet does not choose the stack. It establishes **what must be known and what must be carried** before the stack can be committed to, and it turns the unknowns in `docs/context/canonical/isolated_network_constraints.md` into artifacts a human can act on without an agent present.

Two facts shape every document here:

1. **No Claude on the island.** Everything produced here must be executable by a human, from the document alone. (`project_overview.md`, LOE-7.)
2. **Transfers are one-way, batched, and reviewed.** Forgetting a dependency is not a `npm install` away from fixed — it costs a transfer cycle of unknown length. (`isolated_network_constraints.md`, "Unknown — transfer & supply chain".)

The standing design constraint that follows — **"reproducible offline from pinned artifacts"** — has **no expiration horizon**. It is the environment, not a milestone. Every other constraint in this packet carries its horizon explicitly.

## Scope

| In scope | Document |
|---|---|
| Turning network unknowns into answerable questions for the people who own the network | [`island_questionnaire_v0.md`](island_questionnaire_v0.md) |
| The intake instrument that lets the legacy Angular upgrade be *sized* | [`legacy_estate_inventory_template_v0.md`](legacy_estate_inventory_template_v0.md) |
| A version-pinned, registry-verified manifest of the intended new-project stack + measured bundle size | [`stack_dependency_manifest_v0.md`](stack_dependency_manifest_v0.md) |
| A human-executable first-day sequence: Node, private registry, seed, verify an offline `npm ci` | [`day_one_on_the_island_runbook_v0.md`](day_one_on_the_island_runbook_v0.md) |
| Decisions this packet raises but cannot close | [`decision_register_v0.md`](decision_register_v0.md) |
| Candidate board stories (proposals only — activation is Graham's) | [`story_decomposition_v0.md`](story_decomposition_v0.md) |

## Out of scope

- **Application/domain design.** No domain model for RR-the-product exists yet; anything written now would be invention (`current_priorities.md`, "Not now").
- **Scaffolding any code.** No `package.json`, no monorepo skeleton, no app templates. That is LOE-8 and a later packet. This packet is docs-only by construction.
- **The per-hop Angular upgrade runbooks themselves** (v17→v18, v18→v19, …). This packet produces the *inventory instrument* that sizes them; the runbooks are LOE-6 and follow, using `docs/angular-upgrade-docs/` as raw source.
- **Deployment topology** beyond noting that the Helm/Kubernetes blueprint exists and will need its own transfer accounting (container images are a different supply chain from npm tarballs — flagged, not solved here).
- **Choosing the private registry product.** Verdaccio is the packet's *default candidate*, not a decision; see DR-01.

## How this packet feeds the lines of effort

| LOE | What this packet hands it |
|---|---|
| **LOE-1 Preparation plan** | The questionnaire is the preparation phase's critical path: until it comes back, most preparation work is speculative. The story decomposition is the raw material for LOE-1's board stories. |
| **LOE-4 Stack documentation** | The dependency manifest fixes *which versions* the stack docs must document. LOE-4's rule ("docs for each package at the exact versions to be installed") is unexecutable without a pinned list; this packet supplies the first one, dated and registry-verified. |
| **LOE-5 Transfer bundles** | The manifest's measured tarball footprint plus the runbook's seeding procedure define what a bundle *is* for RR: a tarball set + a lockfile + a verification step, not a folder of hopeful downloads. Bundle #1 is specified here in all but the packing. |
| **LOE-6 Legacy Angular upgrade** | The inventory template is the input the upgrade plan **cannot be sized without**. Ten-plus apps at v17 with unknown build tooling, unknown test runners, and unknown custom schematics is not a plan, it is a hope. One filled table converts it into an estimate. |

Secondary: **LOE-3** (set-up guides) inherits the runbook's "written for a human with no agent" standard as its house style. **LOE-2** (execution plan) begins where the runbook's last verification step succeeds.

## What this packet deliberately does *not* claim

- No answer here is presented as settled where it is not. Unanswered items are marked `[NEEDS GRAHAM]` or `[NEEDS NETWORK OWNER]`; unverifiable version pins are marked `UNVERIFIED`.
- The version pins in the manifest were verified against the live npm registry **on 2026-08-25** and are true as of that date only. They will drift. The manifest states its own re-verification rule.
- One assumption is being proceeded on rather than confirmed: the monorepo layout `apps/*` + `packages/*` (C-001, layout half). It is load-bearing for the story decomposition and nothing else in this packet; see the open questions in `decision_register_v0.md` (DR-05).

## Reading order

For Graham: this README → [`decision_register_v0.md`](decision_register_v0.md) → [`story_decomposition_v0.md`](story_decomposition_v0.md).
For someone about to send the questionnaire out: [`island_questionnaire_v0.md`](island_questionnaire_v0.md) alone is self-contained by design.
For someone on the island on day one: [`day_one_on_the_island_runbook_v0.md`](day_one_on_the_island_runbook_v0.md) plus a printed [`stack_dependency_manifest_v0.md`](stack_dependency_manifest_v0.md).
