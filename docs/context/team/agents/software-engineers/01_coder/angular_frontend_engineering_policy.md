---
schema: corpus-doc/v1
status: accepted
title: Angular Frontend Engineering Policy
areas: [agent-fleet]
updated: 2026-08-25
---

# Angular Frontend Engineering Policy

## Purpose

This policy governs Coder's Angular/frontend implementation work for Project Road Runner.

## Version Truth

Coder must verify the actual Angular version from `apps/web/package.json` and `pnpm-lock.yaml` before using version-specific APIs.

Current inspected truth from `AGENT-HARNESS-01`:

- Angular packages: `21.2.9`
- Angular build/CLI: `21.2.7`
- TypeScript: `5.9.3`
- `@ngrx/signals`: `21.1.0`

Because Angular 21 is installed, Coder may use Angular 21-appropriate guidance when the API is supported and appropriate for the task. Do not use experimental Angular APIs casually in production code.

## Signal-First Posture

For new Angular UI code:

- prefer signal-based local state where practical;
- use `computed` signals for derived state;
- use `effect` sparingly and only for real side effects;
- avoid unnecessary RxJS subscriptions in components;
- prefer typed inputs/outputs and typed view models;
- keep derived data in pure projections or computed signals;
- avoid mutation-heavy component logic.

## Forms Posture

For simple local forms:

- prefer signal-first state over heavy `FormGroup` / `FormControl` boilerplate;
- use native form semantics where possible;
- keep validation explicit and readable;
- do not import large form machinery for two-field utility forms unless there is a reason.

For Signal Forms:

- inspect whether Signal Forms are available/stable in the installed Angular version before use;
- Angular v21 official docs currently mark Signal Forms as experimental;
- evaluate Signal Forms for non-trivial new forms only when appropriate;
- do not force Signal Forms into production paths while the installed docs/API mark them experimental;
- record the forms decision in the handoff when forms are created or materially changed.

## Component Structure

Coder should:

- keep HTML in `.html` files;
- keep SCSS in `.scss` files;
- avoid inline templates except tiny explicitly justified exceptions;
- avoid inline styles;
- keep one component responsible for one region/tool/interaction responsibility;
- prefer presentational child components when a template grows too large;
- use pure helpers for formatting, naming, validation, and projection work;
- avoid broad global styles unless explicitly scoped;
- avoid god components and god stores.

## Comments

Add TSDoc/JSDoc for:

- exported helpers;
- public contracts;
- non-obvious state machines;
- important validation rules;
- provider/data boundary functions;
- domain-critical helpers;
- non-obvious implementation decisions.

Do not add comments that restate obvious code. Comments should explain why, boundary, and contract.

## Bundle Budget

Current `apps/web/angular.json` production budgets:

- `initial`: warning `500kB`, error `1MB`
- `anyComponentStyle`: warning `4kB`, error `8kB`

If build fails only because of bundle budget, stop and report unless the task explicitly includes budget cleanup. Do not silently remove product-relevant UI or rewrite architecture just to shave bytes during a feature task. If a tiny non-product cleanup resolves a budget issue safely, report exactly what changed and why. Prefer a dedicated `WEB-BUDGET-01` task for recurring budget pressure. Record bundle budget status in handoff.

## UI Implementation Quality

Do not invent visually important UI when Cadence direction is missing and the surface is visually important. If the UI feels under-specified, stop and request Cadence or A refinement.

Preserve mockup canvas purity: product UI should not contain explanatory implementation copy. Use compact style, not generic SaaS form walls.
