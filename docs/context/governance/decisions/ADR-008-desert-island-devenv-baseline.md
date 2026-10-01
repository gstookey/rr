---
schema: corpus-doc/v1
status: accepted
title: ADR-008 — Desert Island dev-environment baseline (package managers, container runtime, Kubernetes tooling, Angular patch, Nexus)
areas: [dev-environment, isolated-network, technology-stack, frontend, backend]
related: ["docs/context/governance/decisions/ADR-004-package-manager-npm.md", "docs/context/governance/decisions/ADR-005-island-stack-sync.md", "docs/design/packets/desert-island-devenv-01-design-packet/source_reconciliation_v1.md", "docs/design/packets/desert-island-devenv-01-design-packet/devops_tech_stack_list_v2.md", "docs/context/governance/contradictions/register.md"]
updated: 2026-10-01
---

# ADR-008 — Desert Island dev-environment baseline

**Date:** 2026-10-01 | **Status:** **accepted** — Graham, in session, answering the reconciliation's D-1..D-9 ("Agree with all of your recs — and I'll defer to you on the ones you didn't give recs for", plus the specific answers quoted below). **Amends [ADR-004](ADR-004-package-manager-npm.md)** (its "No pnpm on the island" clause only). Applies [ADR-005](ADR-005-island-stack-sync.md) to the Angular patch.

## Context

The `desert-island-devenv-01` packet vetted the proposed workstation stack (SRC-013/014/015) and raised nine decisions ([`source_reconciliation_v1.md`](../../../design/packets/desert-island-devenv-01-design-packet/source_reconciliation_v1.md) §Decisions). Graham answered on 2026-10-01.

## Decisions

| # | Decision | Whose call | Basis |
|---|---|---|---|
| D-1 | **Both npm and pnpm are available on Desert Island** — Nexus serves both; **each application chooses its own** by its needs. **The examples are locked to pnpm** (`stack/frontend/pnpm-lock.yaml`, `packageManager: pnpm@10.34.6`). | Graham ("grab both packages for the port… lock pnpm in for the examples, since I have plenty of npm examples") | pnpm is one dependency-free npm tarball; carrying it costs nothing and removes a transfer cycle if any app wants it |
| D-2 | **Both islands land on Angular 22.2.1** — the legacy ladder's last rung *and* the new-island examples (ADR-005, exact-parity reading) | Axium's rec, accepted | 22.0–22.1.x carries GHSA-67c8-pqhq-4rmx (critical) and GHSA-ff3f-86qr-9cv3 (high), fixed in 22.2.0; 22.2.1 (2026-09-30) is the newest patch |
| D-3 | **Replace `keycloak-connect`** with standard OIDC/JWT validation in new server code | rec, accepted | newest adapter is 20 months old, every version flagged via dependencies, pulls `chromedriver: "latest"`. The legacy estate keeps its 23.0.6 through the Angular ladder (it is not Angular-coupled); replacing it there is separate work |
| D-4 | **Nx ships in the pool; adoption is per application**, like the package manager. The RR repo itself stays on npm workspaces (`technology_stack.md`, ADR-006) unless DDD-ARCH-01 decides otherwise | deferred to Axium | Nx's residual advisories are dev-time only and in exactly-pinned upstream deps; re-check at every bundle cut |
| D-5 | **Prisma 7's residual CLI advisories: accepted** as dev-time risk, re-checked at every bundle cut | rec, accepted | no fixed 7.x exists |
| D-6 | **ESLint 9 for this cut**; move ESLint and Sheriff together to 10 / 0.20.x once Sheriff 0.20.x has been exercised | rec, accepted | Sheriff 0.19.6 supports ESLint 9 only |
| D-7 | One server runtime or two — **open** (Graham is finding out). The bundle carries both, so the answer costs no transfer cycle | — | — |
| D-8 | **Nexus: the newest release** (3.96.4 on 2026-09-30; the legacy island runs 3.81). Edition (Community vs Pro) still to confirm — CE 3.77+ needs its EULA accepted by an administrator before any upload, which is the organisation's act, not the scripts' | Graham ("open to picking the latest and greatest assuming it's compatible") | the scripts' REST endpoints are long-standing and were exercised on 3.76.1 and (to the EULA gate) 3.96.4 |
| D-9 | **Docker CE on workstations, not Podman; kind for local clusters.** Docker CE RPMs travel in the back-end bundle (they are not RHEL media); Testcontainers runs with Ryuk on | Graham ("Docker is what we use, not Podman — we also use kind") | supersedes the packet's Podman recommendation |
| — | **Kubernetes client tools follow the cluster's minor.** The only cluster known reports server v1.30.4 → kubectl **1.31.14**, Helm **3.18.6** (`helm`; the newest line supporting 1.30) plus **4.3.0** (`helm4`, the architect's Helm 4, advisory-free), kind **0.29.0** with node image **v1.30.13** | Axium, from Graham's `kubectl version` output | kubectl skew is ±1 minor; Helm 4.0.x supports 1.31–1.34 and 4.0.5 has two HIGH advisories |

## Consequences

1. **ADR-004 is amended, not reversed:** RR and the legacy estate stay on npm (ADR-004's reasons — one toolchain during the upgrade, team familiarity — still hold for them). Its "No pnpm on the island" clause no longer applies to Desert Island. C-011 is resolved by this ADR.
2. The legacy ladder is re-cut to land on **22.2.1** (`legacy-shells/`, rehearsed 2026-10-01). C-013 is resolved by this ADR.
3. Workstations carry a root-equivalent `docker` group membership for developers — Docker's documented trade for running without sudo. Rootless Docker is possible later (`docker-ce-rootless-extras`, not bundled).
4. **Kubernetes 1.30 is end-of-life upstream (since 2025-06).** The tool pins above are chosen to be *supported against it*; each is one line in `desert-island-devenv/stack/backend.env` when the cluster moves.

## Expiration

- **The Kubernetes tool pins expire with the 1.30 cluster**: re-pin kubectl, Helm (make `helm4` the default from 1.34) and kind/node image when the cluster's minor changes — or as soon as the Desert Island cluster's version is known, if it is not 1.30 (open question O-1).
- **D-6 expires** when Sheriff 0.20.x has been exercised in the in-repo gate.
- **D-7** is open; **D-8's edition question** is open.
