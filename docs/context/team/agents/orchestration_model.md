---
schema: corpus-doc/v1
status: accepted
title: Agent Orchestration Model
areas: [agent-fleet, process-governance]
updated: 2026-08-2025
---

# Agent Orchestration Model

**Status:** Operating model  
Project Road Runner (RR) development  
**Implementation status:** Human-supervised operating workflow. This document does not describe in-product Project Road Runner AI behavior.

---

## 1. Purpose

This document defines how Graham should coordinate multiple repo-side AI agents when using Claude for Project Road Runner (RR) development.

The goal is to safely use specialized agents together without allowing them to blur roles, modify unauthorized files, skip review gates, or accidentally turn future design intent into implementation truth.

This document is about the **repo-side development agent team**.

---

## 2. Core Principle

Agent orchestration should increase execution speed without reducing truth discipline.

The controlling rule is:

> Orchestrate known workflows. Do not let agents invent authority.

All orchestration should also obey the compact [Agent Operating Contract](agent_operating_contract.md), especially the prompt-generation timebox, minimal-usable-output, checkpointing, and boundary-drift rules.

A multi-agent run is only acceptable when:

- the task sequence is explicit;
- agent roles are clear;
- allowed files are bounded;
- stop conditions are defined;
- downstream actions depend on upstream results;
- Graham remains the operator and final authority.

---

## 3. Agent System Layers

Each agent should be governed by three document layers:

```text
role.md     = authority and responsibility
workflow.md = process
soul.md     = identity, virtues, failure modes
```

These documents work together:

| Document      | Defines                      | Should answer                            |
| ------------- | ---------------------------- | ---------------------------------------- |
| `role.md`     | Responsibility and authority | What is this agent allowed to do?        |
| `workflow.md` | Operating procedure          | How does this agent do its work?         |
| `soul.md`     | Operating identity           | What kind of agent is this trying to be? |

No `soul.md` may expand agent authority beyond its `role.md`.

---

## 4. Current Repo-Side Agent Team

### Axium

**Role:** Lead systems engineer and prompt architect.

Owns:

* strategy synthesis
* systems framing
* prompt generation
* agent routing
* scope control
* sequencing
* handoff clarity

Does not own:

* direct coding
* silent task queue mutation
* implementation review
* formal testing
* context maintenance unless explicitly asked

---

### Context Librarian

**Role:** Memory keeper and context integrity steward.

Owns:

* context navigation
* index hygiene
* contradiction tracking
* task queue hygiene
* current-state updates after verified implementation
* session/log closeout
* link/path repair

Does not own:

* product direction
* architecture decisions
* source code changes
* design intent changes
* task implementation

---

### Coder

**Role:** Scoped implementation agent.

Owns:

* writing code for approved task packets
* preserving existing behavior unless tasked otherwise
* running required validation
* reporting changed files and tradeoffs

Does not own:

* product direction
* architecture expansion
* task scope expansion
* review or testing authority
* unrelated cleanup unless explicitly approved

---

### Reviewer

**Role:** Static/semantic implementation review agent.

Owns:

* code review
* contract review
* state consistency review
* schema/API review
* boundary compliance review
* identifying required fixes before testing

Does not own:

* broad refactors
* implementation rewrites unless explicitly asked
* product redesign
* test pass replacement

---

### Tester

**Role:** Behavioral validation agent.

Owns:

* manual and automated validation
* reproduction steps
* pass/fail reporting
* UI/API behavior checks
* boundary-language checks

Does not own:

* implementation code changes
* product redesign
* speculative bug fixing
* declaring behavior passed when required validation was not performed

---

## 5. Orchestration Modes

There are three approved orchestration modes.

---

# Mode 1 — Single-Agent Precision Mode

## Use When

Use single-agent mode for delicate, foundational, or high-risk work.

Examples:

* Coder implements a scoped task.
* Reviewer performs focused review.
* Tester validates a specific behavior.
* Librarian updates `CURRENT_STATE.md`.
* Axium creates a milestone plan.
* Axium creates a design spec.

## Properties

* One agent acts.
* One output is reviewed.
* Graham decides the next handoff.
* Slowest but most controlled.

## Default For

* architecture
* implementation
* current-state updates

---

# Mode 2 — Supervised Orchestration Mode

## Use When

Use supervised orchestration when the sequence is known, bounded, and conditionally safe.

Example:

```text
Run Tester.
If Tester passes, run Librarian closeout.
If Tester fails, stop.
```

## Properties

* Multiple agents may run sequentially.
* Each next step depends on prior result.
* Stop conditions are explicit.
* Allowed files are restricted per agent.
* Graham reviews the final result before commit/push.

## Good Uses

* Tester → Librarian closeout
* Reviewer → Coder focused fix → Reviewer re-review
* Coder → Reviewer handoff when task is narrow and known
* Librarian index pass after accepted docs

## Unsafe Uses

* Axium → Coder → Reviewer → Tester without human review after milestone creation
* Axium → Librarian canonization without human acceptance
* Coder starting the next task after completing the current one
* DevOps changing infra as part of a feature workflow

---

# Mode 3 — Parallel Multi-Agent Mode

## Use When

Use parallel mode only when outputs are independent or explicitly comparable.

Examples:

* Reviewer and Tester independently inspect a completed feature.
* Axium independently identify design/implementation risks.
* Librarian checks links while Tester validates behavior.

## Properties

* Agents run in parallel.
* No agent depends on another unfinished output.
* No parallel agent modifies overlapping files unless explicitly planned.
* Graham resolves conflicts.

## Requires

Parallel mode must define:

* each agent’s task;
* allowed files;
* forbidden files;
* whether modifications are allowed;
* merge/reconciliation rule;
* stop conditions.

## Avoid Parallel Mode For

* multiple Coders editing the same area;
* design and canonization at the same time;
* architecture and task queue mutation at the same time;
* anything involving migrations, auth, execution, or deployment.

---

## 6. Human Approval Gates

These actions require Graham approval before proceeding:

* starting a new implementation milestone;
* moving tasks from `proposed` to `active`;
* seeding task queue entries;
* modifying `docs/CURRENT_STATE.md`;
* canonizing new design direction;
* changing architecture diagrams materially;
* starting DevOps/infra changes;
* adding dependencies;
* changing database schema;
* modifying execution-related code;

Agents may recommend these actions. They may not silently perform them unless explicitly authorized.

---

## 7. Safe Agent Chains

These chains are generally safe when properly bounded.

---

## Coder → Reviewer → Coder Fix → Reviewer → Tester

Use for implementation tasks.

```text
Coder implements
  ↓
Reviewer reviews
  ↓
Coder fixes required issues
  ↓
Reviewer approves
  ↓
Tester validates behavior
```

Rules:

* Tester should not run before Reviewer approves unless explicitly requested.
* Coder should not start next task after finishing.
* Reviewer findings should route back as smallest scoped fix.
* Tester failures should route back to Coder with reproduction steps.

---

## Tester → Librarian Closeout

Use after a feature/milestone passes validation.

```text
Tester validates
  ↓
If pass: Librarian updates task queue/current state/log
If fail: stop
```

Rules:

* Librarian may not modify source code.
* Librarian may not change design docs unless explicitly asked.
* Librarian should not overstate implementation.
* `CURRENT_STATE.md` remains implementation truth.

---

## 8. Unsafe Agent Chains

Avoid these unless explicitly supervised.

---


## Coder → Coder Next Task Automatically

Risk:

* review/test gates get skipped.

---

## Tester → Coder Fix Automatically

Risk:

* fix scope may be inferred incorrectly.

---

## Librarian Modifies Design Docs During Closeout

Risk:

* implementation truth update becomes design rewrite.

---

## 9. Stop Conditions

Any orchestrated run must stop immediately if:

* Tester returns `Fail — fixes required`;
* Reviewer returns `Changes requested`;
* validation commands fail;
* an agent needs to modify files outside allowed scope;
* an agent attempts to start a task not listed in the workflow;
* an agent modifies source code when not authorized;
* an agent modifies design docs during context closeout;
* an agent modifies `CURRENT_STATE.md` without explicit closeout scope;
* an agent begins implementing future systems;
* the worktree contains unreviewed changes that make the task ambiguous.

When a stop condition occurs:

```text
stop
report
wait for Graham
```

Do not “continue with best effort” inside an orchestrated repo workflow.

---

## 10. File Authority Matrix

| Agent       | May modify by default                                   | May not modify by default                                       |
| ----------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| Axium       | Usually none; prompts only                              | Source code, task queue, current state unless explicitly scoped |
| Librarian   | Context/task queue/log/current-state docs               | App source, design docs unless scoped                           |
| Coder       | Task-scoped source files                                | Unrelated docs, task queue, context canon                       |
| Reviewer    | Review reports by default                               | Source code unless explicitly asked                             |
| Tester      | Test reports by default                                 | Source code unless explicitly asked                             |

This matrix can be overridden only by explicit prompt scope.

---

## 11. Orchestration Prompt Template

Use this template for bounded multi-agent runs.

```md
# Orchestrated Agent Run

## Objective

Execute a bounded multi-agent workflow for [TASK / MILESTONE].

## Repo Root

`/Users/gstookey/repos/Project Road Runner`

## Workflow

1. Run [Agent A] for [task].
2. If [Agent A result condition], run [Agent B].
3. If [failure condition], stop and report.
4. Do not proceed beyond [explicit endpoint].

## Agent Boundaries

### [Agent A] may:
- ...

### [Agent A] may not:
- ...

### [Agent B] may:
- ...

### [Agent B] may not:
- ...

## Allowed Files

[explicit list]

## Forbidden Files

[explicit list]

## Stop Conditions

Stop immediately if:

- validation fails
- required files are missing
- any agent needs unauthorized changes
- any future-scope behavior appears
- any ambiguity affects implementation truth

## Output

Report:

- agents run
- agent spawn / harness notes
- whether role harness docs were read
- whether generic worker fallback occurred
- files changed
- validation results
- bundle budget status for web tasks
- screenshot/Cadence evidence status for UI-heavy tasks
- stop condition status
- recommended next human decision
```

---

## 12. Example — Tester Then Librarian Closeout

```md
# Orchestrated Agent Run

## Objective

Validate UI features and close out context only if validation passes.

## Workflow

1. Run Tester for SomeFeature Milestone 1.
2. If Tester returns `Pass` or `Pass with non-blocking observations`, run Context Librarian closeout.
3. If Tester returns `Fail — fixes required`, stop immediately and report Tester findings.
4. Do not start Milestone 2.

## Tester May

- read task/design/current-state docs
- run validation commands
- manually validate behavior
- produce a test report

## Tester May Not

- modify source code
- modify task queue
- modify context docs

## Librarian May

- move completed tasks to `completed.md`
- update `docs/CURRENT_STATE.md`
- update `docs/context/canonical/current_priorities.md`
- append to `docs/context/log.md`

## Librarian May Not

- modify source code
- modify design docs
- rewrite unrelated context
- start new tasks
- change milestone scope

## Stop Conditions

Stop if:

- Tester fails
- commands fail in a way that affects validation
- Librarian attempts to modify design docs or source code
- any future-scope capability is described as implemented
```

---

## 13. Example — Reviewer Then Coder Fix Then Reviewer

```md
# Orchestrated Agent Run

## Objective

Review and repair [TASK] if required.

## Workflow

1. Run Reviewer.
2. If Reviewer returns `Approve`, stop and report.
3. If Reviewer returns `Approve with non-blocking suggestions`, stop and report.
4. If Reviewer returns `Changes requested`, run Coder with only the required fixes.
5. Run Reviewer focused re-review.
6. Stop after focused re-review.

## Constraints

- Coder may only fix Reviewer’s required findings.
- Coder may not start the next task.
- Reviewer may not broaden re-review unless the fix introduced a new issue.
```

---

## 14. Business Rule: The Human Remains C2

Graham remains Command and Control.

Agents may:

* suggest;
* inspect;
* implement;
* review;
* test;
* maintain context;
* recommend next actions.

Agents may not:

* approve major scope changes;
* skip review gates;
* silently continue into new milestones;
* authorize themselves.

The orchestration system exists to increase leverage, not remove human judgment.

---

## 15. Relationship To Future Project Road Runner Efforts

This repo-side orchestration model is not the final Project Road Runner product.

However, it is a live prototype of Project Road Runner principles:

* specialized agents;
* role boundaries;
* durable context;
* handoff contracts;
* task queues;
* review gates;
* test validation;
* contradiction tracking;
* human command authority.

Lessons from this workflow may later inform Project Road Runner Studio, but repo-side development agents must not be conflated with in-product AI surfaces.

---

## 16. Closing Principle

Orchestration is leverage.

Leverage without boundaries becomes chaos.

Use the team. Keep the gates. Let the system move fast because it tells the truth.
