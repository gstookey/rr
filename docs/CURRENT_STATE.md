---
schema: corpus-doc/v1
status: active
title: CURRENT_STATE — Project Road Runner
areas: [context-system, planning]
related: ["docs/context/canonical/current_priorities.md", "docs/context/index.md"]
updated: 2026-08-25
---

# CURRENT_STATE — Project Road Runner

**Created:** 2026-08-25 | **Last updated:** 2026-08-25 (repo initialization, Axium)

This file is **implementation truth**: what actually exists and works now. When design docs and this file disagree, this file wins for operational questions. Keep it compact — standing truth, active lane, open decisions. Completed-arc detail moves to `docs/context/operations/milestones/` at closeout.

## Standing truth

- **Phase:** preparation / planning. No application code exists in this repo. No monorepo, no `package.json`, no CI.
- **What exists:** the repo-native context system (this docs corpus), the seven-role agent fleet harnesses under `.claude/agents/`, the merge-gate hook, the corpus-graph tooling (`scripts/corpus-graph.mjs`, green as of 2026-08-25), raw source material for the intended stack and brand.
- **Intended stack (design direction, not implemented):** Angular 22 + TypeScript 6 + Vitest + NgRx SignalStore on the client; AstroUXDS design system with RR brand-token overrides; Node/Express gateway; shared TypeScript `common` library; npm-workspaces monorepo; Helm-chart-driven runtime config for Kubernetes. Source: `docs/source-documents/`. Canonical synthesis: `docs/context/canonical/technology_stack.md`.
- **Target environment:** an isolated network. Constraints of that network (package mirrors, allowed tooling, CI availability, container registry) are **not yet documented** — see open decisions.
- **Team:** Graham (lead front-end engineer, repo owner, C2) + the agent fleet. Additional human team members are referenced ("his team") but not documented.
- **Planning surface:** GitHub Project "Project Road Runner Roadmap" (`https://github.com/users/gstookey/projects/3`). Board content not verified from this repo as of 2026-08-25.

## Active lane

- Repo initialization landed on branch `feat/rr-context-init` (2026-08-25). Awaiting Graham's review + merge.
- Next line of effort: **to be chosen by Graham** — Axium's recommendation is in `docs/context/canonical/current_priorities.md` §"Recommended first line of effort".

## Open decisions (Graham-gated)

1. **Monorepo layout** — `client/ common/ server/` (source docs) vs `apps/web` etc. (fleet docs, `.claude/launch.json`). Contradiction C-001.
2. **Isolated-network constraints** — what can be installed, how packages reach the network, whether GitHub/Claude Code are available there at all. Everything downstream depends on this.
3. **Project description** — the description Graham keeps in the Claude project has not been ingested into this repo. `canonical/project_overview.md` carries `[NEEDS GRAHAM]` markers.
4. **Harness model assignments** — `.claude/agents/README.md` table vs frontmatter disagree (Axium: fable vs opus; Rin: fable vs haiku).
5. **Prompt-template repo root** — set to `~/repos/rr` as a guess; confirm.

## Known limitations

- No `current_file_tree.txt` snapshot: `scripts/snapshot-file-tree.sh` has a 1,000-line floor guard inherited from TrAIdit; this repo's tree is smaller. Floor lowered to 100 on 2026-08-25 — verify it suits.
- `scripts/*.example.*` are TrAIdit reference scripts; none run against this repo.
