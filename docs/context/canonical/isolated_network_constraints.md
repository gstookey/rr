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

## Known

- RR will be stood up and developed on an isolated network (AGENTS.md).
- Graham's professional context is aerospace/defense, so assume the network is governed by formal change-control and software-assurance rules until told otherwise.

## Unknown — transfer & supply chain

- How do artifacts get onto the network? (approved package mirror / Artifactory-Nexus proxy / one-way transfer of vetted media / manual review per package)
- Is there an internal npm registry? PyPI? Container registry? Helm chart repo?
- Is there an allow-list of approved OSS, and are Angular 22 / TS 6 / Vitest / AstroUXDS / NgRx on it?
- Lead time per new dependency?

## Unknown — tooling on the island

- Git hosting? (GitHub Enterprise Server / GitLab / bare git) — determines whether `gh`, the Project board, and the PR-based merge gate survive the move.
- CI runner availability and what it can pull.
- Is any LLM/agent tooling (Claude Code or equivalent) available there? If **no**, the fleet workflow becomes an *outside* planning aid and the island workflow must be human-executable from docs alone.
- Node version and OS on dev workstations/build hosts.

## Unknown — governance

- Classification / data-handling constraints on what may be written into this repo now (if it will later be transferred in).
- Whether this public repo `gstookey/rr` may itself be moved onto the network, or only its contents.

## Working stance until answered

- Treat "must be reproducible offline from pinned artifacts" as a **hard design constraint** for every stack choice. This constraint has **no expiration** — it is the environment, not a milestone.
- Treat "fleet tooling available on the island" as **unknown**, and design docs so a human can execute them without an agent.
