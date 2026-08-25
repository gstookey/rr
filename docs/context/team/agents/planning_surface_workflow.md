---
schema: corpus-doc/v1
status: accepted
title: Planning Surface Workflow (GitHub Projects)
areas: [planning, process-governance, agent-fleet]
related: ["docs/context/team/agents/agent_operating_contract.md", "docs/context/governance/decisions/ADR-003-board-is-status-docs-are-doctrine.md"]
updated: 2026-08-25
---

# Planning Surface Workflow (GitHub Projects)

**Created:** 2026-08-25 (reconstructed for RR from the inherited contract rule 16 and ADR-003; TrAIdit's original page was not carried over)

## What the board is

The GitHub Project **"Project Road Runner Roadmap"** — `https://github.com/users/gstookey/projects/3`, repo `gstookey/rr` — is the planning/**status** surface. It is a projection of the docs, never a source of doctrine.

| Board object | Meaning | Convention |
|---|---|---|
| Milestone | convergence target | GitHub milestone, dated |
| Epic | workstream | issue labeled `epic`, title `EP-nn: <name>` |
| Story | one packet of work | sub-issue of its epic, milestone-assigned |

## Thin-board rule

A board item carries **only**: title, one value line, status, priority, size, milestone, and a link to the controlling doc. Never scope text, boundaries, or acceptance criteria. If you are typing more than two sentences into an issue body, stop — that content belongs in a doc, and the issue links to it.

## Story lifecycle

1. **Cut** — Axium shapes a packet in docs (design packet or session plan). No board action yet.
2. **Activate** — only with Graham's explicit approval. Rin (or Axium) creates the story via `gh issue create` as a sub-issue of its `EP-nn:` epic, assigns the milestone, moves it to **In Progress**, and logs the activation in `docs/context/log.md`.
3. **Land** — PR opened, gates green, click-ready (contract rule 18), Graham merges.
4. **Close** — in the same Rin closeout pass that updates `log.md` / `CURRENT_STATE.md` / the milestone ledger, close the story (or move it to Done). Closing records a Graham-gated closeout; it is never itself a decision.

## Structure changes

New epics, milestones, renames, re-slating: Graham's approval first, then the board edit, then a `log.md` entry. The log is the durable trail; the board is the projection.

## Drift

Board ≠ docs → docs win. Surface the drift (contradiction register if durable). Never reconcile silently in either direction.

## Isolated-network caveat

If the target network lacks GitHub Projects, the *principle* survives (one thin status surface, one doctrine surface) and the *tool* is swapped by a future ADR. Until then, `gh` is the hands.
