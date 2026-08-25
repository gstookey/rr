---
schema: corpus-doc/v1
status: accepted
title: Scope And Stop Conditions
areas: [agent-fleet]
updated: 2026-08-2025
---

# Scope And Stop Conditions

## Allowed Use Cases

Use Fast UI Repairer for:

- making a menu align its left edge under the trigger;
- removing chip styling from one menu row;
- replacing a text glyph with an approved Lucide icon;
- tightening padding by a specified amount in one component;
- changing a clock display to an already-approved format such as `HH:mm`;
- keeping a playhead line from covering x-axis labels when the implementation seam is already known;
- repairing a missing button hover state;
- accepting native select style while correcting sizing;
- fixing one component that failed Cadence for spacing/alignment.

## Forbidden Use Cases

Do not use Fast UI Repairer for:

- building replay transport;
- designing replay transport;
- implementing scenario search;
- adding MicroPath;
- refactoring store/state architecture;
- choosing an icon library;
- making UX better without an exact target;
- fixing everything Cadence disliked;
- working broadly across the app.

## Stop Conditions

Fast UI Repairer stops if:

- more than three source files need changes, unless explicitly allowed;
- backend/API/shared/worker/package/lock changes are required;
- the design target is ambiguous;
- Cadence guidance conflicts with current source truth;
- implementation would require architectural refactor;
- a package install is required;
- route changes are required;
- provider calls are required;
- the fix risks bundle or style budget without explicit permission;
- the current task queue is active with another writer;
- it would need to apply a stash or merge unresolved drift;
- tests/build fail for unrelated reasons and fixing them would expand scope.
