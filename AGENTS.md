# Context Maintenance Policy (`AGENTS.md`)

## Role of this file
This file is the schema/governance layer for the Project Road Runner context system.

It tells every agent working this repo — the Claude Code fleet (Axium, Rin, Marlow, Verin, Vera, Marin, and the rest of `.claude/agents/`), the quant-engineer fleet, and any future TrAInit-maintainer agents — how to behave when interacting with this repo-native context layer. *(Revised 2026-08-26)*
## About me:
- Name: Graham
- Role: Team Member and Lead Front End Software Engineer of Project Road Runner
- Background: Currently, I work as a full stack software engineer in the aerospace / defense industry. I have a background in music and was a producer/singer songwriter for many years. Logic was and is my favorite UI ever made. 
- Strong in: Front end web development, specializing in Typescript / Angular, writing, creative problem solving, and UI/UX design
- Still learning: DevOps, Database management, systems engineering, architecture design. 

Adjust the depth of every response to match my background. Never over-explain what I already know. Never skip context I need.

## What I'm working on:
- Short-Term Goal: To plan and prepare for standing up Project Road Runner's software technology stack and dev environment on an isolated network.
- Long-Term Goal: To execute the plan and get the project stood up and into development, and to release a version of the software within the next year. 
- What to avoid: phrasing current or temparary constraints as constraints which may bound us unnecessarily in the future. For example, if we are consentrating on a single user system RIGHT NOW, but the ultimate goal is to make it a multi-user platform in the future, any constraints about limiting scope to being single user should clearly indicate an expiration on that constraint, with something like "[constraint] applies to SomeFeature implementation milestones ONLY" or "[constraint] applies only through Milestone 23 and should be removed as soon as Milestone 23 is finished"

Apply this context to every task. When something doesn't fit this picture, flag it before proceeding.

## Core principle for preparing for the migration to the isolated network
This repo's most valuable asset is not just the files (the plan, the documents, the code, etc), it is the maintained context around:
- setting Graham and his team up for future success
- extensible architecture, following the principles of Domain-Driven-Design (DDD)
- workflow
- domain understanding and software technology coherence
- planning and execution history
- design rationale
- contradictions
- evolving strategy

## Standing governance (August 2026 regime — binding)
- **Merge gate (operating-contract rule 15):** no agent merges to `main` in any `rr*` repo. PRs only, gates green, Graham clicks merge. Enforced by hook + contract + harness prose.
- **Board is status, docs are doctrine:** the GitHub Project "Project Road Runner Roadmap" is the planning/status surface — milestones, epics, stories. Board items stay thin; this docs corpus wins every disagreement. Fleet how-to: `docs/context/team/agents/planning_surface_workflow.md`.
- The full failure-mode checklist every agent obeys: `docs/context/team/agents/agent_operating_contract.md`.

## The four-layer model

### 1. Raw evidence
Immutable inputs and source artifacts.

### 2. Compiled wiki-like context folder
The maintained markdown knowledge base.

### 3. Operating context
The compact picture of what matters now.

### 4. Governance
The policies for ingest, query, lint, and maintenance.

## Additional project layer: milestones
**Milestones live on the Project Road Runner Roadmap board** (`https://github.com/users/gstookey/projects/3`): epics as `EP-nn:` issues, stories as packet-sized sub-issues. They are the execution spine connecting design intent, sequencing, session work, and CURRENT_STATE updates — but the board carries **status only**. 

## Operations

### Ingest
When a new source arrives:
1. register it in `docs/context/evidence/raw/`
2. summarize it
3. identify affected pages
4. update the relevant pages within docs/context
5. append to `docs/context/log.md`
6. record contradictions if needed

### Query
When answering project questions:
1. read `docs/context/index.md`
2. read the relevant pages within `docs/context/`
3. read the latest `docs/context/CURRENT_STATE` or session summary if recency matters
4. answer from compiled context first
5. write durable answers back into context

### Lint
At least weekly:
- find contradictions
- find stale issue status
- find orphan pages
- find duplicated rationale
- find milestone completion not reflected in the ledger
- find session work not rolled up into canonical pages

## Canonical write targets

### Update `index.md` when:
- a page is added
- a page is removed
- a page changes meaningfully

### Update `docs/context/log.md` when:
- a source is ingested
- a milestone is started or completed
- a major decision is made
- a lint pass is run

Convention (BS-14): one `# [YYYY-MM-DD] <type> | <title>` header level, **newest-first — prepend at the top** (below the convention comment).

### Update the board (and log) when milestone/epic/story status changes:
- story lifecycle per `planning_surface_workflow.md` (activation = In Progress with Graham's approval; closure in the Rin closeout pass)

### Update `docs/context/governance/decisions/` when:
- a durable product/architecture/workflow choice is made
- the team changes how milestones or context are governed

### Update `docs/context/governance/contradictions/register.md` when:
- pages disagree materially
- implementation diverges from milestone intent
- a milestone says one thing and `docs/context/CURRENT_STATE.md` says another

## Operating-context compaction
`docs/CURRENT_STATE.md` and `docs/context/canonical/current_priorities.md` carry **standing truth + active lane + open decisions only**, each readable in one ~15–20k-token window. Completed-arc detail moves to `docs/context/operations/milestones/` archives at closeout — move strata out rather than stacking. Prefer pointers over snapshots anywhere a doc would restate fast-moving state (the bootstrap pages are already pointer-based; keep them that way).

## Document date-stamp convention
Every document we stand up bears a **date stamp at the top** — minimum the creation date; add/update a **Last updated:** line when a doc is materially revised. Convert relative dates to absolute (YYYY-MM-DD). Most packet docs already satisfy this via a dated `Status:` line — the rule is to make it universal and never omitted, so currency vs. OBE is gaugeable at a glance without git archaeology. Applies to all authoring and every fleet-dispatch prompt. Rin owns a retroactive date-stamp sweep of undated legacy docs (queued as a hygiene pass, not urgent).

## Session-close rule
Every meaningful session should end with a context rollup:
1. summarize what changed
2. update milestone status if needed
3. update affected wiki pages
4. append to `docs/context/log.md`
5. record new decisions
6. record governance/contradictions/tensions
7. refresh `docs/CURRENT_STATE.md` and `docs/context/canonical/current_priorities.md` if needed

## Project Road Runner rule
Always ask:
- is this specific to Project Road Runner as software?
- or is this a reusable program concept?

## Guardrails for agents
Agents maintaining this context system must:
- prefer explicit updates over silent edits
- never flatten ambiguity into false certainty
- preserve rationale, not just conclusions
- flag contradictions rather than hiding them
- treat context quality as a product concern, not clerical work

## Uncertainty Handling
- If you are uncertain about any fact, statistic, date, quote, or piece of information, say so explicitly before including it. "I'm not certain about this" is always better than presenting a guess as a fact. Never fill gaps in your knowledge with plausible-sounding information. When in doubt, say so.

## Response Summary Guidance
- After completing any editing or writing task, always end with a brief summary:
1. What was changed: [description]
2. What was left untouched: [if relevant]
3. What needs my attention: [anything requiring a decision or review]
  - Keep it short. This is a status update, not a recap of everything you just did.

## End of Session Directions
- When I say that we are going to end the session, i.e. "session end", "wrapping up", or "let's stop here", refer to the instructions in `docs/context/operations/sessions/session_rollup_checklist.md` and write a session summary and append it to `docs/context/operations/sessions/SESSION_LOG.md`.
