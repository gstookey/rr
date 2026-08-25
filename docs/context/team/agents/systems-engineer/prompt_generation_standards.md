---
schema: corpus-doc/v1
status: accepted
title: Axium Prompt Generation Standards
areas: [agent-fleet]
updated: 2026-08-2025
---

# Axium Prompt Generation Standards

## Purpose

Define the standard Axium must follow when generating prompts for downstream agents.

Prompts are executable coordination artifacts. A bad prompt can cause code drift, context drift, scope creep, or false system assumptions.

These standards should be read with the repo-side [Agent Operating Contract](../../agent_operating_contract.md), especially the rule that prompt-generation agents must return a minimal usable prompt first and use a short timebox before optional refinement.

---

# Core Rule

Axium must not generate repo-targeting prompts from memory alone.

Before generating a prompt that references files, folders, agents, milestones, APIs, or source modules, Axium must verify current paths from the repo context.

When Graham asks for a prompt to kick off in another thread, Axium must return the entire prompt as one uninterrupted fenced markdown block. The prompt must be fully copy/pasteable. Before sending, Axium must check that no prompt prose, command, validation note, or output-format instruction has escaped outside the fence and that any nested code examples inside the prompt cannot close the outer fence.

When a repo-side custom agent exists for the target role, Axium must include the exact custom-agent id from the TOML `name` field in the prompt. Prompts must be safe for Graham's normal workflow of opening a fresh thread and pasting the prompt. If the fresh thread is not already running as the required custom agent, the prompt must instruct the generic parent thread to spawn the required custom agent when that custom agent can complete the run, or to use parent launch-coordinator mode when nested spawning is unavailable. The prompt must require the downstream handoff to disclose whether the custom-agent harness was actually used, which harness docs were read, whether `PARENT_LAUNCH_COORDINATOR_USED` occurred, or whether the run was a generic worker fallback.

For orchestration prompts, Axium must include a hard preflight block before the task body. Project config should allow nested orchestration via `[agents].max_depth = 2`, but prompts must not assume nested spawning works in every runtime. If a generic pasted parent thread cannot produce a Marin child that can spawn downstream agents, it must use parent launch-coordinator mode: the parent may coordinate phase gates while spawning the exact role custom agents directly, must not edit source itself, and must disclose `PARENT_LAUNCH_COORDINATOR_USED`. If exact role agents cannot be spawned, stop before implementation and report `CUSTOM_AGENT_NOT_ACTIVE`. A generic fallback may be used only after that stop condition is explicitly reported and Graham authorizes fallback, or when the task prompt itself explicitly permits fallback.

For docs-only context maintenance and session closeout prompts, Axium should avoid a brittle dead-end when Graham opens a fresh pasted thread and the exact custom-agent harness cannot activate. These prompts must still prefer the exact custom agent first, then a clean spawned child. If exact activation fails, Axium may explicitly permit a bounded generic fallback only when the task is docs-only/context-only, production source and package files are forbidden, task queue movement is forbidden unless explicitly scoped, the fallback worker must manually read the relevant role harness docs, and the final handoff must disclose the fallback. This exception must not be used for production implementation, code review, testing, deployment, or authority-bearing tasks unless Graham separately authorizes it.

Current custom-agent ids include:

- `marlow_coder` for Marlow / Coder
- `verin_reviewer` for Verin / Reviewer
- `vera_tester` for Vera / Tester
- `rin_librarian` for Rin / Context Librarian
- `cadence_wda` for Cadence / Cadence
- `ember_fast_ui_repairer` for Ember / Fast UI Repairer
- `axium` for Axium / main systems-engineering thread

---

# Prompt Generation Workflow

## 1. Identify the target agent

Determine which agent should receive the prompt:

- Context Librarian
- Software Design Assistant
- Coder
- Reviewer
- Tester
- DevOps

If no existing agent fits, say so explicitly.

---

## 2. Identify the task type

Classify the prompt as one of:

- context maintenance
- design synthesis
- architecture breakdown
- task decomposition
- implementation
- code review
- testing
- dev-ops / deployment
- documentation
- retrospective / feedback synthesis

---

## 3. Verify current paths

Before writing the prompt, confirm current paths using:

- `docs/context/index.md`
- `docs/current_docs_file_tree.txt` if available
- relevant folder READMEs
- `docs/CURRENT_STATE.md`

Never use old paths such as:

- `docs/context/wiki`
- `docs/context/decisions`
- `docs/context/milestones`
- `docs/context/raw`
- `docs/context/workflow`
- `docs/design/lab_v2`

unless the prompt is intentionally asking an agent to find stale references.

---

## 4. Define authority boundary

Every prompt must state what the receiving agent may read and write.

Examples:

- Librarian may write under `docs/context/`
- Axium may write under `docs/design/v2/`
- Coder may write implementation files named in the task
- Reviewer should generally report findings and avoid broad rewrites
- Tester should generate tests and reports according to assigned scope
- DevOps should avoid product behavior changes

For session closeout prompts, the authority boundary should explicitly say whether bounded generic fallback is allowed if `rin_librarian` cannot activate. When allowed, it must be limited to context/session docs and must preserve the same validation and handoff expectations.

---

## 5. Separate design from implementation

Prompt must explicitly state whether the task is:

- design-only
- docs-only
- code-only
- review-only
- test-only
- infrastructure/config-only

Do not mix layers unless explicitly intended.

---

# Required Prompt Template

Use this structure for downstream agent prompts:

```md
# Agent: [Role / exact custom-agent id]

## Custom Agent Preflight

- Required custom agent: `[exact custom-agent id]`.
- If this thread is not running as `[exact custom-agent id]` but can spawn subagents, spawn `[exact custom-agent id]` with this entire prompt when that spawned agent can complete the task.
- If this is an orchestration prompt and nested spawning is unavailable, use parent launch-coordinator mode: coordinate phase gates from the parent thread, spawn the exact required role custom agents directly, do not edit source locally, and disclose `PARENT_LAUNCH_COORDINATOR_USED`.
- If this thread cannot spawn `[exact custom-agent id]`, stop before implementation and report `CUSTOM_AGENT_NOT_ACTIVE`.
- If fallback is explicitly authorized, disclose `generic worker fallback` in the final handoff and list which role harness docs were actually read.
- For docs-only context/session-closeout tasks only: if exact custom-agent activation fails after the spawn attempt, bounded generic fallback is authorized only when this prompt says so, and only after reading the target role harness docs manually.

## Objective

[What must be accomplished]

## Repo Root

`/Users/gstookey/repos/Project Road Runner`

## Context to Read

- [exact files/folders]

## Task

[bounded task description]

## Allowed Changes

- [paths/files the agent may modify]

## Constraints

- [what the agent must avoid]

## Output Format

- [required response structure]

## Acceptance Criteria

- [concrete success conditions]

## Validation

- [commands, link checks, tests, or review steps]
