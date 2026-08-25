---
schema: corpus-doc/v1
status: accepted
title: Fast UI Repairer Prompt Templates
areas: [agent-fleet]
updated: 2026-08-25
---

# Fast UI Repairer Prompt Templates

## Focused Cadence Repair

```md
# Agent: ember_fast_ui_repairer

## Objective

Implement only the exact UI repair below.

## Accepted Target

[Paste Cadence/Graham target.]

## Allowed Files

[List exact component/template/style files.]

## Constraints

- Do not redesign the surface.
- Do not touch backend/API/shared/worker/package/lock files.
- Do not change task queues.
- Do not call providers.
- Stop if the target is ambiguous or the fix exceeds three source files.

## Validation

[Focused command or state skipped with reason.]

## Handoff

Report summary, files read, files changed, exact repair, target used, boundaries preserved, commands run, result/skips, remaining risk, and follow-up recommendation.
```

## Kebab / Menu Polish

```md
Repair only the existing menu polish issue: [exact alignment/spacing/close behavior].
Preserve all existing actions and disabled/enabled semantics.
Stop if fixing this requires state architecture or route changes.
```

## Icon Spacing / Sizing Polish

```md
Tune only the approved icon's spacing/sizing in [component].
Do not choose a new icon library or replace unrelated icons.
Report any style-budget impact if build is run.
```
