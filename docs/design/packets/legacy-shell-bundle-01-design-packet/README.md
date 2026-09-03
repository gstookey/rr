---
schema: corpus-doc/v1
status: exploratory
title: Legacy Shell Bundle Packet 01 — estate-shaped v17→v18 hop and verified transfer bundle
areas: [isolated-network, frontend, dev-environment, technology-stack]
related: ["docs/design/packets/ng-hop-01-v17-to-v18-design-packet/README.md", "docs/context/canonical/two_island_model.md", "docs/design/packets/iso-net-readiness-01-design-packet/decision_register_v0.md"]
updated: 2026-09-03
---

# Legacy Shell Bundle Packet 01 (`legacy-shell-bundle-01`)

**Created:** 2026-09-03 | **Last updated:** 2026-09-03 (both Milestone-1 hops rehearsed estate-shaped in the real layout; 17→19 pool verified offline; delivery = the tested rebuild script) | **Author:** Axium | **Status:** `exploratory` — rehearsed on approximated shells of the two real apps; not yet run against real estate code

## What this packet is

The step between "the hop works on a bare app" (`ng-hop-01`) and "the hop works on the estate": the v17→v18 hop rehearsed on **two monorepo shells built from the real package.json files of two Legacy Island applications** (`legacy-shells/`, source: `docs/source-documents/legacy-apps/`), plus a **transfer bundle built from what the journey actually fetched** and **verified offline** against a registry seeded from the bundle itself, inside a network namespace with no route to the internet.

| Document | What it is |
|---|---|
| [`monorepo_hop_procedure_v2.md`](monorepo_hop_procedure_v2.md) | **the island procedure** — 17→18 AND 18→19 in the real layout (angular.json in `packages/client/`), temp-root-angular.json bracket, per-hop version pairings, DR-04 effort signals |
| [`v17_to_v19_bundle_manifest_v2.md`](v17_to_v19_bundle_manifest_v2.md) | **the master pool** — 1,495 tarballs / 191.3 MB with per-rung slices (v17: 104.0 · 17→18: 45.1 · 18→19: 42.2 MB) and the Nexus-already-serves-v17 insight |
| [`offline_verification_transcript_v2.md`](offline_verification_transcript_v2.md) | the offline proof for the whole 17→19 pool — both hops replayed, netns isolation, plus the false-green catch and its lesson |
| [`nexus_upload_instructions_v1.md`](nexus_upload_instructions_v1.md) | Nexus upload (publish loop), the node_modules-vs-tarballs callout, delta merge procedure, minimum-payload check |
| `v17_to_v18_monorepo_runbook_delta_v1.md` · `v18_transfer_bundle_manifest_v1.md` · `offline_verification_transcript_v1.md` | **superseded** (2026-09-03) — kept as the evidence trail of the first rehearsal round |

Machine artifacts live beside the shells: `legacy-shells/bundle/` (SHA256SUMS, MANIFEST.json) and `legacy-shells/tools/` (reproducible build + extraction scripts). The tarballs themselves are **not in git** (GitHub size limits); they were handed to Graham as a `.tar` and are reproducible via `legacy-shells/tools/build-v18-hop-bundle.sh`.

## Why the shells matter

The bare-app rehearsal could not see any of this packet's findings: the hoisted-deps monorepo layout, the TypeScript bump the estate's `5.2.2` pin forces, the `ng update` metadata wall on private workspace packages, the third-party peer group (`@ngrx/*`, `keycloak-angular`, Material/CDK), or the two-phase update sequencing. Every one of those was found by giving the rehearsal the estate's real dependency surface.

## What this still does not prove

- The shells approximate **shape, not code**: migrations mostly reported "no changes" because there is almost no source. On the real apps they will edit code.
- The real apps' locks may differ from the approximated ones (registry history, install order, npm version on the island). Porting the **real** `package-lock.json` files remains the documented fallback path.
- The island's private packages (`@other-team/*`, `@ssd_victor/*`, `@my-team/*`) and their transitive trees are invisible from here — see honest-limits in the bundle manifest.
- Graham's real config files (angular.json, jest.config.cjs, tsconfig*) had not landed when this was rehearsed; hop results and bundle get re-verified after they do (angular.json build budgets are the known re-check).
