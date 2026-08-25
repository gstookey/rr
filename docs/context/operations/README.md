---
schema: corpus-doc/v1
status: active
title: Operations
areas: [process-governance, context-system]
updated: 2026-08-25
---

# Operations

**Created:** 2026-08-25

The operating context layer: how work is sequenced, recorded, and closed out.

- `milestones/` — milestone ledger + archived completed-arc detail (the board carries live status; ADR-003).
- `sessions/` — `SESSION_LOG.md` (append-only), the rollup checklist, and dated session/plan artifacts.
- `feedback/` — feedback backlog and open questions (`raw/user_feedback_backlog.md`).
- `reviews/` — structured review retrospectives (codebase / context-coherence / design-coherence). Empty until the first one.
- `user-workflow/` — Graham's operator-facing working flow.

There is deliberately **no `task-queue/`** folder: RR starts on the board-as-status model, so packets are board stories from day one.
