---
schema: corpus-doc/v1
status: active
title: Isolated Network Constraints — Known and Unknown
areas: [isolated-network, dev-environment, security, planning]
related: ["docs/context/canonical/technology_stack.md", "docs/context/canonical/current_priorities.md"]
updated: 2026-08-25
---

# Isolated Network Constraints — Known and Unknown

**Created:** 2026-08-25 | **Last updated:** 2026-08-25

This page is mostly questions. That is deliberate: these are the highest-leverage unknowns in the project, and the answers reshape every downstream choice. Do not fill them in with plausible guesses — route them to Graham or the network owners.

## Known (SRC-012, 2026-08-25)

- RR will be stood up and developed on a fully isolated network.
- **No Claude access on the island.** Graham's agent access is limited to this open-internet side. Consequence: every runbook, guide, and bundle must be human-executable without an agent; troubleshooting is done remotely by description (LOE-7).
- Artifacts cross by **compressed package/file bundles ported up** — a one-way transfer of prepared media, not a live mirror.
- The island already hosts a **legacy estate of 10+ Angular v17 applications** that must be upgraded there (v19 floor, v22 stretch). The environment already has Node/npm tooling of *some* version — to be inventoried.
- Stack languages: TypeScript/Angular primarily, some Python and Java.
- Graham's professional context is aerospace/defense; assume formal change-control and software-assurance rules until told otherwise.

## Unknown — transfer & supply chain

- Transfer mechanics: media type, size limits per transfer, review/scan lead time, how often transfers can happen (this sets the cost of forgetting a dependency).
- Is there an internal npm registry (Nexus/Artifactory/Verdaccio) on the island already, serving the legacy apps? If yes, bundles feed it; if no, standing one up is an early execution-phase story. Same question for PyPI/Maven/containers/Helm.
- Is there an allow-list of approved OSS, and are Angular 22 / TS 6 / Vitest / AstroUXDS / NgRx on it?
- Lead time per new dependency?

## Unknown — tooling on the island

- Git hosting on the island (GitHub Enterprise Server / GitLab / bare git) — determines whether the PR-based merge gate survives in tool form (the principle survives regardless).
- CI runner availability and what it can pull.
- Node/npm versions and OS on the island's workstations and build hosts; whether Node can be upgraded (Angular 19 needs Node 18.19+/20.11+/22; Angular 22 will need newer).
- Whether this repo `gstookey/rr` (or a subset) may itself be ported up.

## Unknown — governance

- Classification / data-handling constraints on what may be written into this repo now (if it will later be transferred in).
- Whether this public repo `gstookey/rr` may itself be moved onto the network, or only its contents.

## Working stance until answered

- Treat "must be reproducible offline from pinned artifacts" as a **hard design constraint** for every stack choice. This constraint has **no expiration** — it is the environment, not a milestone.
- Fleet tooling on the island is **known absent** — write every artifact for a human executor with no agent, and rehearse the port-up on a clean, network-disabled machine on this side before the real one.
