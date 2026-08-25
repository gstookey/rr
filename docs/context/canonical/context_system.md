---
schema: corpus-doc/v1
status: active
title: Context System — How This Corpus Is Organized
areas: [context-system, process-governance]
related: ["docs/context/README.md", "docs/context/governance/decisions/ADR-001-context-system-adopted-from-traidit.md"]
updated: 2026-08-25
---

# Context System — How This Corpus Is Organized

**Created:** 2026-08-25

Adopted from TrAIdit (ADR-001). Four layers (see `AGENTS.md`): raw evidence → compiled wiki → operating context → governance.

| Layer | Lives in | Owner |
|---|---|---|
| Raw evidence | `docs/context/evidence/`, `docs/source-documents/`, `docs/angular-upgrade-docs/`, `images/` | Rin registers; nobody edits sources |
| Compiled wiki | `docs/context/canonical/`, `docs/context/platform/`, `docs/design/` | Axium synthesizes; Rin maintains |
| Operating context | `docs/CURRENT_STATE.md`, `canonical/current_priorities.md`, `operations/` | Rin at closeout; Graham approves CURRENT_STATE changes |
| Governance | `AGENTS.md`, `governance/`, `team/agents/` | Graham + Axium |

Machine-discoverable graph: every participating doc carries `corpus-doc/v1` frontmatter; `node scripts/corpus-graph.mjs lookup <path-or-term>` is the pre-build reflex (contract rule 17). Generated artifacts live at `docs/context/corpus_graph_index_v0.md`, `corpus-graph.json`, `corpus_graph_viewer.html`, `corpus_graph_content.js` — never hand-edited.

A mature example of this system in use is preserved read-only at `docs/context.root-files.example/` (TrAIdit's root files). Use it to see what `index.md` and `log.md` look like after months of operation.
