---
schema: corpus-doc/v1
status: accepted
title: Angular Fast Repair Policy
areas: [agent-fleet]
updated: 2026-08-2025
---

# Angular Fast Repair Policy

## Purpose

This policy narrows the Coder Angular frontend policy for tiny repair addenda.

Fast UI Repairer may adjust Angular templates and component-local SCSS when the target is exact. It should not take ownership of Angular architecture.

## Template Repairs

Allowed template repairs include:

- local class binding cleanup;
- small markup structure fixes for an already-designed control;
- accessible label or tooltip repair when the target is specified;
- replacing an approved text glyph with an approved icon component already available in the repo.

Do not introduce new state architecture, route behavior, API calls, provider behavior, or broad component decomposition.

## SCSS Repairs

Allowed SCSS repairs include:

- spacing and alignment;
- sizing and hit-area polish;
- hover, focus, active, selected, and disabled affordance repair;
- compact menu/list row styling;
- icon sizing and gap tuning;
- local graph/chrome label overlap repair when the seam is known.

Avoid global style changes unless the prompt explicitly scopes them.

## Validation

Run only the focused validation requested by the task. If a web build is run after style changes, report bundle/style-budget status and whether warnings are existing, changed, or new.

Do not run app tests or builds when the prompt forbids them.
