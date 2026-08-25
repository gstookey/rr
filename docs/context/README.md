---
schema: corpus-doc/v1
status: active
title: RR Context System
areas: [context-system]
related: ["docs/context/canonical/context_system.md", "docs/context/index.md"]
updated: 2026-08-25
---

# Project Road Runner Context System

**Created:** 2026-08-25

Chat is a workbench. This directory is the artifact.

Repo-native, compounding context for RR so the project never depends on memory of past chats, scattered bundles, or one person's head. Four layers (`AGENTS.md`): raw evidence → compiled wiki → operating context → governance.

## Directory map

- `index.md` — navigation spine (start here for "where is X")
- `log.md` — prepend-only decision/event trail
- `bootstrap/` — pointer-only session rehydration
- `canonical/` — synthesized current truth
- `governance/` — ADRs, contradiction register, meta rules
- `operations/` — milestones, sessions, feedback, reviews, user workflow
- `team/agents/` — the fleet operating model and role docs
- `platform/` — reusable program concepts
- `evidence/` — source register, raw pastes, images
- Generated: `corpus_graph_index_v0.md`, `corpus-graph.json`, `corpus_graph_viewer.html`, `corpus_graph_content.js` (`node scripts/corpus-graph.mjs index`)

A read-only worked example from TrAIdit lives one level up at `docs/context.root-files.example/`.
