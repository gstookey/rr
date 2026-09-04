# Project Road Runner (RR)

**Created:** 2026-08-25 | **Last updated:** 2026-09-04

Planning-and-preparation repo for **Project Road Runner**: the software technology stack, dev environment, and delivery workflow that will be stood up on an isolated network, then taken into development with a first release targeted within a year.

This repo holds the *context system*, not (yet) the application. The most valuable asset here is the maintained context — decisions, rationale, contradictions, and evolving strategy — that lets a human-plus-agent team work without depending on chat memory.

## Start here

| Need | Go to |
|------|-------|
| How agents and humans must behave in this repo | [`AGENTS.md`](AGENTS.md) |
| What is true *right now* | [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) |
| What we are doing next, and why | [`docs/context/canonical/current_priorities.md`](docs/context/canonical/current_priorities.md) |
| Navigation spine for all context | [`docs/context/index.md`](docs/context/index.md) |
| Cold-start / rehydration for a new session | [`docs/context/bootstrap/START_HERE.md`](docs/context/bootstrap/START_HERE.md) |
| Decision trail | [`docs/context/log.md`](docs/context/log.md) |
| The agent fleet (Axium, Rin, Marlow, Verin, Vera, Ember, Cadence) | [`.claude/agents/`](.claude/agents/README.md) and [`docs/context/team/agents/`](docs/context/team/agents/README.md) |
| Brand / visual identity | [`docs/design/brand/`](docs/design/brand/README.md) |

## Layout

```
AGENTS.md                 governance layer — read first
.claude/                  Claude Code harnesses, hooks (merge gate), launch config
docs/
  CURRENT_STATE.md        implementation truth (compact)
  context/                the repo-native context system (see docs/context/README.md)
  design/                 design direction — brand, mockups, packets
  source-documents/       raw RR source material (brand guide, stack blueprints)
  angular-upgrade-docs/   ripped Angular v17→v22 upgrade guides (reference)
  context.root-files.example/   TrAIdit worked example of a mature context root (reference only)
images/rr_logos/          brand image candidates
scripts/                  corpus-graph tooling, the local CI gate, fence proof, seed + infra checks
apps/ packages/ services/ infra/    the ACME Workshop workspace (see "Running ACME Workshop" below)
legacy-shells/            approximations of the two island Angular monorepos (NOT in the workspace)
```

## Running ACME Workshop (foundation)

Since **2026-09-04** this repo also holds an npm-workspaces monorepo — the foundation of **ACME Workshop**, the DDD reference application ([EP-06](https://github.com/gstookey/rr/issues/37) / [S-18](https://github.com/gstookey/rr/issues/38)). It lives at the root beside `docs/`, in `apps/`, `packages/`, `services/` and `infra/`. `legacy-shells/` is *not* part of it.

```bash
nvm use                    # .nvmrc -> Node 22.23.2 (Angular 22's floor is 22.22.3)
npm ci
bash scripts/local-ci.sh   # THE GATE: 14 steps, per-step PASS/FAIL table
npm start                  # ng serve shell -> http://localhost:4200
docker compose -f infra/docker-compose.yml up   # Keycloak 26.7.3 + Postgres 18.6
```

**What was built, every version pin with its publish date, what is verified by running versus structurally only, the deviations taken, and the ACME lexicon card:** [`docs/design/packets/acme-workshop-01-design-packet/s0_foundation_notes_v0.md`](docs/design/packets/acme-workshop-01-design-packet/s0_foundation_notes_v0.md). Read it before changing a pin — several are deliberate lags, not oversights.

The docker-compose stack has **not been run** by the agent fleet (no Docker daemon); the notes say so explicitly and name what that leaves unverified.

## Governance in one breath

- No agent merges to `main`. PRs only; Graham clicks merge (`.claude/hooks/protect-main.sh` enforces it).
- The GitHub Project board is **status**; this docs corpus is **doctrine**.
- Before building in any area: `node scripts/corpus-graph.mjs lookup <path-or-topic>`.
- Every doc carries a date stamp. Current constraints carry an expiration horizon.

UNTO GLORY.
