---
schema: corpus-doc/v1
status: active
title: Repo Initialization Plan — 2026-08-25 (Axium)
areas: [context-system, planning, process-governance]
related: ["docs/CURRENT_STATE.md", "docs/context/canonical/current_priorities.md"]
updated: 2026-08-25
---

# Repo Initialization Plan — 2026-08-25 (Axium)

**Created:** 2026-08-25 | **Author:** Axium (lead systems engineer, first RR session) | **Status:** executed same session; see `docs/context/log.md` for the closeout entry.

## 1. What the repo was when I found it (assessment)

The `rr` repo was stubbed from TrAIdit. The *governance and fleet layer* came across nearly intact; the *content layer* is empty. Specifically:

**Intact and reusable as-is (with path/name fixes):**
- `AGENTS.md` — the context-maintenance policy, already retargeted to RR in prose.
- `.claude/` — settings, merge-gate hook (`protect-main.sh`), launch config, seven fleet harnesses.
- `docs/context/team/agents/**` — Axium, Rin, Marlow, Verin, Vera, Ember, Cadence role/workflow/soul docs plus the operating contract, handoff contract, orchestration model, collaboration model.
- `scripts/corpus-graph.mjs` + its vocabulary/exclusion/claims files and spec — the doc-graph tool works (node 22 present).
- `docs/context.root-files.example/` — a 13 MB worked example of TrAIdit's context root (index/log/README/generated graph artifacts). Reference only.
- `docs/source-documents/**` — RR-specific raw source: brand/style guide, AstroUXDS branding transcript, Angular 22 config blueprints, Vitest examples, npm-workspaces monorepo + Helm chart blueprints.
- `docs/angular-upgrade-docs/**` — ripped Angular v17→v22 upgrade guides.
- `images/rr_logos/` — 57 brand image candidates.

**Empty (0 bytes):** `README.md` (one line), `docs/CURRENT_STATE.md`, `docs/context/README.md`, `docs/context/index.md`, `docs/context/log.md`, `docs/context/operations/sessions/SESSION_LOG.md`, `scripts/gen-tool-cards.mjs`.

**Referenced but missing (120 broken links/paths found by scan):**
- `docs/context/canonical/` (current_priorities, context_system, evaluation, versioning, implementation_program)
- `docs/context/governance/{decisions,contradictions/register.md,meta/*}`
- `docs/context/operations/{milestones,feedback,reviews,user-workflow}`, `operations/sessions/session_rollup_checklist.md`
- `docs/context/evidence/{raw,images}`, `docs/context/bootstrap/`, `docs/context/platform/`
- `docs/context/team/agents/planning_surface_workflow.md` (cited by AGENTS.md, every harness, the operating contract)
- `docs/design/`
- Axium harness read-list points at `systems-engineer/01_axium_lead-platform-systems-engineer/` — the real folder is `systems-engineer/`.
- `ui-designer/README.md` links `workstation_ui_designer_{role,workflow}.md` — files are `ui_designer_{role,workflow}.md`.
- `.claude/agents/README.md` lists `cadence-Cadence.md` — file is `cadence-ui-designer.md`.

**Corpus-graph `check`: 104 violations** — 49 docs with malformed `updated: 2026-08-25`, 49 uses of `agent-fleet` (absent from the areas vocabulary), one stray `name:` frontmatter field, four exclusion entries that match nothing, one dangling `related` edge (planning_surface_workflow).

**TrAIdit residue:** find/replace left artifacts — "Project Road Runner-specific vs Project Road Runner-level" (was TrAIdit vs TrAInit), "trading-vertical choices", "quant-engineer fleet", "TrAInit-maintainer agents", `ADR-003` citations (a TrAIdit ADR number), repo slug `gstookey/rr`, repo root `~/repos/rr`, `scripts/auth-break-glass.sh` calling `@traidit/api`, `corpus-graph.mjs` header, `images/rr_logos/__MACOSX/` junk and a 31 MB zip duplicating the extracted images.

**Gap I cannot close from the repo:** Graham said a project description exists inside the Claude project. It was **not present in my context** this session. Everything below is grounded only in the repo (AGENTS.md "About me / What I'm working on", the brand guide, and the source documents). The canonical project-overview page is therefore written with explicit `[NEEDS GRAHAM]` markers rather than invented detail.

## 2. Plan (executed in this order)

1. **Branch** `feat/rr-context-init`; never touch `main` (contract rule 15).
2. **Stand up the context skeleton** the harnesses assume: `canonical/`, `governance/{decisions,contradictions,meta}`, `operations/{milestones,feedback,reviews,user-workflow,sessions}`, `evidence/{raw,images}`, `bootstrap/`, `platform/`, `docs/design/`. Each gets a README (some intentionally thin stubs).
3. **Fill the empty root files** — `README.md`, `docs/CURRENT_STATE.md`, `docs/context/{README,index,log}.md`, `SESSION_LOG.md`, `canonical/current_priorities.md`, `session_rollup_checklist.md`.
4. **Write the missing doctrine** every harness cites: `planning_surface_workflow.md`, ADR-001..003 (context system adopted; merge gate; board=status/docs=doctrine), contradiction register with the real contradictions I found.
5. **Fix paths/links/names** in harnesses, READMEs, templates; fix the repo root placeholder; scrub TrAIdit residue.
6. **Make the corpus graph green**: dates, add `agent-fleet` to the vocabulary (it is a legitimate concept tag used by 49 docs — cheaper and truer than re-tagging), fix exclusions, generate the four artifacts, `check` + `index --check` green.
7. **Register the evidence** (source documents, upgrade docs, logos) in `evidence/raw/source_register.md`; point `docs/design/brand/` at the style guide and logos.
8. **Hygiene**: delete `__MACOSX`, the duplicate zip, the empty `gen-tool-cards.mjs`; mark `auth-break-glass.sh` as `.example`; `.gitignore` additions; `scripts/README.md` for RR.
9. **Snapshot + commit**; hand back to Graham with open decisions. I cannot push from this environment — a patch/bundle is produced instead.

## 3. Decisions I made unilaterally (Graham may reverse)

- Kept `docs/source-documents/` and `docs/angular-upgrade-docs/` where they are (registered as evidence) rather than moving them under `docs/context/evidence/raw/` — moving 6 large ripped files adds churn and no meaning. They are excluded from the corpus graph.
- Kept `docs/context.root-files.example/` as a read-only reference, excluded from the corpus graph.
- Did **not** decide the monorepo layout (`client/common/server` per source docs vs. `apps/web` per fleet docs and `launch.json`). Registered as contradiction C-001 — this is the first real architecture decision and should be Graham's.
- Left model assignments in harness frontmatter unchanged (README table says fable for Axium/Rin; frontmatter says opus/haiku). Flagged, not fixed.
- Repo-root placeholder in prompt templates set to `~/repos/rr` — **unverified guess**, flagged.
