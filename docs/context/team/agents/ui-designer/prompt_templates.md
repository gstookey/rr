---
schema: corpus-doc/v1
status: accepted
title: UI Designer Prompt Templates
areas: [agent-fleet]
updated: 2026-08-25
---

# UI Designer Prompt Templates

## Purpose

Reusable prompts for Cadence work.

Every prompt must require Cadence to read its own role, workflow, and soul docs; `AGENTS.md`; the agent handoff contract; the orchestration model; the UI doctrine.

---

# 1. All Design Work

## Objective

Create a design-only package.

## Context To Read

- `AGENTS.md`
- `docs/context/team/agents/ui-designer/README.md`
- `docs/context/team/agents/ui-designer/ui_designer_role.md`
- `docs/context/team/agents/ui-designer/ui_designer_workflow.md`
- `docs/context/team/agents/ui-designer/soul.md`
- `docs/context/team/agents/agent_handoff_contract.md`
- `docs/context/team/agents/orchestration_model.md`

## Target Artifact Path

`docs/design/*`

## Required Outputs

- screen brief
- low-fidelity shell layout
- mid-fidelity HTML/CSS or SVG mockup
- layout doctrine notes
- visual QA checklist
- implementation handoff notes

## Constraints

- Do not modify production source code.
- Do not modify task queues.
- Preserve internal-scroll-only and sticky-frame doctrine.
- Label future-only concepts.

## Output Format

- Files created
- Current truth boundary
- Design doctrine applied
- Mockup summary
- Handoff notes
- Open questions

---

# 2. Module Design Package

## Objective

Create a design-only mockup package for a specific module.

## Context To Read

- Cadence role/workflow/soul docs
- `AGENTS.md`
- `docs/context/team/agents/agent_handoff_contract.md`
- `docs/context/team/agents/orchestration_model.md`

## Target Artifact Path

Choose one:

- `docs/design/`
- another approved path under `docs/design/`

## Required Outputs

- module screen brief
- placement rationale
- low-fidelity module layout
- mid-fidelity mockup
- component anatomy
- interaction states
- visual QA checklist

## Output Format

- Module
- Files created
- Placement rationale
- Artifact summary
- Implementation notes
- Open questions

---

# 4. Other Design

## Objective

Design a high-touch bottom-panel tool surface for inspection, review, EvalCal, readiness repair, or control-heavy workflows.

## Context To Read

- Cadence role/workflow/soul docs
- `AGENTS.md`
- `docs/context/team/agents/agent_handoff_contract.md`
- `docs/context/team/agents/orchestration_model.md`

## Target Artifact Path

Relevant approved mockup path under `docs/design/mockups/**`

## Required Outputs

- bottom-panel layout
- tool/control anatomy
- interaction state matrix
- keyboard/focus notes where useful
- internal-scroll rules
- handoff notes

## Constraints

- Controls must not displace important parts of the UI.
- Keep evidence limitations visible.

## Output Format

- Tool purpose
- Layout
- States
- Controls
- Handoff notes
- QA checklist

---

# 6. Component Anatomy Specification

## Objective

Specify the anatomy of one UI component before implementation.

## Context To Read

- Cadence role/workflow/soul docs
- `AGENTS.md`
- `docs/context/team/agents/agent_handoff_contract.md`
- `docs/context/team/agents/orchestration_model.md`

## Target Artifact Path

Relevant approved mockup path under `docs/design/mockups/`

## Required Outputs

- component purpose
- data inputs
- visual regions
- controls
- states
- empty/loading/error/degraded behavior
- accessibility notes
- implementation notes

## Constraints

- Do not invent unsupported data.
- Label future-only states.

## Output Format

- Component name
- Anatomy table
- State table
- Implementation notes
- QA criteria

---

# 8. Visual QA Review Of Implemented UI

## Objective

Review an implemented UI surface or screenshot against Cadence doctrine and design intent.

## Context To Read

- Cadence role/workflow/soul docs
- `AGENTS.md`
- `docs/CURRENT_STATE.md`
- `docs/context/team/agents/agent_handoff_contract.md`
- `docs/context/team/agents/orchestration_model.md`
- relevant screenshots or implementation files

## Target Artifact Path

Report in the requested location, or propose a path under `docs/design/mockups/` if a durable design review artifact is needed.

## Required Outputs

- visual findings
- doctrine alignment
- spatial-memory issues
- internal-scroll issues
- high-touch/read-mostly placement issues
- unsupported-capability language or visual implication risks
- prioritized recommendations

## Constraints

- Do not modify production source code.
- Do not run implementation tasks.
- Do not update `docs/CURRENT_STATE.md`.

## Output Format

- Findings
- Recommendations
- Boundary risks
- Suggested follow-up artifact

---

# 9. Whittle-Down Design Exploration

## Objective

Generate a design option slate that helps Graham choose and reveal an emerging design doctrine.

## Context To Read

- Cadence role/workflow/soul docs
- `AGENTS.md`
- `docs/context/team/agents/agent_handoff_contract.md`
- `docs/context/team/agents/orchestration_model.md`
- optional visual references or screenshots

## Target Artifact Path

Relevant approved mockup path under `docs/design/mockups/`

## Required Outputs

- 2 to 10 options
- pros and cons
- recommendation
- doctrine implied by each option
- next choice prompt

## Constraints

- Do not copy visual references.
- Do not ask Graham to decide minor details Cadence should judge.
- Keep options implementable.
- Preserve current/future/mockup-only labels.

## Output Format

- Decision being explored
- Option slate
- Recommendation
- Inferred doctrine candidates
- Graham choice requested

---

# 10. Implementation Handoff Package For Coder / Human Software Engineer

## Objective

Prepare a design handoff package for implementation by a human software developer, Coder or a future Human Software Engineer.

## Context To Read

- Cadence role/workflow/soul docs
- `AGENTS.md`
- `docs/context/team/agents/agent_handoff_contract.md`
- `docs/context/team/agents/orchestration_model.md`
- created mockups/wireframes/state matrices

## Target Artifact Path

Same approved mockup package path as the source design artifacts.

## Required Outputs

- artifact index
- implementation scope
- current implementation boundary
- layout invariants
- component anatomy links
- interaction state links
- visual QA checklist
- future-only exclusions
- open questions

## Constraints

- Do not activate task queues.
- Do not write production code.
- Do not imply Axium has decomposed the work unless that has happened.

## Output Format

- Source Agent
- Target Agent
- Task / Artifact
- Files Created
- Current State
- Required Next Action
- Constraints
- Verification Already Performed
- Open Questions
