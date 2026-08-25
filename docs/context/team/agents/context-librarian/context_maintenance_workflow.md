---
schema: corpus-doc/v1
status: accepted
title: Context Maintenance Workflow (Librarian)
areas: [context-system, process-governance, agent-fleet]
related: ["docs/context/team/agents/context-librarian/context_librarian_checklist.md"]
updated: 2026-08-2025
---

# Context Maintenance Workflow

## Purpose

Define the standard process for maintaining the Project Road Runner (RR) context system.

## When to Run

Run a context maintenance pass:

- after major milestones
- after documentation reorganization
- before onboarding a new teammate
- before starting a major new design phase
- when contradictions are suspected
- after large changes to `docs/context/` or `docs/design/`

## Inputs

Primary:
- `docs/context/index.md`
- `docs/CURRENT_STATE.md`
- `docs/context/log.md`
- `docs/context/governance/contradictions/register.md`
- `docs/context/operations/milestones/lab_v1_milestone_ledger.md`

Secondary:
- recently changed files under `docs/context/`
- relevant files under `docs/design/`
- `docs/context/operations/feedback/raw/user_feedback_backlog.md`

## Process

### 1. Structure Check

Verify that the documentation tree matches the current context architecture.

Check for:
- misplaced files
- obsolete folders
- duplicate files
- broken naming conventions
- missing README files in major folders

### 2. Index Check

Verify that `docs/context/index.md` accurately points to:

- canonical pages
- platform pages
- operations docs
- governance docs
- evidence docs
- team docs
- agent-role docs
- task queue entries

### 3. Link Check

Search for stale internal paths such as:

- `docs/context/wiki`
- `docs/context/decisions`
- `docs/context/milestones`
- `docs/context/feedback`
- `docs/context/raw`
- `docs/context/operations/feedback/codebase-review_retrospective_v1.0.md`
- `docs/context/operations/feedback/context-coherence-review_retrospective_v1.0.md`
- `docs/context/operations/feedback/design-coherence-review_retrospective_v1.0.md`

These should generally now point to:

- `docs/context/canonical`
- `docs/context/governance/decisions`
- `docs/context/operations/milestones`
- `docs/context/operations/feedback`
- `docs/context/operations/user-workflow`
- `docs/context/evidence/raw`
- `docs/context/operations/reviews/` (for review retrospectives)
- `docs/design/` (for design docs)

### 4. Truth Check

Compare:

- `docs/CURRENT_STATE.md`
- `docs/context/canonical/current_priorities.md`
- `docs/context/canonical/evaluation.md`
- `docs/context/canonical/versioning.md`
- `docs/context/canonical/implementation_program.md`
- milestone ledger

Flag any mismatch.

### 5. Contradiction Check

If two documents conflict, do one of the following:

- fix the stale document
- add a contradiction entry
- mark the issue as unresolved

Use:

- `docs/context/governance/contradictions/register.md`

### 6. Log Update

Append a short entry to:

- `docs/context/log.md`

Include:
- date
- pass type
- files changed
- contradictions found/resolved
- unresolved follow-ups

### 7. Corpus Graph Upkeep

At every closeout pass (CORPUS-GRAPH-01, 2026-07-17):

- new or materially changed docs get `corpus-doc/v1` frontmatter — status, title, areas (from the one vocabulary at `scripts/corpus-graph-areas.txt`), `governs` only where the doc truly binds implementation, `related` edges to real docs, and a refreshed `updated` date;
- status transitions are frontmatter edits made here (a doc going historical or superseded gets its `status` — and `superseded_by` — updated at closeout; prose date-stamps in doc bodies stay untouched);
- regenerate the four generated artifacts (index md · graph JSON · viewer HTML · doc-contents sidecar JS — one `index` run emits all four): `node scripts/corpus-graph.mjs index`;
- gate before commit: `node scripts/corpus-graph.mjs check` green and `node scripts/corpus-graph.mjs index --check` green.

#### `claims:` — who holds a shared UI resource (added 2026-08-12)

`claims` is an **optional** frontmatter list naming the shared resources a design doc claims, each written `namespace:slug`. Example:

```yaml
claims: ["region:lab-left-registry", "window:settings"]
```

- the **namespace** must come from the one vocabulary at `scripts/corpus-graph-claim-namespaces.txt` (`region`, `state`, `window`, `primitive`, `name`, `route`); the **slug** is free-form kebab-case and deliberately not vocabulary-checked;
- omit the field entirely when a doc claims nothing — an empty list is a violation, not a shrug;
- **contention:** two docs claiming the same `namespace:slug` is a `check` violation naming both paths. Discharge it by resolving the overlap, or — when the overlap is deliberate (successor, companion, hand-off) — by citing the other doc in `related:` from either side;
- **records never contend:** `status: superseded` and `status: historical` docs are excluded from contention entirely, so a retired design never blocks the doc that replaced it.

### 8. Session Closeout File Tree Snapshot

At the end of every session closeout, run the snapshot script **exactly as written — no flags, no depth limit**:

```bash
scripts/snapshot-file-tree.sh
```

The script wraps a single fixed command — `tree -I 'node_modules|.angular|dist|coverage|.git'` written to `current_file_tree.txt` — which intentionally filters generated/dependency folders (`node_modules`, `.angular`, `dist`, `coverage`, `.git`) so the snapshot stays a repo-structure reference, not a build-output dump. It exists because a paraphrased `tree` invocation once slipped in a `-L 3` depth limit and silently truncated the snapshot from ~3,500 lines to ~100 (dropping the whole `docs/` corpus). The script has no knobs to get wrong and a floor guard: if the output comes back under ~1,000 lines (a truncated tree, or a missing `tree` binary), it **fails loudly and refuses to overwrite** the existing snapshot rather than writing a stub.

## Output Report

Each maintenance pass should end with:

```md
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
