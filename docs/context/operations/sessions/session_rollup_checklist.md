---
schema: corpus-doc/v1
status: active
title: Session Rollup Checklist
areas: [context-system, process-governance]
related: ["docs/context/team/agents/context-librarian/context_maintenance_workflow.md"]
updated: 2026-08-25
---

# Session Rollup Checklist

**Created:** 2026-08-25

Run at every "session end" / "wrapping up" / "let's stop here" (AGENTS.md).

- [ ] `git status --short` and `git log --oneline -10` — record what actually landed, not what was intended.
- [ ] Summarize: what changed / what was left untouched / what needs Graham.
- [ ] Update `docs/CURRENT_STATE.md` if implementation truth moved (Graham-gated).
- [ ] Update `docs/context/canonical/current_priorities.md` if sequencing moved.
- [ ] Prepend a `# [YYYY-MM-DD] <type> | <title>` entry to `docs/context/log.md`.
- [ ] Append a session summary to `docs/context/operations/sessions/SESSION_LOG.md`.
- [ ] New decision? → `governance/decisions/ADR-NNN-*.md` + ADR README table.
- [ ] New disagreement? → `governance/contradictions/register.md`.
- [ ] Milestone/story status moved? → ledger + board sync (`planning_surface_workflow.md`).
- [ ] New/changed docs carry `corpus-doc/v1` frontmatter with a fresh `updated`.
- [ ] `node scripts/corpus-graph.mjs index && node scripts/corpus-graph.mjs check && node scripts/corpus-graph.mjs index --check` — all green.
- [ ] `scripts/snapshot-file-tree.sh`.
- [ ] `docs/context/index.md` reflects any added/removed/renamed page.
- [ ] Commit on a non-`main` branch; open/refresh the PR; do not merge.
