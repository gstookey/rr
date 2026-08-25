---
schema: corpus-doc/v1
status: active
title: Doc Hierarchy Overview — Which Doc Wins
areas: [process-governance, context-system]
updated: 2026-08-25
---

# Doc Hierarchy Overview — Which Doc Wins

**Created:** 2026-08-25

Precedence when documents disagree (highest first):

1. Graham's explicit, current instruction.
2. `AGENTS.md` + `agent_operating_contract.md` — behavior of agents.
3. `docs/CURRENT_STATE.md` — implementation truth.
4. `governance/decisions/ADR-*` — durable decisions.
5. `canonical/*` — synthesized current belief.
6. `docs/design/*` — design direction (future intent, never implementation truth).
7. `evidence/*`, `source-documents/*` — informative only until synthesized.
8. The GitHub Project board — status only, never doctrine (ADR-003).

Any disagreement across these levels that persists past one session is a contradiction-register entry.
