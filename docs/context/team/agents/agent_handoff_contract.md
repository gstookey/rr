---
schema: corpus-doc/v1
status: accepted
title: Agent Handoff Contract
areas: [process-governance, agent-fleet]
related: ["docs/context/team/agents/agent_operating_contract.md"]
updated: 2026-08-25
---

# Agent Handoff Contract

## Purpose

Define how specialized agents pass work to one another without relying on shared conversational memory.

Agents coordinate through durable repo artifacts, not implicit chat context.

Handoffs should also preserve the baseline rules in [Agent Operating Contract](agent_operating_contract.md), especially current-truth boundaries, explicit uncertainty, validation intent, and open questions.

---

# Core Principle

Agents do not freely collaborate through hidden shared memory.

They hand off work through:

- task queue entries
- changed files
- reports
- validation output
- context/log updates where appropriate

---

# Standard Handoff Format

Each handoff must include:

## Source Agent

## Target Agent

## Task / Artifact

## Files Changed or Created

## Current State

## Required Next Action

## Constraints

## Verification Already Performed

## Open Questions

---

# Orchestrated Run Addendum

For orchestrated implementation, repair, UI-heavy, validation, or closeout runs, add this compact section without replacing the standard format:

## Agents / Role Phases Run

List each role phase that ran, including Coder, Reviewer, Cadence, Tester, Librarian, Axium, DevOps, or local fallback.

## Agent Spawn / Harness Notes

For each role phase, include:

- requested role;
- spawned name if available;
- whether role harness docs were read;
- exact role docs read or missing;
- whether worker was generic or role-harnessed;
- whether worker timed out;
- whether local fallback was used;
- whether any partial work was accepted;
- whether worker was closed or isolated before local edits.

If generic workers are used, say `generic worker fallback`. Do not claim Coder/Reviewer/Cadence/Tester harness compliance unless the worker read and followed that role's harness.

For web tasks, include bundle budget status. For UI-heavy tasks, include screenshot evidence status and Cadence status. All validation handoffs must include exact commands/results, blocked or skipped checks, stop conditions, and remaining risks.

---

# Example Flow

1. Axium defines milestone and decomposes milestone into task queue entries.
3. Coder implements one task.
4. Reviewer reviews changed files.
5. Tester validates behavior.
6. DevOps handles runtime/deployment concerns if needed.
7. Librarian updates context if documents or system truth changed.

---

# Rule

No downstream agent should have to infer missing context from chat memory.

If an agent needs information, the upstream agent must put it in the task artifact or point to a durable source document.
