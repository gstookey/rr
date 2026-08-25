---
schema: corpus-doc/v1
status: accepted
title: Context Librarian Checklist
areas: [context-system, agent-fleet]
related: ["docs/context/team/agents/context-librarian/context_maintenance_workflow.md"]
updated: 2026-08-2025
---

# Context Librarian Checklist

Use this checklist for each context maintenance pass.

---

## Preflight

- [ ] Confirm current branch
- [ ] Inspect `git status`
- [ ] Read `docs/context/index.md`
- [ ] Read `docs/CURRENT_STATE.md`
- [ ] Read `docs/context/canonical/current_priorities.md`

---

## Structure

- [ ] Confirm major folders exist:
  - [ ] `canonical/`
  - [ ] `platform/`
  - [ ] `operations/`
  - [ ] `governance/`
  - [ ] `evidence/`
  - [ ] `team/`
  - [ ] `operations/user-workflow/`
  - [ ] `operations/task-queue/`
  - [ ] `team/agents/`

- [ ] Confirm no obsolete folders remain:
  - [ ] `docs/context/wiki/`
  - [ ] `docs/context/decisions/`
  - [ ] `docs/context/milestones/`
  - [ ] `docs/context/raw/`
  - [ ] `docs/context/feedback/`

- [ ] Confirm all major folders contain a `README.md` (if appropriate)

- [ ] Check for:
  - [ ] misplaced files
  - [ ] duplicate docs
  - [ ] inconsistent naming
  - [ ] empty folders that should be removed or documented

---

## Index

- [ ] Verify `docs/context/index.md` links to real files
- [ ] Add missing important docs
- [ ] Remove links to missing or renamed docs
- [ ] Ensure canonical, platform, operations, governance, evidence, team, and agent sections are complete

---

## Links / Path Integrity

Example Run:

grep -R "docs/context/wiki\|docs/context/decisions\|docs/context/milestones\|docs/context/raw\|docs/context/feedback\|docs/context/workflow\|docs/context/meta\|docs/context/architecture\|docs/context/system\|docs/context/vision\|docs/context/future\|docs/context/operations/feedback/codebase-review_retrospective_v1.0.md\|docs/context/operations/feedback/context-coherence-review_retrospective_v1.0.md\|docs/context/operations/feedback/design-coherence-review_retrospective_v1.0.md\|docs/design/lab_v2" docs/context docs/design || true

Then:

- [ ] Update stale references to new structure
- [ ] Leave historical references intact if clearly archival
- [ ] Ensure internal links use correct relative paths
- [ ] Ensure review retrospectives live under `docs/context/operations/reviews/`

---

## Truth Alignment

Compare:

- `docs/CURRENT_STATE.md`
- `docs/context/canonical/current_priorities.md`
- `docs/context/canonical/evaluation.md`
- `docs/context/canonical/versioning.md`
- `docs/context/canonical/implementation_program.md`

Check:

- [ ] milestone status matches reality
- [ ] current milestone / next step is consistent
- [ ] known limitations are accurate
- [ ] no completed feature is described as missing
- [ ] no future feature is described as implemented
- [ ] active agent operating model docs do not conflict about role ownership or path locations

---

## Contradictions

- [ ] Review `docs/context/governance/contradictions/register.md`

- [ ] Identify:
  - [ ] stale contradictions that can be resolved
  - [ ] new contradictions to add
  - [ ] tensions that should remain open

- [ ] Do NOT hide or silently resolve ambiguity without justification

---

## Context Hygiene

- [ ] Identify duplicate concepts across multiple docs
- [ ] Suggest merges where appropriate
- [ ] Suggest splits if a document is overloaded
- [ ] Ensure:
  - canonical docs = synthesized truth
  - design docs = source intent
  - CURRENT_STATE = implementation truth
  - evidence = raw input

---

## Log

- [ ] Append entry to `docs/context/log.md`

Include:

- date
- maintenance type
- files changed
- contradictions found/resolved
- unresolved questions
- recommended next actions

---

## Corpus Graph (CORPUS-GRAPH-01)

- [ ] New or materially changed docs carry `corpus-doc/v1` frontmatter:
  - [ ] `status` / `title` / refreshed `updated` date
  - [ ] `areas` only from the vocabulary in `scripts/corpus-graph-areas.txt`
  - [ ] `governs` only where the doc truly binds implementation
  - [ ] `related` edges point at real repo docs
- [ ] Status transitions applied as frontmatter edits (historical / superseded + `superseded_by`); prose date-stamps in doc bodies left untouched
- [ ] Gate green before commit: `node scripts/corpus-graph.mjs check`
- [ ] **Artifact refresh — the librarian's job, and ONLY on a main-side pass** (2026-08-12): regenerate with `node scripts/corpus-graph.mjs index` and verify with `index --check`. **Feature branches must NOT regenerate the artifacts** — when freshness was a blocking per-branch gate, every docs PR carried derived output in its diff and any two parallel docs PRs conflicted (on GitHub as well as locally). `local-ci.sh` now reports drift as an advisory (`corpus:stale`); clearing it is a closeout obligation, not something an unrelated PR absorbs.
- [ ] Generated files (`corpus_graph_index_v0.md`, `corpus-graph.json`, `corpus_graph_viewer.html`, `corpus_graph_content.js`) were never hand-edited

---

## Session Closeout

- [ ] File-tree snapshot refreshed (workflow step 8) — run the script exactly, no flags:

```bash
scripts/snapshot-file-tree.sh
```

  (The script runs the one fixed `tree` command and fails loudly if the output is truncated — do not hand-roll or add a depth limit.)

---

## Final Report

## Context Maintenance Report

### Files changed
- ...

### Links fixed
- ...

### Contradictions found
- ...

### Contradictions resolved
- ...

### Open questions
- ...

### Recommended next actions
- ...

---

## Constraints

- Do not modify application source code
- Do not rewrite strategic documents unnecessarily
- Do not delete historical design artifacts without explicit approval
- Do not change product direction
- Preserve distinction between:
  - design intent
  - implementation reality
  - current synthesized truth
  - future vision
