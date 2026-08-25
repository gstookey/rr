**ATTENTION All Project Road Runner (RR) Agents**
- **THIS IS AN EXAMPLE FOLDER & README!**
- **This folder `context/` and the root level files (not any of the sub folders) were copy and pasted from a project of mine called 'TrAIdit' to provide an example on how I manage the canonical Context documentation corpus in that project**

---
schema: corpus-doc/v1
status: active
title: TrAIdit Context System
areas: [context-system]
updated: 2026-05-02
---

# TrAIdit Context System v1

## Purpose
This directory is the persistent, compounding context layer for TrAIdit and, eventually, TrAInit.

Chat is a workbench.
This context system is the artifact.

The goal is to prevent the project from depending on:
- memory of past chats
- scattered markdown bundles
- tribal knowledge in one person's head
- stale assumptions that quietly survive too long

Instead, we maintain a repo-native context system with four layers:

1. **Raw evidence**  
   Immutable source material: CURRENT_STATE snapshots, screenshots, Codex outputs, pasted articles, notes, and other inputs.

2. **Compiled wiki**  
   Interlinked markdown pages that synthesize what the project currently believes.

3. **Operating context**  
   The active project picture: current milestone, next task, blockers, assumptions, hot issues.

4. **Governance**  
   The rules for how humans and agents ingest, query, lint, update, and prune context.

## Directory map
- `../AGENTS.md` — the maintenance policy and workflow contract for humans and AI agents
- `docs/context/index.md` — the content-oriented catalog of context pages
- `log.md` — append-only chronological record of important context events
- `evidence/raw/` — source register and raw-source summaries
- `canonical/` — the compiled, interlinked project wiki
- `governance/decisions/` — ADR-style decision records
- `governance/contradictions/` — tension, contradiction, and staleness tracking
- `team/agents/` — current multi-agent operating model and role docs
- `operations/feedback/` — feedback backlog, open questions, and structured retrospectives
- `operations/user-workflow/` — operator-facing working flow
- `operations/task-queue/` — task scaffolding for decomposed engineering work
- `operations/sessions/` — per-session summaries and ingest artifacts

## Scope
This system serves two horizons at once:

### TrAIdit horizon
Build, test, evaluate, and refine specialized trading agents through a Lab-first workflow.

### TrAInit horizon
Abstract the agent-building pattern into a general platform for creating, training, testing, deploying, and governing specialized context-rich agents across domains.

## Core rule
Every meaningful working session should end with:
1. source ingest
2. wiki updates
3. log append
4. decision capture
5. contradiction check
6. CURRENT_STATE refresh

If that loop is followed consistently, context compounds.
